import hashlib
import json
import pathlib
import subprocess

ROOT = pathlib.Path(".").resolve()

def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def entry(rel):
    p = ROOT / rel
    return {"path": rel.replace("\\", "/"), "sha256": sha(p), "bytes": p.stat().st_size}

inputs = [
    "inputs/00_0100_50000020.decoded.bin",
    "inputs/02_0106_458c0020.decoded.bin",
]
sources = [
    "brief.md",
    "TASK.md",
    "templates/result.md",
    "ref/analysis/decompiled-main/functions/600619a9.c",
    "ref/analysis/decompiled-main/functions/60062d28.c",
    "ref/analysis/decompiled-main/functions/60062d93.c",
    "ref/analysis/decompiled-main/functions/60062fe5.c",
    "ref/analysis/decompiled-main/functions/60062a60.c",
    "ref/analysis/decompiled-main/functions/60063dc0.c",
    "ref/analysis/decompiled-main/functions/60063380.c",
    "ref/analysis/decompiled-main/functions/60063431.c",
    "ref/analysis/decompiled-main/functions/60419446.c",
    "ref/analysis/decompiled-main/functions/60419696.c",
    "ref/analysis/decompiled-main/functions/604193ca.c",
    "ref/analysis/decompiled-main/functions/6041937f.c",
    "ref/analysis/decompiled-main/functions/60063962.c",
    "ref/analysis/decompiled-main/functions/6006398b.c",
    "ref/analysis/decompiled-main/functions/60063684.c",
    "ref/analysis/decompiled-main/functions/60063567.c",
    "ref/analysis/decompiled-main/functions/600630a3.c",
]
outputs = []
for p in sorted((ROOT / "work").rglob("*")):
    if p.is_file() and p.name != "evidence-manifest.json":
        rel = str(p.relative_to(ROOT))
        outputs.append(entry(rel))

