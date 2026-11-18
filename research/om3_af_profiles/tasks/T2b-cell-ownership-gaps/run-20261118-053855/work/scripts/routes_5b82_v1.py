# T2b routes for key 0x5b82.
# Bounded listings, adjustment-command table, queue fillers, debug dispatchers.
# Reads inputs and ref. Writes only the paths below. Does not overwrite prior scripts.
import json
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
CALLS = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'calls.tsv'
OUT = ROOT / 'work' / 'out' / 'routes-5b82-v1.txt'
LISTINGS = ROOT / 'work' / 'out' / 'listings-5b82-v3.txt'
CURSOR = ROOT / 'work' / 'out' / 'cursor-pages-v1.txt'

lines = []
def w(s=''):
    lines.append(s)

def off(va):
    return va - BASE

def u16(va):
    return struct.unpack_from('<H', MAIN, off(va))[0]

def u32(va):
    return struct.unpack_from('<I', MAIN, off(va))[0]

def hexb(va, n):
    return MAIN[off(va):off(va) + n].hex()

def cstr(va, n=64):
    o = off(va)
    if not (0 <= o < len(MAIN)):
        return '<out of image>'
    raw = MAIN[o:o + n].split(b'\x00', 1)[0]
    return raw.decode('latin1', 'replace')

w('routes 0x5b82 v1')
w('image bytes %d sha prefix %s' % (len(MAIN), __import__('hashlib').sha256(MAIN).hexdigest()[:16]))
w('byte check base 0x60021020')
w()

# ---- outer adjustment command table ----
w('== outer command table 0x61953548 .. 0x61953648 ==')
w('FUN_6183bc55 reads the record halfword at +0, subtracts 0x1001, and walks this table')
w('only when the halfword at RAM 0x62d31d10 equals 1.')
w('entry bytes at the reader 0x6183bcb9: %s' % hexb(0x6183bcb9, 16))
outer = []
va = 0x61953548
while va < 0x61953648:
    ident = u32(va)
    hand = u32(va + 4)
    cmd = (ident + 0x1001) & 0xffffffff
    outer.append((cmd, ident, hand))
    w('  cmd 0x%04x  table-id 0x%04x  thunk 0x%08x  bytes %s' % (cmd, ident, hand, hexb(hand, 12)))
    va += 8
w()

# decode a short thunk: first CD/DD whose rel16 lands in the main image code
def thunk_call(hand):
    raw = MAIN[off(hand):off(hand) + 24]
    for i, x in enumerate(raw):
        if x not in (0xcd, 0xdd) or i + 3 > len(raw):
            continue
        rel = struct.unpack_from('<h', raw, i + 1)[0]
        dest = (hand + i + rel) & 0xffffffff
        if 0x60021020 <= dest < 0x60021020 + len(MAIN):
            return hand + i, dest, raw[:i + 5].hex()
    return None, None, raw[:12].hex()

w('== thunk calls (rel16 from the thunk entry) ==')
for cmd, ident, hand in outer:
    if ident == 0:
        continue
    site, dest, raw = thunk_call(hand)
    w('  cmd 0x%04x thunk 0x%08x call-at %s dest %s raw %s' % (
        cmd, hand, ('0x%08x' % site) if site else '-', ('0x%08x' % dest) if dest else '-', raw))
w()

w('== inner switch of FUN_6183dcee, table 0x619536d4, command = index + 2 ==')
w('load of the table: 0x6183dd26 bytes %s' % hexb(0x6183dd26, 8))
for i in range(0x4b):
    t = u32(0x619536d4 + i * 4)
    mark = ''
    if t == 0x6183e991:
        mark = '  KEY-FROM-RECORD then FUN_60063962'
    w('  inner %d -> 0x%08x%s' % (i + 2, t, mark))
w()

