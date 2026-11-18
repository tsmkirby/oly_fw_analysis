# Static dump for T3a. Read-only on inputs. Writes work/out/static-afon-v1.txt.
import pathlib
import struct

ROOT = pathlib.Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
RES = (ROOT / "inputs" / "02_0106_458c0020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out" / "static-afon-v1.txt"
lines = []


def off(addr):
    return addr - BASE


def u16(addr):
    return struct.unpack_from("<H", BIN, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", BIN, off(addr))[0]


def dump(addr, n):
    return BIN[off(addr):off(addr) + n]


def hx(b):
    return b.hex()


def say(s=""):
    lines.append(s)


say(f"main bytes {len(BIN)} res bytes {len(RES)}")
say("section descriptors at 0x60029b28, 12 bytes, index = section-1")
for i in range(10):
    addr = 0x60029b28 + i * 12
    raw = dump(addr, 12)
    a, b, c = struct.unpack_from("<III", raw)
    say(f"  sec {i+1} {addr:#x} {hx(raw)} w0={a:#x} w1={b:#x} w2={c:#x} compressed={c & 1}")

# Ends from 0x60045e6c immediates, paired with the record's known ranges.
say("known ends: s1 0x6031f000 s2 0x60718800 s4 0x60a8f800 s7 0x6164b000")

say("page 27 descriptor 0x6158f0f8")
say("  " + hx(dump(0x6158F0F8, 20)))
say(f"  page {u32(0x6158F0F8)} rows {u32(0x6158F0F8+4):#x} count {u32(0x6158F0F8+8)} title {u32(0x6158F0F8+12):#x}")

say("page 28 descriptor 0x6158f10c")
say("  " + hx(dump(0x6158F10C, 20)))
say(f"  page {u32(0x6158F10C)} rows {u32(0x6158F10C+4):#x} count {u32(0x6158F10C+8)} title {u32(0x6158F10C+12):#x}")

def row(addr):
    raw = dump(addr, 36)
    sid, kind, lab, cls, opt, cnt, z, cls2, alt, altn = struct.unpack_from("<IHHIIIIIII", raw)
    say(f"  row {addr:#x} {hx(raw)}")
    say(f"    sid {sid} kind {kind} label {lab:#x} class {cls:#x} opt {opt:#x} count {cnt} zero {z:#x} class2 {cls2:#x} alt {alt:#x} altn {altn}")
    return opt, cnt

say("page 27 rows")
p27 = u32(0x6158F0F8 + 4)
for i in range(u32(0x6158F0F8 + 8)):
    row(p27 + i * 36)

say("page 28 rows")
p28 = u32(0x6158F10C + 4)
opts = []
for i in range(u32(0x6158F10C + 8)):
    opt, cnt = row(p28 + i * 36)
    opts.append((opt, cnt))

say("zone list 0x6158ba1c")
zopt, zcnt = 0x6158BA1C, 10
say(f"  bytes {hx(dump(zopt, 12 * zcnt))}")
for i in range(zcnt):
    a = zopt + i * 12
    val, kind, lab, cls = struct.unpack_from("<IHH I", dump(a, 12))
    say(f"  opt {i} {a:#x} value {val} kind {kind} label {lab:#x} class {cls:#x}")

say("page 28 first row option list vs 0x6158ba1c")
if opts:
    say(f"  first row opt {opts[0][0]:#x} count {opts[0][1]} same {opts[0][0] == 0x6158BA1C}")

say("source record 0x61529ce8")
say("  " + hx(dump(0x61529CE8, 16)))
say(f"  +0 {u32(0x61529CE8):#x} +4 {u32(0x61529CE8+4):#x} +8 {u32(0x61529CE8+8)} +12 {u32(0x61529CE8+12):#x}")
idp = u32(0x61529CE8 + 4)
say(f"  id list {idp:#x} {hx(dump(idp, 8))}")

say("tail 0x6031e920 first 16 " + hx(dump(0x6031E920, 16)))
say("tail all ff " + str(set(dump(0x6031E920, 0x6031F000 - 0x6031E920)) == {0xFF}))

# UI maps. Addresses are the first entry of each range, from the assembly of 0x60419446 / 0x60419696.
ranges = [
    ("low", 0, 0x8CF, lambda i: 0x6062555C + i * 4),
    ("3000", 0xBB8, 0xBE6, lambda i: 0x606249BC + i * 4),
    ("4000", 0xFA0, 0xFB6, lambda i: 0x60627984 + (i * 2) - 0x1F40),
    ("4500", 0x1194, 0x11A9, lambda i: 0x60627958 + (i * 2) - 0x2328),
    ("10000", 0x2710, 0x2756, lambda i: 0x606279B2 + i * 4 - 0x9C40),
    ("15000", 0x3A98, 0x3C5F, lambda i: 0x60627ACE + i * 4 - 0xEA60),
]
# Verify the 4000/4500 formulas against the assembly before trusting them.
# 4000: A0 = 0x60627984 + id*2; halfword at A0-0x1F40.
# 4500: A0 = 0x60627958 + id*2; halfword at A0-0x2328.
# 10000: A0 = 0x606279B2 + id*4; halfword at A0-0x9C40. Second half is index at -0x9C3E.
# 15000: A0 = 0x60627ACE + id*4; halfword at A0-0xEA60.

used = {}
zero_slots = []
for name, lo, hi, addr_of in ranges:
    nonzero = 0
    for i in range(lo, hi + 1):
        a = addr_of(i)
        if a < BASE or a + 4 > BASE + len(BIN):
            say(f"MAP {name} id {i} address {a:#x} OUT OF IMAGE")
            break
        key = u16(a)
        index = u16(a + 2)
        if key:
            nonzero += 1
            used[i] = (name, key, index, a)
        else:
            zero_slots.append(i)
    say(f"MAP {name} ids {lo:#x}-{hi:#x} nonzero {nonzero} first {addr_of(lo):#x} last {addr_of(hi):#x}")

say(f"mapped ids {len(used)} zero slots inside ranges {len(zero_slots)}")
# Spot-check 2154 and 238.
for sid in (2154, 2155, 163, 238, 165, 1712):
    say(f"spot {sid} {used.get(sid)}")

# Candidate IDs in the gap between the low map and the 3000 map.
def hits(sid):
    raw16 = struct.pack("<H", sid)
    raw32 = struct.pack("<I", sid)
    n32 = 0
    start = 0
    while True:
        j = BIN.find(raw32, start)
        if j < 0:
            break
        n32 += 1
        start = j + 1
    n16 = 0
    mov16 = 0
    start = 0
    while True:
        j = BIN.find(raw16, start)
        if j < 0:
            break
        n16 += 1
        if j >= 1 and BIN[j - 1] in (0x2C, 0x2D, 0x2E, 0x2F):
            mov16 += 1
        start = j + 1
    mov32 = 0
    start = 0
    while True:
        j = BIN.find(raw32, start)
        if j < 0:
            break
        if j >= 2 and BIN[j - 2] == 0xFC and BIN[j - 1] in (0xCC, 0xCD, 0xCE, 0xCF):
            mov32 += 1
        start = j + 1
    return n32, n16, mov16, mov32

say("gap candidates (outside every map range)")
# A short list of distinctive IDs, plus the first quiet one in the gap.
cands = [0x900, 0xA70, 0xA71, 0xB00, 0xB70, 0x1388, 0x1600, 0x2000, 0x5000]
quiet = None
for sid in range(0x8D0, 0xBB8):
    n32, n16, mov16, mov32 = hits(sid)
    if n32 == 0 and mov16 == 0 and mov32 == 0 and n16 == 0:
        quiet = sid
        break
say(f"first gap id with no u16 and no u32 hit: {quiet:#x}" if quiet is not None else "no fully quiet gap id")
for sid in cands:
    n32, n16, mov16, mov32 = hits(sid)
    say(f"  id {sid:#x} ({sid}) u32 {n32} u16 {n16} mov16 {mov16} mov32 {mov32} mapped {sid in used}")

# UTF-16 scans for zone words.
needles = [
    "Single", "All", "Small", "Cross", "Middle", "Large", "Custom",
    "AF Target", "Target", "Zone", "AF Area", "AF-ON", "Home",
    "Group", "Spot",
]
say("utf16 hits in main and resource")
for word in needles:
    enc = word.encode("utf-16le")
    say(f"  {word!r} main {BIN.find(enc):#x} res {RES.find(enc):#x}")

# Page 25 and 26 descriptors: page 27 is entry at 0x6158f0f8, stride 20, so 25 and 26 are two and one back.
for page, addr in ((25, 0x6158F0F8 - 40), (26, 0x6158F0F8 - 20), (29, 0x6158F0F8 + 40)):
    say(f"page guess {page} {addr:#x} id {u32(addr)} rows {u32(addr+4):#x} count {u32(addr+8)} title {u32(addr+12):#x}")
    base = u32(addr + 4)
    for i in range(min(u32(addr + 8), 4)):
        row(base + i * 36)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote {OUT} lines {len(lines)}")
