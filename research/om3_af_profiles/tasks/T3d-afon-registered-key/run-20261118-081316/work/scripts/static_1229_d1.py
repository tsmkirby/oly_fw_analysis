# Walk FUN_611a1229's table for key 0x900C. Writes work/out/static-1229-d1.txt.
import struct
from pathlib import Path

BIN = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020

def u32(addr):
    return struct.unpack_from("<I", BIN, addr - BASE)[0]

table, end = 0x615130D8, 0x61513158
key = 0x900C
delta = (key - 0x900B) & 0xFFFFFFFF
slot = table + (delta & 0xF) * 8
lines = [f"key=0x{key:04x} delta={delta}"]
for n in range(32):
    k, fn = u32(slot), u32(slot + 4)
    lines.append(f"  slot 0x{slot:08x} delta={k} fn=0x{fn:08x}")
    if k == delta or k == 0:
        break
    slot += 8
    if slot >= end:
        slot = table
# also list the first 16 entries
lines.append("table head:")
for i in range(16):
    s = table + i * 8
    lines.append(f"  0x{s:08x} delta={u32(s)} fn=0x{u32(s + 4):08x}")
text = "\n".join(lines) + "\n"
Path("work/out/static-1229-d1.txt").write_text(text, encoding="utf-8")
print(text)
