import struct
from pathlib import Path
BIN = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
target = 0x61149C48
want = target - BASE
found = []
n = len(BIN)
start = 0
while True:
    i = BIN.find(b"\xdd", start)
    if i < 0 or i + 7 > n:
        break
    rel = struct.unpack_from("<i", BIN, i + 1)[0]
    if ((i + rel) & 0xFFFFFFFF) == want:
        found.append(f"call32 0x{BASE + i:08x}")
    start = i + 1
start = 0
while True:
    i = BIN.find(b"\xcd", start)
    if i < 0 or i + 5 > n:
        break
    rel = struct.unpack_from("<h", BIN, i + 1)[0]
    if ((i + rel) & 0xFFFFFFFF) == want:
        found.append(f"call16 0x{BASE + i:08x}")
    start = i + 1
needle = struct.pack("<I", target)
start = 0
refs = []
while True:
    i = BIN.find(needle, start)
    if i < 0:
        break
    refs.append(f"0x{BASE + i:08x}")
    start = i + 1
Path("work/out/static-refresh-a6.txt").write_text("calls\n" + "\n".join(found) + "\nrefs\n" + "\n".join(refs) + "\n", encoding="utf-8")
print("calls", len(found), "refs", len(refs))
print("\n".join(found[:20]))
print("refs", " ".join(refs[:12]))
