// One stock session. Log the highlight after each key from page 27 back
// through pages 26 and 25 and back to page 27. No behaviour change.
// Usage: node26 work/scripts/exp_tabpath_i1.mjs om-emu work/out/tabpath-i1.jsonl
import { runZone } from './zone_session_i1.mjs';

const [checkout, outPath] = process.argv.slice(2);

await runZone({
  checkout,
  outPath,
  tag: 'tabpath-i1',
  candidate: false,
  explanation: 'Stock path from page 27 to the Release Priority row, the half-press row, and back to AF Button. Observation only.',
  change: 'none',
  async drive(ctx) {
    const note = (step) => {
      const view = ctx.screen();
      ctx.emit('observe', { step, texts: view.texts, highlight: view.highlight });
      ctx.takeFaces();
      return view;
    };
    ctx.press('menu');
    for (let i = 0; i < 20; i++) ctx.press('left');
    ctx.press('down');
    ctx.press('down');
    ctx.press('ok');
    note('page27');
    ctx.press('ok');
    note('2154-open');
    ctx.press('menu');
    note('2154-cancel');
    ctx.press('down');
    note('down-2155');
    ctx.press('ok');
    note('2155-open');
    ctx.press('menu');
    note('2155-cancel');
    ctx.press('menu');
    note('leave-27');
    ctx.press('left');
    note('page1-af');
    for (let i = 0; i < 8; i++) {
      const view = note('down26-' + i);
      if (view.highlight === 'Release Priority') break;
      ctx.press('down');
    }
    ctx.press('ok');
    note('page26');
    ctx.press('menu');
    note('back26');
    for (let i = 0; i < 8; i++) {
      const view = note('up25-' + i);
      if (view.highlight && view.highlight.includes('half-pressing')) break;
      ctx.press('up');
    }
    ctx.press('ok');
    note('page25');
    ctx.press('menu');
    note('back25');
    ctx.press('right');
    note('page2-af');
    for (let i = 0; i < 8; i++) {
      const view = note('down27-' + i);
      if (view.highlight && view.highlight.includes('AF Button')) break;
      ctx.press('down');
    }
    ctx.press('ok');
    note('page27-return');
  },
});
