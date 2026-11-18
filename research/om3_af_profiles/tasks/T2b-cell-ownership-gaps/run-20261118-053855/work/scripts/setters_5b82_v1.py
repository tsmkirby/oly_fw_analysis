# Trace the open one-cell setters for key 0x5b82.
# Listings are checked against the main image. Tables are dumped from the image.
import collections
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
FUNCS = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'functions.tsv'
OUT = ROOT / 'work' / 'out' / 'setters-5b82-v1.txt'
LISTING = ROOT / 'work' / 'out' / 'listings-setters-v1.txt'

SETTER = 0x60063431
TABLE_A = 0x6035a038
TABLE_A_COUNT = 0x7A
TABLE_A_STRIDE = 8
TABLE_B = 0x60242324
TABLE_B_STRIDE = 0x9C
TABLE_B_COUNT = 0x3D  # indices 0..0x3c, FUN_6019525a

FUNCS_KEEP = [
    0x60196ecc, 0x60196ee3, 0x601971f5, 0x601972f1, 0x6019766d,
    0x6019782e, 0x6019783a, 0x6019775a, 0x601977e9,
    0x601eff7a, 0x601efec0, 0x601efff9,
    0x6041ab1d, 0x607135ad,
    0x60195424, 0x6019525a, 0x60195aa7,
]

CALLERS = {
    0x601eff7a: 'slot',
    0x6041ab1d: 'key',
    0x60196ee3: 'index',
    0x601971f5: 'index',
    0x601972f1: 'index',
    0x60195424: 'parent',
}


def off(va):
    return va - BASE


def u16(va):
    return struct.unpack_from('<H', MAIN, off(va))[0]


def u32(va):
    return struct.unpack_from('<I', MAIN, off(va))[0]


def hx(va, n):
    return MAIN[off(va):off(va) + n].hex()


log = []


def w(s=''):
    log.append(s)


ranges = []
for line in FUNCS.read_text(encoding='utf-8').splitlines()[1:]:
    p = line.split('\t')
    if len(p) < 3:
        continue
    a = int(p[0], 16)
    n = int(p[2])
    ranges.append((a, a + n, p[1]))
ranges.sort()
fstarts = [a for a, _, _ in ranges]


def func_of(va):
    import bisect
    i = bisect.bisect_right(fstarts, va) - 1
    if i < 0:
        return None
    a, b, name = ranges[i]
    if a <= va < b:
        return a, b, name
    return None


keep_lo = {}
for a in FUNCS_KEEP:
    hit = func_of(a)
    if hit:
        keep_lo[hit[0]] = hit[1]

# also keep a window around every direct caller once we see it; first pass collects
want_extra = set()

print('scanning listings', flush=True)
ins_all = {}  # va -> (nb, mnem, raw) for kept functions
call_sites = collections.defaultdict(list)  # target -> [(site, mnem, raw)]
n_bad = 0
n_ins = 0
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        try:
            va = int(parts[0], 16)
        except ValueError:
            continue
        raw = parts[1].strip().lower()
        if not raw or any(c not in '0123456789abcdef' for c in raw):
            continue
        nb = len(raw) // 2
        if MAIN[off(va):off(va) + nb].hex() != raw:
            n_bad += 1
            continue
        n_ins += 1
        mnem = parts[2].strip()
        owner = None
        for lo, hi in keep_lo.items():
            if lo <= va < hi:
                owner = lo
                break
        if owner is not None:
            ins_all[va] = (nb, mnem, raw, owner)
        if mnem.startswith('call 0x'):
            try:
                tgt = int(mnem.split()[1].split(',')[0], 16)
            except ValueError:
                continue
            if tgt in CALLERS or tgt == SETTER:
                call_sites[tgt].append((va, mnem, raw))

print('scan', n_ins, 'kept', len(ins_all), 'bad', n_bad, flush=True)
w('listing instructions kept %d mismatches %d' % (len(ins_all), n_bad))
w()

