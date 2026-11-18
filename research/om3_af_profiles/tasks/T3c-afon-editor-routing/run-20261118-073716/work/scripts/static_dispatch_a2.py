# T3c Phase A: setting-id dispatch table, page source records, constructor slot.
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
lines = []


def say(s=""):
    lines.append(s)


def off(addr):
    return addr - BASE


def u16(addr):
    return struct.unpack_from("<H", BIN, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", BIN, off(addr))[0]


def hexb(addr, n):
    return BIN[off(addr):off(addr) + n].hex()


TABLE = 0x6136DD94
END = 0x6136ED94
N = (END - TABLE) // 8
say(f"dispatch table 0x{TABLE:08x} slots={N}")
slots = []
for i in range(N):
    a = TABLE + i * 8
    key, fn = u32(a), u32(a + 4)
    slots.append((key, fn))

want = {
    2154: "priority-release",
    2155: "priority-custom",
    163: "af-area-type",
    238: "home-area",
    165: "home-pos",
    1692: "home-area-ccw",
    1693: "home-area-cw",
    1694: "home-ccw",
    1695: "home-cw",
    0x3D6F: "afon-zone",
    1961: "page25-row0",
    79: "page26-row0",
}
say("== lookup as FUN_6111caee does (key == id, stride 8, mask 0x1ff) ==")
for sid, name in want.items():
    i = sid & 0x1FF
    seen = 0
    found = None
    while seen < N:
        key, fn = slots[i]
        if key == sid:
            found = (TABLE + i * 8, fn, seen)
            break
        if key == 0:
            break
        i = (i + 1) & 0x1FF
        seen += 1
    if found:
        say(f"  id {sid} {name} slot=0x{found[0]:08x} fn=0x{found[1]:08x} probes={found[2]}")
    else:
        say(f"  id {sid} {name} MISS probes={seen}")

say("== every occupied slot whose key is one of the wanted ids, any index ==")
want_ids = set(want)
for i, (key, fn) in enumerate(slots):
    if key in want_ids:
        say(f"  slot {i} 0x{TABLE + i * 8:08x} key={key} fn=0x{fn:08x} {want[key]}")

say(f"occupied {sum(1 for k, _ in slots if k)} empty {sum(1 for k, _ in slots if k == 0)}")

say("== functions those wanted hits point at, first 8 bytes ==")
seen_fn = set()
for i, (key, fn) in enumerate(slots):
    if key in want_ids and fn not in seen_fn:
        seen_fn.add(fn)
        if BASE <= fn < BASE + len(BIN):
            say(f"  fn 0x{fn:08x} for key {key} bytes {hexb(fn, 16)}")
        else:
            say(f"  fn 0x{fn:08x} for key {key} outside image")

say("== page source records, stride 12, from 0x61529ce8 ==")
for n in range(8):
    a = 0x61529CE8 + n * 12
    raw = hexb(a, 12)
    p, c, g = u32(a), u32(a + 4), u32(a + 8)
    ids = []
    if BASE <= p < BASE + len(BIN) and 0 < (c & 0xFFFF) <= 8:
        ids = [u16(p + k * 2) for k in range(c & 0xFFFF)]
    say(f"  0x{a:08x} {raw} w0=0x{p:08x} w1=0x{c:08x} w2=0x{g:08x} ids={ids}")

say("== constructor pointer slot 0x6153aee4 and neighbours ==")
base = 0x6153AE80
for a in range(base, base + 0xC0, 4):
    v = u32(a)
    mark = ""
    if v == 0x61203676:
        mark = "  <== wrapper"
    elif 0x61200000 <= v < 0x61210000:
        mark = "  menu-fn"
    say(f"  0x{a:08x} 0x{v:08x}{mark}")

say("== u32 refs to 0x6153ae80 / 0x6153aee4 / 0x6153aec0 ==")
for addr in (0x6153AE80, 0x6153AEC0, 0x6153AEE0, 0x6153AEE4, 0x6153AEE8):
    needle = struct.pack("<I", addr)
    hits = []
    start = 0
    while len(hits) < 8:
        i = BIN.find(needle, start)
        if i < 0:
            break
        hits.append(BASE + i)
        start = i + 1
    say(f"  0x{addr:08x} hits {len(hits)} " + " ".join(hex(h) for h in hits))

text = "\n".join(lines) + "\n"
(ROOT / "work" / "out" / "static-dispatch-a2.txt").write_text(text, encoding="utf-8")
print(text, end="")
