# T3c Phase A static pass. Read-only over inputs and ref. Writes only under work.
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
OUT.mkdir(parents=True, exist_ok=True)
lines = []


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


def hexb(b):
    return b.hex()


def find_u32(value, limit=40):
    needle = struct.pack("<I", value)
    hits = []
    start = 0
    while len(hits) < limit:
        i = BIN.find(needle, start)
        if i < 0:
            break
        hits.append(BASE + i)
        start = i + 1
    return hits


def call_sites(target_addrs):
    want = {a - BASE for a in target_addrs}
    found = []
    n = len(BIN)
    # CALL d32: dd rel32 mask size. Target offset is site + rel32.
    start = 0
    while True:
        i = BIN.find(b"\xdd", start)
        if i < 0 or i + 7 > n:
            break
        rel = struct.unpack_from("<i", BIN, i + 1)[0]
        tgt = (i + rel) & 0xFFFFFFFF
        if tgt in want:
            found.append((BASE + i, BASE + tgt, "call32"))
        start = i + 1
    start = 0
    while True:
        i = BIN.find(b"\xcd", start)
        if i < 0 or i + 5 > n:
            break
        rel = struct.unpack_from("<h", BIN, i + 1)[0]
        tgt = (i + rel) & 0xFFFFFFFF
        if tgt in want:
            found.append((BASE + i, BASE + tgt, "call16"))
        start = i + 1
    return found


say(f"image_bytes={len(BIN)} base=0x{BASE:08x}")

# Sub-page table.
pages = []
say("== sub-page table 0x6158ee8c stride 20, 66 entries ==")
for i in range(66):
    a = 0x6158EE8C + i * 20
    page, rows, count, state, tail = struct.unpack_from("<5I", BIN, off(a))
    rec = {"index": i, "addr": a, "page": page, "rows": rows, "count": count, "state": state, "tail": tail}
    pages.append(rec)
    if page in (25, 26, 27, 28, 29, 30, 31) or count > 20:
        say(f"  [{i}] 0x{a:08x} page={page} rows=0x{rows:08x} count={count} state=0x{state:08x} tail=0x{tail:08x}")

page_by_id = {p["page"]: p for p in pages}
interesting_rows = []
say("== rows of pages 25-29 ==")
for pid in (25, 26, 27, 28, 29):
    p = page_by_id.get(pid)
    if not p:
        say(f"page {pid} ABSENT")
        continue
    say(f"page {pid} descriptor=0x{p['addr']:08x} rows=0x{p['rows']:08x} count={p['count']} state=0x{p['state']:08x}")
    if BASE <= p["state"] < BASE + len(BIN):
        say(f"  state raw {hexb(dump(p['state'], 16))}")
    for r in range(p["count"]):
        ra = p["rows"] + r * 36
        raw = dump(ra, 36)
        sid, kind, label, viewer, options, nopt, z, viewer2, alt, altn = struct.unpack_from("<IHHIIIIIII", raw)
        row = {
            "page": pid, "index": r, "addr": ra, "setting": sid, "kind": kind, "label": label,
            "viewer": viewer, "options": options, "count": nopt, "alt": alt, "alt_count": altn,
        }
        interesting_rows.append(row)
        say(f"  row[{r}] 0x{ra:08x} id={sid} kind={kind} label=0x{label:04x} class=0x{viewer:08x} opts=0x{options:08x} n={nopt} alt=0x{alt:08x} altn={altn}")
        say(f"    raw {hexb(raw)}")
        if options and 0 < nopt <= 16 and BASE <= options < BASE + len(BIN):
            vals = []
            for k in range(nopt):
                oa = options + k * 12
                value, okind, oid, optr = struct.unpack_from("<IHH I", dump(oa, 12))
                vals.append(value)
                if pid in (28, 29) and k < 4:
                    say(f"    opt[{k}] value={value} kind={okind} id=0x{oid:04x} ptr=0x{optr:08x}")
            say(f"    values {vals}")

say("== page-handler table 0x6158f3b4, 26 x 12 ==")
handlers = []
for i in range(26):
    a = 0x6158F3B4 + i * 12
    page, fn, extra = struct.unpack_from("<IIi", dump(a, 12))
    # The constructor compares a short at the entry with the page id, then reads +4 and +8.
    key = u16(a)
    fn_p = u32(a + 4)
    extra_p = u32(a + 8)
    handlers.append({"addr": a, "key": key, "fn": fn_p, "extra": extra_p})
    say(f"  [{i}] 0x{a:08x} key={key} fn=0x{fn_p:08x} extra=0x{extra_p:08x} raw {hexb(dump(a, 12))}")
