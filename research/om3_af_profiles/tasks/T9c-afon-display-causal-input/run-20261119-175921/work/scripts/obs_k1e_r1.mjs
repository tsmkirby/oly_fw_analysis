// Correction version 1 or 2 of 6. Stock K1e reference.
// Half-press zone, size and position are set with the stock setter, labelled
// test setup. No overlay and no display hook. The frame after the measured
// wait is the expected AF-ON frame for that profile. OM_EMU_MODEL=E147
// before model.mjs.
// Usage: node26 work/scripts/obs_k1e_r1.mjs om-emu A|B
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  IDLE_PERIOD_MS, applyHalf, idleUntil, makeSetter, prepare, readCells, shoot, waitChange,
} from './lib_frame_r1.mjs';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout, profile] = process.argv.slice(2);
if (!checkout || (profile !== 'A' && profile !== 'B')) {
  process.stderr.write('usage: node26 work/scripts/obs_k1e_r1.mjs om-emu A|B\n');
  process.exit(2);
}
const tag = profile === 'A' ? 'k1e-a' : 'k1e-b';
const version = profile === 'A' ? 1 : 2;
const OUT = resolve('work/out/obs-' + tag + '.jsonl');
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
    id: tag + '-plan', step: 'plan', pass: true, problems: [],
    expect: { model: 'E147', profile },
    actual: { modelEnv: 'E147', version },
    note: 'K1e stock reference for profile ' + profile + '. Setter writes are test setup. No display change.',
  });
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-' + tag + '.jsonl',
    tag,
    candidate: false,
    fatalShots: true,
    explanation: tag + ' K1e. Stock. Half-press zone, size and position set to profile ' + profile + ' with the stock setter. EMULATOR-ONLY test setup. No display hook.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: tag + '-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const readKey = await prepare(ctx, A);
      const setKey = makeSetter(ctx);
      const rest = await shoot(ctx, words_to_rgb, write_png, resolve('work/out/' + tag + '-rest.png'));
      const tSet = ctx.l.lab_time();
      applyHalf(setKey, profile);
      const setWait = await waitChange(ctx, words_to_rgb, tSet, rest.sig, 2000);
      const cells = readCells(readKey);
      const pre = await shoot(ctx, words_to_rgb, null, null);
      const tS1 = ctx.l.lab_time();
      ctx.key('s1', 'down');
      const s1 = await waitChange(ctx, words_to_rgb, tS1, pre.sig, 2000);
      const latencyMs = s1.latencyMs;
      const setterLatencyMs = setWait.latencyMs;
      const used = latencyMs != null ? latencyMs : (setterLatencyMs != null ? setterLatencyMs : IDLE_PERIOD_MS);
      const source = latencyMs != null ? 's1-press' : (setterLatencyMs != null ? 'setter-then-s1-unchanged' : 'no-change');
      const boundMs = used + IDLE_PERIOD_MS;
      const settleFrom = latencyMs != null ? tS1 : tSet;
      await idleUntil(ctx, settleFrom, used + IDLE_PERIOD_MS);
      const file = resolve('work/out/' + tag + '-ref.png');
      const ref = await shoot(ctx, words_to_rgb, write_png, file);
      ctx.key('s1', 'up');
      ctx.idle(IDLE_PERIOD_MS);
      const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
      const record = {
        profile, role: 'K1e', version,
        idlePeriodMs: IDLE_PERIOD_MS,
        latencyMs, setterLatencyMs, latencySource: source, boundMs,
        criterion: 'Refresh producer of 0x610c8b66 was not named. Bound is the measured stock latency plus one 600 ms idle period.',
        frame: { marks: ref.boxes, pixels: ref.pixels, n31: ref.n31, sha256, file: 'work/out/' + tag + '-ref.png' },
        cells, subject: cells.subject,
        rest: { marks: rest.boxes, pixels: rest.pixels, n31: rest.n31 },
      };
      writeFileSync(resolve('work/out/ref-' + tag + '.json'), JSON.stringify(record, null, 2) + '\n');
      const problems = [];
      if (cells.subject !== 0) problems.push('subject');
      if (ref.boxes.length === 0 && profile === 'A') problems.push('empty-frame');
      emit({
        id: tag + '-ref', step: 'reference', pass: problems.length === 0, problems,
        expect: { subject: 0, frame: 'measured' },
        actual: record,
        note: 'Hashed before any candidate. Directly sampled pixels. The geometry word was not read.',
      });
      if (problems.length) throw new Error(problems.join(','));
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: tag + '-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
