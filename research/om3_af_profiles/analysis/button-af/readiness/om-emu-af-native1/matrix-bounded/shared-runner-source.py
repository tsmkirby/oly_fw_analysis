"""Drive live E147 player sessions and check independent AF profile behavior."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parent.parent
NODE = ROOT / "tooling/node-v26.12.1-win-x64/node.exe"
EMU = ROOT / "tooling/om-emu"
PROBE = ROOT / "scripts/om_emu_af_live_probe.mjs"
ARCHIVED = ROOT / "analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv"
EDGES = (
    "s1:down", "s1:up", "afon:down", "afon:up",
    "s1:down", "afon:down", "afon:up", "s1:up",
    "afon:down", "s1:down", "s1:up", "afon:up",
)
RAW = {
    "s1:down": "0x02000100", "s1:up": "0x02010100",
    "afon:down": "0x0200000b", "afon:up": "0x0201000b",
}
NATIVE = {
    "s1:down": "0x1000002", "s1:up": "0x1000003",
    "afon:down": "0x1000032", "afon:up": "0x1000033",
}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def session(output, name, overlay=None, focus=0, subject=None):
    env = dict(os.environ, OM3_LIVE_ACCEPTANCE="1")
    env.pop("OM3_LIVE_SCP", None)
    env.pop("OM3_LIVE_AF_MENU", None)
    if subject is not None:
        env["OM3_LIVE_SCP"] = str(subject)
    command = [
        str(NODE), str(PROBE), str(EMU), "overlay" if overlay else "stock",
        str(overlay) if overlay else "-", "0xb", "-", f"idle-120b:{focus}:0",
    ]
    path = output / f"{name}.jsonl"
    timed_out = False
    timeout = float(env.get('OM3_LIVE_SESSION_TIMEOUT', '120'))
    with path.open("wb") as stdout, path.with_suffix(".stderr").open("wb") as stderr:
        try:
            result = subprocess.run(command, cwd=ROOT, env=env, stdout=stdout, stderr=stderr, check=False, timeout=timeout)
        except subprocess.TimeoutExpired:
            timed_out = True
    rows, malformed = [], False
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            malformed = True
    boundary = next((row["boundary"].splitlines()[0] for row in rows if "boundary" in row), None)
    edges = [row for row in rows if row.get("step") in RAW]
    issues = []
    if timed_out:
        issues.append(f'live session exceeded {timeout:g}s wall limit; process terminated')
    if malformed:
        issues.append('trace contains an incomplete or malformed record')
    if not timed_out and (result.returncode or not rows or not rows[-1].get("done")):
        issues.append(boundary or f"player exit {result.returncode}")
    if tuple(row["step"] for row in edges) != EDGES:
        issues.append(f"expected 12 ordered player edges, got {len(edges)}")
    for row in edges:
        edge = row["step"]
        if RAW[edge] not in [record["code"] for record in row["uiin"]]:
            issues.append(f"{edge} missing native UI_IN edge")
        if NATIVE[edge] not in [record["event"] for record in row["engine"]]:
            issues.append(f"{edge} missing application dispatch")
        if row["still"] != 2 or row["movie"] != 0:
            issues.append(f"{edge} occurred outside the stills position")
    return {"trace": path.name, "sha256": sha256(path), "issues": issues}, edges


def stock_fallback(stock, archived, candidate):
    issues = []
    tested = 0
    for base, old, new in zip(stock, archived, candidate, strict=True):
        if old["step"] not in ("s1:down", "s1:up") or old["owned"][5] != 1:
            continue
        tested += 1
        handler = "stock-half-down" if old["step"] == "s1:down" else "stock-half-up"
        if handler not in base["calls"] or handler in old["calls"]:
            issues.append(f"{old['step']} did not reproduce the stock versus archive difference")
        calls = new["calls"]
        if handler not in calls or calls[:calls.index(handler)] != ["wrapper-lock", "wrapper-unlock"]:
            issues.append(f"{old['step']} did not unlock before entering the stock handler: {calls}")
        if new["owned"][5] != 1 or new["owned"][4] != 255 or new["target"] != base["target"]:
            issues.append(f"{old['step']} did not preserve the original AF target state on rejection")
    if tested != 4:
        issues.append(f"expected four gated S1 edges, got {tested}")
    return {"tested_edges": tested, "passed": not issues, "issues": issues}


def profile_handoff(edges, focus, subject):
    issues = set()
    half = afon = False
    records = {}
    if not edges:
        return ["configuration or player failed before the first button edge"]
    for row in edges:
        key, action = row["step"].split(":")
        if key == "s1":
            half = action == "down"
        else:
            afon = action == "down"
        owner = 2 if afon else 1 if half else 0
        owned = row["owned"]
        if owned[4] != owner or owned[5] != 0:
            issues.add(f"{row['step']} owner/status {owned[4]}/{owned[5]}, wanted {owner}/0")
        if row["settings"] != {"focus": focus, "subject": subject}:
            issues.add("stored SCP selection or shared AF mode differs from the requested state")
        target = row["target"]
        if target["effectiveSubject"] != (0 if afon else subject):
            issues.add("effective Subject Detect disagrees with the active button")
        if owner:
            record = tuple(target["record"])
            if not any(record):
                issues.add("AF consumer target record is uninitialized")
            if owner in records and records[owner] != record:
                issues.add("returning to an owner changed its AF consumer target record")
            records[owner] = record
    if records.get(1) == records.get(2):
        issues.add("both buttons left the same AF consumer target record")
    if not all(any(row["hit"].get(stage) for row in edges)
               for stage in ("queue95_start", "queue94_lock_start")):
        issues.add("no observed native AF worker start through queues 95 and 94")
    return sorted(issues)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True, help="decoded in-memory overlay byte diff")
    parser.add_argument("--out", type=Path, required=True, help="new directory for traces and report")
    parser.add_argument("--fallback-only", action="store_true", help="run only the stock shutter fallback regression")
    args = parser.parse_args()
    output, candidate = args.out.resolve(), args.candidate.resolve()
    output.mkdir(parents=True, exist_ok=False)
    inputs = {"runner": Path(__file__), "probe": PROBE, "archived": ARCHIVED, "candidate": candidate}
    hashes = {name: sha256(path) for name, path in inputs.items()}

    with ThreadPoolExecutor(max_workers=3) as jobs:
        controls = [jobs.submit(session, output, name, overlay)
                    for name, overlay in (("stock", None), ("archived", ARCHIVED), ("candidate", candidate))]
        completed = [job.result() for job in controls]
        results = {result["trace"]: result for result, _ in completed}
        if any(result["issues"] for result, _ in completed):
            fallback = {"passed": False, "issues": ["at least one comparison session failed"]}
        else:
            fallback = stock_fallback(*(edges for _, edges in completed))

        matrix = []
        if not args.fallback_only:
            scenarios = [(focus, subject) for focus in (0, 1) for subject in range(7)]
            runs = [jobs.submit(session, output, f"focus-{focus}-subject-{subject}", candidate, focus, subject)
                    for focus, subject in scenarios]
            for (focus, subject), job in zip(scenarios, runs, strict=True):
                result, edges = job.result()
                issues = result["issues"] + profile_handoff(edges, focus, subject)
                matrix.append({**result, "focus": focus, "subject": subject, "passed": not issues, "issues": issues})

    if hashes != {name: sha256(path) for name, path in inputs.items()}:
        raise RuntimeError("Acceptance inputs changed while the live sessions were running")
    report = {
        "inputs_sha256": hashes,
        "om_emu_commit": subprocess.check_output(
            ["git", "-C", str(EMU), "rev-parse", "HEAD"], text=True).strip(),
        "firmware_sha256": {path.name: sha256(path)
                            for path in sorted((EMU / "unpacked/E147").glob("*.bin"))},
        "controls": results,
        "stock_fallback": fallback,
        "profile_handoff": matrix,
        "menu_and_persistence": "outside this runner; requires the independent AF-ON zone editor and storage",
    }
    (output / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Stock fallback {'PASS' if fallback['passed'] else 'FAIL'}")
    if matrix:
        print(f"Live profile handoff {sum(test['passed'] for test in matrix)}/{len(matrix)}")
    print(output / "report.json")
    return 0 if fallback["passed"] and all(test["passed"] for test in matrix) else 1


if __name__ == "__main__":
    raise SystemExit(main())