# ---- image search for absolute pointers and rel16/rel32 calls ----
TARGETS = [0x60196ee3, 0x601971f5, 0x601972f1, 0x601eff7a, 0x6041ab1d, 0x60195424,
           TABLE_A, TABLE_B, 0x629d33b8]


def find_dwords(val, limit=12):
    sig = struct.pack('<I', val)
    hits = []
    s = 0
    while len(hits) < limit:
        i = MAIN.find(sig, s)
        if i < 0:
            break
        hits.append(BASE + i)
        s = i + 1
    return hits


def find_rel_calls(target, limit=20):
    hits = []
    mv = memoryview(MAIN)
    n = len(MAIN)
    for i in range(n - 5):
        b = mv[i]
        va = BASE + i
        if b == 0xCD:
            rel = struct.unpack_from('<h', MAIN, i + 1)[0]
            if (va + rel) & 0xFFFFFFFF == target:
                hits.append((va, 'cd rel16', hx(va, 5)))
        elif b == 0xDD and i + 5 <= n:
            rel = struct.unpack_from('<i', MAIN, i + 1)[0]
            if (va + rel) & 0xFFFFFFFF == target:
                hits.append((va, 'dd rel32', hx(va, 7)))
        if len(hits) >= limit:
            break
    return hits


w('== absolute dwords and relative call encodings ==')
for t in (0x601972f1, 0x60196ee3, 0x601971f5, 0x6041ab1d, 0x601eff7a):
    dwords = find_dwords(t)
    w('pointer 0x%08x dwords %s' % (t, ' '.join('0x%08x' % x for x in dwords) or 'none'))
# relative-call scan is the slow one; do it only for the function with no asm caller
w('rel-call scan for 0x601972f1 (no asm caller)')
for va, kind, raw in find_rel_calls(0x601972f1):
    w('  0x%08x %s %s' % (va, kind, raw))
w()

# ---- table A: 0x6035a038, 0x7a records of 8 bytes ----
w('== table 0x6035a038 count 0x7a stride 8 (key u16, index u16, cache u32) ==')
w('bounds 0x%08x .. 0x%08x exclusive' % (TABLE_A, TABLE_A + TABLE_A_COUNT * TABLE_A_STRIDE))
keys_a = []
hit_a = []
for i in range(TABLE_A_COUNT):
    va = TABLE_A + i * TABLE_A_STRIDE
    key = u16(va)
    idx = u16(va + 2)
    cache = u32(va + 4)
    keys_a.append(key)
    mark = ''
    if key == 0x5B82:
        mark = ' KEY'
        hit_a.append((i, idx, 'key'))
    if idx == 0x5B82:
        mark += ' INDEX'
        hit_a.append((i, idx, 'index-field'))
    w('  [%3d] 0x%08x key 0x%04x index %5d cache 0x%08x %s' % (i, va, key, idx, cache, mark))
w('distinct keys %d' % len(set(keys_a)))
w('0x5b82 occurrences %s' % (hit_a or 'none'))
# one record past the bound, to show the fence
va = TABLE_A + TABLE_A_COUNT * TABLE_A_STRIDE
w('first byte past bound 0x%08x %s' % (va, hx(va, 8)))
w()

