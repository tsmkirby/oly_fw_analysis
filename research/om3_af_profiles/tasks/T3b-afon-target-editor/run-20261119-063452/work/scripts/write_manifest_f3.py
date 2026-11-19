# Hash inputs, sources, outputs, and every command record. Do not edit after it runs.
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path('.')
OUT = ROOT / 'work/evidence-manifest.json'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        while True:
            block = f.read(1024 * 1024)
            if not block:
                break
            h.update(block)
    return h.hexdigest(), path.stat().st_size


def entry(path, extra=None):
    digest, size = sha(path)
    row = {'path': str(path).replace('\\', '/'), 'sha256': digest, 'bytes': size}
    if extra:
        row.update(extra)
    return row


inputs = []
for rel in [
    'brief.md',
    'TASK.md',
    'templates/result.md',
    'audit/previous-review.md',
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
    'om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk00000000.OE.0100.bin',
    'om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin',
    'ref/PROJECT-STATE.md',
    'ref/HARDWARE-STAGE0-RECORD.md',
    'ref/analysis/button-af/FEATURE-SPEC.md',
    'ref/analysis/button-af/AFON-MENU-RESEARCH.md',
    'ref/analysis/button-af/readiness/t5-afon-button-handoff/README.md',
    'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/target-bytes.md',
    'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/design.md',
    'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes.csv',
    'ref/tasks/T2-cell-ownership/run-20261117-220544/work/out/verdict-v2.md',
    'ref/tasks/T3i-afon-zone-acceptance/brief.md',
    'ref/tasks/T3j-afon-acceptance-assertions/brief.md',
    'ref/tasks/T5-afon-button-handoff/brief.md',
    'ref/tasks/T5-afon-button-handoff/run-20261119-044533/work/scripts/accept_runner_c3.mjs',
]:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit('missing input ' + rel)
    inputs.append(entry(path, {'hashed': 'later'}))

sources = []
inv_path = ROOT / 'work/out/import-inventory-f3.json'
inv = json.loads(inv_path.read_text(encoding='utf-8'))
for row in inv['modules']:
    sources.append({
        'path': row['path'], 'sha256': row['sha256'], 'bytes': row['bytes'],
        'hashed': inv.get('hashed', 'execution'), 'inventory': 'work/out/import-inventory-f3.json',
    })
for path in sorted((ROOT / 'work/scripts').glob('*')):
    if path.is_file():
        sources.append(entry(path, {'hashed': 'later', 'role': 'script'}))

outputs = []
outputs.append(entry(ROOT / 'work/result.md', {'hashed': 'later'}))
for path in sorted((ROOT / 'work/out').rglob('*')):
    if path.is_file():
        outputs.append(entry(path, {'hashed': 'later'}))

commands = []
cmd_dir = ROOT / 'work/out/cmd'
exit_files = sorted(cmd_dir.glob('*.exit'), key=lambda p: int(p.name.split('.')[0]))
for path in exit_files:
    n = path.name.split('.')[0]
    doc = json.loads(path.read_text(encoding='utf-8'))
    files = {}
    for suffix in ('cmd.txt', 'out', 'err', 'exit'):
        fp = cmd_dir / f'{n}.{suffix}'
        if fp.exists():
            files[suffix] = entry(fp)
    commands.append({
        'n': n,
        'status': doc.get('status'),
        'spawn': doc.get('spawn'),
        'scripts': doc.get('scripts'),
        'wrapper_sha256': doc.get('wrapper_sha256'),
        'files': files,
    })

def tool(args):
    try:
        return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT).strip()
    except Exception as exc:
        return 'unavailable: ' + str(exc)

manifest = {
    'task': 'T3b',
    'brief_sha256': next(r['sha256'] for r in inputs if r['path'] == 'brief.md'),
    'inputs': inputs,
    'sources': sources,
    'outputs': outputs,
    'commands': commands,
    'tool_versions': {
        'node': tool(['node26', '-v']),
        'python': tool(['python', '-V']),
        'java': tool(['java', '-version']),
        'ghidra': 'tools/bin/run-ghidra.cmd, command 05, log work/out/ghidra-m2.log',
    },
    'note': (
        'Imported emulator modules are the execution-time hashes from work/out/import-inventory-f3.json. '
        'Inputs, scripts, and outputs were hashed by this script after the sessions. '
        'Every command from 01 through the last .exit present is listed, including command 17, '
        'and each of cmd.txt, out, err, and exit is hashed. '
        'This manifest command\'s own stdout and exit are written by the wrapper after this script returns, so they are not in commands yet. '
        'This file is not listed in outputs. '
        'accept-f3 ended ok:false. The four experiment versions are stock_gaps_f1, stock_gaps_f2, route_f2, and accept_f3.'
    ),
}
OUT.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({
    'inputs': len(inputs),
    'sources': len(sources),
    'outputs': len(outputs),
    'commands': len(commands),
    'command_numbers': [c['n'] for c in commands],
}))
