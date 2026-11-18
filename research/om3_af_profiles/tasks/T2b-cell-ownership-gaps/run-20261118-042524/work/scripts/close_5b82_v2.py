# Leaner pass: trace the 29 mov 0x5b8 sites, decode the adjustment thunk gap,
# and characterize the two aligned data words. Does not keep the whole listing in memory.
import bisect
import collections
import re
import struct
import sys
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
FUNCS = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'functions.tsv'
OLD = ROOT / 'ref' / 'tasks' / 'T2-cell-ownership' / 'run-20261117-220544' / 'work' / 'out' / 'candidates-5b82.tsv'
OUT = ROOT / 'work' / 'out' / 'close-5b82-v2.txt'
TSV = ROOT / 'work' / 'out' / 'candidates-5b82-v3.tsv'

SOL_MOV = [
    0x6007f39b, 0x604df354, 0x608f8614, 0x60cc0c5a, 0x60cebcac, 0x60d68d49,
    0x60d68d56, 0x61102019, 0x6118bf47, 0x6118c058, 0x6118c10e, 0x61195d1d,
    0x61195d7f, 0x61195dc1, 0x61195e4e, 0x61195ec2, 0x61195ee7, 0x61195f36,
    0x61195fc3, 0x611fcdcc, 0x61206ef6, 0x612072f3, 0x6128c262, 0x6128c9c0,
    0x612c37f0, 0x616cd897, 0x616cf1d0, 0x616ddb03, 0x616e369a,
]
ISLANDS = [0x607c69f4, 0x607cb986]

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

def gap_bounds(va):
    i = bisect.bisect_right(fstarts, va)
    prev_end = ranges[i - 1][1] if i else BASE
    # the listing may continue past functions.tsv's size, up to the next entry
    next_start = ranges[i][0] if i < len(ranges) else BASE + len(MAIN)
    prev = ranges[i - 1] if i else None
    nxt = ranges[i] if i < len(ranges) else None
    return prev, nxt, prev_end, next_start

# regions to keep: from the function entry that contains each site through the next entry
keep = []
for site in SOL_MOV:
    i = bisect.bisect_right(fstarts, site) - 1
    lo = ranges[i][0]
    hi = ranges[i + 1][0] if i + 1 < len(ranges) else BASE + len(MAIN)
    keep.append((lo, hi))
keep.sort()
merged = []
for lo, hi in keep:
    if merged and lo <= merged[-1][1]:
        merged[-1] = (merged[-1][0], max(merged[-1][1], hi))
    else:
        merged.append((lo, hi))

def wanted(va):
    i = bisect.bisect_right(merged, (va, 10**12)) - 1
    return i >= 0 and merged[i][0] <= va < merged[i][1]

watch_half = []
s = 0
sig = b'\x82\x5b'
while True:
    i = MAIN.find(sig, s)
    if i < 0:
        break
    va = BASE + i
    if va % 2 == 0:
        watch_half.append(va)
    s = i + 1
half_set = set(watch_half)

ins = {}
by_first = collections.defaultdict(set)
covered = {}
n_ins = 0
n_kept = 0
n_bad = 0
print('scanning', flush=True)
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
        by_first[int(raw[:2], 16)].add(nb)
        if va in half_set or any(va < h < va + nb for h in watch_half):
            covered[va] = (nb, parts[2].strip(), raw)
        if wanted(va):
            ins[va] = (nb, parts[2].strip(), raw)
            n_kept += 1
print('scan done', n_ins, 'kept', n_kept, 'bad', n_bad, flush=True)

w('instructions in listing %d kept %d mismatches %d' % (n_ins, n_kept, n_bad))
w('== aligned u16 0x5b82 ==')
# map instruction start -> record, then see which halfword it covers
cov_by_start = covered
for h in watch_half:
    hit = None
    # the instruction starts at or before h; we only stored the instruction if it covered h
    for a, (nb, mnem, raw) in cov_by_start.items():
        if a <= h < a + nb:
            hit = (a, nb, mnem, raw, h - a)
            break
    if hit:
        a, nb, mnem, raw, delta = hit
        w('  0x%08x inside insn 0x%08x +%d bytes %s %s' % (h, a, delta, raw, mnem))
    else:
        w('  0x%08x not an instruction operand  window %s' % (h, hx(h, 8)))
w()

REG = r'(D[0-3]|A[0-3])'
BRA = re.compile(r'^(bra|jmp) 0x([0-9a-fA-F]+)$')
COND = re.compile(r'^(beq|bne|bcc|bcs|bhi|bls|bgt|bge|blt|ble) 0x([0-9a-fA-F]+)$')
CALL = re.compile(r'^call 0x([0-9a-fA-F]+)(?:,\[([^\]]*)\])?')

