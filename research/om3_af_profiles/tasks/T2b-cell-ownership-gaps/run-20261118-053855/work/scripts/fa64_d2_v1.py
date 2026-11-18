# Do the handlers reached from FUN_6071327d preserve D2?
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
FUNCS = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'functions.tsv'
OUT = ROOT / 'work' / 'out' / 'fa64-d2-v1.txt'

def u32(va):
    return struct.unpack_from('<I', MAIN, va - BASE)[0]

lines = []
def w(s=''):
    lines.append(s)

# table 0x60718658 .. 0x60718758, 8-byte records: id, handler
handlers = []
va = 0x60718658
while va < 0x60718758:
    ident = u32(va)
    ptr = u32(va + 4)
    handlers.append((va, ident, ptr))
    va += 8
w('entries %d' % len(handlers))
ptrs = sorted({p for _, _, p in handlers if p})
w('distinct handlers %d' % len(ptrs))
for va, ident, ptr in handlers:
    w('  0x%08x id 0x%x handler 0x%08x' % (va, ident, ptr))

# function sizes
sizes = {}
for line in FUNCS.read_text(encoding='utf-8').splitlines()[1:]:
    p = line.split('\t')
    if len(p) < 3:
        continue
    sizes[int(p[0], 16)] = (int(p[2]), p[1])

# collect ret and any 'D2' mnemonic inside each handler
need = {}
for p in ptrs:
    if p in sizes:
        need[p] = sizes[p][0]
    else:
        need[p] = 0
        w('NO FUNCTION %08x' % p)

found = {p: [] for p in ptrs}
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    cur = None
    end = 0
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        try:
            va = int(parts[0], 16)
        except ValueError:
            continue
        if va in need and need[va]:
            cur = va
            end = va + need[va]
        if cur is None or va < cur or va >= end:
            if cur and va >= end:
                cur = None
            continue
        mnem = parts[2].strip()
        if 'D2' in mnem or mnem.startswith('ret') or mnem.startswith('jmp'):
            found[cur].append((va, parts[1].strip(), mnem))

w()
w('== D2 / ret / jmp inside each handler ==')
bad = []
for p in ptrs:
    rows = found.get(p, [])
    name = sizes.get(p, (0, '?'))[1]
    d2w = [r for r in rows if 'D2' in r[2] and not r[2].startswith('ret')]
    rets = [r for r in rows if r[2].startswith('ret')]
    saves = any('d2' in r[2] for r in rets)
    # a write is a mnemonic whose destination is D2
    writes = []
    for va, raw, mnem in d2w:
        dest = mnem.split(',')[-1].strip() if ',' in mnem else ''
        if dest in ('D2',) or mnem.split()[-1] == 'D2':
            writes.append((va, mnem))
    flag = 'preserves' if (not writes or saves) else 'WRITES-D2'
    if writes and not saves:
        bad.append(p)
        flag = 'WRITES-D2-NO-RET-SAVE'
    w('0x%08x %s %s writes %d rets %s' % (
        p, name, flag, len(writes),
        ' | '.join(r[2] for r in rets) or 'none'))
    for va, mnem in writes[:6]:
        w('    0x%08x %s' % (va, mnem))
w('handlers that write D2 without a d2 ret: %s' % (' '.join('0x%08x' % p for p in bad) or 'none'))

OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('handlers', len(ptrs), 'bad', len(bad))
print('DONE')
