# profile-dial fields from entry-m2. Do not edit after it has run.
import json
from pathlib import Path

rows = [json.loads(line) for line in Path('work/out/entry-m2.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()]
by = {row['id']: row for row in rows}
opened = by.get('profile-open')
dialed = by.get('profile-dial')
keys = ['k99a1', 'k1dd1', 'k5962', 'k88b2', 'k90d1', 'k5a11', 'k9a41', 'k1df1', 'k1de1', 'k84d1']
diff = []
if opened and dialed:
    for key in keys:
        a = opened['mirror'][key]
        b = dialed['mirror'][key]
        for i, (x, y) in enumerate(zip(a, b)):
            if x != y:
                diff.append([key, i, x, y])
print(json.dumps({
    'openZone': opened and opened.get('zone'),
    'dialZone': dialed and dialed.get('zone'),
    'dialTitle': dialed and dialed.get('title'),
    'openTitle': opened and opened.get('title'),
    'diff': diff,
    'seq': dialed and dialed.get('seq'),
    'error': (by.get('profile-stopped') or {}).get('error', '')[:800],
}, indent=2))
