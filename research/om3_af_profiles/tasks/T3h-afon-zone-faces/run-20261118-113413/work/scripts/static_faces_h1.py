# role: observe. Static bytes for the chooser face source. No image writes.
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


def dump_row(addr, name):
    raw = blob(addr, 36)
    add(f"{name} {addr:#x} {hexb(raw)}")
    add(
        f"  id {u32(addr):#x} kind {u16(addr+4):#x} label {u16(addr+6):#x} "
        f"class {u32(addr+8):#x} primary {u32(addr+12):#x} count {u32(addr+16):#x} "
        f"mid {u32(addr+20):#x} class2 {u32(addr+24):#x} "
        f"alternate {u32(addr+28):#x} altcount {u32(addr+32):#x}"
    )


def dump_opts(addr, n, name):
    add(f"{name} {addr:#x} records {n}")
    for i in range(n):
        a = addr + i * 12
        add(
            f"  [{i}] value {u32(a):#x} kind {u16(a+4):#x} id {u16(a+6):#x} "
            f"class {u32(a+8):#x} raw {hexb(blob(a, 12))}"
        )


add("rows")
dump_row(0x6158DC44, "2154")
dump_row(0x6158DC68, "2155")
dump_row(0x6158DC8C, "page28-238")
add("lists")
dump_opts(0x6158BA04, 2, "priority")
dump_opts(0x6158BA1C, 10, "zone")
add("value tables")
add(f"2154 values {hexb(blob(0x606190B7, 8))}")
add(f"238 values {hexb(blob(0x606178B1, 16))}")
add(f"desc 2154 {hexb(blob(0x6062132C, 20))}")
add(f"desc 238 {hexb(blob(0x606200E4, 20))}")

patterns = {
    "priority-value0": bytes.fromhex("0000000004004f12"),
    "priority-value1": bytes.fromhex("0100000004007b12"),
}
add("option-record hits")
for name, pat in patterns.items():
    start = 0
    hits = []
    while True:
        i = image.find(pat, start)
        if i < 0:
            break
        hits.append(BASE + i)
        start = i + 1
    add(f"  {name} count {len(hits)} " + " ".join(f"{a:#x}" for a in hits[:20]))

needles = {0x6158BA04: "priority-list", 0x6158BA1C: "zone-list"}
add("u32 pointers at the two lists")
for needle, name in needles.items():
    pat = struct.pack("<I", needle)
    start = 0
    hits = []
    while True:
        i = image.find(pat, start)
        if i < 0:
            break
        hits.append(BASE + i)
        start = i + 1
    add(f"  {name} {needle:#x} count {len(hits)}")
    for a in hits:
        add(f"    at {a:#x} context {hexb(blob(a - 8, 24))}")

add("catalog tables used beside the four FUN_611c7785 call sites")
tables = [
    (0x613746C0, 0x14, 11, "61128e12"),
    (0x6137479C, 0x14, 5, "61128fbe-window"),
    (0x61374800, 0x14, 5, "61129098-window"),
    (0x61374AF8, 0x1C, 31, "61128229"),
]
zone_ids = {0x23A3, 0x028A, 0x064A, 0x23A4, 0x19B5, 0x23A5, 0x23A6, 0x23A7, 0x23A8, 0x23A9, 0x124F, 0x127B}
for base, stride, count, name in tables:
    add(f"  table {name} {base:#x} stride {stride:#x} count {count}")
    for i in range(count):
        a = base + i * stride
        raw = blob(a, stride)
        words = [u32(a + 4 * k) for k in range(stride // 4)]
        ids = []
        for w in words:
            if (w & 0xFFFF) in zone_ids or ((w >> 16) & 0xFFFF) in zone_ids:
                ids.append(f"{w:#x}")
        mark = (" MARK " + ",".join(ids)) if ids else ""
        add(f"    [{i}] {hexb(raw)}{mark}")

add("section-1 tail around the T3g overlay")
# Report non-FF bytes from the descriptor node through 0x400 bytes past the action table.
start = 0x6031E9B8
end = 0x6031EA48 + 0x400
raw = blob(start, end - start)
ff = 0
run_at = None
for i, b in enumerate(raw):
    addr = start + i
    if b == 0xFF:
        if run_at is None:
            run_at = addr
        ff += 1
    else:
        if run_at is not None and ff >= 16:
            add(f"  ff {run_at:#x} len {ff}")
        run_at = None
        ff = 0
        if i < 0xA0 or b != 0xFF:
            pass
if run_at is not None:
    add(f"  ff {run_at:#x} len {ff} through {end:#x}")
non = [(start + i, raw[i]) for i in range(len(raw)) if raw[i] != 0xFF]
add(f"  non-ff count {len(non)} first {non[:12]} last {non[-8:]}")

# Call-site windows. These are the bytes the listing check will cover; printed here as data.
windows = [
    (0x611285B2, 32, "call-611285c9-window"),
    (0x61128F98, 24, "call-61128faf-window"),
    (0x6112906A, 32, "call-61129089-window"),
    (0x61129144, 32, "call-61129163-window"),
    (0x61204065, 48, "fun-61204065"),
    (0x611C7FA7, 46, "fun-611c7fa7"),
    (0x611C7785, 32, "fun-611c7785-head"),
    (0x611C782F, 24, "fun-611c782f-head"),
]
add("call-site bytes")
for addr, n, name in windows:
    add(f"  {name} {addr:#x} {hexb(blob(addr, n))}")

text = "\n".join(lines) + "\n"
Path("work/out").mkdir(parents=True, exist_ok=True)
Path("work/out/static-faces-h1.txt").write_text(text, encoding="utf-8")
print(text)
