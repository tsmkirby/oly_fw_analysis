# Build the complete overlay CSV, including the private face record.
import struct
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
src = Path("work/out/overlay-exp-faces-h2.csv").read_text(encoding="utf-8").splitlines()
rows = [src[0]]
seen = set()
for line in src[1:]:
    if not line.strip():
        continue
    addr = int(line.split(",")[1], 16)
    seen.add(addr)
    rows.append(line)

FACE = 0x6031EA48
rec = bytearray(image[0x6037C98C - BASE:0x6037C98C - BASE + 0x24])
struct.pack_into("<H", rec, 8, 10)
struct.pack_into("<I", rec, 0x0C, 0x6158BA1C)
purpose = "EMULATOR-ONLY private face record for UI 0x3D6F count 10 list 0x6158ba1c"
for i, b in enumerate(rec):
    addr = FACE + i
    if addr in seen:
        raise SystemExit("overlap at %#x" % addr)
    old = image[addr - BASE]
    if old != 0xFF:
        raise SystemExit("stock byte at %#x is %#x" % (addr, old))
    off = addr - BASE
    rows.append(",".join([
        format(off, "08x"), format(addr, "x"), "ff", format(b, "02x"), purpose,
    ]))

# Section check. Record is 12 bytes: dest, source, flag. Section n covers dest[n] .. dest[n+1].
table = 0x60029B28
sections = []
for n in range(10):
    a = table + n * 12
    dest, source, flag = struct.unpack_from("<III", image, a - BASE)
    sections.append((n + 1, dest, flag))
def section_of(addr):
    for i, (n, dest, flag) in enumerate(sections):
        nxt = sections[i + 1][1] if i + 1 < len(sections) else dest
        if dest <= addr < nxt:
            return n, flag
    return None, None
for addr in (0x6031E920, 0x6031EA48, 0x6031EA6B, 0x6037C98C):
    n, flag = section_of(addr)
    print("addr %#x section %s flag %s" % (addr, n, flag))

text = "\n".join(rows) + "\n"
Path("work/out/overlay-changed-bytes.csv").write_text(text, encoding="utf-8")
print("rows", len(rows) - 1)
