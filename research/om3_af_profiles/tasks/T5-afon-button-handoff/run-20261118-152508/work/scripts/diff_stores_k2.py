# Candidate store against a stock session that opened page 27.
import base64
import json
from pathlib import Path

def load(name):
    doc = json.loads(Path(name).read_text(encoding='utf-8'))
    return {k: base64.b64decode(doc[k]) for k in ('M', 'E')}

control = load('work/out/nvram-accept-store-control.json')
c1 = load('work/out/nvram-accept3-c1.json')
for bank in ('M', 'E'):
    a, b = control[bank], c1[bank]
    diffs = [i for i in range(len(a)) if a[i] != b[i]]
    print(bank, 'diffs', len(diffs))
    if not diffs:
        continue
    runs = []
    start = prev = diffs[0]
    for i in diffs[1:]:
        if i == prev + 1:
            prev = i
            continue
        runs.append((start, prev))
        start = prev = i
    runs.append((start, prev))
    for s, e in runs:
        print(f'  {s:06x}-{e:06x} control {a[s:e+1].hex()} candidate {b[s:e+1].hex()}')
