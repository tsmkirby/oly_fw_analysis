# Compact summary of the second stock edit. Do not edit after it has run.
import json
from pathlib import Path

rows = [json.loads(line) for line in Path('work/out/stock-edit-m2.jsonl').read_text(encoding='utf-8').splitlines() if line]
for row in rows:
    if row.get('step') in ('setup', 'done'):
        print(row.get('step'), row.get('ok'), row.get('error'))
        continue
    cells = row.get('cells') or {}
    print('\n==', row.get('step'), row.get('screen'), 'diff', row.get('diff'))
    print('  99a1', cells.get('k99a1'), '9a41', cells.get('k9a41'), '5962', cells.get('k5962'))
    print('  1dd1', cells.get('k1dd1'), '84d1', cells.get('k84d1'), '88b2', cells.get('k88b2'))
    print('  90d1', cells.get('k90d1'), '9fa1', cells.get('k9fa1'), '99d2', cells.get('k99d2'))
    sets = row.get('sets') or []
    mapped = row.get('mapped') or []
    wraps = row.get('wraps') or []
    print('  sets', len(sets), 'mapped', len(mapped), 'wraps', len(wraps))
    for s in sets:
        print('   set', {k: s[k] for k in ('d0', 'd1', 'd2', 'd3', 'caller')})
    callers = sorted({w['caller'] for w in wraps})
    print('   wrap callers', callers[:12], 'n', len(callers))
    mcallers = sorted({m['caller'] for m in mapped})
    print('   mapped callers', mcallers[:12])
    if mapped[:3]:
        print('   mapped sample', [{k: m[k] for k in ('d0', 'd1', 'd2', 'caller')} for m in mapped[:4]])