say("handler keys include 28? " + str(any(h["key"] == 28 for h in handlers)))
say("handler keys include 29? " + str(any(h["key"] == 29 for h in handlers)))
say("handler keys include 27? " + str(any(h["key"] == 27 for h in handlers)))

# References to the page descriptors and to the constructor.
say("== u32 references to page descriptors and constructors ==")
targets = {
    "ctor_61203696": 0x61203696,
    "ctor_wrap_61203676": 0x61203676,
    "open_61203e81": 0x61203E81,
    "list_type_61203470": 0x61203470,
    "editor_kind_6120345d": 0x6120345D,
}
for pid in (27, 28, 29):
    p = page_by_id.get(pid)
    if p:
        targets[f"page{pid}_desc"] = p["addr"]
        targets[f"page{pid}_rows"] = p["rows"]
refs = {}
for name, addr in targets.items():
    hits = find_u32(addr, 30)
    refs[name] = hits
    say(f"  {name} 0x{addr:08x} u32 hits {len(hits)}: " + " ".join(hex(h) for h in hits))

say("== direct CALL sites to constructor, wrapper, open path ==")
calls = call_sites([0x61203696, 0x61203676, 0x61203E81, 0x61203470, 0x6120345D])
for site, tgt, kind in calls:
    say(f"  {kind} site=0x{site:08x} target=0x{tgt:08x}")
say(f"call_site_count={len(calls)}")

# Viewer vtable and the shared row class.
say("== bytes at row class 0x6158aeb4 and viewer vtable 0x6158fb4c ==")
say("class " + hexb(dump(0x6158AEB4, 64)))
say("vtable " + hexb(dump(0x6158FB4C, 64)))
vt = [u32(0x6158FB4C + i * 4) for i in range(16)]
say("vtable words " + " ".join(hex(x) for x in vt))

# Source records around the known page-27 provider source.
say("== source neighbourhood 0x61529c80 stride 12 ==")
for a in range(0x61529C80, 0x61529E00, 12):
    raw = dump(a, 12)
    w0, w1, w2 = struct.unpack_from("<III", raw)
    say(f"  0x{a:08x} {hexb(raw)} {w0:#x} {w1:#x} {w2:#x}")

# Menu-item list: which ids, and a search for page-27's title label 0x1279 as a record label.
say("== menu item u16 list 0x61520552 first and last, count 244 ==")
ids = [u16(0x61520552 + i * 2) for i in range(244)]
say(f"  first {ids[:8]} last {ids[-4:]} contains 5393? {5393 in ids}")

# 12-byte records whose label half is a page title. Page state field may be the title record.
say("== title-label search in 12-byte shaped records ==")
for pid in (25, 26, 27, 28, 29):
    p = page_by_id.get(pid)
    if not p or not (BASE <= p["state"] < BASE + len(BIN)):
        continue
    # Try several interpretations of the state pointer.
    st = p["state"]
    say(f"page {pid} state 0x{st:08x} u16s {[u16(st + i) for i in range(0, 12, 2)]} u32s {[hex(u32(st + i)) for i in range(0, 16, 4)]}")

# UI map for the named AF Home and priority ids. Names come from the candidate list.
names = json.loads((ROOT / "ref" / "analysis" / "review" / "setting-name-candidates.json").read_text(encoding="utf-8"))
# The file is either a list or an object with a list.
if isinstance(names, dict):
    seq = names.get("settings") or names.get("candidates") or names.get("items")
    if seq is None:
        # first list value
        seq = next(v for v in names.values() if isinstance(v, list))
else:
    seq = names
home = [x for x in seq if isinstance(x, dict) and str(x.get("name", "")).startswith("MODE_AF_HOME")]
say("== MODE_AF_HOME* UI map 0x6062555c ==")
home_map = []
for x in home:
    sid = int(x["id"])
    if sid >= 2256:
        say(f"  id {sid} {x['name']} above map0")
        continue
    key, index = struct.unpack_from("<HH", BIN, off(0x6062555C + sid * 4))
    home_map.append({"id": sid, "name": x["name"], "key": key, "index": index})
    say(f"  id {sid} {x['name']} key=0x{key:04x} index={index}")

