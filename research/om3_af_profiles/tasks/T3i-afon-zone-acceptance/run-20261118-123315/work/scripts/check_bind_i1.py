# role: observe. Confirm where 0x60320000 sits in the decoded image.
# Usage: python -I work/scripts/check_bind_i1.py
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
off = 0x60320000 - BASE
span = 416 * 24 + 24
chunk = image[off:off + span]
print("image_bytes", len(image))
print("bind_off", hex(off), "span", span, "ff", chunk.count(0xFF), "other", span - chunk.count(0xFF))
table = 0x60029b28 - BASE
print("section_table_off", hex(table))
for i in range(16):
    o = table + i * 12
    dest, src, flag = int.from_bytes(image[o:o + 4], "little"), int.from_bytes(image[o + 4:o + 8], "little"), int.from_bytes(image[o + 8:o + 12], "little")
    if dest == 0 and src == 0:
        break
    print(i, hex(dest), hex(src), flag)
