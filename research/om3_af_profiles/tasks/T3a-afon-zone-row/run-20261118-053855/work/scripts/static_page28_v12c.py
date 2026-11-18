# Find data that pairs a menu item with page id 28. Read-only.
import pathlib
b = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020

def u16(o):
    return int.from_bytes(b[o:o+2], 'little')
def u32(o):
    return int.from_bytes(b[o:o+4], 'little')

# Pairs (item, page) we already trust, as adjacent u16 or u32+u16.
known = {5262: 25, 5263: 26, 5393: 27}
print('search u32 item then nearby page id')
for item, page in known.items():
    pat = item.to_bytes(4, 'little')
    start = 0
    n = 0
    while n < 8:
        i = b.find(pat, start)
        if i < 0:
            break
        start = i + 1
        window = b[i:i+24]
        # page id as u16 in the next 16 bytes
        pages = [u16(i+k) for k in range(0, 20, 2)]
        if page in pages:
            print(hex(BASE+i), 'item', item, 'pages', pages, window.hex())
            n += 1
print('--- records whose u16 at +4 or +6 or +8 is 28 and a pointer looks like a viewer ---')
# scan 12-byte records in 0x61510000-0x61590000 for halfword 28
lo = 0x61500000 - BASE
hi = 0x61600000 - BASE
hits = 0
for off in range(lo, hi, 2):
    if u16(off) != 28:
        continue
    # look at preceding u32 as an item id in a plausible range
    if off < 4:
        continue
    ident = u32(off-4)
    if 2000 <= ident <= 8000:
        kind = u16(off+2) if off+4 <= len(b) else 0
        print('id-then-page', hex(BASE+off-4), 'id', ident, 'next', u16(off+2), 'word', hex(u32(off+2)))
        hits += 1
        if hits > 40:
            break
print('hits', hits)
