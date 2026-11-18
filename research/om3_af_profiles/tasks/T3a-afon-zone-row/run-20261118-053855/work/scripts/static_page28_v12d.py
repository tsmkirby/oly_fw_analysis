# Who points at the page-28 descriptor, and which item labels equal 0x0da4.
import pathlib
b = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
pat = (0x6158f10c).to_bytes(4, 'little')
start = 0
print('pointers to page 28 descriptor')
while True:
    i = b.find(pat, start)
    if i < 0:
        break
    start = i + 1
    print(' ', hex(BASE + i), b[max(0, i-8):i+12].hex())
# page id 28 as the first u32 is inside the descriptor itself (1c 00 00 00 at 0x6158f10c)
# search u16 page-id tables: a run 19 00 1a 00 1b 00 1c 00 (pages 25..28)
seq = bytes([0x19, 0x00, 0x1a, 0x00, 0x1b, 0x00, 0x1c, 0x00])
i = b.find(seq)
print('page id run', hex(BASE + i) if i >= 0 else None)
# item 5393's label match method: find label 0x1279 records already known.
# Dump 0x40 bytes around each 0xda4 menu record so the following fields show the target.
for addr in (0x6156c2a8, 0x6156c2e0, 0x6156c510, 0x6156c564):
    off = addr - BASE
    print('record', hex(addr))
    print(b[off-16:off+48].hex())
