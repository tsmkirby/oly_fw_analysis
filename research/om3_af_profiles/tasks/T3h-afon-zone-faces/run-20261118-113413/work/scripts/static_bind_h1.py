# role: observe. Binding records for editors 0x1e3 and 0x1e4.
import struct
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
ptr = 0x615C540C
count = 416
lines = []
for n in range(count):
    rec = ptr + n * 0x18
    editor = struct.unpack_from("<I", image, rec - BASE)[0]
    if editor in (0x1E3, 0x1E4, 0x1E6):
        raw = image[rec - BASE:rec - BASE + 0x18]
        lines.append(f"{rec:#x} {raw.hex()}")
Path("work/out/static-bind-h1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
