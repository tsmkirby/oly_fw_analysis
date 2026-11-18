import struct
from pathlib import Path
d = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
base = 0x60021020
addr = 0x6037ce80
raw = d[addr - base:addr - base + 40]
vals = [struct.unpack_from("<I", raw, i)[0] for i in range(0, 40, 4)]
print(" ".join(f"{v:08x}" for v in vals))
