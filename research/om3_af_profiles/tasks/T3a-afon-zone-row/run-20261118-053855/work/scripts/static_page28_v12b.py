# Locate the menu item that opens page 28. Read-only.
import pathlib
b = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020

def cpu(off):
    return BASE + off

def u16(off):
    return int.from_bytes(b[off:off+2], 'little')

def u32(off):
    return int.from_bytes(b[off:off+4], 'little')

# Every aligned-looking 12-byte record with label 0x0da4, any kind, id printed.
print('--- loose 0xda4 at record+6 ---')
needle = (0x0da4).to_bytes(2, 'little')
start = 0
n = 0
while True:
    i = b.find(needle, start)
    if i < 0:
        break
    start = i + 1
    if i < 6:
        continue
    ident = u32(i - 6)
    kind = u16(i - 2)
    viewer = u32(i + 2)
    if ident > 0x10000 or kind > 32:
        continue
    if not (0x60000000 <= viewer <= 0x63000000 or viewer == 0):
        continue
    print(hex(cpu(i - 6)), 'id', ident, 'kind', kind, 'view', hex(viewer))
    n += 1
print('count', n)

# Item 5393 = 0x1511 and nearby AF items. Search u32 id at record start.
print('--- id 5393 records ---')
pat = (5393).to_bytes(4, 'little')
start = 0
while True:
    i = b.find(pat, start)
    if i < 0:
        break
    start = i + 1
    kind = u16(i + 4)
    label = u16(i + 6)
    viewer = u32(i + 8)
    if kind <= 32 and 0x60000000 <= viewer <= 0x63000000:
        print(hex(cpu(i)), 'kind', kind, 'label', hex(label), 'view', hex(viewer), b[i:i+20].hex())

# First-level list 0x61520552, 244 u16. Print a window around 5393 and around ids whose records use label 0xda4.
off = 0x61520552 - BASE
ids = [u16(off + k * 2) for k in range(244)]
print('list len', len(ids), 'has 5393', 5393 in ids, 'index', ids.index(5393) if 5393 in ids else None)
for want in (5393, 5261, 5262, 5263, 1650, 1344, 1341, 2081, 238):
    print(' id', want, 'in list', want in ids, 'at', ids.index(want) if want in ids else None)

# Dump 30 ids around 5393 with their record if we can find one table.
idx = ids.index(5393)
print('around 5393:')
for j in range(max(0, idx - 8), min(len(ids), idx + 24)):
    print(f'  [{j}] {ids[j]}')

# Search a record table for these ids. Try 0x6151aa1c stride 12 for a while.
print('--- table near 0x6151aa1c ---')
base = 0x6151aa1c - BASE
# find a record whose id is 5393
for k in range(0, 8000):
    offk = base + k * 12
    if u32(offk) == 5393:
        print('found stride12 at', hex(cpu(offk)), 'k', k)
        for j in range(-5, 30):
            o = offk + j * 12
            print(f'  {hex(cpu(o))} id={u32(o)} kind={u16(o+4)} label={hex(u16(o+6))} view={hex(u32(o+8))}')
        break
else:
    print('5393 not in stride-12 from 0x6151aa1c within 8000')
