# Hash T14 r2 inputs and work products. Writes work/out/r2/seal-r2.json
# and work/evidence-manifest.json. Does not replace work/out/seal.json.
import hashlib
import json
from pathlib import Path

ROOT = Path(r"C:\Dev\OM3-tasks\T14-stock-afon-vs-halfpress\ws")


def sha(p):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def rel(p):
    return p.relative_to(ROOT).as_posix()


def entry(p):
    return {"path": rel(p), "sha256": sha(p), "bytes": p.stat().st_size}


inputs = [
    ROOT / "inputs" / "00_0100_50000020.decoded.bin",
    ROOT / "inputs" / "02_0106_458c0020.decoded.bin",
    ROOT / "projects" / "OM3_main_full.gpr",
    ROOT / "projects" / "OM3_main_full.rep" / "project.prp",
    ROOT / "projects" / "OM3_main_full.rep" / "idata" / "00" / "00000000.prp",
    ROOT / "projects" / "OM3_main_full.rep" / "idata" / "00" / "~00000000.db" / "db.1.gbf",
    ROOT / "projects" / "OM3_main_full.rep" / "idata" / "00" / "~00000000.db" / "db.2.gbf",
]
sources = [
    ROOT / "work" / "scripts" / "scan_image_t14.py",
    ROOT / "work" / "scripts" / "T14Dump.java",
    ROOT / "work" / "scripts" / "seal_t14.py",
    ROOT / "work" / "scripts" / "scan_t14_r2.py",
    ROOT / "work" / "scripts" / "scan_t14_r2b.py",
    ROOT / "work" / "scripts" / "T14R2.java",
    ROOT / "work" / "scripts" / "seal_t14_r2.py",
    ROOT / "ref" / "scripts" / "OM3Disasm.java",
]
before = json.loads((ROOT / "work" / "out" / "r2" / "hashes-before.json").read_text(encoding="utf-8"))
after_project = [{"path": rel(p), "sha256": sha(p), "bytes": p.stat().st_size} for p in inputs[2:]]
same = [(b["path"], b["sha256"] == a["sha256"]) for b, a in zip(before["project"], after_project)]

outputs = [ROOT / "work" / "result.md"]
outputs += sorted((ROOT / "work" / "out").rglob("*"))
outputs = [p for p in outputs if p.is_file() and p.name != "seal-r2.json"]

sealed = [entry(p) for p in outputs]
seal = {
    "task": "T14",
    "round": "r2",
    "what": "sha256 of result.md and work/out files except this seal",
    "project_unchanged_since_hashes_before": all(ok for _, ok in same),
    "project_compare": [{"path": path, "match": ok} for path, ok in same],
    "files": sealed,
}
seal_path = ROOT / "work" / "out" / "r2" / "seal-r2.json"
seal_path.write_text(json.dumps(seal, indent=2) + "\n", encoding="utf-8")

manifest = {
    "task": "T14",
    "brief_sha256": sha(ROOT / "brief.md"),
    "inputs": [{"path": rel(p), "sha256": sha(p)} for p in inputs],
    "sources": [{"path": rel(p), "sha256": sha(p)} for p in sources],
    "outputs": [entry(p) for p in outputs] + [entry(seal_path)],
    "commands": [
        "python -I work\\scripts\\scan_t14_r2.py",
        "python -I work\\scripts\\scan_t14_r2b.py",
        "tools\\bin\\run-ghidra.cmd -postScript T14R2.java -log work\\out\\r2\\ghidra-r2.log",
        "tools\\bin\\run-ghidra.cmd -postScript OM3Disasm.java 610831e6 22 work\\out\\r2\\listings\\assign-lookup.txt -log work\\out\\r2\\ghidra-lookup.log",
        "tools\\bin\\run-ghidra.cmd -postScript OM3Disasm.java 610831e6 30 work\\out\\r2\\listings\\assign-lookup.txt -log work\\out\\r2\\ghidra-lookup2.log",
        "python -I -c \"import struct; from pathlib import Path; b=Path(r'inputs/00_0100_50000020.decoded.bin').read_bytes(); BASE=0x60021020; out=[]; tab=0x613086e8\nout.append('table 0x613086e8 index=(value-1), each entry u32le code pointer')\nfor val in (8,10,0x3b):\n    addr=tab+(val-1)*4; w=struct.unpack_from('<I', b, addr-BASE)[0]; raw=b[addr-BASE:addr-BASE+4]\n    out.append('value %d at %s bytes %s pointer %s'%(val, hex(addr), raw.hex(), hex(w)))\nrel=0x61308968; raw=b[rel-BASE:rel-BASE+8]; w=struct.unpack_from('<2I', b, rel-BASE)\nout.append('release pair %s bytes %s id %d handler %s'%(hex(rel), raw.hex(), w[0], hex(w[1])))\nPath(r'work/out/r2/jump-slots.txt').write_text('\\n'.join(out)+'\\n', encoding='utf-8'); print('\\n'.join(out))\"",
        "python -I work\\scripts\\seal_t14_r2.py",
    ],
    "tool_versions": {
        "java": "openjdk 25.0.5 Temurin-25.0.5+8",
        "ghidra": "12.2 PUBLIC",
        "python": "3.12.7",
    },
    "notes": [
        "R1 commands are the command list in the previous manifest and were not re-run.",
        "hashes-before.json was written before the r2 Ghidra launch. It matches the r1 seal-time project hashes. It is not a hash from before the r1 Ghidra launch.",
    ],
}
(ROOT / "work" / "evidence-manifest.json").write_text(
    json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
)
print("outputs", len(manifest["outputs"]))
print("project_match", all(ok for _, ok in same))
print("brief", manifest["brief_sha256"])
print("seal", entry(seal_path)["sha256"])