# ---- table B ----
w('== table 0x60242324 count 0x3d stride 0x9c ==')
end_b = TABLE_B + TABLE_B_COUNT * TABLE_B_STRIDE
w('bounds 0x%08x .. 0x%08x exclusive (indices 0..0x3c)' % (TABLE_B, end_b))
w('record 0x3d would start at 0x%08x (one past the searched range)' % end_b)
hits_b = []
link_out = []
w('idx va u16+0 u16+2 u16+2e u32+0c u32+14 u16+48 u16+2c')
for i in range(TABLE_B_COUNT + 1):
    va = TABLE_B + i * TABLE_B_STRIDE
    if va + TABLE_B_STRIDE > BASE + len(MAIN):
        break
    fields = {
        0x00: u16(va),
        0x02: u16(va + 2),
        0x2C: u16(va + 0x2C),
        0x2E: u16(va + 0x2E),
        0x48: u16(va + 0x48),
    }
    type_dw = u32(va + 0x0C)
    link = u32(va + 0x14)
    # any even offset inside the record
    local = []
    for o in range(0, TABLE_B_STRIDE, 2):
        if u16(va + o) == 0x5B82:
            local.append(o)
            hits_b.append((i, o, va + o))
    if i < TABLE_B_COUNT and not (link == 0x3E or 0 <= link < TABLE_B_COUNT):
        link_out.append((i, link))
    star = ' HIT' + ','.join('+0x%x' % o for o in local) if local else ''
    past = ' PAST' if i == TABLE_B_COUNT else ''
    w('  [%02x] 0x%08x %04x %04x %04x %08x %08x %04x %04x%s%s' % (
        i, va, fields[0], fields[2], fields[0x2E], type_dw, link, fields[0x48], fields[0x2C], star, past))
w('u16 0x5b82 inside the 0x3d records: %s' % (
    ' '.join('idx 0x%x off +0x%x at 0x%08x' % h for h in hits_b) or 'none'))
w('next-link outside 0..0x3c and not 0x3e: %s' % (
    ' '.join('idx 0x%x -> 0x%x' % x for x in link_out) or 'none'))
w()

# ---- listings of the small functions ----
listing = []


def emit_listing(lo, hi, title):
    listing.append('== %s 0x%08x..0x%08x ==' % (title, lo, hi))
    vas = [va for va in ins_all if lo <= va < hi]
    vas.sort()
    bad = 0
    for va in vas:
        nb, mnem, raw, _ = ins_all[va]
        if MAIN[off(va):off(va) + nb].hex() != raw:
            bad += 1
        listing.append('0x%08x %s %s' % (va, raw, mnem))
    listing.append('instructions %d mismatches %d' % (len(vas), bad))
    listing.append('')
    return len(vas), bad


list_stats = []
for lo, hi, name in ranges:
    if lo in keep_lo and lo in (
        0x60196ecc, 0x60196ee3, 0x601971f5, 0x601972f1, 0x6019766d,
        0x6019782e, 0x6019783a, 0x601eff7a, 0x601efec0, 0x6041ab1d, 0x607135ad,
        0x60195aa7, 0x6019525a,
    ):
        n, b = emit_listing(lo, hi, name)
        list_stats.append((name, n, b))

w('== listing counts ==')
for name, n, b in list_stats:
    w('  %s instructions %d mismatches %d' % (name, n, b))
w()

# ---- per setter call, the 12 instructions before it, from the kept listing ----
w('== calls of FUN_60063431 inside the kept setter functions ==')
sites = []
for va, (nb, mnem, raw, owner) in ins_all.items():
    if mnem.startswith('call 0x60063431'):
        sites.append(va)
sites.sort()
ordered = sorted(ins_all)
import bisect
for va in sites:
    owner = ins_all[va][3]
    w('-- call 0x%08x in %s bytes %s' % (va, ranges[fstarts.index(owner)][2] if owner in fstarts else hex(owner), ins_all[va][2]))
    i = bisect.bisect_left(ordered, va)
    start = max(0, i - 14)
    for j in range(start, i + 1):
        p = ordered[j]
        if ins_all[p][3] != owner:
            continue
        nb, mnem, raw, _ = ins_all[p]
        w('  0x%08x %s %s' % (p, raw, mnem))
w()

# ---- caller windows: 16 instructions before each call of the open setters ----
w('== caller windows ==')
# The caller instructions may sit in functions we did not keep.
# Second, smaller scan: collect ranges covering each call site.
caller_vas = []
for tgt, rows in call_sites.items():
    if tgt == SETTER:
        continue
    for va, mnem, raw in rows:
        caller_vas.append(va)
