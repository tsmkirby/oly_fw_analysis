# role: observe. Decode the 24-byte editor-id table that pairs 0x1e3 with UI 2154.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"


def off(addr):
    return addr - BASE


def u16(addr):
    return struct.unpack_from("<H", BIN, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", BIN, off(addr))[0]


def raw(addr, n):
    return BIN[off(addr):off(addr) + n]


secs = []
for i in range(10):
    dest, size, flag = struct.unpack_from("<III", BIN, off(0x60029B28 + i * 12))
    secs.append((i + 1, dest, flag))


def section_of(addr):
    ordered = [(d, n, f) for n, d, f in secs if 0x60000000 <= d < 0x70000000]
    ordered.sort()
    for i, (dest, n, flag) in enumerate(ordered):
        nxt = ordered[i + 1][0] if i + 1 < len(ordered) else dest + 0x2000000
        if dest <= addr < nxt:
            return n, dest, nxt, bool(flag & 1)
    return None


lines = []
say = lines.append

ANCHOR = 0x615C5DCC
# Editor id sits at the start of a 24-byte record. Walk while ids stay sequential.
lo = ANCHOR
while u16(lo - 24) + 1 == u16(lo) and u16(lo) != 0:
    lo -= 24
hi = ANCHOR
while u16(hi + 24) == u16(hi) + 1 and u16(hi) != 0xFFFF:
    hi += 24
count = (hi - lo) // 24 + 1
say("table lo 0x%08x hi 0x%08x count %d first-id 0x%04x last-id 0x%04x section %s" % (
    lo, hi, count, u16(lo), u16(hi), section_of(lo)))
say("record stride 24")
say("fields tried: +0 u16 id, +2 u16, +4 u32, +8 u32, +12 u32, +16 u32, +20 u32")

# Distinct values of the constant-looking fields across the whole run.
fields = {2: set(), 4: set(), 8: set(), 12: set(), 16: set(), 20: set()}
for addr in range(lo, hi + 1, 24):
    fields[2].add(u16(addr + 2))
    for rel in (4, 8, 12, 16, 20):
        fields[rel].add(u32(addr + rel))
for rel, vals in fields.items():
    sample = sorted(vals)
    say("field +%d distinct %d sample %s" % (rel, len(vals), [hex(v) for v in sample[:12]]))

say("== records with id 0x1d8..0x1f0, plus neighbours of the anchor ==")
want = set(range(0x1D0, 0x1F8))
shown = 0
for addr in range(lo, hi + 1, 24):
    ident = u16(addr)
    if ident not in want and not (ANCHOR - 48 <= addr <= ANCHOR + 96):
        continue
    shown += 1
    say("  0x%08x id 0x%04x +2 0x%04x +4 0x%08x +8 0x%08x +12 0x%08x +16 0x%08x +20 0x%08x raw %s" % (
        addr, ident, u16(addr + 2), u32(addr + 4), u32(addr + 8), u32(addr + 12),
        u32(addr + 16), u32(addr + 20), raw(addr, 24).hex()))
say("shown %d" % shown)

# Pointers to the table base, to the 0x1e3 record, and to a few interior addresses.
targets = {
    lo: "base",
    lo + 4: "base+4",
    ANCHOR: "id-0x1e0-record",
    ANCHOR + 0x18 * 3: "id-0x1e3-record",
}
# Also the address of the record whose id is 0x1e3, computed from the walk.
rec_1e3 = None
for addr in range(lo, hi + 1, 24):
    if u16(addr) == 0x1E3:
        rec_1e3 = addr
        targets[addr] = "record-1e3"
say("record 0x1e3 at %s" % (hex(rec_1e3) if rec_1e3 else None))

say("== image words equal to table addresses, capped ==")
wanted = {addr: name for addr, name in targets.items()}
# Also accept any record address, but only report bases and the five priority records.
priority = {}
for addr in range(lo, hi + 1, 24):
    if u16(addr) in (0x1E0, 0x1E1, 0x1E2, 0x1E3, 0x1E4):
        priority[addr] = "rec-%04x" % u16(addr)
wanted.update(priority)
found = {k: [] for k in wanted}
for o in range(0, len(BIN) - 3, 4):
    v = struct.unpack_from("<I", BIN, o)[0]
    if v in found:
        found[v].append(BASE + o)
for addr, refs in found.items():
    say("  refs to 0x%08x (%s): %d %s" % (
        addr, wanted[addr], len(refs), " ".join(hex(x) for x in refs[:12])))

# Other candidate tables from the stride scan.
say("== stride-12 candidate 0x6151e48c ==")
for addr in range(0x6151E48C - 24, 0x6151E48C + 24 * 8, 12):
    say("  0x%08x %s" % (addr, raw(addr, 12).hex()))
say("== stride-8 candidate 0x6035ccd8 ==")
for addr in range(0x6035CCD8 - 16, 0x6035CCD8 + 8 * 10, 8):
    ptr = u32(addr + 4)
    extra = ""
    if 0x60021020 <= ptr < 0x60021020 + len(BIN):
        extra = " *%s" % raw(ptr, 16).hex()
    say("  0x%08x id 0x%08x ptr 0x%08x%s" % (addr, u32(addr), ptr, extra))

# How many records have +8 equal to a UI id we know, and is +8 unique per id.
say("== +8 uniqueness for ids 0x1e0-0x1e4 ==")
seen_ui = {}
for addr in range(lo, hi + 1, 24):
    ident = u16(addr)
    ui = u32(addr + 8)
    seen_ui.setdefault(ui, []).append(ident)
for ident in (0x1E0, 0x1E1, 0x1E2, 0x1E3, 0x1E4):
    addr = lo + (ident - u16(lo)) * 24
    if u16(addr) != ident:
        say("  id 0x%04x NOT at computed slot, got 0x%04x" % (ident, u16(addr)))
        continue
    ui = u32(addr + 8)
    say("  id 0x%04x ui 0x%04x (%d) other ids with this ui: %s" % (
        ident, ui, ui, [hex(x) for x in seen_ui[ui][:8]]))

text = "\n".join(lines) + "\n"
(OUT / "binding-table-f1.txt").write_text(text, encoding="utf-8")
print(text)
