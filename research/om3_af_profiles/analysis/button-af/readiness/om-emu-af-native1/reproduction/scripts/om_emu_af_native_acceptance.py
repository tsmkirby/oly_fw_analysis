"""Live matrix for the experimental central-edge overlay, retaining worker gates."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import subprocess
import om_emu_af_acceptance as original


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--candidate', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--cpu3-af', action='store_true')
    args = p.parse_args()
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=False)
    for k in list(os.environ):
        if k.startswith('OM3_LIVE_'):
            del os.environ[k]
    os.environ.update(OM3_LIVE_NATIVE_FOCUS='1', OM3_LIVE_CENTRAL_EDGE='1')
    if args.cpu3_af:
        os.environ['OM3_LIVE_CPU3_AF'] = '1'
    inputs = [Path(__file__), original.PROBE, Path(original.__file__), args.candidate,
              original.ROOT/'scripts/om_emu_af_edge_overlay.py',
              original.EMU/'emu/src/lab/camapp.mjs', original.EMU/'emu/src/lab/rtos.mjs',
              original.EMU/'emu/checks/lib/env.mjs', original.EMU/'emu/host/blobs.mjs']
    hashes = {str(f.resolve()): original.sha256(f) for f in inputs}
    scenarios = [(f, s) for f in (0, 1) for s in range(7)]
    results = []
    expected = {'s1:down':0x01000002, 's1:up':0x01000003,
                'afon:down':0x01050007, 'afon:up':0x01050008}
    with ThreadPoolExecutor(max_workers=3) as pool:
        jobs = [pool.submit(original.session, out, f'focus-{f}-subject-{s}', args.candidate.resolve(), f, s)
                for f, s in scenarios]
        for (focus, subject), job in zip(scenarios, jobs, strict=True):
            result, edges = job.result()
            issues = result['issues'] + original.profile_handoff(edges, focus, subject)
            for row in edges:
                if row.get('reconciliations') != [expected[row['step']]]:
                    issues.append(f"{row['step']}: not exactly one matching reconciliation")
            worker_issue = 'no observed native AF worker start through queues 95 and 94'
            behavioral = [i for i in issues if i != worker_issue]
            results.append(dict(result, focus=focus, subject=subject, edges=len(edges),
                                handoff_passed=not behavioral, full_passed=not issues, issues=issues))
            print(f'focus={focus} subject={subject}: edges={len(edges)} handoff={not behavioral} full={not issues}', flush=True)
    assert hashes == {str(f.resolve()): original.sha256(f) for f in inputs}, 'Source changed during run'
    report = {
        'firmware_build':'OLY_E_147_1100_0000_0000',
        'firmware_sha256':{f.name:original.sha256(f) for f in sorted((original.EMU/'unpacked/E147').glob('*.bin'))},
        'om_emu_commit':subprocess.check_output(['git','-C',str(original.EMU),'rev-parse','HEAD'],text=True).strip(),
        'inputs_sha256':hashes,
        'native_initializers':['6071181e','608fe1b0','609df7e4'],
        'cpu3_af_delivery':args.cpu3_af,
        'cases':results,
        'handoff_passed':sum(r['handoff_passed'] for r in results),
        'full_passed':sum(r['full_passed'] for r in results),
        'limitations':['legacy AF Home profile source, no independent editor',
                       'partial native boot; TAKE_MAIN and TAKE_FUNC still stand-ins',
                       'CPU3 IRQ delivery, when enabled, is a model scheduling the native callback',
                       'no full-worker claim without queue95 and queue94 observations',
                       'not a flashable firmware image'],
    }
    (out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(f"Handoff {report['handoff_passed']}/14; full acceptance {report['full_passed']}/14")
    return 0 if report['full_passed']==14 else 1


if __name__ == '__main__':
    raise SystemExit(main())
