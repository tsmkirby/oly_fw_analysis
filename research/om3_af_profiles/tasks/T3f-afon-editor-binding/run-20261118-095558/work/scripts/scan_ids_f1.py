# role: observe. Scan the decoded main image for editor-id neighbours of 0x1e0-0x1e4
# and for the priority option-list pointer 0x6158ba04. Read-only on inputs.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
OUT.mkdir(parents=True, exist_ok=True)

secs = []
for i in range(12):
    dest, size, flag = struct.unpack_from("<III", BIN, 0x60029B28 - BASE + i * 12)
    secs.append((i + 1, dest, size, flag))


def section_of(addr):
    for n, dest, size, flag in secs:
        end = dest + size if size < 0x10000000 else None
        # The third field is a file-space word, not a length. Bound a section by the next dest.
    ordered = sorted((dest, n, flag) for n, dest, size, flag in secs if 0x60000000 <= dest <= 0x70000000)
    for i, (dest, n, flag) in enumerate(ordered):
        nxt = ordered[i + 1][0] if i + 1 < len(ordered) else dest + 0x2000000
        if dest <= addr < nxt:
            return n, dest, nxt, bool(flag & 1)
    return None


def u16(o):
    return struct.unpack_from("<H", BIN, o)[0]


def u32(o):
    return struct.unpack_from("<I", BIN, o)[0]


lines = []
say = lines.append
say("image %d base 0x%x" % (len(BIN), BASE))
for addr in (0x611a01e8, 0x611a01ee, 0x611a0205, 0x6127e750, 0x6151346c, 0x61513470, 0x6158ba04, 0x6158ba1c):
    sec = section_of(addr)
    o = addr - BASE
    say("addr 0x%08x off 0x%x section %s bytes %s" % (addr, o, sec, BIN[o:o + 32].hex()))

IDS = {0x1E0, 0x1E1, 0x1E2, 0x1E3, 0x1E4}
UI = {2154, 2155, 2156, 2157, 2205}
say("== u32 equals of 0x1e0-0x1e4, capped at 80 ==")
hits = 0
for o in range(0, len(BIN) - 4, 2):
    v = u32(o)
    if v in IDS:
        hits += 1
        if hits <= 80:
            say("  0x%08x u32 0x%04x context %s" % (BASE + o, v, BIN[max(0, o - 8):o + 16].hex()))
say("u32 hits %d" % hits)

say("== u16 0x1e0-0x1e4 within 16 bytes of a priority UI id, capped at 60 ==")
near = 0
# stride-2 scan is large; check only aligned halfwords
for o in range(0, len(BIN) - 2, 2):
    v = u16(o)
    if v not in IDS:
        continue
    window = BIN[max(0, o - 16):o + 18]
    found = None
    for d in range(0, len(window) - 1, 2):
        w = struct.unpack_from("<H", window, d)[0]
        if w in UI:
            found = w
            break
    if found is None:
        continue
    near += 1
    if near <= 60:
        say("  0x%08x id 0x%04x near ui %d ctx %s" % (BASE + o, v, found, BIN[max(0, o - 8):o + 20].hex()))
say("near hits %d" % near)

say("== pointer 0x6158ba04 and 0x6158ba1c ==")
for target in (0x6158BA04, 0x6158BA1C):
    pat = struct.pack("<I", target)
    start = 0
    n = 0
    while True:
        i = BIN.find(pat, start)
        if i < 0:
            break
        n += 1
        if n <= 40:
            say("  ptr 0x%08x at 0x%08x ctx %s" % (target, BASE + i, BIN[max(0, i - 8):i + 16].hex()))
        start = i + 2
    say("  count %d for 0x%08x" % (n, target))

say("== constant-stride runs of 0x1e0,0x1e1,0x1e2 ==")
runs = 0
for stride in (2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 48):
    pat_hits = 0
    # search the three halfwords at this stride
    b0 = struct.pack("<H", 0x1E0)
    start = 0
    while pat_hits < 8:
        i = BIN.find(b0, start)
        if i < 0 or i + stride * 2 + 2 > len(BIN):
            break
        if u16(i + stride) == 0x1E1 and u16(i + stride * 2) == 0x1E2:
            pat_hits += 1
            runs += 1
            say("  stride %d at 0x%08x next %s" % (
                stride, BASE + i,
                " ".join("%04x" % u16(i + stride * k) for k in range(6))))
        start = i + 2
    if pat_hits:
        say("  stride %d runs shown %d" % (stride, pat_hits))
say("runs %d" % runs)
(OUT / "scan-ids-f1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines[:40]))
print("... lines", len(lines))
