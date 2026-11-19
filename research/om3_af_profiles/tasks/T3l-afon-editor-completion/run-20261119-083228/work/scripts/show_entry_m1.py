# Compact fields from entry-m1.jsonl. Do not edit after it has run.
import json
from pathlib import Path

want = {'k99a1', 'k1dd1', 'k5962', 'k5a11', 'k9a41', 'k1df1', 'k88b2'}
for line in Path('work/out/entry-m1.jsonl').read_text(encoding='utf-8').splitlines():
    if not line.strip():
        continue
    row = json.loads(line)
    mirror = {k: row.get('mirror', {}).get(k) for k in sorted(want) if isinstance(row.get('mirror'), dict)}
    half = {}
    if isinstance(row.get('half'), dict):
        half = {
            'k99a1': row['half'].get('k99a1'),
            'k1dd1': row['half'].get('k1dd1'),
            'k5962': row['half'].get('k5962'),
            'k1df1': row['half'].get('k1df1'),
            'k5a11': row['half'].get('k5a11'),
        }
    print(json.dumps({
        'id': row.get('id'),
        'pass': row.get('pass'),
        'problems': row.get('problems'),
        'screen': row.get('screen'),
        'flag': row.get('flag'),
        'zone': row.get('zone'),
        'title': row.get('title'),
        'highlight': row.get('highlight'),
        'texts': row.get('texts'),
        'subject': row.get('subject'),
        'mirror': mirror or None,
        'half': half or None,
        'seq': row.get('seq'),
        'exits': row.get('exits'),
        'error': (row.get('error') or '')[:500],
    }, separators=(',', ':')))
