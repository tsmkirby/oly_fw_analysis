# One change on the combined overlay. k3 stopped because one byte of the
# 0x9fa1 call is stock 0xFF and is absent from the CSV. This reads the image,
# including stock bytes, and writes every patched byte.
# Zone type comes from 0xa031e920. 0xdfa1, 0x99d2 and 0x1e01 stay.
# EMULATOR-ONLY. No firmware image.
import csv
import struct
from pathlib import Path

BASE = 0x60021020
ROOT = Path('.')
STOCK_SHA = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
SRC = ROOT / 'work/out/overlay-combined-k1.csv'
OUT = ROOT / 'work/out/overlay-changed-bytes.csv'
AT = 0x60A8F708
PATCH = bytes.fromhex('fca820e931a0') + bytes([0xDC]) + struct.pack('<i', 0x0E) + bytes(9)
EXPECT = bytes.fromhex('fccca19f000089fcdc00000000dd6b3c5dffc00c')


def main():
    import hashlib
    stock = (ROOT / 'inputs/00_0100_50000020.decoded.bin').read_bytes()
    if hashlib.sha256(stock).hexdigest() != STOCK_SHA:
        raise SystemExit('stock hash')
    if len(PATCH) != 20 or (AT + 6) + struct.unpack_from('<i', PATCH, 7)[0] != 0x60A8F71C:
        raise SystemExit('patch')
    rows = []
    with SRC.open(newline='') as f:
        for rec in csv.DictReader(f):
            rows.append(rec)
    by = {int(r['runtime_address'], 16): r for r in rows}
    image = bytearray(stock)
    for rec in rows:
        image[int(rec['component_offset'], 16)] = int(rec['proposed_byte'], 16)
    got = bytes(image[AT - BASE:AT - BASE + 20])
    if got != EXPECT:
        raise SystemExit('combined image does not still read 0x9fa1: ' + got.hex())
    for i, b in enumerate(PATCH):
        addr = AT + i
        if b == got[i]:
            continue
        rec = by.get(addr)
        if rec is None:
            rec = {
                'component_offset': f'{addr - BASE:08x}',
                'runtime_address': f'{addr:08x}',
                'stock_byte': f'{stock[addr - BASE]:02x}',
                'proposed_byte': f'{b:02x}',
                'source': 'new',
                'purpose': 'profile source swap: zone type from 0xa031e920, size and position stay on the legacy provider, EMULATOR-ONLY behaviour',
            }
            rows.append(rec)
            by[addr] = rec
        else:
            rec['proposed_byte'] = f'{b:02x}'
            rec['source'] = 'new'
            rec['purpose'] = 'profile source swap: zone type from 0xa031e920, size and position stay on the legacy provider, EMULATOR-ONLY behaviour'
    image2 = bytearray(stock)
    for rec in rows:
        image2[int(rec['component_offset'], 16)] = int(rec['proposed_byte'], 16)
    if bytes(image2[AT - BASE:AT - BASE + 20]) != PATCH:
        raise SystemExit('patch did not land')
    for addr, key in ((0x60A8F73E, 'fccca1df0000'), (0x60A8F75A, 'fcccd2990000'), (0x60A8F770, 'fccc011e0000')):
        if bytes(image2[addr - BASE:addr - BASE + 6]).hex() != key:
            raise SystemExit(f'legacy read changed at {addr:08x}')
    rows.sort(key=lambda r: int(r['runtime_address'], 16))
    with OUT.open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['component_offset', 'runtime_address', 'stock_byte', 'proposed_byte', 'source', 'purpose'])
        w.writeheader()
        for rec in rows:
            w.writerow(rec)
    changed = sum(1 for i in range(20) if PATCH[i] != EXPECT[i])
    print('wrote', OUT.name, 'rows', len(rows), 'patched_bytes', changed)


if __name__ == '__main__':
    main()
