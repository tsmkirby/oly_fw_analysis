# role: observe. Find same-shaped 24-byte editor tables and every pointer to their bases.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
LO = 0x615C59F4


def u16(addr):
    return struct.unpack_from("<H", BIN, addr - BASE)[0]


def u32(addr):
    return struct.unpack_from("<I", BIN, addr - BASE)[0]


lines = []
say = lines.append
start = LO - 160
say("bytes before 0x615c59f4:")
blob = BIN[start - BASE:LO - BASE]
for i in range(0, len(blob), 16):
    say("  0x%08x %s" % (start + i, blob[i:i + 16].hex()))

sec_lo = 0x6103F000
sec_hi = 0x6169E800
groups = []
o = sec_lo
run_lo = None
run_n = 0
run_a = None
run_b = None


def flush():
    global run_lo, run_n, run_a, run_b
    if run_n >= 8:
        groups.append((run_lo, run_n, run_a, run_b, u16(run_lo), u16(run_lo + (run_n - 1) * 24)))
    run_lo = None
    run_n = 0
    run_a = None
    run_b = None


while o + 24 <= sec_hi:
    ident, z = struct.unpack_from("<HH", BIN, o - BASE)
    a = struct.unpack_from("<I", BIN, o - BASE + 4)[0]
    b = struct.unpack_from("<I", BIN, o - BASE + 12)[0]
    tail = struct.unpack_from("<I", BIN, o - BASE + 20)[0]
    ok = z == 0 and tail == 0 and 0 < ident < 0x8000
    if ok and run_lo is not None and ident == u16(o - 24) + 1 and a == run_a and b == run_b:
        run_n += 1
        o += 24
        continue
    if run_n:
        flush()
    if ok:
        run_lo = o
        run_n = 1
        run_a = a
        run_b = b
        o += 24
    else:
        o += 2
if run_n:
    flush()

say("groups %d" % len(groups))
for g in groups:
    say("  lo 0x%08x n %d +4 0x%x +12 0x%x ids 0x%04x..0x%04x" % g)

say("== byte-pattern refs ==")
for lo, n, a, b, first, last in groups:
    for delta in (0, -4, -8, -12, -16, -20, -24, -32, -36, -48):
        pat = struct.pack("<I", (lo + delta) & 0xFFFFFFFF)
        refs = []
        start_at = 0
        while len(refs) < 6:
            i = BIN.find(pat, start_at)
            if i < 0:
                break
            refs.append(BASE + i)
            start_at = i + 1
        if refs:
            say("  0x%08x delta %d refs %s" % (lo, delta, " ".join(hex(x) for x in refs)))

text = "\n".join(lines) + "\n"
(OUT / "binding-groups-f2.txt").write_text(text, encoding="utf-8")
print("groups", len(groups))