w('== inner switch of FUN_61841830, table 0x6195394c, command = index + 4 ==')
w('load of the table: 0x61841868 bytes %s' % hexb(0x61841868, 8))
for i in range(0x19):
    t = u32(0x6195394c + i * 4)
    mark = ''
    if t == 0x61841e83:
        mark = '  SPAN: key from record+8, call FUN_6183cc7d'
    w('  inner %d -> 0x%08x%s' % (i + 4, t, mark))
w()

w('== key load at 0x6183e9b5 (inner command 53) ==')
w('0x6183e991..0x6183e9c8 bytes follow in the listing')
w('record+8 halfword -> D2 -> FUN_60063356; if the lookup returns non-null, D2 -> FUN_60063962')
w('FUN_60063962 queues type 4 or calls FUN_6006398b, which copies the ROM default (zeros for 0x5b82).')
w()

w('== span call at 0x61841ea8 (inner command 18) ==')
w('0x61841e85 mov (0x8,A0),D0 then exthu: key is the low halfword of record+8')
w('0x61841e88 mov (0xc,A0),D1 then exthu: second argument')
w('0x61841e99 mov (0x2c,A0),A0: source pointer is the dword at record+0x2c')
w('FUN_6183cc7d calls FUN_6006327f(key). Bank 7 returns 7, which is not 5, 8, or 9,')
w('so a type-2 key (0x5b82 & 7 == 2) reaches FUN_60063567 and the span copy.')
w()

# ---- who calls the two entries, by rel16/rel32 ----
w('== relative calls to the handler entries ==')
want = {
    0x6183dcee: 'dcee',
    0x61841830: '1830',
    0x6183cc7d: 'cc7d',
    0x6183bc55: 'dispatcher',
    0x6183b9aa: 'adj-loop',
    0x60215a26: 'dbg1',
    0x6021818d: 'dbg2',
    0x602158a8: 'dbg1-parent',
    0x6021552a: 'dbg1-grand',
    0x602181e3: 'shell-exec',
    0x6021822f: 'shell-task',
}
hits = {k: [] for k in want}
for i, x in enumerate(MAIN[:-5]):
    if x not in (0xcd, 0xdd, 0xcc, 0xdc):
        continue
    rel16 = struct.unpack_from('<h', MAIN, i + 1)[0]
    rel32 = struct.unpack_from('<i', MAIN, i + 1)[0]
    a = BASE + i
    for rel, kind in ((rel16, '16'), (rel32, '32')):
        dest = (a + rel) & 0xffffffff
        if dest in hits:
            if kind == '32' and ((a + rel16) & 0xffffffff) == dest:
                continue
            hits[dest].append((a, x, kind))
for dest, name in want.items():
    w('  %s 0x%08x calls %d' % (name, dest, len(hits[dest])))
    for a, x, kind in hits[dest]:
        w('    from 0x%08x opcode 0x%02x rel%s bytes %s' % (a, x, kind, hexb(a, 6)))
w()

w('== absolute pointers to the adjustment loop and the shell task ==')
for dest, name in ((0x6183b9aa, 'adj-loop'), (0x6021822f, 'shell-task'), (0x602154af, 'dbgall-handler'), (0x600619a9, 'prm-handler')):
    sig = struct.pack('<I', dest)
    start = 0
    found = []
    while True:
        i = MAIN.find(sig, start)
        if i < 0:
            break
        found.append(BASE + i)
        start = i + 1
    w('  %s 0x%08x at %s' % (name, dest, ' '.join('0x%08x' % v for v in found)))
w('task slot 0x6003915c context dwords:')
for va in range(0x60039140, 0x60039180, 4):
    w('  0x%08x 0x%08x' % (va, u32(va)))
w()

