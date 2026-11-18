# List second-words of aligned action records, and the page-27 vtable method.
import struct
from pathlib import Path

BIN = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020

def off(addr):
    return addr - BASE

used = {}
start = off(0x6150B000)
end = off(0x61511000)
for o in range(start, end - 24, 4):
    key, ui, sub, handler, first, second, tail = struct.unpack_from("<IHHIIII", BIN, o)
    if key == 1 and handler == 0 and first == 8 and tail == 0 and ui != 0:
        used.setdefault(second, []).append((BASE + o, ui))
print("distinct second words", len(used))
free = [n for n in (0x0E3D, 0x3D6E, 0x0100, 0x0FFF) if n not in used]
print("candidate free", [hex(n) for n in free])
vt = struct.unpack_from("<I", BIN, off(0x6151346C + 4))[0]
print("vtable+4", hex(vt))
print("owners of 0x1e3", [(hex(a), ui) for a, ui in used.get(0x1E3, [])])
print("owners of 0x1e4", [(hex(a), ui) for a, ui in used.get(0x1E4, [])])
