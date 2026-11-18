# List every absolute immediate in the central-edge code that points at the
# section-1 tail. Used to relocate owned state off Z's menu bytes.
# Does not write an image.
import json
from pathlib import Path

BASE = 0x60021020
ROOT = Path('.')
windows = json.loads((ROOT / 'work/out/static-windows-k1.json').read_text(encoding='utf-8'))
# Rebuild the central-edge image window from the CSV so the scan covers every
# changed code byte, not only the disassembled windows.
import csv
stock = (ROOT / 'inputs/00_0100_50000020.decoded.bin').read_bytes()
image = bytearray(stock)
edge = ROOT / 'ref/analysis/button-af/readiness/om-emu-af-native1/central-edge-v2.csv'
with edge.open(newline='') as f:
    for rec in csv.DictReader(f):
        off = int(rec['component_offset'], 16)
        image[off] = int(rec['proposed_byte'], 16)

# Code extents that the central-edge CSV changes and that are executable.
RANGES = [
    (0x6031EAD0, 0x6031EC9F),
    (0x607187A4, 0x607187D0),
    (0x60A8F088, 0x60A8F800),
]
LO, HI = 0xA031E900, 0xA031F000
hits = []
for lo, hi in RANGES:
    blob = bytes(image[lo - BASE:hi - BASE + 1])
    for i in range(len(blob) - 5):
        if blob[i] != 0xFC:
            continue
        op = blob[i + 1]
        if not (0x80 <= op <= 0xFF):
            continue
        word = int.from_bytes(blob[i + 2:i + 6], 'little')
        if LO <= word < HI:
            hits.append({
                'at': f'{lo + i:08x}',
                'opcode': f'{blob[i]:02x}{op:02x}',
                'word': f'{word:08x}',
                'off': word - 0xA031E920,
            })
print('hits', len(hits))
words = sorted({h['word'] for h in hits})
print('unique', len(words))
print('min', words[0], 'max', words[-1])
for h in hits:
    print(h['at'], h['opcode'], h['word'], h['off'])
(ROOT / 'work/out/owned-immediates-k1.json').write_text(json.dumps(hits, indent=2) + '\n', encoding='utf-8')