w('== flag 0x62d31d10 ==')
w('FUN_60f1a6a8 returns that halfword. Bytes at 0x60f1a6a8: %s' % hexb(0x60f1a6a8, 9))
w('cleared by FUN_6183bbeb (movhu 0). Bytes at 0x6183bbec: %s' % hexb(0x6183bbec, 6))
w('written from D0 by FUN_6183bbf5. Bytes at 0x6183bbf5: %s' % hexb(0x6183bbf5, 6))
w('FUN_6183be43, the ungated command 0x1002 handler, does mov 0x1,D0 then calls FUN_6183bbf5.')
w('bytes at 0x6183be63: %s' % hexb(0x6183be63, 8))
w('FUN_6183bedb calls FUN_6183bbf5(0), clearing the flag, when the flag is already 1.')
w()

# ---- debug tables ----
w('== debug command tables, 0x3f entries of 8 bytes (name, handler) ==')
for base, title in ((0x602ec3d4, 'dispatcher FUN_60215a26'), (0x602ed9a8, 'dispatcher FUN_6021818d')):
    w('  %s base 0x%08x' % (title, base))
    for i in range(0x3f):
        ent = base + i * 8
        name = u32(ent)
        hand = u32(ent + 4)
        mark = '  PRM' if hand == 0x600619a9 else ''
        w('    [%d] 0x%08x name %s handler 0x%08x%s' % (i, ent, cstr(name, 24), hand, mark))
w()
w('shell strings:')
for va in (0x602edbbf, 0x602edbdb, 0x602edbc7, 0x619531e5, 0x602ecdbe, 0x602ecde6, 0x602ece45, 0x6195332a, 0x61953340):
    w('  0x%08x %s' % (va, cstr(va, 80)))
w()

# ---- queue fillers from calls.tsv ----
w('== callers of the transaction enqueue FUN_60063116 ==')
fillers = []
for i, line in enumerate(CALLS.read_text(encoding='utf-8').splitlines()):
    if i == 0:
        continue
    p = line.split('\t')
    if len(p) < 3:
        continue
    if int(p[2], 16) == 0x60063116:
        fillers.append((int(p[0], 16), int(p[1], 16)))
        w('  caller 0x%08x site 0x%08x bytes %s' % (int(p[0], 16), int(p[1], 16), hexb(int(p[1], 16), 6)))
w('three sites. Type immediate is the mov to D0 immediately before each call:')
w('  0x600634d2 mov 0x1,D0  bytes %s  then call at 0x600634d9  (one cell)' % hexb(0x600634d2, 2))
w('  0x60063666 mov 0x2,D0  bytes %s  then call at 0x60063668  (span)' % hexb(0x60063666, 2))
w('  0x60063979 mov 0x4,D0  bytes %s  then call at 0x6006397b  (whole-key default)' % hexb(0x60063979, 2))
w()

# replay
w('== FUN_600630a3 replay ==')
w('installed by mov 0x600630a3,A0 at 0x600631cd bytes %s' % hexb(0x600631cd, 6))
w('type 1 -> FUN_600634ee, type 2 -> FUN_60063684, type 4 -> FUN_6006398b')
w('bytes of the three compares are in the listing')
w()

# ---- asm windows for call-site key immediates ----
w('== straight-line key immediate before calls of the three fillers ==')
watched = {0x60063431: 'setter', 0x60063567: 'span', 0x60063962: 'default'}
sites = {k: [] for k in watched}
for i, line in enumerate(CALLS.read_text(encoding='utf-8').splitlines()):
    if i == 0:
        continue
    p = line.split('\t')
    if len(p) < 3:
        continue
    callee = int(p[2], 16)
    if callee in sites:
        sites[callee].append(int(p[1], 16))
site_set = {}
for callee, addrs in sites.items():
    for a in addrs:
        site_set[a] = callee

# scan asm once, keep a window inside the current function
import re
IMM_MOV = re.compile(r'^mov\s+(-?0x[0-9a-fA-F]+|-?\d+),(D0|D1|A0)$')
window = []
current = None
results = []
BRANCH = ('bra', 'beq', 'bne', 'bcc', 'bcs', 'bhi', 'bls', 'bgt', 'bge', 'blt', 'ble', 'jmp', 'ret', 'retf')

