# role: observe. Find 36-byte menu rows whose UI id is 2154-2157 or 2205.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
WANT = {2154, 2155, 2156, 2157, 2205}
lines = []
say = lines.append
# Section 7 menu data.
lo = 0x61500000
hi = 0x6169E800
for addr in range(lo, hi - 36, 4):
    ident = struct.unpack_from("<I", BIN, addr - BASE)[0]
    if ident not in WANT:
        continue
    raw = BIN[addr - BASE:addr - BASE + 36]
    # A row's kind is a small halfword at +4. Reject pointers and code-like values.
    kind = struct.unpack_from("<H", raw, 4)[0]
    if kind > 64:
        continue
    say("0x%08x id %d kind %d raw %s" % (addr, ident, kind, raw.hex()))
text = "\n".join(lines) + "\n"
(OUT / "rows-priority-f1.txt").write_text(text, encoding="utf-8")
print("lines", len(lines))
