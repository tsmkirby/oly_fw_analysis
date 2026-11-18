# role: observe. Compare the 20-byte editor descriptors for 2154 and UI 238.
import struct
from pathlib import Path

image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
lines = []

def dump(addr, n, label):
    raw = image[addr - BASE:addr - BASE + n]
    u16 = struct.unpack_from("<H", raw)[0]
    words = [hex(struct.unpack_from("<I", raw, i)[0]) for i in range(0, n, 4)]
    lines.append("%s %s u16 %s words %s raw %s" % (label, hex(addr), u16, words, raw.hex()))

dump(0x6062132c, 32, "t3c-2154")
dump(0x606200e4, 32, "ui238")
# Find a 20-byte-aligned record whose first u16 is 2154 in the descriptor region.
hits = []
region = image[0x60618000 - BASE:0x60628000 - BASE]
for off in range(0, len(region) - 20, 2):
    if struct.unpack_from("<H", region, off)[0] == 2154:
        hits.append(0x60618000 + off)
lines.append("u16 2154 hits in 0x60618000-0x60628000: %s" % " ".join(hex(h) for h in hits[:40]))
lines.append("hit count %d" % len(hits))
Path("work/out/descriptors-f1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines[:8]))
