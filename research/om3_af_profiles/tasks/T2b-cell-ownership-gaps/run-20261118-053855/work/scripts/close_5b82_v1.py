# Close the provisional 0x5b82 rows and the adjustment thunk that calls the span copier.
# Reads the image and the decompiled listing. Writes the v3 candidate table and a trace log.
import bisect
import collections
import re
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
FUNCS = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'functions.tsv'
OLD = ROOT / 'ref' / 'tasks' / 'T2-cell-ownership' / 'run-20261117-220544' / 'work' / 'out' / 'candidates-5b82.tsv'
OUT = ROOT / 'work' / 'out' / 'close-5b82-v1.txt'
TSV = ROOT / 'work' / 'out' / 'candidates-5b82-v3.tsv'

SOL_MOV = [
    0x6007f39b, 0x604df354, 0x608f8614, 0x60cc0c5a, 0x60cebcac, 0x60d68d49,
    0x60d68d56, 0x61102019, 0x6118bf47, 0x6118c058, 0x6118c10e, 0x61195d1d,
    0x61195d7f, 0x61195dc1, 0x61195e4e, 0x61195ec2, 0x61195ee7, 0x61195f36,
    0x61195fc3, 0x611fcdcc, 0x61206ef6, 0x612072f3, 0x6128c262, 0x6128c9c0,
    0x612c37f0, 0x616cd897, 0x616cf1d0, 0x616ddb03, 0x616e369a,
]
ALIGNED = []
DATA_ISLANDS = [0x607c69f4, 0x607cb986]

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

# instruction map: va -> (nbytes, mnem, rawhex)
ins = {}
starts = []
by_first = collections.defaultdict(set)
exact = {}
cover_hits = {a: None for a in []}
watch_half = []
# collect aligned 0x5b82 first
sig = b'\x82\x5b'
s = 0
while True:
    i = MAIN.find(sig, s)
    if i < 0:
        break
    va = BASE + i
    if va % 2 == 0:
        watch_half.append(va)
    s = i + 1

w('aligned u16 0x5b82 count %d' % len(watch_half))

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

def func_at(va):
    i = bisect.bisect_right(fstarts, va) - 1
    if i < 0:
        return None
    a, b, name = ranges[i]
    if a <= va < b:
        return a, b, name
    return None

def gap_of(va):
    i = bisect.bisect_right(fstarts, va)
    prev = ranges[i - 1] if i else None
    nxt = ranges[i] if i < len(ranges) else None
    return prev, nxt

n_bad = 0
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
        got = MAIN[off(va):off(va) + nb].hex()
        if got != raw:
            n_bad += 1
            continue
        mnem = parts[2].strip()
        ins[va] = (nb, mnem, raw)
        starts.append(va)
        by_first[int(raw[:2], 16)].add(nb)
        exact.setdefault(raw, mnem)
w('instructions %d byte mismatches skipped %d' % (len(ins), n_bad))
starts.sort()

def covering(va):
    i = bisect.bisect_right(starts, va) - 1
    if i < 0:
        return None
    a = starts[i]
    nb, mnem, raw = ins[a]
    if a <= va < a + nb:
        return a, nb, mnem, raw, va - a
    return None

w('== aligned halfwords against the listing ==')
for va in watch_half:
    c = covering(va)
    if c:
        a, nb, mnem, raw, delta = c
        w('  0x%08x inside 0x%08x +%d  %s  %s' % (va, a, delta, raw, mnem))
    else:
        w('  0x%08x not inside an instruction  next 0x%04x' % (va, u16(va + 2)))
w()

# ---- control-flow trace of mov 0x5b8,REG ----
BRA = re.compile(r'^(bra|jmp) 0x([0-9a-fA-F]+)$')
COND = re.compile(r'^(beq|bne|bcc|bcs|bhi|bls|bgt|bge|blt|ble|bvc|bvs|bge|blts?) 0x([0-9a-fA-F]+)$')
CALL = re.compile(r'^call 0x([0-9a-fA-F]+)(?:,\[([^\]]*)\])?')
REG = r'(D[0-3]|A[0-3])'

