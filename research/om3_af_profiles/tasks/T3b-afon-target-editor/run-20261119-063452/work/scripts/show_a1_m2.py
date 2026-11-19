# Print A1 on the cell-setter records for the move and the single dial.
# Do not edit after it has run.
import json
from pathlib import Path

want = {'dial-single', 'move-right-3', 'dial-1', 'confirm-ok'}
for line in Path('work/out/stock-edit-m2.jsonl').read_text(encoding='utf-8').splitlines():
    row = json.loads(line)
    if row.get('step') not in want:
        continue
    print('==', row['step'])
    for s in row.get('sets') or []:
        if s['caller'] == '0x604193c7':
            print('  key', hex(s['d0']), 'index', s['d1'], 'a1', s['a1'], 'd2', s['d2'])
