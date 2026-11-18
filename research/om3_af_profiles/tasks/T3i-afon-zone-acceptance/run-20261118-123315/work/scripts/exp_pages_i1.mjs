// Log every key of the shared page 27/26/25 path, stock control and final candidate.
// Page 28 is the T3c reference construction, opened the same way in both.
// Usage: node26 work/scripts/exp_pages_i1.mjs om-emu
import { runZone } from './zone_session_i1.mjs';

const [checkout] = process.argv.slice(2);

async function drive(ctx) {
  const note = (step) => {
    const view = ctx.screen();
    ctx.emit('observe', {
      step, texts: view.texts, highlight: view.highlight,
      profile: ctx.readByte(ctx.PROFILE),
    });
    ctx.takeFaces();
    return view;
  };
  ctx.press('menu');
  note('menu');
  for (let i = 0; i < 20; i++) { ctx.press('left'); note('left-' + i); }
  ctx.press('down'); note('down-caf');
  ctx.press('down'); note('down-afbutton');
  ctx.press('ok'); note('page27');
  ctx.press('ok'); note('2154-open');
  ctx.press('menu'); note('2154-cancel');
  ctx.press('down'); note('down-2155');
  ctx.press('ok'); note('2155-open');
  ctx.press('menu'); note('2155-cancel');
  ctx.press('menu'); note('leave-27');
  for (let i = 0; i < 8; i++) {
    const view = note('seek26-' + i);
    if (view.texts.some((t) => t.includes('Release Priority'))) break;
    ctx.press('left');
  }
  ctx.press('ok'); note('page26');
  ctx.press('menu'); note('leave-26');
  for (let i = 0; i < 8; i++) {
    const view = note('seek25-' + i);
    if (view.texts.some((t) => t.includes('half-pressing'))) break;
    ctx.press('left');
  }
  ctx.press('ok'); note('page25');
  ctx.press('menu'); note('leave-25');
  for (let i = 0; i < 8; i++) {
    const view = note('seek27-' + i);
    if (view.texts.some((t) => t.includes('AF Button'))) break;
    ctx.press('right');
  }
  ctx.press('ok'); note('page27-return');
}

const base = { checkout, help: true, rowLabel: true };
await runZone({
  ...base, candidate: false, page28: false, tag: 'pages-control',
  outPath: 'work/out/pages-control.jsonl',
  explanation: 'Stock control. Shared key log for pages 27, 26 and 25. No AF-ON row.',
  change: 'no candidate change',
  drive,
});
await runZone({
  ...base, candidate: true, page28: false, tag: 'pages-candidate',
  outPath: 'work/out/pages-candidate.jsonl',
  explanation: 'Final configuration, shared keys only: H, the help list, and the kind-4 label. No zone commit.',
  change: 'final configuration, shared path',
  drive,
});
await runZone({
  ...base, candidate: false, page28: true, tag: 'page28-control',
  outPath: 'work/out/page28-control.jsonl',
  explanation: 'Stock control. EMULATOR-ONLY reference construction of page 28, same menu keys.',
  change: 'reference construction only',
  async drive(ctx) {
    ctx.page28State.phase = 'build';
    ctx.press('menu');
    for (let i = 0; i < 20; i++) ctx.press('left');
    ctx.press('down'); ctx.press('down'); ctx.press('ok');
    ctx.page28State.phase = 'off';
    ctx.idle(300);
    const view = ctx.shot('open');
    ctx.emit('observe', { step: 'page28', texts: view.texts, highlight: view.highlight, file: view.file, replaced: ctx.page28State.replaced });
  },
});
await runZone({
  ...base, candidate: true, page28: true, tag: 'page28-candidate',
  outPath: 'work/out/page28-candidate.jsonl',
  explanation: 'Final configuration plus the EMULATOR-ONLY reference construction of page 28.',
  change: 'reference construction on the final configuration',
  async drive(ctx) {
    ctx.page28State.phase = 'build';
    ctx.press('menu');
    for (let i = 0; i < 20; i++) ctx.press('left');
    ctx.press('down'); ctx.press('down'); ctx.press('ok');
    ctx.page28State.phase = 'off';
    ctx.idle(300);
    const view = ctx.shot('open');
    ctx.emit('observe', { step: 'page28', texts: view.texts, highlight: view.highlight, file: view.file, replaced: ctx.page28State.replaced });
  },
});
