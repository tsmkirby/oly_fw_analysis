# Compact read of trace-l1.jsonl. Does not change the trace. Do not edit after it has run.
import json
from pathlib import Path

rows = [json.loads(line) for line in Path('work/out/trace-l1.jsonl').read_text(encoding='utf-8').splitlines() if line]
for row in rows:
    step = row.get('step')
    if step == 'live-pointers':
        for key, info in row['pointers'].items():
            print(f"ptr {key} expect {info['expect']} got {info['pointer']} match {info['match']} err {info['error']}")
            if info['mem'] != info['via']:
                print(f"  mem {info['mem']}")
                print(f"  via {info['via']}")
        continue
    if step in ('imports', 'tab'):
        print(step, {k: row[k] for k in row if k in ('modules', 'i', 'texts')})
        continue
    diff = row.get('diff')
    tail = row.get('callTail') or []
    trans = row.get('transitions') or []
    print(
        f"{step:16} {row.get('screen')} {row.get('state')} from {row.get('from')} "
        f"diff {diff} trans {trans} calls {row.get('callCount')} sets {len(row.get('sets') or [])}"
    )
    if row.get('sets'):
        print('  sets', row['sets'])
    if tail:
        print('  tail', tail[-12:])
    if row.get('note') or row.get('powerError') or row.get('error'):
        print('  note', row.get('note'), row.get('powerError'), row.get('error'))
    if step == 'done':
        print('ok', row.get('ok'))
