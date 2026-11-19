// Diagnostic. Which setup call writes E and M. Not an acceptance run.
// EMULATOR-ONLY. Role: test setup.
// Usage: node26 work/scripts/probe_saves_t8b.mjs om-emu
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';

const checkout = process.argv[2];
if (checkout !== 'om-emu') {
  process.stderr.write('usage: node26 work/scripts/probe_saves_t8b.mjs om-emu\n');
  process.exit(2);
}
const OUT = resolve('work/out/probe-saves-t8b.json');
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
  outPath: 'work/out/session-probe-saves-t8b.jsonl',
  tag: 'probe-saves-t8b',
  candidate: true,
  help: true,
  rowLabel: true,
  fatalShots: true,
  nvramPath: 'work/out/nvram-probe-saves-t8b.json',
  overlayCsv: 'work/out/overlay-combined-t8.csv',
  explanation: 'Diagnostic of the setup save. EMULATOR-ONLY. Role: test setup.',
  change: 'none',
  async drive(ctx) {
    process.env.OM_EMU_MODEL = 'E147';
    const model = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
    mark(ctx, 'boot');
    ctx.bringUp();
    mark(ctx, 'after-bring-up');
    ctx.s.switch_input('lever', 1);
    ctx.s.camapp.pump();
    ctx.idle(500);
    mark(ctx, 'after-lever');
    const { A } = model;
    const api = A(0x50ac4afe);
    const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
    mark(ctx, 'after-mode-arg');
    ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
    mark(ctx, 'after-mode-289');
    ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
    ctx.idle(500);
    mark(ctx, 'after-mode-1712');
    const pose = attachPose(ctx.l);
    pose.setPose('landscape');
    pose.deliver();
    ctx.idle(600);
    mark(ctx, 'after-pose');
    const setter = ctx.native(0x60063431);
    ctx.l.call(setter, { d0: 0x1db1, d1: 0, a1: 1 }, null, null, 200000);
    mark(ctx, 'after-1db1');
    ctx.l.call(setter, { d0: 0x1dc1, d1: 0, a1: 1 }, null, null, 200000);
    mark(ctx, 'after-1dc1');
  },
});
writeFileSync(OUT, JSON.stringify({ ok: result.ok, failed: result.failed || null, marks }, null, 2) + '\n');
if (!result.ok) process.exit(1);
