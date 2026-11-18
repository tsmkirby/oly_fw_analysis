// One change against H plus the help list: row kind 4, label 0x0DD2,
// primary list 0x6158ba1c count 10, alternate 0.
// Usage: node26 work/scripts/exp_label_i1.mjs om-emu work/out/label-i1.jsonl
import { runZone } from './zone_session_i1.mjs';

const [checkout, outPath] = process.argv.slice(2);
const GLYPH = '0x6120408f';
const HELP = '0x611f843e';
const SLOT = '0x611f83b1';

await runZone({
  checkout,
  outPath,
  tag: 'label-i1',
  candidate: true,
  help: true,
  rowLabel: true,
  explanation: 'Starting from H plus the ten-record help list. The one change is the row: kind 4, label 0x0DD2, primary 0x6158ba1c count 10, alternate 0.',
  change: 'one change, EMULATOR-ONLY behaviour: row kind 4 label 0x0DD2. The help list is the previous change, not a new one.',
  async drive(ctx) {
    const note = (step) => {
      const view = ctx.shot(step);
      const faces = ctx.takeFaces().filter((f) => f.caller === GLYPH || f.caller === HELP || f.caller === SLOT);
      const rec = {
        step, texts: view.texts, highlight: view.highlight, file: view.file, faces,
        profile: ctx.readByte(ctx.PROFILE), cached: ctx.readByte(ctx.PROFILE_CACHED),
      };
      ctx.emit('observe', rec);
      return rec;
    };
    ctx.press('menu');
    note('menu');
    for (let i = 0; i < 20; i++) { ctx.press('left'); note('left-' + i); }
    ctx.press('down'); note('down-caf');
    ctx.press('down'); note('down-afbutton');
    ctx.press('ok'); note('page27');
    ctx.press('down'); note('down-2155');
    ctx.press('down'); note('down-zone');
    ctx.press('ok'); note('chooser-open');
    ctx.press('right'); note('right-0');
    ctx.press('right'); note('right-1');
    ctx.press('ok'); note('commit');
    ctx.press('ok'); note('reopen');
    ctx.press('menu'); note('cancel');
  },
});
