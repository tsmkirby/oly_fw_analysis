# Static search for computed indexing into the key-8 binding array.
# Array base 0x615c540c, stride 24. Index 151 is the duplicate record at
# 0x615c6234. The directory entry is 0x615cc934. The whole decoded image is
# scanned. A hit whose 16 neighbouring bytes are 0xFF is marked padding.
import pathlib

BASE = 0x60021020
ARRAY = 0x615C540C
DIRECTORY = 0x615CC934
SLOT = 0x615CC938
FIRST = 0x615C59DC
DUP = 0x615C6234
PAST = 0x615C624C
STRIDE = 24
INDEX = 151

data = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
out = []


def say(line=''):
    out.append(line)


def u32(o):
    return int.from_bytes(data[o:o + 4], 'little')


def addr_of(o):
    return BASE + o


def is_padding(o):
    lo = max(0, o - 8)
    hi = min(len(data), o + 8)
    return data[lo:hi] == b'\xff' * (hi - lo)


def find_u32(value):
    needle = value.to_bytes(4, 'little')
    hits = []
    start = 0
    while True:
        i = data.find(needle, start)
        if i < 0:
            return hits
        hits.append(i)
        start = i + 1


def padding_tag(o):
    return ' padding' if is_padding(o) else ''


say('image bytes %d base 0x%x' % (len(data), BASE))
say('index 151 * 24 = 0x%x' % (INDEX * STRIDE))
say('array + 151*24 = 0x%x duplicate 0x%x match %s' % (ARRAY + INDEX * STRIDE, DUP, ARRAY + INDEX * STRIDE == DUP))
say('array + 152*24 = 0x%x past-record 0x%x match %s' % (ARRAY + (INDEX + 1) * STRIDE, PAST, ARRAY + (INDEX + 1) * STRIDE == PAST))
say('first record 0x%x delta 0x%x index %s' % (FIRST, FIRST - ARRAY, (FIRST - ARRAY) / STRIDE))
say('')

immediates = {
    'array-base': ARRAY,
    'directory': DIRECTORY,
    'directory-slot': SLOT,
    'first-record': FIRST,
    'duplicate': DUP,
    'past-152': PAST,
    'e28': INDEX * STRIDE,
    'e40': (INDEX + 1) * STRIDE,
}
sites = {}
for name, value in immediates.items():
    hits = find_u32(value)
    sites[name] = hits
    say('immediate %s 0x%x count %d' % (name, value, len(hits)))
    for o in hits:
        say('  0x%08x file+0x%x%s bytes %s' % (addr_of(o), o, padding_tag(o), data[o:o + 8].hex()))
say('')

# udfu01 imm8 is f9, reg 0x14+Dn, imm. udfu01 imm16 is fb, reg, imm.le16.
mul24 = []
for o in range(len(data) - 3):
    op = data[o]
    regb = data[o + 1]
    if regb < 0x14 or regb > 0x17:
        continue
    if op == 0xF9 and data[o + 2] == 0x18:
        mul24.append((o, 'imm8', regb - 0x14))
    elif op == 0xFB and data[o + 2] == 0x18 and data[o + 3] == 0x00:
        mul24.append((o, 'imm16', regb - 0x14))

by_reg = [0, 0, 0, 0]
for _, _, reg in mul24:
    by_reg[reg] += 1
say('udfu01 *24 count %d by register D0 %d D1 %d D2 %d D3 %d' % (len(mul24), *by_reg))
say('')

needles = {
    'array-base': ARRAY.to_bytes(4, 'little'),
    'directory': DIRECTORY.to_bytes(4, 'little'),
    'directory-slot': SLOT.to_bytes(4, 'little'),
}
say('computed index: a *24 whose 192 bytes before it, or 48 after it, contain the array base, the directory base, or the directory slot')
near = []
for o, form, reg in mul24:
    lo = max(0, o - 192)
    hi = min(len(data), o + 48)
    window = data[lo:hi]
    found = [name for name, needle in needles.items() if needle in window]
    if not found:
        continue
    near.append((o, form, reg, found))
    say('  *24 at 0x%08x %s D%d near %s%s' % (addr_of(o), form, reg, ','.join(found), padding_tag(o)))
say('near count %d' % len(near))
say('')

# Walker windows known from the accepted T4 listings. Report every *24 inside them.
windows = [
    ('walk-1', 0x6124F4E5, 0x6124F55E),
    ('walk-2', 0x6124F55E, 0x6124F63D),
    ('walk-3', 0x6124F63D, 0x6124F7BD),
]
say('walker windows (walk-3 end is entry+0x180, a search bound, not a proven ret)')
for name, start, end in windows:
    say('%s 0x%08x-0x%08x' % (name, start, end))
    for o, form, reg in mul24:
        a = addr_of(o)
        if start <= a < end:
            say('  *24 at 0x%08x %s D%d' % (a, form, reg))
say('')
say('done')

path = pathlib.Path('work/out/static-index-b1.txt')
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text('\n'.join(out) + '\n', encoding='utf-8')
print('\n'.join(out))
