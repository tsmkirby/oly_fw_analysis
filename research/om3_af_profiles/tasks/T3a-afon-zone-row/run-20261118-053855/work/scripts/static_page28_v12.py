# Static locate of page 28's menu item and its setting-id list. Read-only.
import pathlib
p = pathlib.Path('inputs/00_0100_50000020.decoded.bin')
b = p.read_bytes()
BASE = 0x60021020

def cpu(off):
    return BASE + off

def u16(off):
    return int.from_bytes(b[off:off+2], 'little')

def u32(off):
    return int.from_bytes(b[off:off+4], 'little')

print('image', len(b))
# 12-byte menu records whose label halfword is 0x0da4
hits = []
needle = (0x0da4).to_bytes(2, 'little')
start = 0
while True:
    i = b.find(needle, start)
    if i < 0:
        break
    start = i + 1
    if i >= 6:
        kind = u16(i - 2)
        ident = u32(i - 6)
        viewer = u32(i + 2) if i + 6 <= len(b) else 0
        if kind in (1, 2, 3, 4, 12) and 0x60000000 <= viewer <= 0x62000000:
            hits.append((cpu(i - 6), ident, kind, 0x0da4, viewer))
print('label 0x0da4 records', len(hits))
for row in hits[:40]:
    print(' rec', ' '.join(hex(x) for x in row))

# consecutive page-28 setting ids 238, 1692, 1693
pat = bytes([0xee, 0x00, 0x9c, 0x06, 0x9d, 0x06])
start = 0
print('id-list hits')
while True:
    i = b.find(pat, start)
    if i < 0:
        break
    start = i + 1
    print(' ', hex(cpu(i)), b[i:i+12].hex())

# page 28 descriptor neighbourhood already known; dump source table records that
# point near 0x61529800-0x6152a000 and have a small count.
print('source-like records with count 3 and a pointer')
# scan 0x61529000-0x6152b000 for u32 pointer, u16 count==3
off0 = 0x61529000 - BASE
off1 = 0x6152c000 - BASE
n = 0
for off in range(off0, off1, 2):
    ptr = u32(off)
    count = u16(off + 4)
    if count == 3 and 0x61520000 <= ptr <= 0x61530000:
        ids = [u16(ptr - BASE + k * 2) for k in range(3)]
        if 238 in ids or 2154 in ids:
            print(' ', hex(cpu(off - 4)), 'ptr', hex(ptr), 'count', count, 'ids', ids, 'raw', b[off-4:off+12].hex())
            n += 1
            if n > 30:
                break
print('done', n)