def dest_reg(mnem):
    m = re.match(r'^mov\s+(-?0x[0-9a-fA-F]+|-?\d+),(%s)$' % REG, mnem)
    return m.group(2) if m else None

def tokens(text):
    return set(re.findall(REG, text))

def kind_of(mnem, reg):
    head = mnem.split(' ', 1)[0]
    if head in ('bra', 'beq', 'bne', 'bcc', 'bcs', 'bhi', 'bls', 'bgt', 'bge', 'blt', 'ble', 'jmp'):
        return 'flow'
    if head in ('ret', 'retf'):
        return 'ret'
    if head == 'call':
        m = CALL.match(mnem)
        saved = set()
        if m and m.group(2):
            saved = set(x.strip().upper() for x in m.group(2).split(','))
        if reg.lower() in saved or reg.upper() in saved:
            return 'preserved'
        if reg in ('D0', 'D1', 'A0', 'A1'):
            return 'arg'
        return 'call-other'
    if head == 'clr' and reg in mnem:
        return 'redef'
    m = re.match(r'^mov\s+([^,]+),(%s)$' % REG, mnem)
    if m and m.group(2) == reg and reg not in tokens(m.group(1)):
        return 'redef'
    if reg not in tokens(mnem):
        return 'none'
    if head in ('asl', 'asr', 'lsr') or mnem.startswith('asl2'):
        return 'shift'
    if head in ('add', 'addc', 'sub', 'subc'):
        return 'add'
    return 'use'

def trace(site):
    nb, mnem, raw = ins[site]
    reg = dest_reg(mnem)
    found = []
    seen = set()
    def walk(va, depth):
        if depth > 30 or len(found) > 12:
            return
        if va in seen:
            return
        seen.add(va)
        if va not in ins:
            found.append(('gap', va, ''))
            return
        _, m, _ = ins[va]
        k = kind_of(m, reg)
        if k == 'flow':
            mb = BRA.match(m)
            mc = COND.match(m)
            if mb:
                walk(int(mb.group(2), 16), depth + 1)
                return
            if mc:
                walk(int(mc.group(2), 16), depth + 1)
                nxt = va + ins[va][0]
                walk(nxt, depth + 1)
                return
            return
        if k in ('none', 'preserved'):
            walk(va + ins[va][0], depth + 1)
            return
        found.append((k, va, m))
        if k == 'shift':
            walk(va + ins[va][0], depth + 1)
    walk(site + nb, 0)
    return reg, found

w('== control flow of mov 0x5b8,REG ==')
mov_result = {}
for site in SOL_MOV:
    if site not in ins:
        w('MISSING 0x%08x' % site)
        mov_result[site] = ('?', [('missing', site, '')])
        continue
    reg, found = trace(site)
    mov_result[site] = (reg, found)
    w('0x%08x %s %s -> %s' % (site, ins[site][2], ins[site][1], reg))
    if not found:
        w('  (no consuming instruction)')
    for k, va, m in found:
        raw = ins[va][2] if va in ins else ''
        w('  %s 0x%08x %s %s' % (k, va, raw, m))
w()

slot = 0x6062555c + 0x5b8 * 4
w('UI-map dword for UI id 0x5b8 at 0x%08x = %s' % (slot, hx(slot, 4)))
w()

w('== thunk gap 0x6183bced..0x6183be06 ==')
GAP0, GAP1 = 0x6183bced, 0x6183be06
memo = {}
def rec(pos):
    if pos == GAP1:
        return []
    if pos > GAP1:
        return None
    if pos in memo:
        return memo[pos]
    b0 = MAIN[off(pos)]
    best = None
    for L in sorted(by_first.get(b0, ()), reverse=True):
        if L <= 0 or pos + L > GAP1:
            continue
        rest = rec(pos + L)
        if rest is None:
            continue
        best = [(pos, L)] + rest
        break
    memo[pos] = best
    return best

dec = rec(GAP0)
if not dec:
    w('undecoded')
else:
    for pos, L in dec:
        raw = hx(pos, L)
        note = ''
        if raw[:2] in ('cd', 'dd', 'cc', 'dc') and L >= 3:
            rel = struct.unpack_from('<h', MAIN, off(pos) + 1)[0]
            note = ' rel16 -> 0x%08x' % ((pos + rel) & 0xffffffff)
            if L >= 5 and raw[:2] in ('dd', 'dc'):
                rel32 = struct.unpack_from('<i', MAIN, off(pos) + 1)[0]
                note += ' rel32 -> 0x%08x' % ((pos + rel32) & 0xffffffff)
        w('  0x%08x %s%s' % (pos, raw, note))
w()

w('== FUN_603c2a6b ROM keys, 13 records of 10 bytes at 0x605af01c ==')
keys = []
for i in range(13):
    va = 0x605af01c + i * 10
    k = u16(va)
    keys.append(k)
    w('  [%d] 0x%08x 0x%04x %s' % (i, va, k, hx(va, 10)))
