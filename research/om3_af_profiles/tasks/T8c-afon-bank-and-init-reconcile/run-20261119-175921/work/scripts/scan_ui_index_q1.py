# Static. Callers of the direct-screen bank read, and the UI-id table it uses.
# Not an experiment version. Do not edit after this runs.
import json
from pathlib import Path

BASE = 0x60021020
image = Path('inputs/00_0100_50000020.decoded.bin').read_bytes()

def u16(addr):
    i = addr - BASE
    return image[i] | (image[i + 1] << 8)

def s16(addr):
    v = u16(addr)
    return v - 0x10000 if v & 0x8000 else v

def s32(addr):
    i = addr - BASE
    v = image[i] | (image[i + 1] << 8) | (image[i + 2] << 16) | (image[i + 3] << 24)
    return v - 0x100000000 if v & 0x80000000 else v

def callers(target):
    hits = []
    for i, b in enumerate(image):
        pc = BASE + i
        if b == 0xCD and i + 4 < len(image):
            if pc + s16(pc + 1) == target:
                hits.append({'at': hex(pc), 'form': 'cd', 'extra': hex(u16(pc + 3))})
        elif b == 0xDD and i + 6 < len(image):
            if pc + s32(pc + 1) == target:
                hits.append({'at': hex(pc), 'form': 'dd', 'extra': hex(u16(pc + 5))})
    return hits

TABLE = 0x6062555c
rows = []
for uid in range(0x8D0):
    key = u16(TABLE + uid * 4)
    index = u16(TABLE + uid * 4 + 2)
    if key in (0x5962, 0x99A1, 0x88B2):
        rows.append({'ui': uid, 'key': hex(key), 'index': index, 'at': hex(TABLE + uid * 4)})

report = {
    'callers_6041931e': callers(0x6041931e),
    'callers_60419312': callers(0x60419312),
    'callers_60419696': callers(0x60419696),
    'callers_60419446': callers(0x60419446),
    'uiRows': rows,
}
Path('work/out/ui-index-q1.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('callers', len(report['callers_6041931e']), 'rows', len(rows))
for row in rows:
    print(row['ui'], row['key'], row['index'])