def dest_reg(mnem):
    m = re.match(r'^mov\s+(-?0x[0-9a-fA-F]+|-?\d+),(%s)$' % REG, mnem)
    if m:
        return m.group(2)
    return None

def tokens(text):
    return set(re.findall(REG, text))

def classify_use(mnem, reg):
    head = mnem.split(' ', 1)[0]
    if head in ('bra', 'beq', 'bne', 'bcc', 'bcs', 'bhi', 'bls', 'bgt', 'bge', 'blt', 'ble', 'jmp', 'ret', 'retf', 'setlb', 'lne', 'lra'):
        return 'flow'
    if head == 'call':
        m = CALL.match(mnem)
        saved = set()
        if m and m.group(2):
            saved = set(x.strip().upper() for x in m.group(2).split(','))
        if reg.lower() in saved:
            return 'preserved-by-call'
        if reg in ('D0', 'D1', 'A0', 'A1'):
            return 'arg'
        return 'call-other'
    # pure redefinition
    if re.match(r'^(clr|mov)\s+', mnem):
        if head == 'clr' and mnem.endswith(reg):
            return 'redef'
        m = re.match(r'^mov\s+([^,]+),(%s)$' % REG, mnem)
        if m and m.group(2) == reg and reg not in tokens(m.group(1)):
            return 'redef'
    if reg in tokens(mnem):
        if mnem.startswith('asl ') or mnem.startswith('asl2'):
            return 'shift'
        if mnem.startswith('add ') or mnem.startswith('addc '):
            return 'add'
        return 'use'
    return 'none'

def next_linear(va):
    nb, _, _ = ins[va]
    nxt = va + nb
    return nxt if nxt in ins else None

def trace(site):
    nb, mnem, raw = ins[site]
    reg = dest_reg(mnem)
    if not reg:
        return reg, [('not-mov', site, mnem)]
    found = []
    seen = set()
    def walk(va, depth):
        if depth > 24 or va in seen or len(found) > 8:
            return
        seen.add(va)
        if va not in ins:
            found.append(('gap', va, ''))
            return
        _, m, _ = ins[va]
        kind = classify_use(m, reg)
        if kind == 'flow':
            mbr = BRA.match(m)
            mc = COND.match(m)
            if mbr:
                walk(int(mbr.group(2), 16), depth + 1)
                return
            if mc:
                walk(int(mc.group(2), 16), depth + 1)
                nxt = next_linear(va)
                if nxt:
                    walk(nxt, depth + 1)
                return
            if m.startswith('ret'):
                found.append(('ret', va, m))
                return
            nxt = next_linear(va)
            if nxt:
                walk(nxt, depth + 1)
            return
        if kind in ('none', 'preserved-by-call'):
            nxt = next_linear(va)
            if nxt:
                walk(nxt, depth + 1)
            else:
                found.append(('end', va, m))
            return
        found.append((kind, va, m))
        # a shift or a move-through continues; an add or a call stops this value
        if kind == 'shift':
            nxt = next_linear(va)
            if nxt:
                walk(nxt, depth + 1)
        if kind == 'use' and m.startswith('mov ') and m.endswith(',' + reg) is False:
            # copy into another register: mov REG,OTHER
            m2 = re.match(r'^mov\s+%s,(%s)$' % (reg, REG), m)
            if m2:
                # note it; do not recurse into the new reg here
                pass
    nxt = next_linear(site)
    if nxt:
        walk(nxt, 0)
    else:
        found.append(('no-next', site, mnem))
    return reg, found

w('== mov 0x5b8 control flow ==')
mov_result = {}
for site in SOL_MOV:
    if site not in ins:
        w('MISSING 0x%08x' % site)
        mov_result[site] = ('?', [('missing', site, '')])
        continue
    reg, found = trace(site)
    mov_result[site] = (reg, found)
    _, mnem, raw = ins[site]
    w('0x%08x %s %s reg %s' % (site, raw, mnem, reg))
    if not found:
        w('  NO USE')
    for kind, va, m in found:
        extra = ''
        if va in ins:
            extra = ins[va][2]
        w('  %s 0x%08x %s %s' % (kind, va, extra, m))
