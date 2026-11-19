// T9 correction experiment version 10. Stock K1.
// The version-9 write of 0x88b2 alone moved the marks. This run records the
// getter callers and whether 0x609eece3 runs during that same write.
// OM_EMU_MODEL=E147 is assigned before any import of emu/src/fw/model.mjs.
// EMULATOR-ONLY test setup. Do not edit after it has run.
// Usage: node26 work/scripts/obs_cell_v10.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_cell_v10.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const POS = 0x609eece3;
const OUT = resolve('work/out/obs-cell-v10.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'v10-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 10. Trace the 0x88b2 setter. Test-setup write only.',
  });
  if (!envPass) process.exit(1);
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-cell-v10.jsonl',
    tag: 'obs-cell-v10',
    candidate: false,
    fatalShots: true,
    explanation: 'v10 stock K1. Same EMULATOR-ONLY test-setup write of 0x88b2 as version 9, while recording getter callers and entries of 0x609eece3.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const modelPass = MODEL === 'E147';
      emit({
        id: 'v10-model', step: 'model', pass: modelPass, problems: modelPass ? [] : ['model'],
        expect: { model: 'E147' }, actual: { model: MODEL },
        note: 'Read before bring-up and before any key.',
      });
      if (!modelPass) throw new Error('model');
      const API_SET = A(SET_API);
      let armed = false;
      const gets = [];
      const pos = [];
      const getCount = new Map();
      ctx.l.observe(ctx.native(GET), (lab, r) => {
        if (!armed) return;
        const key = r.d0 & 0xffff;
        if (key !== 0x88b2 && key !== 0x5962 && key !== 0x84d1) return;
        const caller = hex(r.mdr);
        const name = caller + ' ' + hex(key);
        getCount.set(name, (getCount.get(name) || 0) + 1);
        if (gets.length < 40) gets.push({ caller, key: hex(key), index: r.d1 & 0xffff });
      }, 'obs-get-v10');
      ctx.l.observe(ctx.native(POS), (lab, r) => {
        if (!armed || pos.length >= 12) return;
        pos.push({ caller: hex(r.mdr), d0: r.d0 >>> 0, d1: r.d1 >>> 0, a0: hex(r.a0) });
      }, 'obs-pos-v10');
      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }

      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
      ctx.idle(150);
      const subject = readKey(0x1e71, 0);
      const before = { k88b2: readKey(0x88b2, 0), k5962: readKey(0x5962, 0), subject };
      const ready = subject === 0 && before.k88b2 === 526 && before.k5962 === 526;
      emit({
        id: 'v10-before', step: 'before', pass: ready, problems: ready ? [] : ['before'],
        expect: { subject: 0, k88b2: 526, k5962: 526 }, actual: before,
      });
      if (!ready) throw new Error('before');

      armed = true;
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      armed = false;
      const after = { k88b2: readKey(0x88b2, 0), k5962: readKey(0x5962, 0), subject: readKey(0x1e71, 0) };
      const writePass = after.k88b2 === 412 && after.k5962 === 526 && after.subject === 0;
      emit({
        id: 'v10-write', step: 'write', pass: writePass, problems: writePass ? [] : ['readback'],
        expect: { k88b2: 412, k5962: 526, subject: 0 },
        actual: { cells: after, gets, getCounts: Object.fromEntries(getCount), posEntries: pos },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. The lists are the reads during that call.',
      });
      if (!writePass) throw new Error('readback');
    },
  });
  emit({
    id: 'v10-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: result.ok, failed: result.failed },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v10-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
