# role: observe. Find every image occurrence of the binding-table base and of nearby headers.
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
say("bytes before table:")
start = LO - 128
say("  0x%08x %s" % (start, BIN[start - BASE:LO - BASE].hex()))

# Same-shaped groups: stride 24, +4 constant, +12 constant, sequential ids.
say("== other 24-byte groups with +2==0 +20==0 and sequential ids, length>=8 ==")
# Scan section 7 only: dest 0x6103f000 .. 0x6169e800
sec_lo = 0x6103F000 - BASE
sec_hi = 0x6169E800 - BASE
groups = []
addr = 0x6103F000
# Step through looking for a record that starts a run.
# A record: u16 id, u16 0, u32 constA, u32 ui, u32 constB, u32 idx, u32 0
prev = None
run_lo = None
run_n = 0
run_a = None
run_b = None

def flush(end_addr):
    global run_lo, run_n, run_a, run_b
    if run_n >= 8:
        groups.append((run_lo, run_n, run_a, run_b, u16(run_lo), u16(run_lo + (run_n - 1) * 24)))
    run_lo = None
    run_n = 0

o = sec_lo
while o + 24 <= sec_hi:
    ident, z, a, ui, b, idx, tail = struct.unpack_from("<HHI III", BIN, o)
    # HHI is 2+2+4=8, then three I. That's 8+12=20, missing the last? 
    # Layout: +0 H, +2 H, +4 I, +8 I, +12 I, +16 I, +20 I. 24 bytes.
    ident, z = struct.unpack_from("<HH", BIN, o)
    a, ui, b, idx, tail = struct.unpack_from("<IIIII", BIN, o + 4)
    ok = z == 0 and tail == 0 and ident != 0 and ident != 0xFFFF
    if ok and run_lo is not None and ident == u16(BASE + o - 24) + 1 and a == run_a and b == run_b:
        run_n += 1
        o += 24
        continue
    if run_n:
        flush(BASE + o)
    if ok:
        run_lo = BASE + o
        run_n = 1
        run_a = a
        run_b = b
        o += 24
    else:
        o += 2
if run_n:
    flush(0)
say("groups %d" % len(groups))
for g in groups:
    say("  lo 0x%08x n %d +4 0x%x +12 0x%x ids 0x%04x..0x%04x" % g)

say("== byte-pattern refs to each group base and to base-4/-8/-16 ==")
for lo, n, a, b, first, last in groups:
    for delta in (0, -4, -8, -16, -32):
        pat = struct.pack("<I", (lo + delta) & 0xFFFFFFFF)
        start = 0
        refs = []
        while len(refs) < 8:
            i = BIN.find(pat, start)
            if i < 0:
                break
            refs.append(BASE + i)
            start = i + 1
        if refs:
            say("  0x%08x refs %s" % (lo + delta, " ".join(hex(x) for x in refs)))

text = "\n".join(lines) + "\n"
(OUT / "binding-groups-f1.txt").write_text(text, encoding="utf-8")
print("groups", len(groups))
print("lines", len(lines))
