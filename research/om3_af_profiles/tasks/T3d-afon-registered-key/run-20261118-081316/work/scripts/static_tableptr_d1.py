import struct
from pathlib import Path
BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
addr = 0x6150F5F0
off = addr - BASE
blob = image[off - 32:off + 48]
lines = [f"bytes at 0x{addr - 32:08x}: {blob.hex()}"]
for i in range(0, 80, 4):
    a = addr - 32 + i
    w = struct.unpack_from("<I", image, a - BASE)[0]
    h = struct.unpack_from("<H", image, a - BASE)[0]
    lines.append(f"  0x{a:08x} u32=0x{w:08x} u16=0x{h:04x}")
Path("work/out/static-tableptr-d1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
