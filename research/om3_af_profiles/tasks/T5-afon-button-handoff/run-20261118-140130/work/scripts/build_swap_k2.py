# One change on the combined overlay: the home builder's AF Home area-type read
# (key 0x9fa1) becomes a load of the RAM profile byte at 0xa031e920.
# build_swap_k1.py rejected its own patch because the hex literal was 18 bytes.
# This file uses a 20-byte patch. Size, position and 0x1e01 stay.
# EMULATOR-ONLY. No firmware image.
import csv
import struct
from pathlib import Path

BASE = 0x60021020
ROOT = Path('.')
SRC = ROOT / 'work/out/overlay-combined-k1.csv'
OUT = ROOT / 'work/out/overlay-changed-bytes.csv'
AT = 0x60A8F708
# movbu (0xa031e920),D0; jmp to 0x60a8f71c; nine unexecuted bytes.
PATCH = bytes.fromhex('fca820e931a0dc0e00000000000000000000000000')
EXPECT = bytes.fromhex('fccca19f000089fcdc00000000dd6b3c5dffc00c')


def main():
    if len(PATCH) != 20 or len(EXPECT) != 20:
        raise SystemExit('patch length ' + str(len(PATCH)))
    disp = struct.unpack_from('<i', PATCH, 7)[0]
    if (AT + 6) + disp != 0x60A8F71C:
        raise SystemExit('jmp target')
    rows = []
    with SRC.open(newline='') as f:
        for rec in csv.DictReader(f):
            rows.append(rec)
    by = {int(r['runtime_address'], 16): r for r in rows}
    got = bytes(int(by[AT + i]['proposed_byte'], 16) for i in range(20))
    if got != EXPECT:
        raise SystemExit('combined image does not still read 0x9fa1: ' + got.hex())
    for i, b in enumerate(PATCH):
        rec = by[AT + i]
        if int(rec['proposed_byte'], 16) == b:
            continue
        rec['proposed_byte'] = f'{b:02x}'
        rec['source'] = 'new'
        rec['purpose'] = 'profile source swap: zone type from 0xa031e920, size and position stay on the legacy provider, EMULATOR-ONLY behaviour'
    for addr, key in ((0x60A8F73E, 'fccca1df0000'), (0x60A8F75A, 'fcccd2990000'), (0x60A8F770, 'fccc011e0000')):
        raw = bytes(int(by[addr + i]['proposed_byte'], 16) for i in range(6))
        if raw.hex() != key:
            raise SystemExit(f'legacy read changed at {addr:08x} {raw.hex()}')
    with OUT.open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['component_offset', 'runtime_address', 'stock_byte', 'proposed_byte', 'source', 'purpose'])
        w.writeheader()
        for rec in rows:
            w.writerow(rec)
    changed = sum(1 for i in range(20) if PATCH[i] != EXPECT[i])
    print('wrote', OUT.name, 'patched_bytes', changed)


if __name__ == '__main__':
    main()
