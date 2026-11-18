# Build labels.json, the combined menu log, and evidence-manifest.json.
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work"
OUT = WORK / "out"
TERM = Path(r"C:\Dev\OM3-tasks\_agent\home\.cursor\projects\C-Dev-OM3-tasks-T1-page27-mapping-ws\terminals")

def extract_jsonl(terminal_name, dest):
    text = (TERM / terminal_name).read_text(encoding="utf-8", errors="replace")
    rows = [line for line in text.splitlines() if line.startswith("{")]
    dest.write_text("\n".join(rows) + "\n", encoding="utf-8", newline="\n")
    return len(rows)

def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def version(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    text = (p.stdout or "") + (p.stderr or "")
    return " ".join(text.split())

n_a = extract_jsonl("416321.txt", OUT / "menu-toggle-a-first.jsonl")
n_b = extract_jsonl("416322.txt", OUT / "menu-toggle-b-first.jsonl")

parts = [
    OUT / "menu-toggle-control.jsonl",
    OUT / "menu-toggle-a-first.jsonl",
    OUT / "menu-toggle-b-first.jsonl",
    OUT / "menu-toggle-a.jsonl",
    OUT / "menu-toggle-b.jsonl",
]
blob = b"".join(p.read_bytes() for p in parts)
if not blob.endswith(b"\n"):
    blob += b"\n"
(OUT / "menu-toggle.jsonl").write_bytes(blob)

label_runs = [
    ("control", OUT / "menu-toggle-control.jsonl"),
    ("toggle-a-first", OUT / "menu-toggle-a-first.jsonl"),
    ("toggle-b-first", OUT / "menu-toggle-b-first.jsonl"),
    ("toggle-a-repeat", OUT / "menu-toggle-a.jsonl"),
    ("toggle-b-repeat", OUT / "menu-toggle-b.jsonl"),
]
strings = {}
touched = {}
for name, path in label_runs:
    row = json.loads(path.read_text(encoding="utf-8").splitlines()[0])
    touched[name] = list(row["strings"])
    for key, value in row["strings"].items():
        previous = strings.get(key, None)
        if key not in strings or (isinstance(value, str) and (not isinstance(previous, str) or len(value) > len(previous))):
            strings[key] = value
labels = {
    "getter": "A(0x510bb079)",
    "note": "Every label ID passed to the string getter in any recorded run. Where a later 400-byte read is longer than the first pair's 180-byte read, the longer text is stored. 0xff0, 0xff2, 0x5b4, and 0xc6 were read only by the control run. 0x06b1 and 0x282c are string-table lookups of the same numbers as the page-27 image ids. Kind 12 does not use this table.",
    "strings": {key: strings[key] for key in sorted(strings, key=lambda item: int(item, 16))},
    "touched_by": touched,
}
(OUT / "labels.json").write_text(json.dumps(labels, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")

inputs = [
    ROOT / "inputs" / "00_0100_50000020.decoded.bin",
    ROOT / "inputs" / "02_0106_458c0020.decoded.bin",
]
sources = [
    ROOT / "brief.md",
    ROOT / "ref" / "PROJECT-STATE.md",
    ROOT / "ref" / "analysis" / "button-af" / "AFON-MENU-RESEARCH.md",
    ROOT / "ref" / "analysis" / "decompiled-main" / "all-functions.asm",
    ROOT / "ref" / "analysis" / "decompiled-main" / "functions.tsv",
    ROOT / "ref" / "scripts" / "om_emu_af_live_probe.mjs",
    ROOT / "om-emu" / "unpacked" / "E147" / "OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin",
    ROOT / "om-emu" / "emu" / "src" / "lab" / "menuwalk.mjs",
]
outputs = []
for path in sorted(WORK.rglob("*")):
    if path.is_file() and path.name != "evidence-manifest.json":
        outputs.append(path)

manifest = {
    "task": "T1-page27-mapping",
    "brief_sha256": sha256(ROOT / "brief.md"),
    "inputs": [{"path": str(p.relative_to(ROOT)), "sha256": sha256(p)} for p in inputs],
    "sources": [{"path": str(p.relative_to(ROOT)), "sha256": sha256(p)} for p in sources],
    "outputs": [
        {"path": str(p.relative_to(ROOT)), "sha256": sha256(p), "bytes": p.stat().st_size}
        for p in outputs
    ],
    "commands": [
        "python -I work\\scripts\\dump_page27.py",
        "python -I work\\scripts\\glyph_scan.py",
        "python -I work\\scripts\\string_ids.py",
        "node26 work\\scripts\\page27_probe.mjs om-emu control work\\out\\menu-toggle-control.jsonl control",
        "node26 work\\scripts\\page27_probe.mjs om-emu toggle work\\out\\menu-toggle-a.jsonl toggle-a",
        "node26 work\\scripts\\page27_probe.mjs om-emu toggle work\\out\\menu-toggle-b.jsonl toggle-b",
        "node26 work\\scripts\\page27_probe.mjs om-emu toggle work\\out\\menu-toggle-a.jsonl toggle-a",
        "node26 work\\scripts\\page27_probe.mjs om-emu toggle work\\out\\menu-toggle-b.jsonl toggle-b",
        "python -I work\\scripts\\assemble_outputs.py",
        "python -I work\\scripts\\check_pointer.py",
        "tools\\bin\\run-ghidra.cmd -postScript Page27List.java C:\\Dev\\OM3-tasks\\T1-page27-mapping\\ws\\work\\out\\page27-listing.txt -log work\\out\\page27-listing.log",
        "node26 work\\scripts\\page27_probe_control.mjs om-emu control work\\out\\repro-control.jsonl control",
        "node26 work\\scripts\\page27_probe_first.mjs om-emu toggle work\\out\\repro-a-first.jsonl toggle-a",
        "node26 work\\scripts\\page27_probe_first.mjs om-emu toggle work\\out\\repro-b-first.jsonl toggle-b",
        "python -I work\\scripts\\assemble_outputs.py",
        "python -I work\\scripts\\assemble_outputs.py",
    ],
    "tool_versions": {
        "node26": version("node26 --version"),
        "python": version("python --version"),
        "java": version("java -version"),
    },
    "notes": {
        "first_toggle_lines": {"a": n_a, "b": n_b},
        "menu_toggle_order": [
            "menu-toggle-control.jsonl",
            "menu-toggle-a-first.jsonl",
            "menu-toggle-b-first.jsonl",
            "menu-toggle-a.jsonl",
            "menu-toggle-b.jsonl",
        ],
        "container_sha256_from_PROJECT-STATE_not_rehashed": "8c133084414533159f587bf46bfb4152714c4074312a47c8d8503e33d605696d",
        "om_emu_pin_from_PROJECT-STATE": "4e4ec4ef084542a7e30eecce56970c7e09c123c9 + local patch 61cd1327…7702",
        "manifest_lists_every_work_file_except_itself": True,
        "OM_EMU_NVRAM": "off",
        "correction_round": "run-20261117-204643-review",
        "run_ids": {
            "control": "menu-toggle-control.jsonl; editors not opened",
            "toggle-a-first": "menu-toggle-a-first.jsonl; JSON run field toggle-a",
            "toggle-b-first": "menu-toggle-b-first.jsonl; JSON run field toggle-b",
            "toggle-a-repeat": "menu-toggle-a.jsonl; JSON run field toggle-a",
            "toggle-b-repeat": "menu-toggle-b.jsonl; JSON run field toggle-b",
        },
    },
}
(WORK / "evidence-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
print(f"first lines a={n_a} b={n_b} outputs={len(outputs)}")
