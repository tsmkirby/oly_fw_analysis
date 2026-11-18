"""Refresh work/evidence-manifest.json from the files and command records on disk.

The wrapper writes this process's .cmd.txt before the process starts, and writes
.out, .err and .exit after the manifest is saved. The requested text is the
line already in that .cmd.txt. The three later files are absent from outputs.
"""
import json
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
    "om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk00000000.OE.0100.bin",
    "om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv",
]
sources = [
    "brief.md",
    "TASK.md",
    "templates/result.md",
    "ref/tasks/T3f-afon-editor-binding/decision.md",
    "ref/tasks/T3f-afon-editor-binding/run-20261118-104215-review/review.md",
    "ref/tasks/T3f-afon-editor-binding/run-20261118-095558/work/out/design.md",
    "ref/tasks/T3a-afon-zone-row/brief.md",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/design.md",
    "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/scripts/build_overlay_v2.py",
    "ref/tasks/T3c-afon-editor-routing/run-20261118-073716/work/out/phaseA.md",
    "ref/analysis/button-af/AFON-MENU-RESEARCH.md",
    "ref/analysis/decompiled-main/functions/60405865.c",
    "ref/analysis/decompiled-main/functions/604058bc.c",
    "ref/analysis/decompiled-main/functions/6040547b.c",
    "ref/analysis/decompiled-main/functions/604052d5.c",
    "ref/analysis/decompiled-main/functions/60405178.c",
    "ref/analysis/decompiled-main/functions/604050e5.c",
    "ref/analysis/decompiled-main/functions/604057c8.c",
    "ref/analysis/decompiled-main/functions/611c7785.c",
    "ref/analysis/decompiled-main/functions/611c782f.c",
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


def requested(cmd_path):
    if not cmd_path.is_file():
        return None
    for line in cmd_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("requested: "):
            return line[len("requested: "):]
    return None


commands = []
seen = set()
for exit_path in sorted(CMD.glob("*.exit")):
    stem = exit_path.name[:-5]
    seen.add(stem)
    record = json.loads(exit_path.read_text(encoding="utf-8"))
    commands.append({
        "cmd": requested(CMD / f"{stem}.cmd.txt"),
        "exit": record.get("status"),
        "signal": record.get("signal"),
        "error": record.get("error"),
        "stdout": f"work/out/cmd/{stem}.out",
        "stderr": f"work/out/cmd/{stem}.err",
        "exit_file": f"work/out/cmd/{stem}.exit",
    })

for cmd_path in sorted(CMD.glob("*.cmd.txt")):
    stem = cmd_path.name[:-8]
    if stem in seen:
        continue
    commands.append({
        "cmd": requested(cmd_path),
        "exit": None,
        "signal": None,
        "error": None,
        "note": "This command is in flight. run_logged.mjs writes its .out, .err and .exit after the manifest is saved, so those three files are not in outputs. The requested text is the line already stored in the .cmd.txt.",
        "cmd_file": f"work/out/cmd/{stem}.cmd.txt",
    })


def tool_text(stem):
    path = CMD / f"{stem}.out"
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8").strip()


manifest = {
    "task": "T3g-afon-zone-chooser",
    "brief_sha256": sha(ROOT / "brief.md")[0],
    "inputs": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in inputs],
    "sources": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in sources],
    "outputs": outputs,
    "commands": commands,
    "tool_versions": {"node26": tool_text("12"), "python": tool_text("13")},
    "missing_sources": missing,
}
(ROOT / "work" / "evidence-manifest.json").write_text(
    json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("outputs", len(outputs))
print("commands", len(commands))
print("missing", missing)
print("node", manifest["tool_versions"]["node26"])
print("python", manifest["tool_versions"]["python"])
