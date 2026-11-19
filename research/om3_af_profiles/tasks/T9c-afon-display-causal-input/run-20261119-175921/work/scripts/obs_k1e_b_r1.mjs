// Correction version 2 of 6. Stock K1e for profile B.
// S1 is pressed immediately after the stock setter returns, before a separate
// idle, so the latency is from that press to the first frame change.
// The setter writes are test setup. No overlay and no display hook.
// OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_k1e_b_r1.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  IDLE_PERIOD_MS, applyHalf, idleUntil, makeSetter, prepare, readCells, shoot, waitChange,
} from './lib_frame_r1.mjs';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_k1e_b_r1.mjs om-emu\n');
  process.exit(2);
}
const tag = 'k1e-b';
const OUT = resolve('work/out/obs-k1e-b.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  emit({
    id: 'k1e-b-plan', step: 'plan', pass: true, problems: [],
    expect: { model: 'E147', profile: 'B' },
    actual: { modelEnv: 'E147', version: 2 },
    note: 'K1e stock reference for profile B. S1 is pressed as soon as the setter returns. No display change.',
  });
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-k1e-b.jsonl',
    tag,
    candidate: false,
    fatalShots: true,
    explanation: 'k1e-b K1e. Stock. Half-press zone 6, size 5 by 7 and position 540, set with the stock setter. EMULATOR-ONLY test setup. S1 follows at once. No display hook.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'k1e-b-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const readKey = await prepare(ctx, A);
      const setKey = makeSetter(ctx);
      const rest = await shoot(ctx, words_to_rgb, write_png, resolve('work/out/k1e-b-rest.png'));
      applyHalf(setKey, 'B');
      const tS1 = ctx.l.lab_time();
      ctx.key('s1', 'down');
      const s1 = await waitChange(ctx, words_to_rgb, tS1, rest.sig, 2000);
      const cells = readCells(readKey);
      const latencyMs = s1.latencyMs;
      const used = latencyMs != null ? latencyMs : IDLE_PERIOD_MS;
      const boundMs = used + IDLE_PERIOD_MS;
      await idleUntil(ctx, tS1, used + IDLE_PERIOD_MS);
      const file = resolve('work/out/k1e-b-ref.png');
      const ref = await shoot(ctx, words_to_rgb, write_png, file);
      ctx.key('s1', 'up');
      ctx.idle(IDLE_PERIOD_MS);
      const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
      const record = {
        profile: 'B', role: 'K1e', version: 2,
        idlePeriodMs: IDLE_PERIOD_MS,
        latencyMs, latencySource: latencyMs != null ? 's1-press' : 'no-change',
        boundMs,
        criterion: 'S1 was pressed immediately after the stock setter returned. The bound is that press-to-change latency plus one 600 ms idle period. The producer of 0x610c8b66 stays unresolved.',
        frame: { marks: ref.boxes, pixels: ref.pixels, n31: ref.n31, sha256, file: 'work/out/k1e-b-ref.png' },
        cells, subject: cells.subject,
        rest: { marks: rest.boxes, pixels: rest.pixels, n31: rest.n31 },
      };
      writeFileSync(resolve('work/out/ref-k1e-b.json'), JSON.stringify(record, null, 2) + '\n');
      const problems = [];
      if (cells.subject !== 0) problems.push('subject');
      if (cells.k88b2 !== 540 || cells.k99a1 !== 6 || cells.k84d1 !== 7) problems.push('cells');
      if (cells.k1dd1[2] !== 5 || cells.k1dd1[3] !== 7) problems.push('size');
      if (latencyMs == null) problems.push('latency');
      emit({
        id: 'k1e-b-ref', step: 'reference', pass: problems.length === 0, problems,
        expect: { subject: 0, k88b2: 540, k99a1: 6, k84d1: 7, latency: 'measured' },
        actual: record,
        note: 'Hashed before any candidate. Directly sampled pixels. The geometry word was not read.',
      });
      if (problems.length) throw new Error(problems.join(','));
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'k1e-b-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
