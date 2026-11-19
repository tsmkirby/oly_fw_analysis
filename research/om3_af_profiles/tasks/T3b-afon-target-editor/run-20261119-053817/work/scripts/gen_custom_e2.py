# Build custom_e2.mjs from the already-run route_e1.mjs. This generator is not an emulator session.
from pathlib import Path
src = Path('work/scripts/route_e1.mjs').read_text(encoding='utf-8')
src = src.replace('route_e1', 'custom_e2')
src = src.replace('route-e1', 'custom-e2')
old = """  dial('sub', 1);
  shot('afon-sub');
  press('ok');
  shot('afon-ok');
  writeByte(MODE, 0);
  press('up');
  shot('half-open');
  dial('main', 1);
  shot('half-dial');
  press('right');
  shot('half-right');
  press('ok');
  shot('half-ok');
"""
new = """  press('info');
  shot('c1-info');
  press('right');
  shot('c1-info-right');
  press('up');
  shot('c1-info-up');
  press('menu');
  shot('c1-menu');
"""
if old not in src:
    raise SystemExit('tail not found')
src = src.replace(old, new, 1)
src = src.replace(
    'Same hook as route e1, probing whether INFO resizes a custom target. ',
    '',
)
Path('work/scripts/custom_e2.mjs').write_text(
    '// Same combined hook as route_e1. Probe: on C1, INFO then arrows, then MENU.\\n'
    + src.split('\\n', 1)[1] if False else src,
    encoding='utf-8',
)
print('wrote', len(src))
