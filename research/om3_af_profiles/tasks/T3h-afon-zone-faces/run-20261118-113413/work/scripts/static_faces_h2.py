# role: observe. Decode the chooser face table at 0x6037bedc.
import struct
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
TABLE = 0x6037BEDC
STRIDE = 0x24
COUNT = 0x60
lines = []


def u16(addr):
    return struct.unpack_from("<H", image, addr - BASE)[0]


def u32(addr):
    return struct.unpack_from("<I", image, addr - BASE)[0]


def blob(addr, n):
    return image[addr - BASE:addr - BASE + n]


names = {
    0x6158BA04: "page27-priority",
    0x6158BA1C: "zone",
    0x61575880: "chooser-face-seen",
    0x61576520: "chooser-help-seen",
    0x61574870: "chooser-class",
    0x6158AEB4: "page-class",
}
lines.append("table 0x6037bedc stride 0x24 count 0x60")
zone_hits = []
face_hits = []
for i in range(COUNT):
    a = TABLE + i * STRIDE
    key = u16(a)
    count = u16(a + 8)
    face = u32(a + 0x0C)
    help_ = u32(a + 0x10)
    extra = u32(a + 0x14)
    mark = []
    for p, name in ((face, "face"), (help_, "help"), (extra, "extra")):
        if p in names:
            mark.append(f"{name}={names[p]}")
    if face == 0x6158BA1C or help_ == 0x6158BA1C:
        zone_hits.append(i)
    if face == 0x61575880:
        face_hits.append(i)
    flag = (" " + " ".join(mark)) if mark else ""
    lines.append(
        f"[{i:02d}] {a:#x} key {key:#06x} count {count:#x} face {face:#x} help {help_:#x} +14 {extra:#x}{flag}"
    )
lines.append("zone-list records " + " ".join(str(i) for i in zone_hits))
lines.append("seen-face records " + " ".join(str(i) for i in face_hits))

# Pointers at the two chooser lists, and at the table base.
for needle, name in (
    (0x61575880, "chooser-face"),
    (0x61576520, "chooser-help"),
    (0x6037BEDC, "table"),
):
    pat = struct.pack("<I", needle)
    start = 0
    hits = []
    while True:
        i = image.find(pat, start)
        if i < 0:
            break
        hits.append(BASE + i)
        start = i + 1
    lines.append(f"ptr {name} {needle:#x} count {len(hits)}")
    for h in hits[:30]:
        lines.append(f"  {h:#x} {blob(h - 4, 16).hex()}")

# The two lists themselves, 8 records each.
for base, name in ((0x61575880, "face-list"), (0x61576520, "help-list")):
    lines.append(name)
    for i in range(4):
        a = base + i * 12
        lines.append(
            f"  [{i}] {blob(a, 12).hex()} value {u32(a):#x} kind {u16(a+4):#x} id {u16(a+6):#x} class {u32(a+8):#x}"
        )

# Is the table inside a run of non-FF, and is there a free slot (key 0 and face 0)?
free = []
for i in range(COUNT):
    a = TABLE + i * STRIDE
    if blob(a, STRIDE) == b"\x00" * STRIDE or blob(a, STRIDE) == b"\xff" * STRIDE:
        free.append(i)
lines.append("empty records " + " ".join(str(i) for i in free))
text = "\n".join(lines) + "\n"
Path("work/out/static-faces-h2.txt").write_text(text, encoding="utf-8")
print(text)
