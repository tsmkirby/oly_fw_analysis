# Where the acceptance M stores differ. The E stores already matched.
import json
from pathlib import Path

def load(name):
    doc = json.loads(Path(name).read_text(encoding='utf-8'))
    return {k: __import__('base64').b64decode(doc[k]) for k in ('M', 'E')}

control = load('work/out/nvram-accept3-control.json')
c1 = load('work/out/nvram-accept3-c1.json')
c2 = load('work/out/nvram-accept3-c2.json')
for label, store in (('c1', c1), ('c2', c2)):
    for bank in ('M', 'E'):
        a, b = control[bank], store[bank]
        diffs = [i for i in range(max(len(a), len(b))) if (a[i:i+1] != b[i:i+1])]
        print(label, bank, 'len', len(a), len(b), 'diffs', len(diffs))
        if diffs:
            runs = []
            start = prev = diffs[0]
            for i in diffs[1:]:
                if i == prev + 1:
                    prev = i
                    continue
                runs.append((start, prev))
                start = prev = i
            runs.append((start, prev))
            print('  runs', len(runs), 'first', [(hex(s), hex(e), a[s:e+1].hex(), b[s:e+1].hex()) for s, e in runs[:12]])
print('c1-c2 M diffs', sum(1 for i in range(len(c1['M'])) if c1['M'][i] != c2['M'][i]))
