# role: observe. Locate stored addresses of the menu dispatcher and the chooser opener.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
lines = []
say = lines.append
for target in (0x61283B1C, 0x610CDEBF, 0x610CDF05, 0x6111CAD7, 0x6041937F, 0x615C59F4):
    pat = struct.pack("<I", target)
    start = 0
    refs = []
    while len(refs) < 15:
        i = BIN.find(pat, start)
        if i < 0:
            break
        refs.append(BASE + i)
        start = i + 1
    say("0x%08x count-shown %d %s" % (target, len(refs), " ".join(hex(x) for x in refs)))
text = "\n".join(lines) + "\n"
(OUT / "callers-f1.txt").write_text(text, encoding="utf-8")
print(text)
