# Summarise the l4 exit records. Do not edit after it has run.
import json
from pathlib import Path

want = {'ok-exit', 'menu-exit', 's1-exit', 'size-ok', 'size-compare'}
for line in Path('work/out/exit-l4.jsonl').read_text(encoding='utf-8').splitlines():
    row = json.loads(line)
    if row.get('id') not in want:
        continue
    print(row['id'], 'flag', row.get('flag'), 'zone', row.get('zone'), 'snap', row.get('engageSnap'), 'screen', row.get('screen'))
    for item in row.get('exits') or []:
        print('  exit', item.get('why'), 'restore', item.get('restore'), 'zoneBefore', item.get('zone'))
    sets = [s for s in (row.get('seq') or []) if s[0] == 'set' and s[1] in (0x1dd1, 0x1de1, 0x1df1, 0x99a1)]
    states = [s for s in (row.get('seq') or []) if s[0] == 'state' and (s[1] in (0x900d, 0x900e, 0x900b, 0x972b))]
    print('  size sets', sets[-12:])
    print('  exit states', states[-6:])
