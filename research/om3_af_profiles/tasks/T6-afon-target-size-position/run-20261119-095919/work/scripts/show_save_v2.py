# Summarise the save-v2 completion record. Do not edit after it runs.
import json
from pathlib import Path

row = None
for line in Path('work/out/save-v2.jsonl').read_text(encoding='utf-8').splitlines():
    rec = json.loads(line)
    if rec.get('id') == 'save-v2-completion':
        row = rec
        break
if row is None:
    raise SystemExit('no completion')
actual = row['actual']
added = actual['added']
events = actual['events']
print('problems', row['problems'][:8], 'count', len(row['problems']))
print('added', len(added))
stores = {}
for rec in added:
    stores[rec['store']] = stores.get(rec['store'], 0) + 1
print('added stores', stores)
print('added sample', added[:6])
print('events', len(events), 'pending', actual['pending'], 'screen', actual['screen'])
status = {}
when = {}
evstores = {}
for ev in events:
    status[ev.get('status')] = status.get(ev.get('status'), 0) + 1
    when[ev.get('when')] = when.get(ev.get('when'), 0) + 1
    evstores[ev.get('store')] = evstores.get(ev.get('store'), 0) + 1
print('status', status)
print('when', when)
print('event stores', evstores)
print('event0', events[0] if events else None)
print('event1', events[1] if len(events) > 1 else None)
nv = json.loads(Path('work/out/nvram-save-v2.json').read_text(encoding='utf-8'))
print('nv keys', sorted(nv))
for name in ('M', 'E'):
    raw = nv.get(name)
    print(name, 'present', raw is not None, 'b64', len(raw) if isinstance(raw, str) else None)
