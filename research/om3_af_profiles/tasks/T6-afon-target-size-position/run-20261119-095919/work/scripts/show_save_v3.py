# Summarise save-v3 completion and persisted cells. Do not edit after it runs.
import json
from pathlib import Path

comp = pers = None
for line in Path('work/out/save-v3.jsonl').read_text(encoding='utf-8').splitlines():
    rec = json.loads(line)
    if rec.get('id') == 'save-v3-completion':
        comp = rec
    if rec.get('id') == 'save-v3-persisted':
        pers = rec
print('completion', comp['pass'], comp['problems'])
print('log', comp['actual']['log'])
print('events', json.dumps(comp['actual']['events']))
print('persisted', pers['pass'], pers['problems'])
cells = pers['actual']['cells']
for key, value in cells.items():
    if key == 'mirror':
        print('mirror', bytes(value).hex(), 'allff', all(b == 255 for b in value))
    else:
        print(key, value)
print('mirrorMatch', pers['actual']['mirrorMatch'], 'loaded', pers['actual']['loaded'])
print('bytes', pers['actual']['mBytes'], pers['actual']['eBytes'])
