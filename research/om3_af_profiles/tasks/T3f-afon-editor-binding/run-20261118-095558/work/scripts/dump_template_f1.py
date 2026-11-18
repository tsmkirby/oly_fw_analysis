# role: observe. Dump the 2154 chooser template and the zone option records.
import struct
from pathlib import Path

image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
lines = []
raw = image[0x606190b7 - BASE:0x606190b7 - BASE + 64]
lines.append("template 0x606190b7 " + raw.hex())
words = [hex(struct.unpack_from("<I", raw, i)[0]) for i in range(0, 64, 4)]
lines.append("words " + " ".join(words))
# zone records
z = image[0x6158ba1c - BASE:0x6158ba1c - BASE + 120]
lines.append("zone records")
for i in range(10):
    rec = z[i * 12:(i + 1) * 12]
    value, kind, text, ptr = struct.unpack_from("<IHI I", rec)
    lines.append("  value %d kind %d text %s ptr %s raw %s" % (value, kind, hex(text), hex(ptr), rec.hex()))
# search a window around the template for pointers into 0x6158b000
lines.append("pointers near template")
window = image[0x60619000 - BASE:0x60619800 - BASE]
for off in range(0, len(window) - 4, 4):
    w = struct.unpack_from("<I", window, off)[0]
    if 0x6158b000 <= w < 0x6158c000:
        lines.append("  %s -> %s" % (hex(0x60619000 + off), hex(w)))
Path("work/out/template-f1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("wrote", len(lines))
