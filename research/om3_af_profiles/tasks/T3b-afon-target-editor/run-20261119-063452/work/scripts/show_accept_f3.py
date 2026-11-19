# Diff accept-f3 cell snapshots. Do not edit after it has run.
import json
from pathlib import Path
rows = [json.loads(line) for line in Path('work/out/accept-f3.jsonl').read_text(encoding='utf-8').splitlines() if line]
by = {(r.get('session'), r.get('id')): r for r in rows}
def flat(cells):
    out = {}
    if not isinstance(cells, dict):
        return out
    for key, val in cells.items():
        if isinstance(val, list):
            for i, item in enumerate(val):
                out[f'{key}[{i}]'] = item
        else:
            out[key] = val
    return out
def show(a, b, label):
    fa, fb = flat(a), flat(b)
    keys = sorted(set(fa) | set(fb))
    diffs = [(k, fa.get(k), fb.get(k)) for k in keys if fa.get(k) != fb.get(k)]
    print(label, 'diffs', len(diffs))
    for item in diffs:
        print(' ', item)
left = by[('control', 'p-dial')]['half']
right = by[('c1', 'h1-dial')]['half']
show(left, right, 'control p-dial half vs c1 h1-dial half')
show(by[('c1', 'h1-up')]['half'], by[('c1', 'h1-dial')]['half'], 'c1 h1-up half vs h1-dial half')
show(by[('control', 'p-up')]['half'], by[('control', 'p-dial')]['half'], 'control p-up half vs p-dial half')
print('c1 h1-dial title', by[('c1', 'h1-dial')].get('title'))
print('control p-dial title', by[('control', 'p-dial')].get('title'))
print('c1 h1-dial zone', by[('c1', 'h1-dial')].get('zone'), 'prof zone', by[('c1', 'h1-dial')]['prof']['k99a1'])
print('c1 p-dial zone', by[('c1', 'p-dial')].get('zone'), 'prof', by[('c1', 'p-dial')]['prof']['k99a1'], 'half', by[('c1', 'p-dial')]['half']['k99a1'])
print('save control', {k: by[('control', 'save')].get(k) for k in ('pass', 'savesBefore', 'savesAfterMenu', 'savesAfterPower', 'storeChanged', 'powerNull', 'powerError', 'bootSaves')})
