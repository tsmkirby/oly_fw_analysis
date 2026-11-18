# Compare Ghidra listing bytes with the decoded main image.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
lines = []
total = 0
bad = 0
for path in sorted(OUT.glob("disasm-*-e1.txt")):
    n = 0
    mismatch = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or "\t" not in line:
            continue
        addr_s, rest = line.split("\t", 1)
        if rest == "??":
            n += 1
            mismatch += 1
            lines.append(f"UNDEF {path.name} {line}")
            continue
        hexpart = rest.split("\t", 1)[0]
        addr = int(addr_s, 16)
        raw = bytes.fromhex(hexpart)
        got = BIN[addr - BASE:addr - BASE + len(raw)]
        n += 1
        if got != raw:
            mismatch += 1
            lines.append(f"MISMATCH {path.name} {addr_s} listing {hexpart} image {got.hex()}")
    total += n
    bad += mismatch
    lines.append(f"{path.name} instructions {n} mismatches {mismatch}")
lines.append(f"TOTAL instructions {total} mismatches {bad}")
text = "\n".join(lines) + "\n"
(OUT / "listing-check-e1.txt").write_text(text, encoding="utf-8")
print(text)