def parse_imm(text):
    if text.startswith('0x') or text.startswith('-0x'):
        return int(text, 16)
    return int(text)

n_inst = 0
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    for line in f:
        if line.startswith('; Function '):
            window = []
            continue
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        try:
            va = int(parts[0], 16)
        except ValueError:
            continue
        mnem = parts[2].strip()
        n_inst += 1
        op = mnem.split(' ', 1)[0]
        if va in site_set:
            imm = None
            how = 'RUNTIME'
            for prev_va, prev_m in reversed(window):
                m = IMM_MOV.match(prev_m)
                if m and m.group(2) == 'D0':
                    imm = parse_imm(m.group(1))
                    how = 'imm'
                    break
                pop = prev_m.split(' ', 1)[0]
                if pop in BRANCH or pop == 'call':
                    break
            results.append((site_set[va], va, how, imm, mnem))
        if op in BRANCH or op == 'call':
            window = []
        else:
            window.append((va, mnem))
            if len(window) > 12:
                window.pop(0)

w('asm instructions scanned %d' % n_inst)
from collections import Counter
for callee, name in watched.items():
    rows = [r for r in results if r[0] == callee]
    kinds = Counter(r[2] for r in rows)
    imms = sorted({r[3] for r in rows if r[2] == 'imm'})
    w('  %s FUN_%08x sites %d  %s' % (name, callee, len(rows), dict(kinds)))
    w('    immediates: %s' % ' '.join('0x%x' % v for v in imms))
    runtime = [r for r in rows if r[2] != 'imm']
    w('    runtime sites %d' % len(runtime))
    for r in runtime:
        w('      0x%08x %s' % (r[1], r[4]))
w()

# 0x5b82 among those immediates?
bad = [r for r in results if r[2] == 'imm' and (r[3] & 0xffff) == 0x5b82]
w('filler call sites whose straight-line D0 immediate is 0x5b82: %d' % len(bad))
w()

# aligned halfwords
w('== aligned u16 0x5b82 in the image ==')
sig = b'\x82\x5b'
start = 0
n = 0
while True:
    i = MAIN.find(sig, start)
    if i < 0:
        break
    va = BASE + i
    if va % 2 == 0:
        nxt = u16(va + 2)
        w('  0x%08x next 0x%04x window %s' % (va, nxt, hexb(va, 8)))
        n += 1
    start = i + 1
w('aligned count %d' % n)
w()

# data islands
w('== two aligned data coincidences ==')
for va in (0x607c69f4, 0x607cb986):
    w('  0x%08x u16 0x%04x next 0x%04x dword 0x%08x' % (va, u16(va), u16(va + 2), u32(va)))
    w('    -32..+32 %s' % hexb(va - 32, 64))
    # pointer to this address?
    sig = struct.pack('<I', va)
    s = 0
    ptrs = []
    while True:
        i = MAIN.find(sig, s)
        if i < 0:
            break
        ptrs.append(BASE + i)
        s = i + 1
    w('    pointers to this address: %s' % (' '.join('0x%08x' % p for p in ptrs) or 'none'))
w()

OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('wrote', OUT, 'lines', len(lines))

