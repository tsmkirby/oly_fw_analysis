# Build the page-27 acceptance table from T3j's literals.
# Chooser help text is a separate field. The page header is not that sentence.
import json
from pathlib import Path

ROOT = Path('.')
src = json.loads((ROOT / 'ref/tasks/T3j-afon-acceptance-assertions/run-20261118-132500/work/scripts/accept_table_j1.json').read_text(encoding='utf-8'))
by = {step['id']: step for step in src}
ids = ['baseline', 'menu']
ids += [f'left-{i}' for i in range(20)]
ids += ['down-caf', 'down-afbutton', 'page27', '2154-open', '2154-cancel', 'down-2155', '2155-open', '2155-cancel']
ids += ['zone-row', 'zone-open']
ids += [f'zone-right-{n}' for n in range(1, 10)]
ids += ['zone-cancel-c4', 'zone-reopen', 'commit2-right-1', 'commit2-right-2', 'commit-2', 'reopen-2']
ids += [f'commit9-right-{n}' for n in range(3, 10)]
ids += ['commit-9']
HELP = {
    'Choose the AF target area.',
    'When a specified subject is detected at\r\nthe selected AF target position, AF is\r\nperformed on the detected subject.',
}
out = []
for step_id in ids:
    if step_id not in by:
        raise SystemExit('missing ' + step_id)
    step = json.loads(json.dumps(by[step_id]))
    title = step['expect']['title']
    if title in HELP:
        step['expect']['helpText'] = title
        step['expect']['title'] = 'glyph-header'
    else:
        step['expect']['helpText'] = None
    out.append(step)
dest = ROOT / 'work/scripts/accept_table_k1.json'
dest.write_text(json.dumps(out, indent=2) + '\n', encoding='utf-8')
print('steps', len(out), 'shared', sum(1 for s in out if s['shared']))
