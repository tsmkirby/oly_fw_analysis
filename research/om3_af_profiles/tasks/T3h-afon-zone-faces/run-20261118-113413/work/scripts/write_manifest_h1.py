"""Refresh work/evidence-manifest.json. This process is the last command.

The wrapper writes this process's .cmd.txt before the process starts, and writes
.out, .err and .exit after the manifest is saved. Those three files are absent
from outputs. The requested text is the line already in that .cmd.txt.
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
    "review-brief.md",
    "templates/result.md",
    "ref/tasks/T3g-afon-zone-chooser/brief.md",
    "ref/tasks/T3g-afon-zone-chooser/decision.md",
    "ref/tasks/T3g-afon-zone-chooser/run-20261118-112628-review/review.md",
    "ref/tasks/T3g-afon-zone-chooser/run-20261118-104935/work/out/design.md",
    "ref/tasks/T3a-afon-zone-row/brief.md",
    "ref/analysis/button-af/AFON-MENU-RESEARCH.md",
    "ref/analysis/decompiled-main/functions/611c7785.c",
    "ref/analysis/decompiled-main/functions/611c782f.c",
    "ref/analysis/decompiled-main/functions/611f81aa.c",
    "ref/analysis/decompiled-main/functions/611f7f01.c",
    "ref/analysis/decompiled-main/functions/6124f11a.c",
    "ref/analysis/decompiled-main/functions/6124f4e5.c",
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
for exit_path in sorted(CMD.glob("*.exit"), key=lambda p: p.name):
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
        "script_sha256": (record.get("scripts") or [{}])[0].get("sha256"),
    })

for cmd_path in sorted(CMD.glob("*.cmd.txt"), key=lambda p: p.name):
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
    for suffix in ("out", "err"):
        path = CMD / f"{stem}.{suffix}"
        if path.is_file():
            text = path.read_text(encoding="utf-8", errors="replace").strip()
            if text:
                return text
    return None


manifest = {
    "task": "T3h-afon-zone-faces",
    "brief_sha256": sha(ROOT / "brief.md")[0],
    "inputs": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in inputs if (ROOT / p).is_file()],
    "sources": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in sources if (ROOT / p).is_file()],
    "outputs": outputs,
    "commands": commands,
    "tool_versions": {
        "node26": tool_text("23"),
        "python": tool_text("24"),
        "java": tool_text("25"),
    },
    "missing_sources": missing,
}
(ROOT / "work" / "evidence-manifest.json").write_text(
    json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("outputs", len(outputs), "commands", len(commands), "missing", missing)
