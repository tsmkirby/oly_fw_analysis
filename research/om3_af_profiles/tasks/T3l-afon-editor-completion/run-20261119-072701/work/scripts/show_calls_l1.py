# Which calls in the retained stock size-ok trace are absent from opening it.
# Read-only. Do not edit after it has run.
import json
from pathlib import Path

path = Path('ref/tasks/T3b-afon-target-editor/run-20261119-063452/work/out/stock-gaps-f2.jsonl')
want = {'c1-right', 'size-ok', 'cancel-menu', 'open-up'}
rows = {}
for line in path.read_text(encoding='utf-8').splitlines():
    if not line:
        continue
    row = json.loads(line)
    if row.get('step') in want and row.get('calls'):
        rows[row['step']] = set(row['calls'])
        print(row['step'], 'calls', len(row['calls']), 'screen', row.get('screen'), 'state', row.get('stateName'))
STATE = '0x61293070'
for name, calls in rows.items():
    print(name, 'state-log', STATE in calls)
if 'size-ok' in rows and 'c1-right' in rows:
    only = sorted(rows['size-ok'] - rows['c1-right'])
    print('size-ok only', len(only))
    print('\n'.join(only[:80]))
