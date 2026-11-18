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

labels_row = json.loads((OUT / "menu-toggle-a.jsonl").read_text(encoding="utf-8").splitlines()[0])
labels = {
    "getter": "A(0x510bb079)",
    "run": "toggle-a step menu-labels",
    "note": "0x06b1 and 0x282c are string-table lookups of the same numbers as the page-27 image ids. Kind 12 does not use this table.",
    "strings": labels_row["strings"],
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
    },
}
(WORK / "evidence-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
print(f"first lines a={n_a} b={n_b} outputs={len(outputs)}")
