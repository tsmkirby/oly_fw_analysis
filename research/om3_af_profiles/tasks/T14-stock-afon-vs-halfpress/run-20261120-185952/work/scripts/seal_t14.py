# Hash T14 inputs and work products. Writes seal.json, then evidence-manifest.json.
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
    ROOT / "ref" / "scripts" / "OM3Disasm.java",
]
outputs = [ROOT / "work" / "result.md"]
outputs += sorted((ROOT / "work" / "out").rglob("*"))
outputs = [p for p in outputs if p.is_file() and p.name != "seal.json"]

sealed = [entry(p) for p in outputs]
seal = {
    "task": "T14",
    "what": "sha256 of result.md, call-graph, zone table, listings, scan, and ghidra logs",
    "files": sealed,
}
seal_path = ROOT / "work" / "out" / "seal.json"
seal_path.write_text(json.dumps(seal, indent=2) + "\n", encoding="utf-8")

manifest = {
    "task": "T14",
    "brief_sha256": sha(ROOT / "brief.md"),
    "inputs": [{"path": rel(p), "sha256": sha(p)} for p in inputs],
    "sources": [{"path": rel(p), "sha256": sha(p)} for p in sources],
    "outputs": [entry(p) for p in outputs] + [entry(seal_path)],
    "commands": [
        "python -I work\\scripts\\scan_image_t14.py",
        "tools\\bin\\run-ghidra.cmd -postScript T14Dump.java -log work\\out\\ghidra-t14.log",
        "tools\\bin\\run-ghidra.cmd -postScript T14Dump.java -log work\\out\\ghidra-t14b.log",
        "tools\\bin\\run-ghidra.cmd -postScript T14Dump.java -log work\\out\\ghidra-t14c.log",
        "tools\\bin\\run-ghidra.cmd -postScript OM3Disasm.java 609025aa 45 work\\out\\listings\\priority-side.txt -log work\\out\\ghidra-side.log",
        "python -I -c  (caller scans of 0x609024aa, 0x60902452, 0x609025aa, 0x609b3bca, 0x609b34d1, and handler-pointer immediates)",
        "tools\\bin\\run-ghidra.cmd -postScript OM3Disasm.java 60900240 36 work\\out\\listings\\accessor-use-a.txt -log work\\out\\ghidra-use-a.log",
        "python -I work\\scripts\\seal_t14.py",
    ],
    "tool_versions": {
        "java": "openjdk 25.0.5 Temurin-25.0.5+8",
        "ghidra": "12.2 PUBLIC",
        "python": "3.12.7",
    },
}
(ROOT / "work" / "evidence-manifest.json").write_text(
    json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
)
print("outputs", len(manifest["outputs"]))
print("brief", manifest["brief_sha256"])
print("seal", entry(seal_path)["sha256"])
