# Print the baseline cell mismatch from save-v1. Do not edit after it runs.
import json
from pathlib import Path

row = None
for line in Path('work/out/save-v1.jsonl').read_text(encoding='utf-8').splitlines():
    rec = json.loads(line)
    if rec.get('id') == 'baseline':
        row = rec
        break
if row is None:
    raise SystemExit('no baseline')
exp = row['expected']['cells']
act = row['actual']['cells']

def walk(a, b, path):
    if isinstance(a, dict) or isinstance(b, dict):
        keys = list(dict.fromkeys([*(a or {}), *(b or {})]))
        for key in keys:
            walk((a or {}).get(key), (b or {}).get(key), path + [str(key)])
        return
    if a != b:
        print(path, 'expected', a, 'actual', b)

walk(exp, act, [])
print('problems', row['problems'])
print('title', row['actual']['title'], 'screen', row['actual']['screen'], 'profile', row['actual']['profile'])
