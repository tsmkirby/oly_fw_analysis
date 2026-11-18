# role: observe. Face-table keys that no binding record selects.
import struct
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()


def u16(addr):
    return struct.unpack_from("<H", image, addr - BASE)[0]


def u32(addr):
    return struct.unpack_from("<I", image, addr - BASE)[0]


used = set()
for i in range(0x0E):
    a = 0x615CC934 + i * 0x0C
    ptr, count = u32(a + 4), u16(a + 8)
    if not (0x60000000 <= ptr < 0x62000000) or count > 2000:
        continue
    for n in range(count):
        used.add(u32(ptr + n * 0x18 + 0x10) & 0xFFFF)

lines = [f"binding face keys {len(used)}"]
free = []
for i in range(0x60):
    a = 0x6037BEDC + i * 0x24
    key = u16(a)
    if key not in used:
        free.append((i, a, key, u16(a + 8), u32(a + 0x0C)))
lines.append(f"table records whose key no binding selects: {len(free)}")
for i, a, key, count, face in free:
    lines.append(f"  [{i:02d}] {a:#x} key {key:#06x} count {count:#x} face {face:#x}")
text = "\n".join(lines) + "\n"
Path("work/out/static-free-keys-h1.txt").write_text(text, encoding="utf-8")
print(text)
