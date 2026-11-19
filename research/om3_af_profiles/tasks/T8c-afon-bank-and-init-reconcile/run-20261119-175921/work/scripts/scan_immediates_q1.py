# Static scan for settings-key immediates. Not an experiment version.
from pathlib import Path
image = Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020

def find_all(needle, limit=40):
    out = []
    start = 0
    while len(out) < limit:
        at = image.find(needle, start)
        if at < 0:
            break
        out.append(hex(BASE + at))
        start = at + 1
    return out

needles = {
    'mov16_5962_d0': bytes.fromhex('2c6259'),
    'mov16_5962_d1': bytes.fromhex('2d6259'),
    'mov32_5962': bytes.fromhex('fccc62590000'),
    'mov16_99a1_d0': bytes.fromhex('2ca199'),
    'mov32_99a1': bytes.fromhex('fccca1990000'),
    'mov16_1db1_d0': bytes.fromhex('2cb11d'),
    'mov16_1dc1_d0': bytes.fromhex('2cc11d'),
    'pose_word': bytes.fromhex('8c562ca3'),
}
for name, needle in needles.items():
    hits = find_all(needle, 30)
    print(name, len(hits), ' '.join(hits[:12]))
