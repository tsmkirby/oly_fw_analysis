# Extract the failed n-dial actual from t8v4. Not an experiment.
import json
from pathlib import Path
row = None
for line in Path('work/out/t8v4.jsonl').read_text(encoding='utf-8').splitlines():
    obj = json.loads(line)
    if obj.get('id') == 'k1-n-dial':
        row = obj
        break
if row is None:
    raise SystemExit('missing row')
print(json.dumps({
    'problems': row['problems'],
    'title': row['actual']['title'],
    'screen': row['actual']['screen'],
    'half': row['actual']['half'],
    'status': row['actual']['status'],
    'target': row['actual']['target'],
}, indent=2))
