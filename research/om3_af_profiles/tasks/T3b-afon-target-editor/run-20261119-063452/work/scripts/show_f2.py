# Print the stock-gaps-f2 rows needed to route the size editor. Do not edit after it has run.
import json
from pathlib import Path

rows = [json.loads(line) for line in Path('work/out/stock-gaps-f2.jsonl').read_text(encoding='utf-8').splitlines() if line]
want = {'open-up', 'cancel-menu', 'dial-single', 'custom-direct-hold', 'c1-right', 'size-ok', 'size-dial-v', 'size-dial-h', 'done'}
for row in rows:
    if row.get('step') not in want:
        continue
    title = row.get('title') or {}
    print(row['step'], 'screen', row.get('screen'), 'zone', row.get('zone'),
          'calls', row.get('callCount'), 'capped', row.get('callCapped'),
          'title', title.get('sha256'), 'box', title.get('w'), title.get('h'), title.get('x0'), title.get('x1'), title.get('y1'))
    for item in row.get('sets') or []:
        print('  set', json.dumps(item))
    if row.get('step') == 'done':
        print('done', row.get('ok'), row.get('error'))
