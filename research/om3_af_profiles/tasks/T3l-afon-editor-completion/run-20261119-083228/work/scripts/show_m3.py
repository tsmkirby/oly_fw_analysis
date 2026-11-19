# Key rows from entry-m3. Do not edit after it has run.
import json
from pathlib import Path

want = {
    'profile-retained', 'profile-c1-diff', 'profile-c2-kept', 'detect-read',
    'profile-normal-dial', 'profile-normal-ok', 'snap-restored', 'profile-open',
}
rows = [json.loads(line) for line in Path('work/out/entry-m3.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()]
for row in rows:
    if row.get('id') not in want:
        continue
    out = {k: row.get(k) for k in (
        'id', 'pass', 'subject', 'highlight', 'offLabel', 'titleText', 'texts', 'highlight',
        'mirrorType', 'halfType', 'mirrorPos', 'halfPos', 'diff', 'c1Diff', 'c2Diff',
        'zoneDuring', 'title', 'zone', 'ninth',
    )}
    if row.get('id') in ('profile-c2-kept', 'profile-c1-diff', 'profile-retained'):
        out['mirror'] = row.get('mirror')
        out['half'] = row.get('half')
    if row.get('id') == 'profile-normal-ok':
        out['half'] = row.get('half')
        out['mirror'] = row.get('mirror')
    print(json.dumps(out))