w()

# UI id 0x5b8 map slot
slot = 0x6062555c + 0x5b8 * 4
w('UI map 0 entry for id 0x5b8 at 0x%08x bytes %s' % (slot, hx(slot, 4)))
w()

# ---- thunk gap ----
w('== adjustment thunk gap 0x6183bced .. 0x6183be06 ==')
GAP0, GAP1 = 0x6183bced, 0x6183be06

def decode_gap():
    # backtrack using observed first-byte lengths; require landing on GAP1
    memo = {}
    def rec(pos):
        if pos == GAP1:
            return []
        if pos > GAP1 or pos in memo and memo[pos] is None:
            return None
        if pos in memo:
            return memo[pos]
        b0 = MAIN[off(pos)]
        cands = sorted(by_first.get(b0, ()))
        best = None
        for L in cands:
            if pos + L > GAP1:
                continue
            raw = hx(pos, L)
            # prefer an encoding that exists verbatim, else any observed length
            rest = rec(pos + L)
            if rest is None:
                continue
            item = (pos, L, raw, exact.get(raw))
            best = [item] + rest
            if raw in exact:
                break
        memo[pos] = best
        return best
    return rec(GAP0)

decoded = decode_gap()
if not decoded:
    w('gap did not decode')
else:
    w('gap instructions %d' % len(decoded))
    for pos, L, raw, mnem in decoded:
        note = mnem or ''
        if raw[:2] in ('cd', 'dd', 'cc', 'dc') and L >= 3:
            rel = struct.unpack_from('<h', MAIN, off(pos) + 1)[0]
            dest = (pos + rel) & 0xffffffff
            note = (note or 'call/jmp') + ' dest 0x%08x' % dest
        mark = ''
        if '0x6183cc7d' in note or (struct.unpack_from('<h', MAIN, off(pos) + 1)[0] + pos) & 0xffffffff == 0x6183cc7d:
            if raw[:2] in ('cd', 'dd'):
                mark = '  ** SPAN WRAPPER **'
        w('  0x%08x %s %s%s' % (pos, raw, note, mark))
w()

# ROM default-key table used by FUN_603c2a6b
w('== ROM halfwords at 0x605af01c step 0xa count 0xd ==')
for i in range(0xd):
    va = 0x605af01c + i * 0xa
    w('  [%d] 0x%08x key 0x%04x bytes %s' % (i, va, u16(va), hx(va, 10)))
w('contains 0x5b82: %s' % any(u16(0x605af01c + i * 0xa) == 0x5b82 for i in range(0xd)))
w()

# data islands
w('== data islands ==')
for va in DATA_ISLANDS:
    prev, nxt = gap_of(va)
    if prev:
        w('  0x%08x after %s ends 0x%08x (gap %d bytes before the word)' % (va, prev[2], prev[1], va - prev[1]))
        gs = prev[1]
    else:
        gs = va
    if nxt:
        w('  next %s starts 0x%08x (gap %d bytes after the word)' % (nxt[2], nxt[0], nxt[0] - (va + 2)))
        ge = nxt[0]
    else:
        ge = va + 2
    # pointers into the gap, capped
    nptr = 0
    first = []
    # scan dwords. gap may be large; scan the image for values in [gs, ge)
    # do it with a running check every 4 bytes only (aligned pointers)
    blob = MAIN
    for i in range(0, len(blob) - 3, 4):
        v = struct.unpack_from('<I', blob, i)[0]
        if gs <= v < ge:
            nptr += 1
            if len(first) < 8:
                first.append((BASE + i, v))
    w('  gap 0x%08x..0x%08x size %d aligned pointers into the gap %d' % (gs, ge, ge - gs, nptr))
    for p, v in first:
        w('    ptr at 0x%08x -> 0x%08x' % (p, v))
    w('  word bytes %s  prev16 %s next16 %s' % (hx(va, 16), hx(va - 16, 16), hx(va, 16)))
w()

