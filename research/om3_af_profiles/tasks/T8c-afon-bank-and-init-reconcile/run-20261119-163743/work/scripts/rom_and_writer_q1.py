# Static. Not an experiment version.
# Walk the registration tables that 0x60062536 walks, and check the
# ten-byte writer 0x609b3c79 against the image bytes.
import json
from pathlib import Path

BASE = 0x60021020
image = Path('inputs/00_0100_50000020.decoded.bin').read_bytes()

def u16(addr):
    i = addr - BASE
    return image[i] | (image[i + 1] << 8)

TABLES = [
    ('T0', 0x60095584, None),
    ('T2', 0x600b8f54, None),
    ('T3a', 0x600bb5ec, None),
    ('T3b', 0x600bda78, None),
    ('bank7', 0x600e4bec, 0x6011fe20),
]
LAYOUT = {
    0x99a1: ('k99a1', 8, 1),
    0x9a41: ('k9a41', 2, 1),
    0x5962: ('k5962', 6, 2),
    0x1dd1: ('k1dd1', 10, 1),
    0x84d1: ('k84d1', 1, 1),
    0x88b2: ('k88b2', 1, 2),
    0x90d1: ('k90d1', 8, 1),
    0x5a11: ('k5a11', 11, 1),
    0x1de1: ('k1de1', 8, 1),
    0x1df1: ('k1df1', 8, 1),
    0x1db1: ('k1db1', 1, 1),
    0x1dc1: ('k1dc1', 1, 1),
    0x5991: ('k5991', 2, 1),
    0xe1f1: ('ke1f1', 1, 1),
    0x1e71: ('k1e71', 1, 1),
}

found = {k: [] for k in LAYOUT}
stats = []
for name, start, end_key in TABLES:
    addr = start
    count = 0
    end = None
    for _ in range(5000):
        key = u16(addr)
        if key == 0:
            end = addr
            break
        ncell = u16(addr + 2)
        width = (key & 3) or 4
        payload_len = ncell * width
        raw = image[addr + 4 - BASE: addr + 4 - BASE + payload_len]
        if key in LAYOUT:
            found[key].append({
                'table': name,
                'record': hex(addr),
                'count': ncell,
                'width': width,
                'payload': raw.hex(),
            })
        count += 1
        addr = (addr + 4 + payload_len + 3) & ~3
    stats.append({'name': name, 'records': count, 'zeroKey': hex(end) if end else None, 'endOk': end == end_key if end_key else True})

# Ten-byte writer window. Expected getter immediates from the accepted listing.
WRITER = 0x609b3c79
writer = image[WRITER - BASE: WRITER - BASE + 0xF4]
# Fixed calls inside 0x609b3c79 .. 0x609b3d6d, checked as raw immediates present in order.
needles = [
    bytes.fromhex('419a0000'),  # 0x9a41
    bytes.fromhex('d11d'),      # 0x1dd1 appears twice; search sequentially
    bytes.fromhex('d1840000'),  # 0x84d1
    bytes.fromhex('b2880000'),  # 0x88b2
    bytes.fromhex('f11d'),      # 0x1df1
    bytes.fromhex('011e'),      # 0x1e01
]
pos = 0
hits = []
ok = True
for needle in needles:
    at = writer.find(needle, pos)
    hits.append({'needle': needle.hex(), 'at': None if at < 0 else hex(WRITER + at)})
    if at < 0:
        ok = False
    else:
        pos = at + 1
# The pose word and the two bank keys must be absent from the writer body.
absent = []
for label, needle in (
    ('pose', bytes.fromhex('8c562ca3')),
    ('0x5962', bytes.fromhex('6259')),
    ('0x99a1', bytes.fromhex('a1990000')),
    ('0x1db1', bytes.fromhex('b11d')),
    ('0x1dc1', bytes.fromhex('c11d')),
):
    at = writer.find(needle)
    absent.append({'label': label, 'present': at >= 0, 'at': None if at < 0 else hex(WRITER + at)})
    if at >= 0 and label in ('pose', '0x99a1', '0x1db1', '0x1dc1'):
        ok = False

# 0x5962 as a 16-bit mov immediate can be the two bytes 62 59. That pair can
# occur inside other immediates, so a hit is reported and not treated as a
# failure by itself. The 32-bit form and the pose word are the strict checks.
report = {
    'tables': stats,
    'rom': [
        {
            'key': hex(k),
            'name': LAYOUT[k][0],
            'layout': {'n': LAYOUT[k][1], 'width': LAYOUT[k][2]},
            'hits': found[k],
        }
        for k in LAYOUT
    ],
    'writer': {
        'entry': hex(WRITER),
        'return': hex(0x609b3d6d),
        'windowBytes': len(writer),
        'windowSha256': __import__('hashlib').sha256(writer).hexdigest(),
        'orderedImmediates': hits,
        'absentOrPresent': absent,
        'fixedIndices': [
            {'key': '0x9a41', 'index': 0, 'site': '0x609b3c7a'},
            {'key': '0x1dd1', 'index': 0, 'site': '0x609b3c8c'},
            {'key': '0x1dd1', 'index': 1, 'site': '0x609b3c9c'},
            {'key': '0x84d1', 'index': 0, 'site': '0x609b3cad'},
            {'key': '0x88b2', 'index': 0, 'site': '0x609b3cc0'},
            {'key': '0x1df1', 'index': 0, 'site': '0x609b3cd3'},
            {'key': '0x1e01', 'index': 0, 'site': '0x609b3ce4'},
        ],
        'checksOk': ok and all(h['at'] for h in hits),
    },
}
out = Path('work/out/rom-and-writer-q1.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({
    'tables': stats,
    'writerChecksOk': report['writer']['checksOk'],
    'romKeys': len(report['rom']),
    'bank7end': stats[-1],
}))
