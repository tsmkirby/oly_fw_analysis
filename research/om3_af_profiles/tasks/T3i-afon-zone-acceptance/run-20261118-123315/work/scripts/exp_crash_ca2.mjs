// C-a on the inline interpreter. H unchanged, nine Rights, then Menu.
// setExecTrace records instructions that reach step(); inline forms do not, and
// the interpreter mode is not forced. A host crash still leaves the last PC.
// Usage: node26 work/scripts/exp_crash_ca2.mjs om-emu work/out/crash-ca2.jsonl
import { openSync, writeSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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
  ctx.shot('page');
  ctx.takeFaces();
  ctx.press('down');
  ctx.takeFaces();
  ctx.press('down');
  const row = ctx.shot('down-2');
  ctx.emit('observe', { step: 'down-2', texts: row.texts, highlight: row.highlight, file: row.file, faces: ctx.takeFaces().slice(0, 12) });
  ctx.press('ok');
  const opened = ctx.shot('open');
  ctx.emit('observe', { step: 'open', texts: opened.texts, file: opened.file, faces: ctx.takeFaces().slice(0, 16), profile: ctx.readByte(ctx.PROFILE) });
}

await runZone({
  checkout,
  outPath,
  tag: 'crash-ca2',
  candidate: true,
  help: false,
  rowLabel: false,
  explanation: 'C-a inline. H unchanged. Nine Rights to C4, then Menu, without forcing the helper interpreter.',
  change: 'no change against H',
  async drive(ctx) {
    openChooser(ctx);
    for (let i = 0; i < 9; i++) {
      ctx.press('right');
      const view = ctx.shot('nav-' + i);
      ctx.emit('observe', { step: 'nav-' + i, texts: view.texts, file: view.file, faces: ctx.takeFaces().slice(0, 12), profile: ctx.readByte(ctx.PROFILE) });
    }
    const { setExecTrace } = await import(pathToFileURL(resolve(checkout, 'emu/src/core/cpu.mjs')).href);
    const fd = openSync(resolve('work/out/crash-ca2-pc.bin'), 'w');
    const buf = Buffer.alloc(8);
    let n = 0;
    let last = 0;
    setExecTrace((pc) => {
      last = pc >>> 0;
      n += 1;
      if ((n & 255) === 0) {
        buf.writeUInt32LE(last, 0);
        buf.writeUInt32LE(n >>> 0, 4);
        writeSync(fd, buf, 0, 8, 0);
      }
    });
    ctx.emit('observe', { step: 'before-menu', profile: ctx.readByte(ctx.PROFILE), note: 'Menu from C4, inline interpreter, exec trace on step() only' });
    try {
      ctx.press('menu');
    } finally {
      buf.writeUInt32LE(last >>> 0, 0);
      buf.writeUInt32LE(n >>> 0, 4);
      try { writeSync(fd, buf, 0, 8, 0); } catch { /* process dying */ }
      setExecTrace(null);
      try { closeSync(fd); } catch { /* already closed */ }
      ctx.emit('observe', { step: 'trace-end', lastPc: ctx.hex(last), traced: n });
    }
    const back = ctx.shot('cancel');
    ctx.emit('observe', {
      step: 'cancel', texts: back.texts, highlight: back.highlight, file: back.file,
      profile: ctx.readByte(ctx.PROFILE), cached: ctx.readByte(ctx.PROFILE_CACHED),
    });
  },
});