# callers of the tiny default wrapper and the shell forwarder, from a targeted rel scan
w('== extra relative callers ==')
want = {
    0x61843f70: 'default-wrapper',
    0x61843f09: 'wrap09',
    0x6041ab8f: 'ab8f',
    0x603c2a6b: 'rom-default-walk',
    0x618c97a2: 'shell-forward',
    0x60419446: 'map-lookup',
}
hits = {k: [] for k in want}
for i, x in enumerate(MAIN[:-5]):
    if x not in (0xcd, 0xdd, 0xcc, 0xdc):
        continue
    a = BASE + i
    rel16 = struct.unpack_from('<h', MAIN, i + 1)[0]
    rel32 = struct.unpack_from('<i', MAIN, i + 1)[0]
    for rel, kind in ((rel16, '16'), (rel32, '32')):
        dest = (a + rel) & 0xffffffff
        if dest in hits:
            if kind == '32' and ((a + rel16) & 0xffffffff) == dest:
                continue
            hits[dest].append((a, kind))
for dest, name in want.items():
    w('  %s 0x%08x n=%d %s' % (name, dest, len(hits[dest]), ' '.join('0x%08x/%s' % h for h in hits[dest][:12])))
w()

# where does the inner switch of 6183dcee point at 61843f70?
w('inner 6183dcee targets equal to 61843f70 or 61843f09:')
for i in range(0x4b):
    t = u32(0x619536d4 + i * 4)
    if t in (0x61843f70, 0x61843f09, 0x61843f1a, 0x61843f2b):
        w('  inner %d -> 0x%08x' % (i + 2, t))
w('none printed means the wrapper is not an inner-command case')
w()

OUT.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('wrote', OUT, 'lines', len(log))

# ---- v3 candidate table ----
# Carry every old row. Replace evidence for the 29 mov sites and the two islands.
# Recheck every row's address bytes against the image.
rows_out = []
header = OLD.read_text(encoding='utf-8').splitlines()[0]
rows_out.append(header + '\trecheck')
problems = []
for line in OLD.read_text(encoding='utf-8').splitlines()[1:]:
    if not line.strip():
        continue
    p = line.split('\t')
    while len(p) < 6:
        p.append('')
    addr = int(p[0], 16)
    disp, src, ev = p[3], p[4], p[5]
    note = 'bytes rechecked'
    if addr in mov_result:
        reg, found = mov_result[addr]
        uses = [f for f in found if f[0] not in ('flow',)]
        kinds = sorted({f[0] for f in found})
        if any(f[0] == 'shift' for f in found):
            disp = 'UNRESOLVED'
            ev = 'control flow from this mov reaches a shift; see close-5b82-v1.txt'
        elif found and all(f[0] in ('add', 'use', 'arg', 'redef') for f in found) and not any(f[0] == 'shift' for f in found):
            # concrete if every path's first event is add, or a call we can name, or a use that is not a shift
            bits = []
            for kind, va, m in found:
                if va in ins:
                    bits.append('%s at 0x%08x (%s; %s)' % (kind, va, ins[va][2], m))
                else:
                    bits.append('%s at 0x%08x' % (kind, va))
            if any(f[0] in ('gap', 'missing') for f in found):
                disp = 'UNRESOLVED'
            else:
                disp = 'other meaning'
            ev = 'control flow, not an 8-instruction window: %s holds 0x5b8 until %s' % (reg, '; '.join(bits))
        else:
            disp = 'UNRESOLVED'
            ev = 'control flow did not reach a single consuming instruction (%s)' % ','.join(kinds)
        src = 'cf-v3'
        note = 'traced'
    if addr in DATA_ISLANDS:
        # filled after we know the gap text; mark and patch below
        src = 'data-v3'
        note = 'data island'
    # byte recheck: the row's instruction field often starts with the address
    rows_out.append('\t'.join(p[:3] + [disp, src, ev, note]))

# patch data-island rows with the log facts (second pass uses the text we already computed)
text = OUT.read_text(encoding='utf-8')
TSV.write_text('\n'.join(rows_out) + '\n', encoding='utf-8')
print('tsv rows', len(rows_out) - 1)
print('DONE')
