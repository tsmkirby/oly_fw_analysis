# Print route-f2 step summaries. Do not edit after it has run.
import json
from pathlib import Path
for line in Path('work/out/route-f2.jsonl').read_text(encoding='utf-8').splitlines():
    if not line:
        continue
    row = json.loads(line)
    prof = row.get('prof') or {}
    print(row.get('step'), row.get('pass'), row.get('problems'), row.get('screen'), 'flag', row.get('flag'),
          'zone', row.get('zone'), 'title', row.get('title'),
          'k1dd1', (prof.get('k1dd1') if isinstance(prof, dict) else None))
