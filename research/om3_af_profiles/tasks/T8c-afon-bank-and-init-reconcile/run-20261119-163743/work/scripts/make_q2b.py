from pathlib import Path
src = Path('work/scripts/observe_q2.mjs').read_text(encoding='utf-8')
src = src.replace('work/out/q2.jsonl', 'work/out/q2b.jsonl')
src = src.replace('work/out/q2-summary.json', 'work/out/q2b-summary.json')
src = src.replace("q2-' + String", "q2b-' + String")
src = src.replace('observe_q2.mjs', 'observe_q2b.mjs')
old = """  if (s.screen() !== 'menu') press('menu');
  let found = null;
  const dirs = ['left', 'right'];
  for (const dir of dirs) {
    for (let i = 0; i < 24 && timeLeft() && !found; i++) {
      const view = viewOf();
      log({ step: 'tab-' + dir + '-' + i, screen: view.screen, texts: (view.texts || []).slice(0, 12), highlight: view.highlight, title: view.title });
      if ((view.highlight || '').includes('Reset/Initialize Settings')) { found = view; break; }
      if ((view.texts || []).some((t) => t.includes('Reset/Initialize Settings'))) {
        for (let d = 0; d < 8 && timeLeft(); d++) {
          const cur = viewOf();
          if ((cur.highlight || '').includes('Reset/Initialize Settings')) { found = cur; break; }
          press('down');
        }
        if (found) break;
      }
      press(dir);
    }
    if (found) break;
  }
  if (!found) throw new Error('reset row not found');
"""
new = """  if (s.screen() !== 'menu') press('menu');
  const opened = viewOf();
  log({ step: 'menu-open', screen: opened.screen, texts: opened.texts, highlight: opened.highlight, title: opened.title, subject: assertSubject('menu-open') });
  if (!(opened.highlight || '').includes('Card Formatting') || !(opened.texts || []).some((t) => t.includes('Card/Folder/File'))) {
    throw new Error('menu did not open on tab 6 page 1');
  }
  let found = null;
  for (let i = 0; i < 6 && timeLeft(); i++) {
    press('right');
    const view = viewOf();
    log({ step: 'page-right-' + (i + 1), screen: view.screen, texts: view.texts, highlight: view.highlight, title: view.title, subject: assertSubject('page-right-' + (i + 1)) });
    if ((view.highlight || '').includes('Reset/Initialize Settings')) { found = view; break; }
    if ((view.texts || []).some((t) => t.includes('Reset/Initialize Settings'))) {
      for (let d = 0; d < 8 && timeLeft(); d++) {
        const cur = viewOf();
        if ((cur.highlight || '').includes('Reset/Initialize Settings')) { found = cur; break; }
        press('down');
      }
      if ((viewOf().highlight || '').includes('Reset/Initialize Settings')) { found = viewOf(); break; }
    }
  }
  if (!found) throw new Error('reset row not found');
"""
if old not in src:
    raise SystemExit('nav block not found')
src = src.replace(old, new, 1)
src = src.replace('T8c Q2.', 'T8c Q2b.', 1)
Path('work/scripts/observe_q2b.mjs').write_text(src, encoding='utf-8')
print('wrote', len(src))