say("== priority and area ids ==")
for sid, name in ((2154, "PRIORITY_RELEASE"), (2155, "PRIORITY_CUSTOM"), (163, "AF_AREA_TYPE"), (238, "AF_HOME_AREA"), (165, "AF_HOME")):
    key, index = struct.unpack_from("<HH", BIN, off(0x6062555C + sid * 4))
    say(f"  id {sid} {name} key=0x{key:04x} index={index}")

# Editor-descriptor ROM records: u16 id at the start of a 20-byte record, flags 0x0080 seen on the UI 238 clone.
say("== search u16 id + flags 0x0080 for 2154, 2155, 163, 238, 165 ==")
for sid in (2154, 2155, 163, 238, 165, 0x3D6F):
    needle = struct.pack("<HH", sid, 0x0080)
    start = 0
    n = 0
    while n < 6:
        i = BIN.find(needle, start)
        if i < 0:
            break
        say(f"  id {sid} at 0x{BASE + i:08x} {hexb(BIN[i:i + 20])}")
        start = i + 1
        n += 1
    if n == 0:
        say(f"  id {sid} no flags-0x80 record")

# External direct calls into the 0x610e family, counted by target.
say("== external direct CALL into 0x610e0000-0x610f0000 ==")
tsv = (ROOT / "ref" / "analysis" / "decompiled-main" / "functions.tsv").read_text(encoding="utf-8").splitlines()[1:]
family = []
for line in tsv:
    if not line:
        continue
    addr = int(line.split("\t", 1)[0], 16)
    if 0x610E0000 <= addr < 0x610F0000:
        family.append(addr)
say(f"family_entries={len(family)}")
ext = call_sites(family)
inside = 0
outside = []
for site, tgt, kind in ext:
    if 0x610E0000 <= site < 0x610F0000:
        inside += 1
    else:
        outside.append((site, tgt, kind))
say(f"direct_calls_into_family={len(ext)} from_inside={inside} from_outside={len(outside)}")
by_tgt = {}
for site, tgt, kind in outside:
    by_tgt.setdefault(tgt, []).append(site)
say(f"outside_targets={len(by_tgt)}")
# The 14 addresses the earlier stock-OK trace entered.
known = [0x610E09AD, 0x610E0A9F, 0x610E141C, 0x610E15F4, 0x610E2165, 0x610E22D0, 0x610E2360, 0x610E24B5, 0x610E2536, 0x610E2DA3, 0x610E6E36, 0x610EAF3D, 0x610EAFE0, 0x610EB153]
for addr in known:
    sites = by_tgt.get(addr, [])
    say(f"  target 0x{addr:08x} outside_callers={len(sites)} first=" + " ".join(hex(s) for s in sites[:8]))

# Callers of the known targets that sit in 0x61100000-0x61300000, grouped by caller function.
fn_ranges = []
for line in tsv:
    if not line:
        continue
    parts = line.split("\t")
    fn_ranges.append((int(parts[0], 16), parts[1]))
fn_ranges.sort()


def fn_of(addr):
    lo, hi = 0, len(fn_ranges) - 1
    best = None
    while lo <= hi:
        mid = (lo + hi) // 2
        if fn_ranges[mid][0] <= addr:
            best = fn_ranges[mid]
            lo = mid + 1
        else:
            hi = mid - 1
    return best


say("== outside caller functions of the 14 stock-OK addresses ==")
caller_fns = {}
for addr in known:
    for site in by_tgt.get(addr, []):
        fn = fn_of(site)
        if not fn:
            continue
        caller_fns.setdefault(fn[0], {"name": fn[1], "sites": []})["sites"].append({"site": site, "target": addr})
for addr, info in sorted(caller_fns.items()):
    if not (0x61100000 <= addr < 0x61350000):
        continue
    tgts = sorted({s["target"] for s in info["sites"]})
    say(f"  {info['name']} 0x{addr:08x} calls {len(info['sites'])} sites targets=" + " ".join(hex(t) for t in tgts))

report = {
    "pages": pages,
    "rows": interesting_rows,
    "handlers": handlers,
    "refs": {k: v for k, v in refs.items()},
    "ctor_calls": [{"site": s, "target": t, "kind": k} for s, t, k in calls],
    "outside_calls": len(outside),
    "home_map": home_map,
    "known_outside": {hex(a): [hex(s) for s in by_tgt.get(a, [])] for a in known},
}
(OUT / "static-route-a1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
(OUT / "static-route-a1.json").write_text(json.dumps(report), encoding="utf-8")
say(f"wrote {OUT / 'static-route-a1.txt'}")
print("\n".join(lines))
