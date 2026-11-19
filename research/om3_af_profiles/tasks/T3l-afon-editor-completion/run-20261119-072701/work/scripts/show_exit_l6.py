# Pull the exit records this run established. Do not edit after it has run.
import json
from pathlib import Path

want = {'ok-exit', 'menu-exit', 's1-exit', 'size-ok', 'size-compare', 'c2-ok', 'c2-compare', 'play-exit', 'play-recover-s1'}
files = [
    Path('work/out/exit-l4.jsonl'),
    Path('work/out/exit-l6.jsonl'),
]
for path in files:
    print('FILE', path)
    for line in path.read_text(encoding='utf-8').splitlines():
        row = json.loads(line)
        if row.get('id') not in want or row.get('session') not in {'candidate', 'c1', 'c2'}:
            continue
        exits = row.get('exits') or []
        last = exits[-1] if exits else None
        mirror = row.get('mirror') or {}
        bits = {k: mirror.get(k) for k in ('k1dd1', 'k1de1', 'k1df1', 'k5a11') if k in mirror}
        print(path.name, row.get('session'), row['id'], 'pass', row.get('pass'), 'screen', row.get('screen'), 'state', row.get('state'), 'flag', row.get('flag'), 'zone', row.get('zone'), 'snap', row.get('engageSnap'), 'last', last and last.get('why'), 'mirror', bits)
