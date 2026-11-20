# Stage the relocated reader and the sweep copy. One-shot. Do not edit after it runs.
from pathlib import Path

src = Path('ref/tasks/T8c-afon-bank-and-init-reconcile/run-20261119-175921/work/scripts/hook_t8c3.mjs').read_text(encoding='utf-8')
src = src.replace(
    'This copy adds a read log. bank() and initMirror() are the confirmed functions.',
    'Relocated so the factory import resolves from work/scripts. bank() and initMirror() are unchanged.',
)
Path('work/scripts/hook_t8d_read.mjs').write_text(src, encoding='utf-8')
sweep = Path('work/scripts/sweep_t8d1.mjs').read_text(encoding='utf-8')
old = "from '../../ref/tasks/T8c-afon-bank-and-init-reconcile/run-20261119-175921/work/scripts/hook_t8c3.mjs';"
new = "from './hook_t8d_read.mjs';"
if old not in sweep:
    raise SystemExit('import line missing')
sweep = sweep.replace(old, new, 1).replace('sweep-t8d1', 'sweep-t8d2')
Path('work/scripts/sweep_t8d2.mjs').write_text(sweep, encoding='utf-8')
print('staged')