w('0x5b82 present: %s' % (0x5b82 in keys))
w()

w('== data islands ==')
island_info = {}
for va in ISLANDS:
    prev, nxt, prev_end, next_start = gap_bounds(va)
    # true gap is from the end of the previous function body to the next entry.
    # Use functions.tsv end, and also show the next entry.
    w('0x%08x previous %s body ends 0x%08x next entry %s at 0x%08x' % (
        va,
        prev[2] if prev else '-', prev[1] if prev else 0,
        nxt[2] if nxt else '-', nxt[0] if nxt else 0))
    gs = prev[1] if prev else va
    ge = nxt[0] if nxt else va + 2
    island_info[va] = (gs, ge, prev, nxt)
    w('  gap 0x%08x..0x%08x (%d bytes)' % (gs, ge, ge - gs))
    w('  +/-32 %s' % hx(va - 32, 64))

# one pointer scan for both gaps
print('pointer scan', flush=True)
ptrs = {va: [] for va in ISLANDS}
for i in range(0, len(MAIN) - 3, 4):
    v = struct.unpack_from('<I', MAIN, i)[0]
    for va, (gs, ge, _, _) in island_info.items():
        if gs <= v < ge and len(ptrs[va]) < 6:
            ptrs[va].append((BASE + i, v))
for va in ISLANDS:
    gs, ge, _, _ = island_info[va]
    w('  pointers into gap of 0x%08x (first %d): %s' % (
        va, len(ptrs[va]),
        ' '.join('0x%08x->0x%08x' % p for p in ptrs[va]) or 'none in the first matches'))
w()

# count pointers fully (the capped list may hide a later one). A second targeted search
# for the two addresses themselves and the gap starts.
w('absolute dwords equal to the island addresses or the gap starts:')
need = {}
for va, (gs, ge, _, _) in island_info.items():
    need[va] = 0
    need[gs] = 0
blob_counts = {k: [] for k in need}
for key in list(need):
    sig = struct.pack('<I', key)
    s = 0
    while True:
        i = MAIN.find(sig, s)
        if i < 0:
            break
        blob_counts[key].append(BASE + i)
        s = i + 4
        if len(blob_counts[key]) > 8:
            break
for key, hits in blob_counts.items():
    w('  0x%08x hits %d %s' % (key, len(hits), ' '.join('0x%08x' % h for h in hits)))
w()

OUT.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('wrote', OUT, flush=True)

# v3 rows
def evidence_for(addr):
    reg, found = mov_result[addr]
    if not found or any(k == 'missing' for k, _, _ in found):
        return 'UNRESOLVED', 'cf-v3', 'no consuming instruction recorded'
    if any(k == 'shift' for k, _, _ in found):
        return 'UNRESOLVED', 'cf-v3', 'a path shifts this register; see close-5b82-v2.txt'
    if any(k == 'gap' for k, _, _ in found):
        return 'UNRESOLVED', 'cf-v3', 'a path leaves the decoded function before the value is consumed'
    bits = []
    for k, va, m in found:
        raw = ins[va][2] if va in ins else ''
        bits.append('%s 0x%08x %s %s' % (k, va, raw, m))
    text = '%s still holds 0x5b8 until %s. No asl of this register on those paths, so the immediate is not shifted into key 0x5b82.' % (
        reg, '; '.join(bits))
    return 'other meaning', 'cf-v3', text

rows = [OLD.read_text(encoding='utf-8').splitlines()[0] + '\tv3']
for line in OLD.read_text(encoding='utf-8').splitlines()[1:]:
    if not line.strip():
        continue
    p = line.split('\t')
    while len(p) < 6:
        p.append('')
    addr = int(p[0], 16)
    if addr in mov_result and mov_result[addr][0] != '?':
        disp, src, ev = evidence_for(addr)
        p[3], p[4], p[5] = disp, src, ev
    elif addr in ISLANDS:
        gs, ge, prev, nxt = island_info[addr]
        p[3] = 'UNRESOLVED'
        p[4] = 'data-v3'
        p[5] = (
            'aligned u16 0x5b82 at 0x%08x bytes %s, next halfword 0x%04x. '
            'Not an instruction start. Gap between %s (ends 0x%08x) and %s (starts 0x%08x). '
            'No image dword equals this address. Structure not identified.'
            % (addr, hx(addr, 4), u16(addr + 2),
               prev[2], prev[1], nxt[2], nxt[0])
        )
    rows.append('\t'.join(p[:6] + ['recheck-v3']))
TSV.write_text('\n'.join(rows) + '\n', encoding='utf-8')
n_un = sum(1 for r in rows[1:] if '\tUNRESOLVED\t' in r)
print('rows', len(rows) - 1, 'UNRESOLVED', n_un)
print('DONE')
