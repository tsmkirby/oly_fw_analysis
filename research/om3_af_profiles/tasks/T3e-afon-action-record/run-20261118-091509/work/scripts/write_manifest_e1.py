"""Refresh work/evidence-manifest.json from the files on disk.

The wrapper writes this process's .out, .err, and .exit after the manifest is saved,
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
    "ref/tasks/T3d-afon-registered-key/decision.md",
    "ref/tasks/T3d-afon-registered-key/run-20261118-090732-review/review.md",
    "ref/tasks/T3d-afon-registered-key/run-20261118-081316/work/out/decision-point.md",
    "ref/tasks/T3d-afon-registered-key/run-20261118-081316/work/out/design.md",
    "ref/tasks/T3d-afon-registered-key/run-20261118-081316/work/scripts/run_logged.mjs",
    "ref/tasks/T3a-afon-zone-row/decision.md",
    "ref/tasks/T3a-afon-zone-row/brief.md",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/design.md",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv",
    "ref/tasks/T3c-afon-editor-routing/decision.md",
    "ref/analysis/button-af/AFON-MENU-RESEARCH.md",
    "ref/analysis/review/setting-name-candidates.json",
    "ref/analysis/decompiled-main/functions/611a2631.c",
    "ref/analysis/decompiled-main/functions/6119a177.c",
    "ref/analysis/decompiled-main/functions/6119a162.c",
    "ref/analysis/decompiled-main/functions/6124f82b.c",
    "ref/analysis/decompiled-main/functions/611a3655.c",
    "ref/analysis/decompiled-main/functions/61283b1c.c",
    "ref/analysis/decompiled-main/functions/61283f10.c",
    "ref/analysis/decompiled-main/functions/6127e750.c",
    "ref/analysis/decompiled-main/functions/60419446.c",
    "ref/analysis/decompiled-main/functions/60419696.c",
    "ref/analysis/decompiled-main/functions/60063a20.c",
    "ref/analysis/decompiled-main/functions/60419368.c",
    "ref/analysis/decompiled-main/functions/6041937f.c",
    "ref/analysis/decompiled-main/functions/60419c7d.c",
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

commands = []
incomplete = []
for exit_path in sorted(CMD.glob("*.exit")):
    stem = exit_path.name[:-5]
    record = json.loads(exit_path.read_text(encoding="utf-8"))
    cmd_path = CMD / f"{stem}.cmd.txt"
    line = cmd_path.read_text(encoding="utf-8").strip().splitlines()[-1] if cmd_path.is_file() else stem
    commands.append({
        "cmd": line,
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
manifest = {
    "task": "T3e-afon-action-record",
    "brief_sha256": sha(ROOT / "brief.md")[0],
    "inputs": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in inputs if (ROOT / p).is_file()],
    "sources": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in sources if (ROOT / p).is_file()],
    "outputs": outputs,
    "commands": commands,
    "tool_versions": {"python": sys.version.split()[0], "node26": node_out},
}
(ROOT / "work" / "evidence-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("outputs", len(outputs))
print("commands", len(commands))
print("incomplete", incomplete)
print("sources", len(manifest["sources"]))
print("missing", missing)
print("brief", manifest["brief_sha256"])
