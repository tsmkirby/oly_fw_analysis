# Zone byte and position at the accept-f3 stop. Do not edit after it has run.
import json
from pathlib import Path
rows = [json.loads(line) for line in Path('work/out/accept-f3.jsonl').read_text(encoding='utf-8').splitlines() if line]
want = {
    ('control', 'p-up'), ('control', 'p-dial'), ('control', 'p-right'), ('control', 'p-menu'),
    ('c1', 'p-right'), ('c1', 'p-menu'), ('c1', 'p-shoot'), ('c1', 'h1-mark'), ('c1', 'h1-up'), ('c1', 'h1-dial'),
}
for row in rows:
    key = (row.get('session'), row.get('id'))
    if key not in want:
        continue
    half = row.get('half') or {}
    prof = row.get('prof') or {}
    print(key, 'flag', row.get('flag'), 'zoneByte', row.get('profileByte'),
          'half99', half.get('k99a1'), 'half5962', half.get('k5962'), 'half88', half.get('k88b2'),
          'prof99', prof.get('k99a1'), 'prof5962', prof.get('k5962'), 'title', (row.get('title') or '')[:12])
