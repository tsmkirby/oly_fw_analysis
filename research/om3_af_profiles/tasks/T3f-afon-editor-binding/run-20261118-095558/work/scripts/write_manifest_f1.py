"""Refresh work/evidence-manifest.json. The command text is the requested line.

The wrapper writes this process's .out, .err and .exit after the manifest is saved,
so those three files are not in outputs. Their status is not reconstructed.
"""
import json
import sys
from hashlib import sha256
from pathlib import Path

ROOT = Path(".").resolve()
CMD = ROOT / "work" / "out" / "cmd"

def sha(path):
    data = path.read_bytes()
    return sha256(data).hexdigest(), len(data)

inputs = [
    "inputs/00_0100_50000020.decoded.bin",
    "inputs/02_0106_458c0020.decoded.bin",
]
sources = [
    "brief.md",
    "TASK.md",
    "templates/result.md",
    "ref/tasks/T3e-afon-action-record/brief.md",
    "ref/tasks/T3e-afon-action-record/decision.md",
    "ref/tasks/T3e-afon-action-record/run-20261118-094952-review/review.md",
    "ref/tasks/T3e-afon-action-record/run-20261118-091509/work/out/design.md",
    "ref/tasks/T3e-afon-action-record/run-20261118-091509/work/out/action-records.md",
    "ref/tasks/T3e-afon-action-record/run-20261118-091509/work/scripts/run_logged.mjs",
    "ref/tasks/T3a-afon-zone-row/brief.md",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/design.md",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/design-v12.md",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/scripts/build_overlay_v2.py",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/scripts/afon_zone_probe_v16.mjs",
    "ref/tasks/T3c-afon-editor-routing/brief.md",
    "ref/tasks/T3c-afon-editor-routing/run-20261118-073716/work/out/phaseA.md",
    "ref/analysis/button-af/AFON-MENU-RESEARCH.md",
    "ref/analysis/decompiled-main/functions/6124f4e5.c",
    "ref/analysis/decompiled-main/functions/6124f11a.c",
    "ref/analysis/decompiled-main/functions/6127e750.c",
    "ref/analysis/decompiled-main/functions/6041937f.c",
]
missing = [p for p in inputs + sources if not (ROOT / p).is_file()]
outputs = []
for path in sorted((ROOT / "work").rglob("*")):
    if not path.is_file():
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel == "work/evidence-manifest.json":
        continue
    digest, size = sha(path)
    outputs.append({"path": rel, "sha256": digest, "bytes": size})

def requested(cmd_path, record):
    if cmd_path.is_file():
        for line in cmd_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("requested: "):
                return line[len("requested: "):]
    spawn = record.get("spawn")
    if spawn:
        return spawn
    return None

commands = []
incomplete = []
for exit_path in sorted(CMD.glob("*.exit")):
    stem = exit_path.name[:-5]
    record = json.loads(exit_path.read_text(encoding="utf-8"))
    commands.append({
        "cmd": requested(CMD / f"{stem}.cmd.txt", record),
        "exit": record.get("status"),
        "signal": record.get("signal"),
        "error": record.get("error"),
        "stdout": f"work/out/cmd/{stem}.out",
        "stderr": f"work/out/cmd/{stem}.err",
        "exit_file": f"work/out/cmd/{stem}.exit",
    })
for out_path in sorted(CMD.glob("*.out")):
    stem = out_path.name[:-4]
    if not (CMD / f"{stem}.exit").is_file():
        incomplete.append(stem)
if incomplete:
    commands.append({
        "cmd": None,
        "exit": None,
        "note": "These command records have no .exit file. Their status was not reconstructed.",
        "stdout_stems": incomplete,
    })
commands.append({
    "cmd": None,
    "exit": None,
    "note": "run_logged.mjs writes this process's .out, .err and .exit after the manifest has been saved, so that one command's three files are not in outputs.",
})

node_out = (CMD / "01.out").read_text(encoding="utf-8").strip()
python_out = (CMD / "02.out").read_text(encoding="utf-8").strip()
manifest = {
    "task": "T3f-afon-editor-binding",
    "brief_sha256": sha(ROOT / "brief.md")[0],
    "inputs": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in inputs if (ROOT / p).is_file()],
    "sources": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in sources if (ROOT / p).is_file()],
    "outputs": outputs,
    "commands": commands,
    "tool_versions": {"python": python_out, "node26": node_out},
    "missing_sources": missing,
}
(ROOT / "work" / "evidence-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("outputs", len(outputs))
print("commands", len(commands))
print("missing", missing)
