# Print the baseline half-press cells and the C1 profile from custom-e2.
import json
from pathlib import Path
rows = [json.loads(l) for l in Path('work/out/custom-e2.jsonl').read_text(encoding='utf-8').splitlines()]
for step in ('baseline-mode-off', 'afon-type-3', 'c1-menu'):
    row = next(r for r in rows if r.get('step') == step)
    print('==', step, row.get('screen'))
    print('half', json.dumps(row['half']))
    print('prof', json.dumps(row['prof']))
