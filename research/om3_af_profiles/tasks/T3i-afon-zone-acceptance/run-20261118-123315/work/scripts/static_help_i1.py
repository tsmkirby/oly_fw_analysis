# role: observe. Static decode of the chooser help list. No image writes.
import struct
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
lines = []


def add(s=""):
    lines.append(s)


def off(addr):
    return addr - BASE


def blob(addr, n):
    return image[off(addr):off(addr) + n]


def u16(addr):
    return struct.unpack_from("<H", image, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", image, off(addr))[0]


def hexb(b):
    return b.hex()


def dump_opts(addr, n, name):
    add(f"{name} {addr:#x} records {n}")
    for i in range(n):
        a = addr + i * 12
        add(
            f"  [{i}] value {u32(a):#x} kind {u16(a+4):#x} id {u16(a+6):#x} "
            f"extra {u32(a+8):#x} raw {hexb(blob(a, 12))}"
        )


add("reader")
add("FUN_611c7785 at 0x611c7785 indexes A1 by udfu01 0xc (stride 12).")
add("Match is the record's first u32 against D0. D1 is the scan count.")
add("Kind is the u16 at +4. The text or image id is the u16 at +6.")
add("The help call at 0x611f8437 passes record+0x10 as A1 and record+8 as D1.")
add("")
add("stock help and the ten records a count of 10 would scan")
dump_opts(0x61576520, 10, "help-scan")
add("")
add("zone face list")
dump_opts(0x6158BA1C, 10, "zone-faces")
add("")
add("priority face list")
dump_opts(0x61575880, 2, "priority-faces")
add("")

FACE = 0x6037BEDC
STRIDE = 0x24
COUNT = 0x60
ZONE = 0x6158BA1C
add(f"face table {FACE:#x} stride {STRIDE:#x} count {COUNT}")
zone_hits = []
long_help = []
for i in range(COUNT):
    a = FACE + i * STRIDE
    key = u16(a)
    count = u16(a + 8)
    face = u32(a + 0x0C)
    help_p = u32(a + 0x10)
    if face == ZONE or count >= 10 or help_p == 0x61576520:
        add(
            f"  rec {i} {a:#x} key {key:#x} count {count} "
            f"face {face:#x} help {help_p:#x}"
        )
        if face == ZONE:
            zone_hits.append((i, a, key, count, help_p))
        if count >= 10:
            long_help.append((i, a, key, count, face, help_p))

add("")
add("help lists of the records above")
seen = set()
for i in range(COUNT):
    a = FACE + i * STRIDE
    count = u16(a + 8)
    face = u32(a + 0x0C)
    help_p = u32(a + 0x10)
    if not (face == ZONE or count >= 10):
        continue
    if help_p in seen or help_p < 0x60000000:
        continue
    seen.add(help_p)
    dump_opts(help_p, max(count, 1), f"help-of-rec-{i}-key-{u16(a):#x}")
    add("")

add("bindings whose UI id is 238, 239, 240 or 0x3D6F")
BIND = 0x615C540C
BIND_N = 416
for i in range(BIND_N):
    a = BIND + i * 24
    editor = u32(a)
    ui = u32(a + 8)
    mark = u32(a + 4)
    word = u32(a + 0x10)
    if ui in (238, 239, 240, 0x3D6F) or editor in (0x1E0, 0x1E1, 0x1E2, 0x1E3, 0x1E4, 0x1E5, 0x1E6):
        add(
            f"  [{i}] {a:#x} editor {editor:#x} mark {mark:#x} ui {ui:#x} "
            f"word {word:#x} raw {hexb(blob(a, 24))}"
        )

add("")
add("face records selected by those binding words")
keys = set()
for i in range(BIND_N):
    a = BIND + i * 24
    ui = u32(a + 8)
    if ui in (238, 239, 240):
        keys.add(u32(a + 0x10) & 0xFFFF)
for i in range(COUNT):
    a = FACE + i * STRIDE
    if u16(a) in keys:
        count = u16(a + 8)
        help_p = u32(a + 0x10)
        add(
            f"  key {u16(a):#x} rec {i} {a:#x} count {count} "
            f"face {u32(a+0x0c):#x} help {help_p:#x}"
        )
        if help_p >= 0x60000000:
            dump_opts(help_p, max(count, 1), f"ui238-help-{u16(a):#x}")

add("")
ZONE_VALUES = [0, 1, 2, 3, 5, 10, 6, 7, 8, 9]
add("search for a kind-4 list whose values are the ten zone values in order")
# First record is value 0, kind 4. Later records are checked only at those hits.
needle = struct.pack("<IH", 0, 4)
hits = []
start = 0
limit = len(image) - 120
while start < limit and len(hits) < 20:
    o = image.find(needle, start, limit)
    if o < 0:
        break
    start = o + 4
    ids = []
    ok = True
    for n, v in enumerate(ZONE_VALUES):
        b = o + n * 12
        if struct.unpack_from("<IH", image, b) != (v, 4):
            ok = False
            break
        ids.append(struct.unpack_from("<H", image, b + 6)[0])
    if ok:
        hits.append((BASE + o, ids))
add(f"  hits {len(hits)}")
for addr, ids in hits:
    add(f"  {addr:#x} ids " + " ".join(f"{i:#x}" for i in ids))

add("")
add("free bytes after the private face record")
FACE_PRIV = 0x6031EA48
HELP_AT = 0x6031EA6C
window = blob(HELP_AT, 128)
add(f"  {HELP_AT:#x} first128 {hexb(window)}")
add(f"  all FF {all(b == 0xFF for b in window)}")
# T3a overlay span
csv = Path("ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv").read_text(encoding="utf-8").splitlines()[1:]
addrs = [int(line.split(",")[1], 16) for line in csv if line.strip()]
add(f"  T3a overlay {min(addrs):#x}..{max(addrs):#x} count {len(addrs)}")
span = range(HELP_AT, HELP_AT + 120)
clash = [a for a in addrs if a in span or (FACE_PRIV <= a < FACE_PRIV + 0x24)]
add(f"  clash with help window or face record {clash}")

# section of the help window
table = 0x60029B28
sections = []
for n in range(10):
    a = table + n * 12
    dest, source, flag = struct.unpack_from("<III", image, off(a))
    sections.append((n + 1, dest, source, flag))
add("sections")
for n, dest, source, flag in sections:
    add(f"  {n} dest {dest:#x} source {source:#x} flag {flag}")


def section_of(addr):
    for i, (n, dest, source, flag) in enumerate(sections):
        nxt = sections[i + 1][1] if i + 1 < len(sections) else dest + 1
        if dest <= addr < nxt:
            return n, flag, dest, nxt
    return None, None, None, None


for addr in (0x6031EA48, 0x6031EA6C, 0x6031EAE3, 0x60320000, 0x61576520, 0x6158BA1C):
    n, flag, dest, nxt = section_of(addr)
    add(f"  addr {addr:#x} section {n} flag {flag} range {dest:#x}..{nxt:#x}")

text = "\n".join(lines) + "\n"
Path("work/out/static-help-i1.txt").write_text(text, encoding="utf-8")
print(text)
