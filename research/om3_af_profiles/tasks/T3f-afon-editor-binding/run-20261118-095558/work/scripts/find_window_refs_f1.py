# role: observe. One pass for image words that point just before the 0x1b7 binding table.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
LO = 0x615C4000
HI = 0x615C5A10
lines = []
say = lines.append
hits = []
for o in range(0, len(BIN) - 3):
    v = BIN[o] | (BIN[o + 1] << 8) | (BIN[o + 2] << 16) | (BIN[o + 3] << 24)
    if LO <= v < HI:
        hits.append((BASE + o, v))
say("hits %d" % len(hits))
for src, dst in hits[:200]:
    say("  word at 0x%08x -> 0x%08x delta-from-table %d" % (src, dst, dst - 0x615C59F4))
if len(hits) > 200:
    say("  ... %d more" % (len(hits) - 200))
text = "\n".join(lines) + "\n"
(OUT / "binding-window-refs-f1.txt").write_text(text, encoding="utf-8")
print("hits", len(hits))
