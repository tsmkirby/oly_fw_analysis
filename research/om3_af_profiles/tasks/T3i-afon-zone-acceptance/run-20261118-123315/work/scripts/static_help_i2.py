# role: observe. Second static pass: zone-value help lists and page-28 rows. No image writes.
import struct
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
lines = []


def add(s=""):
    lines.append(s)


def u16_at(b):
    return struct.unpack_from("<H", image, b)[0]


def u32_at(b):
    return struct.unpack_from("<I", image, b)[0]


ZONE = {0, 1, 2, 3, 5, 6, 7, 8, 9, 10}
FACE_ORDER = [0, 2, 1, 5, 3, 10, 6, 7, 8, 9]
add("kind-4 runs of 10 whose values are the zone set, and the face-list order")
needle = struct.pack("<IH", 0, 4)
hits_set = []
hits_order = []
start = 0
limit = len(image) - 120
while start < limit and (len(hits_set) < 30 or len(hits_order) < 10):
    o = image.find(needle, start, limit)
    if o < 0:
        break
    start = o + 4
    vals = []
    ok = True
    ids = []
    for n in range(10):
        b = o + n * 12
        val, kind = struct.unpack_from("<IH", image, b)
        if kind != 4:
            ok = False
            break
        vals.append(val)
        ids.append(u16_at(b + 6))
    if not ok:
        continue
    if set(vals) == ZONE and len(hits_set) < 30:
        hits_set.append((BASE + o, vals, ids))
    if vals == FACE_ORDER and len(hits_order) < 10:
        hits_order.append((BASE + o, ids))
add(f"set hits {len(hits_set)}")
for addr, vals, ids in hits_set:
    add(f"  {addr:#x} vals {vals} ids " + " ".join(f"{i:#x}" for i in ids))
add(f"face-order hits {len(hits_order)}")
for addr, ids in hits_order:
    add(f"  {addr:#x} ids " + " ".join(f"{i:#x}" for i in ids))

add("")
add("page 28 and 29 rows, 36 bytes each, from 0x6158dc8c")
for i in range(6):
    a = 0x6158DC8C + i * 36
    raw = image[a - BASE:a - BASE + 36]
    ident, kind, label = struct.unpack_from("<IHH", raw, 0)
    primary, count, mid, class2, alt, altc = struct.unpack_from("<IIIIII", raw, 8)
    add(
        f"  [{i}] {a:#x} id {ident:#x} kind {kind:#x} label {label:#x} "
        f"primary {primary:#x} count {count:#x} alt {alt:#x} altcount {altc:#x} "
        f"raw {raw.hex()}"
    )

add("")
add("page id lists T3c used")
for name, addr, n in (("page28", 0x61529816, 8), ("page29", 0x6152981C, 8)):
    raw = image[addr - BASE:addr - BASE + n * 2]
    ids = [struct.unpack_from("<H", raw, i * 2)[0] for i in range(n)]
    add(f"  {name} {addr:#x} " + " ".join(f"{i:#x}" for i in ids))

text = "\n".join(lines) + "\n"
Path("work/out/static-help-i2.txt").write_text(text, encoding="utf-8")
print(text)
