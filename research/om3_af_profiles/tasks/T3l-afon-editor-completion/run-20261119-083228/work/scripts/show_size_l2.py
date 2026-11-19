# Print the GUI transitions and setter records of the size-editor measurement.
# Do not edit after it has run.
import json
from pathlib import Path

want = {'c1-right', 'c1-dial', 'c1-sub', 'c1-ok', 'c2-right', 'c2-ok', 'back-menu', 'page-ok', 'menu'}
for line in Path('work/out/measure-size-l2.jsonl').read_text(encoding='utf-8').splitlines():
    row = json.loads(line)
    if row.get('step') not in want or 'transitions' not in row:
        continue
    print(row['step'], 'sets', row.get('sets'), 'trans', row.get('transitions'))
