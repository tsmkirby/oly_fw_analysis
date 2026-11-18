# Direct-call search with absolute targets compared to absolute targets.
# The T3c search compared a file-offset sum with an absolute address.
# Read-only over inputs. Writes work/out/static-calls-d1.txt.
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out" / "static-calls-d1.txt"
TSV = ROOT / "ref" / "analysis" / "decompiled-main" / "functions.tsv"


def off(addr):
    o = addr - BASE
    if not 0 <= o < len(BIN):
        raise ValueError(hex(addr))
    return o


def dump(addr, n):
    return BIN[off(addr):off(addr) + n]


def u16(addr):
    return struct.unpack_from("<H", BIN, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", BIN, off(addr))[0]


def calls_to(targets):
    """Return (site_absolute, target_absolute, kind) for CALL encodings.

    MN10300 CALL: opcode, displacement from the opcode address, then the
    frame bytes. The absolute target is BASE + file_offset + displacement.
    The old search omitted BASE, so an absolute wanted address never matched.
    """
    want = set(targets)
    found = []
    old_hits = []
    n = len(BIN)
    start = 0
    while True:
        i = BIN.find(b"\xdd", start)
        if i < 0 or i + 7 > n:
            break
        rel = struct.unpack_from("<i", BIN, i + 1)[0]
        absolute = (BASE + i + rel) & 0xFFFFFFFF
        relative = (i + rel) & 0xFFFFFFFF
        if absolute in want:
            found.append((BASE + i, absolute, "call32"))
        if relative in want:
            old_hits.append((BASE + i, relative, "call32"))
        start = i + 1
    start = 0
    while True:
        i = BIN.find(b"\xcd", start)
        if i < 0 or i + 5 > n:
            break
        rel = struct.unpack_from("<h", BIN, i + 1)[0]
        absolute = (BASE + i + rel) & 0xFFFFFFFF
        relative = (i + rel) & 0xFFFFFFFF
        if absolute in want:
            found.append((BASE + i, absolute, "call16"))
        if relative in want:
            old_hits.append((BASE + i, relative, "call16"))
        start = i + 1
    return found, old_hits


fns = []
for line in TSV.read_text(encoding="utf-8").splitlines()[1:]:
    if not line:
        continue
    parts = line.split("\t")
    fns.append((int(parts[0], 16), parts[1], int(parts[2])))
starts = [a for a, _, _ in fns]


def owner(addr):
    lo, hi = 0, len(starts) - 1
    best = None
    while lo <= hi:
        mid = (lo + hi) >> 1
        if starts[mid] <= addr:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    if best is None:
        return None
    a, name, n = fns[best]
    if addr < a + n:
        return name
    return None


lines = []
say = lines.append
say(f"image_bytes={len(BIN)} base=0x{BASE:08x}")
say("formula: absolute_target = BASE + file_offset + displacement")
say("old formula, for comparison: file_offset + displacement, then compared with an absolute address")

say("== bytes at the chain ==")
for name, addr, n in (
    ("FUN_6119a2be", 0x6119A2BE, 48),
    ("FUN_61203082", 0x61203082, 16),
    ("FUN_6120308d", 0x6120308D, 32),
):
    raw = dump(addr, n)
    say(f"{name} 0x{addr:08x} {raw.hex()}")

say("== vtable 0x6158ae0c, 32 slots ==")
for i in range(32):
    p = u32(0x6158AE0C + i * 4)
    say(f"  +0x{i * 4:02x} 0x{p:08x} {owner(p) or ''}")

say("== vtable 0x6158fb4c, 8 slots ==")
for i in range(8):
    p = u32(0x6158FB4C + i * 4)
    say(f"  +0x{i * 4:02x} 0x{p:08x} {owner(p) or ''}")

say("== section descriptors at 0x60029b28, 10 rows of 12 ==")
for i in range(10):
    addr = 0x60029B28 + i * 12
    raw = dump(addr, 12)
    dest, src, flag = struct.unpack_from("<III", raw)
    say(f"  row {i + 1} 0x{addr:08x} dest=0x{dest:08x} src=0x{src:08x} word=0x{flag:08x} raw {raw.hex()}")

say("== UI map slot for 2154 and whether 0x3D6F has a slot ==")
# Map 0: ids below 0x8d0, 4 bytes at 0x6062555c: key, index.
uid = 2154
slot = 0x6062555C + uid * 4
say(f"  id {uid} map0 0x{slot:08x} key=0x{u16(slot):04x} index={u16(slot + 2)}")
ranges = [
    ("below-2256", 0, 0x8D0, 0x6062555C),
    ("3000-3046", 3000, 0xBE7, 0x606249BC),
    ("10000-10070", 10000, 0x2757, 0x6061DD72),
    ("15000-15455", 15000, 0x3C60, 0x6061906E),
]
for name, lo, hi, base in ranges:
    inside = lo <= 0x3D6F < hi
    say(f"  range {name} ids {lo}..{hi - 1} table 0x{base:08x} holds_0x3D6F={inside}")
say("  0x3D6F is 15727. The mapped getter returns 0 past 15455 (0x3c5f).")

say("== direct calls, absolute target against absolute target ==")
targets = {
    0x61252031: "known-call-from-dispatch",
    0x6124F6C7: "FUN_6124f6c7",
    0x61203816: "FUN_61203816",
    0x610CDEBF: "FUN_610cdebf",
    0x610CDF05: "FUN_610cdf05",
    0x610E2536: "FUN_610e2536",
    0x61204065: "FUN_61204065",
    0x61203E81: "FUN_61203e81",
    0x60063431: "FUN_60063431",
    0x6041937F: "FUN_6041937f",
    0x60419446: "FUN_60419446",
    0x60419696: "FUN_60419696",
    0x604058BC: "FUN_604058bc",
    0x600624D3: "FUN_600624d3",
    0x61203082: "FUN_61203082",
    0x6120308D: "FUN_6120308d",
    0x6119A2BE: "FUN_6119a2be",
}
found, old_hits = calls_to(targets)
say(f"new_call_count={len(found)} old_call_count={len(old_hits)}")
by_target = {}
for site, tgt, kind in sorted(found):
    who = owner(site)
    by_target.setdefault(tgt, []).append((site, kind, who))
for tgt in sorted(by_target):
    rows = by_target[tgt]
    named = [r for r in rows if r[2]]
    say(f"target 0x{tgt:08x} {targets[tgt]} sites={len(rows)} inside_function={len(named)}")
    show = named if named else rows
    for site, kind, who in show[:24]:
        raw = dump(site, 7 if kind == "call32" else 5)
        say(f"  {kind} site=0x{site:08x} in {who or 'outside-body'} bytes {raw.hex()}")
    if len(show) > 24:
        say(f"  ... {len(show) - 24} more")

# Sanity: the dispatch listing's call at 0x6124f6cb.
site = 0x6124F6CB
raw = dump(site, 5)
rel = struct.unpack_from("<h", raw, 1)[0]
absolute = (site + rel) & 0xFFFFFFFF
say(f"sanity 0x{site:08x} bytes {raw.hex()} disp={rel} absolute_target=0x{absolute:08x}")

text = "\n".join(lines) + "\n"
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(text, encoding="utf-8")
print(text)