# listings: selected ranges, byte-checked against the image
# second small scan would be heavy; pull the lines we need by address filter while we already scanned.
# Re-scan is simpler and the file is local. Collect only the ranges.
ranges = [
    (0x6183bc55, 0x6183be43, 'FUN_6183bc55 dispatcher through the flag test and the table jump'),
    (0x6183dcee, 0x6183dd30, 'FUN_6183dcee prologue and switch'),
    (0x6183e991, 0x6183e9c9, 'inner command 53, key from record+8, FUN_60063962'),
    (0x61841830, 0x61841872, 'FUN_61841830 prologue and switch'),
    (0x61841e83, 0x61841eb8, 'inner command 18, key from record+8, FUN_6183cc7d'),
    (0x6183cc7d, 0x6183cde5, 'FUN_6183cc7d'),
    (0x600630a3, 0x60063116, 'FUN_600630a3 replay'),
    (0x600634c0, 0x600634ee, 'setter queues type 1'),
    (0x60063658, 0x60063684, 'span copier queues type 2 or copies'),
    (0x60063684, 0x600636ec, 'FUN_60063684'),
    (0x60063962, 0x6006398b, 'FUN_60063962 queues type 4 or calls the default copy'),
    (0x60215a26, 0x60215a61, 'FUN_60215a26 debug dispatcher 1'),
    (0x6021818d, 0x602181c8, 'FUN_6021818d debug dispatcher 2'),
    (0x602181e3, 0x6021822f, 'FUN_602181e3 shell command exec'),
    (0x600631c8, 0x600631d4, 'callback pointer to FUN_600630a3'),
]
range_set = []
for a, b, title in ranges:
    range_set.append((a, b, title))

out_l = []
out_l.append('listings-5b82-v3')
out_l.append('each instruction line is checked against inputs/00_0100_50000020.decoded.bin')
out_l.append('file offset = address - 0x60021020')
checked = 0
mism = 0
capturing = None
buf = {i: [] for i in range(len(ranges))}
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        try:
            va = int(parts[0], 16)
        except ValueError:
            continue
        raw = parts[1].strip()
        if not raw or any(c not in '0123456789abcdefABCDEF' for c in raw):
            continue
        for i, (a, b, title) in enumerate(ranges):
            if a <= va < b:
                got = MAIN[off(va):off(va) + len(raw) // 2].hex()
                checked += 1
                ok = got == raw.lower()
                if not ok:
                    mism += 1
                buf[i].append((va, raw.lower(), parts[2].strip(), ok))
out_l.append('checked %d mismatches %d' % (checked, mism))
out_l.append('')
for i, (a, b, title) in enumerate(ranges):
    out_l.append('---- 0x%08x..0x%08x %s (%d ins) ----' % (a, b, title, len(buf[i])))
    for va, raw, mnem, ok in buf[i]:
        flag = '' if ok else '  MISMATCH'
        out_l.append('0x%08x  %s  %s%s' % (va, raw, mnem, flag))
    out_l.append('')
LISTINGS.write_text('\n'.join(out_l) + '\n', encoding='utf-8')
print('listings', LISTINGS, 'checked', checked, 'mismatches', mism)

# cursor samples from the confirmed T2 logs. Read-only.
cur = []
cur.append('cursor-page samples from the T2 correction logs')
cur.append('These twelve samples are the cursor-page search inside the C1 action list.')
cur.append('They are not twelve menu tabs.')
base = ROOT / 'ref' / 'tasks' / 'T2-cell-ownership' / 'run-20261117-220544' / 'work' / 'out'
for name in ('dynamic-5b82-mark-w.jsonl', 'dynamic-5b82-mark-x.jsonl', 'dynamic-5b82-control-p.jsonl'):
    path = base / name
    cur.append('')
    cur.append(name)
    for line in path.read_text(encoding='utf-8').splitlines():
        o = json.loads(line)
        if o.get('step') != 'cursor-page-search':
            continue
        pages = o.get('cursorPages') or []
        cur.append('pages %d' % len(pages))
        samples = []
        for p in pages:
            samples.append(tuple(p.get('sample') or []))
            cur.append('  n=%s hit=%s sample=%s' % (p.get('n'), p.get('hit'), p.get('sample')))
        uniq = sorted(set(samples))
        cur.append('distinct samples %d' % len(uniq))
        for u in uniq:
            cur.append('  ' + ' | '.join(u))
CURSOR.write_text('\n'.join(cur) + '\n', encoding='utf-8')
print('cursor', CURSOR)
print('DONE')