caller_vas = sorted(set(caller_vas))
# keep the function that contains each caller
extra_keep = []
for va in caller_vas:
    hit = func_of(va)
    if hit and hit[0] not in keep_lo:
        extra_keep.append(hit)
# unique
seen_lo = set()
extra_ranges = []
for a, b, name in extra_keep:
    if a not in seen_lo:
        seen_lo.add(a)
        extra_ranges.append((a, b, name))

extra_ins = {}
if extra_ranges:
    print('second scan for callers', len(extra_ranges), flush=True)
    lohi = [(a, b) for a, b, _ in extra_ranges]

    def in_extra(va):
        for a, b in lohi:
            if a <= va < b:
                return a
        return None

    with ASM.open('r', encoding='utf-8', errors='replace') as f:
        for line in f:
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 3:
                continue
            try:
                va = int(parts[0], 16)
            except ValueError:
                continue
            if in_extra(va) is None:
                continue
            raw = parts[1].strip().lower()
            if not raw or any(c not in '0123456789abcdef' for c in raw):
                continue
            nb = len(raw) // 2
            if MAIN[off(va):off(va) + nb].hex() != raw:
                continue
            extra_ins[va] = (nb, parts[2].strip(), raw)

all_ins = dict(ins_all)
for va, (nb, mnem, raw) in extra_ins.items():
    all_ins[va] = (nb, mnem, raw, 0)

ordered2 = sorted(all_ins)
for tgt in (0x601eff7a, 0x6041ab1d, 0x60196ee3, 0x601971f5, 0x601972f1, 0x60195424):
    rows = call_sites.get(tgt, [])
    w('-- callers of 0x%08x : %d in the asm listing' % (tgt, len(rows)))
    for va, mnem, raw in rows:
        w('  site 0x%08x %s %s' % (va, raw, mnem))
        i = bisect.bisect_left(ordered2, va)
        start = max(0, i - 18)
        for j in range(start, i + 1):
            p = ordered2[j]
            nb, mm, rr, _ = all_ins[p]
            w('    0x%08x %s %s' % (p, rr, mm))
        w('')
w()

# ---- FUN_607135ad register story, printed in order ----
w('== FUN_607135ad in order (A2/A3/D0 lines marked) ==')
vas = sorted(va for va, rec in ins_all.items() if rec[3] == 0x607135ad)
for va in vas:
    nb, mnem, raw, _ = ins_all[va]
    mark = ''
    if 'A2' in mnem or 'A3' in mnem or mnem.startswith('call'):
        mark = ' <<'
    w('  0x%08x %s %s%s' % (va, raw, mnem, mark))
w()

# ---- specific byte checks Sol named ----
w('== Sol lineage bytes ==')
for va, n in ((0x607135ef, 6), (0x6071365d, 4), (0x60196f73, 2), (0x601effc8, 2),
              (0x6041ab71, 8), (0x601972da, 4)):
    w('  0x%08x %s' % (va, hx(va, n)))
w()

# ---- who writes the key halfwords of table A: stores in the three functions ----
w('== stores in FUN_601efec0 / FUN_601eff7a / FUN_601efff9 ==')
for lo in (0x601efec0, 0x601eff7a, 0x601efff9):
    vas = sorted(va for va, rec in ins_all.items() if rec[3] == lo)
    for va in vas:
        mnem = ins_all[va][1]
        # a store has a memory destination. mnemonics put the destination last.
        if ',' in mnem and '(' in mnem.split(',')[-1]:
            w('  0x%08x %s %s' % (va, ins_all[va][2], mnem))
w()

text = '\n'.join(log) + '\n'
OUT.write_text(text, encoding='utf-8')
LISTING.write_text('\n'.join(listing) + '\n', encoding='utf-8')
print('wrote', OUT)
print('wrote', LISTING)
print('calls setter', len(sites))
print('DONE')
