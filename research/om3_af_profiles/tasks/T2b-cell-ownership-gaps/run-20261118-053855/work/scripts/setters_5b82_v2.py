# Second pass: key-field dump, index links, the skipped call, and D2 at the late fa64 sites.
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
OUT = ROOT / 'work' / 'out' / 'setters-5b82-v2.txt'

def off(va):
    return va - BASE

def u16(va):
    return struct.unpack_from('<H', MAIN, off(va))[0]

def u32(va):
    return struct.unpack_from('<I', MAIN, off(va))[0]

def hx(va, n):
    return MAIN[off(va):off(va) + n].hex()

lines = []
def w(s=''):
    lines.append(s)

TABLE = 0x60242324
STRIDE = 0x9C
w('== key halfwords at +0x4c and +0x4e, links at +0x14 and +0x6c ==')
w('idx va key4c key4e link14 link6c')
wild = []
keys = []
for i in range(0x3E):  # 0..0x3d inclusive
    va = TABLE + i * STRIDE
    k4c = u16(va + 0x4C)
    k4e = u16(va + 0x4E)
    link = u32(va + 0x14)
    link6 = u32(va + 0x6C)
    keys.append(k4c)
    keys.append(k4e)
    ok14 = link == 0x3E or 0 <= link <= 0x3D
    ok6 = link6 == 0x3E or 0 <= link6 <= 0x3D
    if not ok14 or not ok6:
        wild.append((i, link, link6))
    w('  %02x 0x%08x %04x %04x %08x %08x%s' % (
        i, va, k4c, k4e, link, link6, '' if ok14 and ok6 else ' WILD'))
w('0x5b82 among key halfwords: %s' % (0x5B82 in keys))
w('wild links: %s' % (wild or 'none'))
w('record 0x3d bytes +0x00 %s' % hx(TABLE + 0x3D * STRIDE, 16))
w()

# gap between the call that the listing skips and the resume
GAP0, GAP1 = 0x601958DF, 0x60195A52
w('== gap 0x%08x..0x%08x (%d bytes) ==' % (GAP0, GAP1, GAP1 - GAP0))
# find cd/dd whose rel target is one of the setters, and print 16 bytes before each
targets = {
    0x601972f1: 'FUN_601972f1',
    0x60196ee3: 'FUN_60196ee3',
    0x601971f5: 'FUN_601971f5',
    0x60063431: 'FUN_60063431',
    0x60196ecc: 'FUN_60196ecc',
}
pos = GAP0
while pos + 5 <= GAP1:
    b = MAIN[off(pos)]
    hit = None
    if b == 0xCD:
        rel = struct.unpack_from('<h', MAIN, off(pos) + 1)[0]
        tgt = (pos + rel) & 0xFFFFFFFF
        if tgt in targets:
            hit = (tgt, 'cd')
    elif b == 0xDD and pos + 7 <= GAP1:
        rel = struct.unpack_from('<i', MAIN, off(pos) + 1)[0]
        tgt = (pos + rel) & 0xFFFFFFFF
        if tgt in targets:
            hit = (tgt, 'dd')
    if hit:
        w('  call-like 0x%08x %s -> %s %s' % (pos, hit[1], targets[hit[0]], hx(pos, 8)))
        w('    prev16 %s' % hx(pos - 16, 16))
    pos += 1
w()

# instructions in FUN_60195424 that mention (0x50,sp)
w('== (0x50,sp) in 0x60195424..0x60195aa7 ==')
lo, hi = 0x60195424, 0x60195AA7
n = 0
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        try:
            va = int(parts[0], 16)
        except ValueError:
            continue
        if va < lo:
            continue
        if va >= hi:
            break
        if '0x50,sp' in parts[2] or va < 0x60195460:
            raw = parts[1].strip().lower()
            if raw and MAIN[off(va):off(va) + len(raw) // 2].hex() == raw:
                if '0x50,sp' in parts[2] or va < 0x60195460:
                    w('  0x%08x %s %s' % (va, raw, parts[2].strip()))
                    n += 1
w('lines %d' % n)
w()

# D2 writes inside the two callees that sit between mov A3,D2 and the late setter calls
w('== callees between the fa64 copy and the late D2 key loads ==')
for start, name, size in (
    (0x60156943, 'FUN_60156943', 10),
    (0x6071327d, 'FUN_6071327d', 62),
    (0x6007822a, 'FUN_6007822a', 40),
):
    w('-- %s' % name)
    # pull from the listing if present, else raw
    got = []
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    want = {0x60156943, 0x6071327d}
    # collect by streaming once the two small functions fully: they are in the listing
    capture = None
    cap_end = 0
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        try:
            va = int(parts[0], 16)
        except ValueError:
            continue
        if va in (0x60156943, 0x6071327d) or (capture and va < cap_end):
            if va in (0x60156943, 0x6071327d):
                capture = va
                cap_end = va + (10 if va == 0x60156943 else 80)
                w('-- start 0x%08x' % va)
            raw = parts[1].strip().lower()
            mnem = parts[2].strip()
            if raw and MAIN[off(va):off(va) + len(raw) // 2].hex() == raw:
                mark = ''
                if 'D2' in mnem or mnem.startswith('ret'):
                    mark = ' <<'
                w('  0x%08x %s %s%s' % (va, raw, mnem, mark))
        elif capture and va >= cap_end:
            capture = None

w()
w('bytes 0x6071365d %s (expect 9b mov A2,A3)' % hx(0x6071365d, 1))
w('bytes 0x607135ef %s (expect 2664fa mov 0xfa64,A2)' % hx(0x607135ef, 3))
w('bytes 0x607136f6 %s (expect f1de mov A3,D2)' % hx(0x607136f6, 2))
w('bytes 0x6071374b %s (expect 88 mov D2,D0)' % hx(0x6071374b, 1))
w('bytes 0x60196ecc %s' % hx(0x60196ecc, 12))
w('bytes 0x601eff84 %s' % hx(0x601eff84, 6))
w('bytes 0x6041ab22 %s' % hx(0x6041ab22, 4))
w('bytes 0x6041ab71 %s' % hx(0x6041ab71, 6))

OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('wrote', OUT)
print('wild', wild)
print('key 5b82', 0x5B82 in keys)
print('DONE')
