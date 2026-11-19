// Diagnostic. Records store-log rows after each checkpoint. Not an acceptance run.
// EMULATOR-ONLY. Role: test setup.
// Usage: node26 work/scripts/probe_saves_t8.mjs om-emu
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { headerHash, pageTitle } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/observe_c1.mjs';

const checkout = process.argv[2];
if (checkout !== 'om-emu') {
  process.stderr.write('usage: node26 work/scripts/probe_saves_t8.mjs om-emu\n');
  process.exit(2);
}

const OUT = resolve('work/out/probe-saves-t8.json');
const marks = [];

function saves(ctx) {
  const rows = ctx.l.store_log && ctx.l.store_log.nvram ? ctx.l.store_log.nvram.saves : [];
  return rows.map((rec) => ({ store: rec.store, from: rec.from, posted: !!rec.posted }));
}

function mark(ctx, id) {
  marks.push({ id, n: saves(ctx).length, saves: saves(ctx) });
  writeFileSync(OUT, JSON.stringify({ marks }, null, 2) + '\n');
}

const result = await runZone({
  checkout,
  outPath: 'work/out/session-probe-saves-t8.jsonl',
  tag: 'probe-saves-t8',
  candidate: true,
  help: true,
  rowLabel: true,
  fatalShots: true,
  nvramPath: 'work/out/nvram-probe-saves-t8.json',
  overlayCsv: 'work/out/overlay-combined-t8.csv',
  explanation: 'Diagnostic of which steps write E and M. EMULATOR-ONLY. Role: test setup.',
  change: 'none',
  async drive(ctx) {
    process.env.OM_EMU_MODEL = 'E147';
    const model = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
    ctx.bringUp();
    ctx.s.switch_input('lever', 1);
    ctx.s.camapp.pump();
    ctx.idle(500);
    const { A } = model;
    const api = A(0x50ac4afe);
    const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
    ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
    ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
    ctx.idle(500);
    const pose = attachPose(ctx.l);
    pose.setPose('landscape');
    pose.deliver();
    ctx.idle(600);
    const setter = ctx.native(0x60063431);
    ctx.l.call(setter, { d0: 0x1db1, d1: 0, a1: 1 }, null, null, 200000);
    ctx.l.call(setter, { d0: 0x1dc1, d1: 0, a1: 1 }, null, null, 200000);
    mark(ctx, 'after-setup');
    ctx.press('up');
    mark(ctx, 'after-zone-up');
    ctx.press('ok');
    mark(ctx, 'after-zone-ok');
    ctx.press('up');
    ctx.s.dial_input('main', 1);
    ctx.s.camapp.pump();
    ctx.idle(500);
    ctx.press('ok');
    mark(ctx, 'after-normal-edit');
    pose.setPose('exif6');
    pose.deliver();
    ctx.idle(600);
    mark(ctx, 'after-pose');
    ctx.press('menu');
    let view = ctx.shot('p-open');
    const onTab = (v) => pageTitle(v.texts) === '2.AF' && String(v.highlight || '').includes('Subject Detection')
      && headerHash(v.file) === 'bb086a5b20fe141fc7db882c015fb47fa34bccd9d86ab709799ef8bb8324225c';
    for (let i = 0; i < 24 && !onTab(view); i++) {
      ctx.press('left');
      view = ctx.shot('p-seek-' + i);
    }
    mark(ctx, 'after-tab');
    for (let i = 0; i < 8 && !String(view.highlight || '').includes('AF Button'); i++) {
      ctx.press('down');
      view = ctx.shot('p-af-' + i);
    }
    ctx.press('ok');
    view = ctx.shot('p-af-open');
    const modeRow = (h) => String(h || '').includes('AF Target Mode') && !String(h || '').includes('Settings');
    for (let i = 0; i < 6 && !modeRow(view.highlight); i++) {
      if (String(pageTitle(view.texts) || '').includes('AF Button')) {
        ctx.press('ok');
        ctx.press('menu');
        view = ctx.shot('p-cancel-' + i);
        if (modeRow(view.highlight)) break;
        ctx.press('down');
        view = ctx.shot('p-row-' + i);
      } else {
        ctx.press('down');
        view = ctx.shot('p-row-' + i);
      }
    }
    mark(ctx, 'before-commit highlight ' + view.highlight);
    ctx.press('ok');
    ctx.press('right');
    ctx.press('ok');
    let leave = 0;
    while (ctx.s.screen() !== 'shooting' && leave < 6) {
      ctx.press('menu');
      leave += 1;
    }
    ctx.idle(1200);
    mark(ctx, 'after-commit');
  },
});

writeFileSync(OUT, JSON.stringify({ ok: result.ok, failed: result.failed || null, marks }, null, 2) + '\n');
if (!result.ok) process.exit(1);
