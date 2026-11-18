// C-b. H plus the ten-record help list. Same keys as C-a: nine Rights to C4, then Menu.
// Usage: node26 work/scripts/exp_crash_cb.mjs om-emu work/out/crash-cb.jsonl
import { runZone } from './zone_session_i1.mjs';

const [checkout, outPath] = process.argv.slice(2);

function openChooser(ctx) {
  ctx.press('menu');
  let menuRow = null;
  const seen = new Set();
  for (let n = 0; n < 24 && !menuRow; n++) {
    const view = ctx.shot('tab-' + n);
    ctx.emit('observe', { step: 'tab-' + n, texts: view.texts, highlight: view.highlight, file: view.file });
    ctx.takeFaces();
    menuRow = view.texts.find((t) => t.endsWith('AF Button'));
    if (menuRow) break;
    const sig = view.texts.join('\n');
    if (seen.has(sig)) break;
    seen.add(sig);
    ctx.press('left');
  }
  if (!menuRow) throw new Error('AF Button tab not found');
  ctx.walk.to([{ row: [menuRow] }]);
  ctx.idle(200);
  const page = ctx.shot('page');
  ctx.emit('observe', { step: 'page', texts: page.texts, highlight: page.highlight, file: page.file });
  ctx.takeFaces();
  ctx.press('down');
  ctx.shot('down-1');
  ctx.takeFaces();
  ctx.press('down');
  const row = ctx.shot('down-2');
  ctx.emit('observe', { step: 'down-2', texts: row.texts, highlight: row.highlight, file: row.file, faces: ctx.takeFaces().slice(0, 20) });
  ctx.press('ok');
  const opened = ctx.shot('open');
  ctx.emit('observe', { step: 'open', texts: opened.texts, highlight: opened.highlight, file: opened.file, faces: ctx.takeFaces().slice(0, 30), cells: ctx.cells() });
}

await runZone({
  checkout,
  outPath,
  tag: 'crash-cb',
  candidate: true,
  help: true,
  rowLabel: false,
  explanation: 'C-b. One combined change against H: a ten-record help list at 0x6031ea6c, each record kind 4 text 0x1a8, and the private face record +0x10 pointed at it. Same keys as C-a.',
  change: 'combined one change, EMULATOR-ONLY behaviour: help list 0x6031ea6c and face +0x10',
  async drive(ctx) {
    openChooser(ctx);
    for (let i = 0; i < 9; i++) {
      ctx.press('right');
      const view = ctx.shot('nav-' + i);
      ctx.emit('observe', {
        step: 'nav-' + i,
        texts: view.texts,
        highlight: view.highlight,
        file: view.file,
        faces: ctx.takeFaces().slice(0, 20),
        profile: ctx.readByte(ctx.PROFILE),
      });
    }
    ctx.emit('observe', { step: 'before-menu', profile: ctx.readByte(ctx.PROFILE), note: 'about to press Menu from C4 on the inline interpreter, no exec trace' });
    ctx.press('menu');
    const back = ctx.shot('cancel');
    ctx.emit('observe', {
      step: 'cancel',
      texts: back.texts,
      highlight: back.highlight,
      file: back.file,
      profile: ctx.readByte(ctx.PROFILE),
      cached: ctx.readByte(ctx.PROFILE_CACHED),
      faces: ctx.takeFaces().slice(0, 20),
    });
  },
});
