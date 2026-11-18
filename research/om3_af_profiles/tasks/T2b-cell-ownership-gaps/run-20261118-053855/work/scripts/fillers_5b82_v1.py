# Key source for every runtime call of the three queue fillers, plus the two data-pool samples.
import collections
import re
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
ROUTES = (ROOT / 'work' / 'out' / 'routes-5b82-v1.txt').read_text(encoding='utf-8')
OUT = ROOT / 'work' / 'out' / 'fillers-5b82-v1.txt'

def off(va):
    return va - BASE

def hx(va, n):
    return MAIN[off(va):off(va) + n].hex()

def cstr(va, n=48):
    raw = MAIN[off(va):off(va) + n].split(b'\x00', 1)[0]
    return raw.decode('latin1', 'replace')

sites = []
for line in ROUTES.splitlines():
    line = line.strip()
    if line.startswith('0x') and ' call 0x6006' in line:
        addr = int(line.split()[0], 16)
        sites.append(addr)
site_set = set(sites)

log = []
def w(s=''):
    log.append(s)

w('runtime filler sites %d' % len(sites))

# rolling window inside the current function
window = []
saved = {}
fn = ''
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    for line in f:
        if line.startswith('; Function '):
            window = []
            fn = line.strip()
            continue
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        try:
            va = int(parts[0], 16)
        except ValueError:
            continue
        raw = parts[1].strip().lower()
        mnem = parts[2].strip()
        if va in site_set:
            saved[va] = (fn, list(window) + [(va, raw, mnem)])
        window.append((va, raw, mnem))
        if len(window) > 8:
            window.pop(0)

IMM = re.compile(r'^mov\s+(-?0x[0-9a-fA-F]+|-?\d+),(D0|D1|D2|D3|A0|A1|A2|A3)$')
for va in sites:
    fn, win = saved.get(va, ('?', []))
    w('---- 0x%08x %s' % (va, fn))
    for a, raw, m in win:
        mark = ' <<' if a == va else ''
        w('  0x%08x %s %s%s' % (a, raw, m, mark))
w()

w('== argument strings at the 0x608f8614 call ==')
for va in (0x60a39f0d, 0x60a3a6cd, 0x617c31d7, 0x617c31ed):
    w('  0x%08x %r' % (va, cstr(va)))
w()

w('== data-pool samples ==')
for va in (0x6078dd60, 0x607bdd04, 0x607ddd98, 0x6079dd00, 0x6077dcfc, 0x607bccfc, 0x607c69f4, 0x607cb986):
    raw = MAIN[off(va):off(va) + 24]
    asc = ''.join(chr(b) if 32 <= b < 127 else '.' for b in raw)
    w('  0x%08x %s %s' % (va, raw.hex(), asc))
w()

# callers of the tiny wrappers, rel16 and rel32, plus absolute
w('== callers ==')
want = [0x61843f70, 0x61843f09, 0x61843f1a, 0x61843f2b, 0x6041ab8f, 0x603c2a6b, 0x6183dcca, 0x6183be43]
hits = {k: [] for k in want}
for i, x in enumerate(MAIN[:-5]):
    if x not in (0xcd, 0xdd, 0xcc, 0xdc):
        continue
    a = BASE + i
    r16 = struct.unpack_from('<h', MAIN, i + 1)[0]
    r32 = struct.unpack_from('<i', MAIN, i + 1)[0]
    d16 = (a + r16) & 0xffffffff
    d32 = (a + r32) & 0xffffffff
    if d16 in hits:
        hits[d16].append(a)
    elif d32 in hits:
        hits[d32].append(a)
for k in want:
    w('  0x%08x n=%d %s' % (k, len(hits[k]), ' '.join('0x%08x' % a for a in hits[k][:10])))
w()

# how many absolute pointers into the big gap, and whether targets look like strings
# already sampled. Count pointer-to-gap roughly by sampling the known registration vs gap.
w('registration record 0x600e5874 bytes %s' % hx(0x600e5874, 8))
w('island 0x607c69f4 is not followed by a small count: next u16 0x%04x' % struct.unpack_from('<H', MAIN, off(0x607c69f4) + 2)[0])
w('island 0x607cb986 next u16 0x%04x' % struct.unpack_from('<H', MAIN, off(0x607cb986) + 2)[0])

OUT.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('sites', len(sites), 'saved', len(saved))
print('wrote', OUT)
