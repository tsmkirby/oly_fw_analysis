# role: observe. Template bytes, priority option records, and image-id neighbours.
import struct
from pathlib import Path

image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
lines = []
raw = image[0x606190b7 - BASE:0x606190b7 - BASE + 48]
lines.append("template " + raw.hex())
pri = image[0x6158ba04 - BASE:0x6158ba04 - BASE + 24]
lines.append("priority " + pri.hex())
for i in range(2):
    rec = pri[i * 12:(i + 1) * 12]
    value, kind, text, ptr = struct.unpack_from("<IHHI", rec)
    lines.append("priority rec value %d kind %d text %s ptr %s" % (value, kind, hex(text), hex(ptr)))
zone = image[0x6158ba1c - BASE:0x6158ba1c - BASE + 120]
lines.append("zone")
for i in range(10):
    rec = zone[i * 12:(i + 1) * 12]
    value, kind, text, ptr = struct.unpack_from("<IHHI", rec)
    lines.append("  value %d kind %d image %s ptr %s" % (value, kind, hex(text), hex(ptr)))
# neighbours of image id 0x23a3 as a u16
hits = 0
target = struct.pack("<H", 0x23a3)
start = 0
while hits < 12:
    i = image.find(target, start)
    if i < 0:
        break
    addr = BASE + i
    window = image[max(0, i - 8):i + 16]
    lines.append("u16 0x23a3 at %s %s" % (hex(addr), window.hex()))
    hits += 1
    start = i + 2
Path("work/out/template-f2.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("hits", hits)
