// C-a. Configuration H, unchanged. Nine Rights to C4, then Menu.
// The menu press is traced so a host access violation leaves the last PC on disk.
// Usage: node26 work/scripts/exp_crash_ca.mjs om-emu work/out/crash-ca.jsonl
import { runZone } from './zone_session_i1.mjs';

const [checkout, outPath] = process.argv.slice(2);

function openChooser(ctx) {
  ctx.press('menu');
  let menuRow = null;
  const seen = new Set();
  const tabs = [];
  for (let n = 0; n < 24 && !menuRow; n++) {
    const view = ctx.shot('tab-' + n);
    const faces = ctx.takeFaces();
    ctx.emit('observe', { step: 'tab-' + n, texts: view.texts, highlight: view.highlight, file: view.file, faces: faces.slice(0, 12) });
    menuRow = view.texts.find((t) => t.endsWith('AF Button'));
    tabs.push(view.texts);
    if (menuRow) break;
    const sig = view.texts.join('\n');
    if (seen.has(sig)) break;
    seen.add(sig);
    ctx.press('left');
  }
  if (!menuRow) throw new Error('AF Button tab not found ' + JSON.stringify(tabs.at(-1)));
  ctx.page28State.phase = 'build';
  ctx.walk.to([{ row: [menuRow] }]);
  ctx.page28State.phase = 'off';
  ctx.idle(200);
  const page = ctx.shot('page');
  ctx.emit('observe', { step: 'page', texts: page.texts, highlight: page.highlight, file: page.file, faces: ctx.takeFaces().slice(0, 20) });
  ctx.press('down');
  const mid = ctx.shot('down-1');
  ctx.emit('observe', { step: 'down-1', texts: mid.texts, highlight: mid.highlight, file: mid.file });
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
  tag: 'crash-ca',
  candidate: true,
  help: false,
  rowLabel: false,
  explanation: 'C-a. H unchanged: private face record count 10, faces 0x6158ba1c, help still 0x61576520. Nine Rights reach C4, then Menu.',
  change: 'no change against H',
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
    ctx.emit('observe', { step: 'before-menu', profile: ctx.readByte(ctx.PROFILE), note: 'about to press Menu from C4' });
    ctx.trace('work/out/crash-ca-pc.bin', () => ctx.press('menu'));
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