def ver(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    text = (r.stdout or r.stderr or "").strip()
    return text.splitlines()[0] if text else "exit %s" % r.returncode

commands = [
    {"command": "python -I work\\scripts\\scan_keys_v1.py work\\out\\scan-keys-v1.txt", "exit": 1, "note": "length assert 0x2000000 failed; image is 33554368 bytes; no output file"},
    {"command": "python -I work\\scripts\\scan_keys_v2.py work\\out\\scan-keys-v2.txt", "exit": 0, "output": "work/out/scan-keys-v2.txt"},
    {"command": "python -I work\\scripts\\dump_strings_v1.py", "exit": 0},
    {"command": "python -I work\\scripts\\find_menu_strings_v1.py", "exit": 0},
    {"command": "python -I work\\scripts\\extract_listings_v1.py", "exit": 0, "output": "work/out/listings-5b82.txt"},
    {"command": "node26 work\\scripts\\own_5b82_v1.mjs om-emu mark work\\out\\dynamic-5b82-mark-a.jsonl work\\out\\nvram-5b82-mark-a.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-a.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v2.mjs om-emu mark work\\out\\dynamic-5b82-mark-b.jsonl work\\out\\nvram-5b82-mark-b.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-b.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v3.mjs om-emu mark work\\out\\dynamic-5b82-mark-c.jsonl work\\out\\nvram-5b82-mark-c.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-c.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v4.mjs om-emu mark work\\out\\dynamic-5b82-mark-d.jsonl work\\out\\nvram-5b82-mark-d.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-d.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v5.mjs om-emu mark work\\out\\dynamic-5b82-mark-e.jsonl work\\out\\nvram-5b82-mark-e.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-e.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v6.mjs om-emu mark work\\out\\dynamic-5b82-mark-f.jsonl work\\out\\nvram-5b82-mark-f.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-f.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v7.mjs om-emu mark work\\out\\dynamic-5b82-mark-g.jsonl work\\out\\nvram-5b82-mark-g.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-g.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v8.mjs om-emu mark work\\out\\dynamic-5b82-mark-h.jsonl work\\out\\nvram-5b82-mark-h.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-h.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v9.mjs om-emu mark work\\out\\dynamic-5b82-mark-i.jsonl work\\out\\nvram-5b82-mark-i.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-i.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v10.mjs om-emu mark work\\out\\dynamic-5b82-mark-j.jsonl work\\out\\nvram-5b82-mark-j.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-j.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v11.mjs om-emu mark work\\out\\dynamic-5b82-mark-k.jsonl work\\out\\nvram-5b82-mark-k.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-k.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v12.mjs om-emu mark work\\out\\dynamic-5b82-mark-l.jsonl work\\out\\nvram-5b82-mark-l.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-l.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v13.mjs om-emu mark work\\out\\dynamic-5b82-mark-m.jsonl work\\out\\nvram-5b82-mark-m.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-m.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v2.mjs om-emu control work\\out\\dynamic-5b82-control.jsonl work\\out\\nvram-5b82-control.json", "exit": 0, "output": "work/out/dynamic-5b82-control.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v2.mjs om-emu mark work\\out\\dynamic-5b82-mark-n.jsonl work\\out\\nvram-5b82-mark-n.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-n.jsonl"},
    {"command": "python -I work\\scripts\\build_manifest_v1.py", "exit": 1, "note": "node26 was not visible to Python's CreateProcess; no manifest written"},
    {"command": "node26 --version", "exit": 0, "note": "v26.12.1"},
    {"command": "python --version", "exit": 0, "note": "Python 3.12.7"},
    {"command": "python -I work\\scripts\\build_manifest_v2.py", "exit": 0, "output": "work/evidence-manifest.json"},
    {"command": "python -I work\\scripts\\classify_5b82_v1.py", "exit": 0, "output": "work/out/classify-5b82-v1.txt"},
    {"command": "node26 work\\scripts\\own_5b82_v14.mjs om-emu mark work\\out\\dynamic-5b82-mark-o.jsonl work\\out\\nvram-5b82-mark-o.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-o.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v15.mjs om-emu mark work\\out\\dynamic-5b82-mark-p.jsonl work\\out\\nvram-5b82-mark-p.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-p.jsonl", "note": "the Custom Mode row found was the movie item and would not open"},
    {"command": "node26 work\\scripts\\own_5b82_v16.mjs om-emu mark work\\out\\dynamic-5b82-mark-q.jsonl work\\out\\nvram-5b82-mark-q.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-q.jsonl", "note": "still_movie 2 still opened the movie Custom Mode item"},
    {"command": "node26 work\\scripts\\own_5b82_v17.mjs om-emu mark work\\out\\dynamic-5b82-mark-r.jsonl work\\out\\nvram-5b82-mark-r.json", "exit": 1, "output": "work/out/dynamic-5b82-mark-r.jsonl", "note": "mode_dial was sent as a dial input and was rejected"},
    {"command": "node26 work\\scripts\\own_5b82_v18.mjs om-emu mark work\\out\\dynamic-5b82-mark-s.jsonl work\\out\\nvram-5b82-mark-s.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-s.jsonl", "note": "Assign confirmed; the recall search left the menu and did not find the row"},
    {"command": "node26 work\\scripts\\own_5b82_v19.mjs om-emu mark work\\out\\dynamic-5b82-mark-t.jsonl work\\out\\nvram-5b82-mark-t.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-t.jsonl", "note": "Recall confirmed; the save was not posted"},
    {"command": "node26 work\\scripts\\own_5b82_v20.mjs om-emu mark work\\out\\dynamic-5b82-mark-u.jsonl work\\out\\nvram-5b82-mark-u.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-u.jsonl", "note": "one of three sequential runs; save not posted"},
    {"command": "node26 work\\scripts\\own_5b82_v20.mjs om-emu mark work\\out\\dynamic-5b82-mark-v.jsonl work\\out\\nvram-5b82-mark-v.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-v.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v20.mjs om-emu control work\\out\\dynamic-5b82-control-o.jsonl work\\out\\nvram-5b82-control-o.json", "exit": 0, "output": "work/out/dynamic-5b82-control-o.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v21.mjs om-emu mark work\\out\\dynamic-5b82-mark-w.jsonl work\\out\\nvram-5b82-mark-w.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-w.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v21.mjs om-emu mark work\\out\\dynamic-5b82-mark-x.jsonl work\\out\\nvram-5b82-mark-x.json", "exit": 0, "output": "work/out/dynamic-5b82-mark-x.jsonl"},
    {"command": "node26 work\\scripts\\own_5b82_v21.mjs om-emu control work\\out\\dynamic-5b82-control-p.jsonl work\\out\\nvram-5b82-control-p.json", "exit": 0, "output": "work/out/dynamic-5b82-control-p.jsonl"},
    {"command": "python -I work\\scripts\\build_manifest_v3.py", "exit": 0, "output": "work/evidence-manifest.json"},
]

doc = {
    "task": "T2-cell-ownership",
    "brief_sha256": sha(ROOT / "brief.md"),
    "inputs": [entry(p) for p in inputs],
    "sources": [entry(p) for p in sources],
    "outputs": outputs,
    "commands": commands,
    "tool_versions": {
        "node26": "v26.12.1",
        "python": "Python 3.12.7",
    },
}
dest = ROOT / "work" / "evidence-manifest.json"
dest.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
print("outputs", len(outputs), "brief", doc["brief_sha256"][:16], "node", doc["tool_versions"]["node26"])
