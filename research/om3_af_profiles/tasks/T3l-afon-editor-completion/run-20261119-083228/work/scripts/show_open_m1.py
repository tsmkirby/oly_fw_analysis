# Full mirror of entry-m1 profile-open. Do not edit after it has run.
import json
from pathlib import Path

for line in Path('work/out/entry-m1.jsonl').read_text(encoding='utf-8').splitlines():
    row = json.loads(line)
    if row.get('id') != 'profile-open':
        continue
    print(json.dumps({'mirror': row.get('mirror'), 'half': row.get('half'), 'title': row.get('title'), 'zone': row.get('zone'), 'flag': row.get('flag')}, indent=2))
