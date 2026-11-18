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
    {"command": "python -I work\\scripts\\build_manifest_v1.py", "exit": 0, "output": "work/evidence-manifest.json"},
]

doc = {
    "task": "T2-cell-ownership",
    "brief_sha256": sha(ROOT / "brief.md"),
    "inputs": [entry(p) for p in inputs],
    "sources": [entry(p) for p in sources],
    "outputs": outputs,
    "commands": commands,
    "tool_versions": {
        "node26": ver(["node26", "--version"]),
        "python": ver(["python", "--version"]),
    },
}
dest = ROOT / "work" / "evidence-manifest.json"
dest.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
print("outputs", len(outputs), "brief", doc["brief_sha256"][:16], "node", doc["tool_versions"]["node26"])
