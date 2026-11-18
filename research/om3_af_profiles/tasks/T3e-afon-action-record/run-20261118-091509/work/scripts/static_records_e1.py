# Decode the page-27 action records, the C-AF Area record, the editor
# dispatch table, and the UI-map gap for ids 2274-2279. Read-only on inputs.
import json
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
OUT.mkdir(parents=True, exist_ok=True)
lines = []
TSV = ROOT / "ref" / "analysis" / "decompiled-main" / "functions.tsv"
NAMES = ROOT / "ref" / "analysis" / "review" / "setting-name-candidates.json"


def say(s=""):
    lines.append(s)


def off(addr):
    o = addr - BASE
    if not 0 <= o < len(BIN):
        raise ValueError(hex(addr))
    return o


def u16(addr):
    return struct.unpack_from("<H", BIN, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", BIN, off(addr))[0]


def dump(addr, n):
    return BIN[off(addr):off(addr) + n]


def hx(b):
    return b.hex()


fns = []
for line in TSV.read_text(encoding="utf-8").splitlines()[1:]:
    if not line:
        continue
    parts = line.split("\t")
    fns.append((int(parts[0], 16), parts[1]))
starts = [a for a, _ in fns]


def fn_of(addr):
    if not addr:
        return None
    lo, hi, best = 0, len(starts) - 1, None
    while lo <= hi:
        mid = (lo + hi) >> 1
        if starts[mid] <= addr:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    if best is None:
        return None
    return {"addr": fns[best][0], "name": fns[best][1], "delta": addr - fns[best][0]}


say("image bytes %d base 0x%x" % (len(BIN), BASE))
say("== section table 0x60029b28 ==")
secs = []
for i in range(12):
    addr = 0x60029B28 + i * 12
    raw = dump(addr, 12)
    dest, size, flag = struct.unpack_from("<III", raw)
    secs.append((i + 1, dest, size, flag))
    say("  section %d at 0x%08x dest 0x%08x size 0x%x flag 0x%x compressed %s raw %s" % (
        i + 1, addr, dest, size, flag, bool(flag & 1), hx(raw)))


def section_of(addr):
    # The established ends: section 1 ends at the next destination when the
    # table's size field is not the runtime span. Report both the record and
    # which destination range contains the address using consecutive destinations.
    dests = [(n, dest, flag) for n, dest, size, flag in secs if dest]
    dests.sort(key=lambda x: x[1])
    for i, (n, dest, flag) in enumerate(dests):
        end = dests[i + 1][1] if i + 1 < len(dests) else dest + 0x1000000
        if dest <= addr < end:
            return n, dest, end, flag
    return None


def record(addr):
    raw = dump(addr, 24)
    w0, ui, sub, handler, first, second, tail = struct.unpack_from("<IHHIIII", raw)
    return {
        "addr": addr,
        "raw": hx(raw),
        "w0": w0,
        "ui": ui,
        "sub": sub,
        "handler": handler,
        "handler_fn": fn_of(handler),
        "first": first,
        "second": second,
        "tail": tail,
    }


def show_record(title, rec):
    say(title)
    say("  addr 0x%08x raw %s" % (rec["addr"], rec["raw"]))
    say("  +0x00 u32 match-key 0x%x" % rec["w0"])
    say("  +0x04 u16 ui-id %d (0x%04x)" % (rec["ui"], rec["ui"]))
    say("  +0x06 u16 sub-key 0x%04x" % rec["sub"])
    hf = rec["handler_fn"]
    say("  +0x08 u32 handler 0x%08x %s" % (rec["handler"], hf["name"] if hf else "null"))
    say("  +0x0c u32 dispatch-first 0x%08x (low half 0x%04x)" % (rec["first"], rec["first"] & 0xFFFF))
    say("  +0x10 u32 dispatch-second 0x%08x (low half 0x%04x)" % (rec["second"], rec["second"] & 0xFFFF))
    tf = fn_of(rec["tail"])
    say("  +0x14 u32 callback 0x%08x %s" % (rec["tail"], tf["name"] if tf else "null"))


say("== page-27 action table 0x6150c514 count 2 ==")
page = [record(0x6150C514), record(0x6150C52C)]
for i, rec in enumerate(page):
    show_record("page-27 record %d" % i, rec)
    sec = section_of(rec["addr"])
    say("  section %s" % (sec,))

say("== C-AF action table 0x6150c4cc count 3 ==")
caf = [record(0x6150C4CC + i * 24) for i in range(3)]
for i, rec in enumerate(caf):
    show_record("C-AF record %d" % i, rec)
    say("  section %s" % (section_of(rec["addr"]),))

say("== sole image pointer 0x6150f5f0 ==")
say("  pointer 0x%08x count-word 0x%08x" % (u32(0x6150F5F0), u32(0x6150F5F4)))
say("  neighbourhood %s" % hx(dump(0x6150F5D0, 80)))
say("  pointer section %s" % (section_of(0x6150F5F0),))
say("  table section %s" % (section_of(0x6150C514),))

say("== other image u32 equal to 0x6150c514 or 0x6150c4cc ==")
for target in (0x6150C514, 0x6150C4CC):
    needle = struct.pack("<I", target)
    start = 0
    hits = []
    while True:
        j = BIN.find(needle, start)
        if j < 0:
            break
        hits.append(BASE + j)
        start = j + 1
    say("  0x%08x hits %d: %s" % (target, len(hits), " ".join(hex(h) for h in hits)))

say("== editor dispatch table 0x615e32d8 stride 12, indices 0..0x46 ==")
say("  table section %s" % (section_of(0x615E32D8),))
kind_counts = {}
kind8 = []
focus = []
for i in range(0x47):
    a = 0x615E32D8 + i * 12
    kind, ident, extra, fn = struct.unpack_from("<IHH I", dump(a, 12))
    kind_counts[kind] = kind_counts.get(kind, 0) + 1
    row = {
        "i": i, "addr": a, "kind": kind, "id": ident, "extra": extra, "fn": fn,
        "fn_name": (fn_of(fn) or {}).get("name"),
    }
    if kind == 8:
        kind8.append(row)
    if ident in (0x1E0, 0x1E1, 0x1E2, 0x1E3, 0x1E4) or (kind == 8 and ident in range(0x1E0, 0x1E8)):
        focus.append(row)
say("  distinct kind values: " + ", ".join("%s:%d" % (hex(k), kind_counts[k]) for k in sorted(kind_counts)))
say("  kind 8 entries %d" % len(kind8))
for row in kind8:
    say("    [%d] 0x%08x kind %d id 0x%04x extra 0x%04x fn 0x%08x %s" % (
        row["i"], row["addr"], row["kind"], row["id"], row["extra"], row["fn"], row["fn_name"]))
say("  entries whose id is 0x1e0..0x1e4:")
for row in focus:
    say("    [%d] kind %d id 0x%04x fn 0x%08x %s" % (row["i"], row["kind"], row["id"], row["fn"], row["fn_name"]))

say("== family scan in section 7: u32 +0 == 1, +8 == 0, +0xc == 8 ==")
sec7 = section_of(0x6150C514)
if sec7:
    _, dest, end, _ = sec7
    found = []
    a = dest
    while a + 24 <= end:
        if u32(a) == 1 and u32(a + 8) == 0 and u32(a + 0xC) == 8:
            found.append(record(a))
        a += 4
    say("  matches %d" % len(found))
    for rec in found:
        say("  0x%08x ui %d (0x%04x) sub 0x%04x second 0x%x tail 0x%x" % (
            rec["addr"], rec["ui"], rec["ui"], rec["sub"], rec["second"], rec["tail"]))

say("== page-27 stock rows and option lists ==")


def show_row(addr):
    raw = dump(addr, 36)
    sid, kind, lab, cls, opt, cnt, z, cls2, alt, altn = struct.unpack_from("<IHHIIIIIII", raw)
    say("  row 0x%08x %s" % (addr, hx(raw)))
    say("    id %d kind %d label 0x%04x class 0x%08x opt 0x%08x count %d zero 0x%x class2 0x%08x alt 0x%08x altn %d" % (
        sid, kind, lab, cls, opt, cnt, z, cls2, alt, altn))
    return opt, cnt


def show_opts(addr, count):
    say("  options 0x%08x count %d raw %s" % (addr, count, hx(dump(addr, 12 * count))))
    for i in range(count):
        a = addr + i * 12
        val, kind, lab, cls = struct.unpack_from("<IHH I", dump(a, 12))
        say("    [%d] 0x%08x value %d kind %d label 0x%04x class 0x%08x" % (i, a, val, kind, lab, cls))


p27 = u32(0x6158F0F8 + 4)
say("page 27 rows at 0x%08x count %d" % (p27, u32(0x6158F0F8 + 8)))
for i in range(u32(0x6158F0F8 + 8)):
    show_row(p27 + i * 36)
show_opts(0x6158BA04, 2)
show_opts(0x6158BA1C, 10)

say("== owned tail ==")
tail = dump(0x6031E920, 0x6031F000 - 0x6031E920)
say("  0x6031e920..0x6031f000 all FF %s length %d" % (set(tail) == {0xFF}, len(tail)))
say("  section of 0x6031ea00 %s" % (section_of(0x6031EA00),))
say("  bytes 0x6031ea00..0x6031ea48 %s" % hx(dump(0x6031EA00, 0x48)))

say("== UI map for MODE_AF_HOME* and ids 2274-2279 ==")
names = json.loads(NAMES.read_text(encoding="utf-8"))
seq = names.get("settings") or names.get("candidates") or names.get("items")
if seq is None:
    seq = next(v for v in names.values() if isinstance(v, list))
home = [x for x in seq if isinstance(x, dict) and "AF_HOME" in str(x.get("name", ""))]
# Map formulas checked against FUN_60419446 / FUN_60419696.
# Low range is the only one that can hold 165, 238, 517, 1713, 2154.
# Address formulas follow the halfword loads in FUN_60419446 / FUN_60419696:
# the id is multiplied by 4 and added to the range base. 2154 lands at 0x60627704.
ranges = [
    ("low", 0, 0x8CF, lambda i: 0x6062555C + i * 4),
    ("3000", 0xBB8, 0xBE6, lambda i: 0x606249BC + i * 4),
    ("10000", 0x2710, 0x2756, lambda i: 0x6061DD72 + i * 4),
    ("15000", 0x3A98, 0x3C5F, lambda i: 0x6061906E + i * 4),
]


def map_slot(sid):
    for name, lo, hi, addr_of in ranges:
        if lo <= sid <= hi:
            a = addr_of(sid)
            return {"range": name, "addr": a, "key": u16(a), "index": u16(a + 2)}
    return None


home_out = []
for x in home:
    sid = int(x["id"])
    slot = map_slot(sid)
    row = {"id": sid, "name": x["name"], "slot": slot}
    home_out.append(row)
    if slot:
        say("  id %d %s range %s addr 0x%08x key 0x%04x index %d" % (
            sid, x["name"], slot["range"], slot["addr"], slot["key"], slot["index"]))
    else:
        say("  id %d %s NO MAP SLOT (gap or past 0x3c5f)" % (sid, x["name"]))

say("== spot check 2154 ==")
slot = map_slot(2154)
say("  2154 %s" % slot)
say("  image at formula 0x%08x raw %s" % (slot["addr"], hx(dump(slot["addr"], 4))))

# 4000 and 4500 are halfword maps. Confirm 2274 is not inside them by range only.
say("== ids 2274-2279 against every published range ==")
orig = []
for sid in range(2274, 2280):
    name = next((x["name"] for x in home if x["id"] == sid), None)
    slot = map_slot(sid)
    orig.append({"id": sid, "name": name, "slot": slot, "typed_accessor": "0x60063a20 needs a key; the map getters return 0 for this gap"})
    say("  %d %s slot %s" % (sid, name, slot))

(OUT / "home-map-e1.json").write_text(json.dumps({"home": home_out, "originally": orig}, indent=2) + "\n", encoding="utf-8")
text = "\n".join(lines) + "\n"
(OUT / "static-records-e1.txt").write_text(text, encoding="utf-8")
print(text)
