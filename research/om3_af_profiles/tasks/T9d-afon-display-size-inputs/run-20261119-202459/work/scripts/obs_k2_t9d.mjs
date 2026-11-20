// Version 2 of 6. Full K2. Same display hook as the candidates, unseeded.
// T6 overlay and T6 reader. Half-press All is test setup. The twelve frames
// are hashed here, before either seeded run. OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_k2_t9d.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ALL, EDGES, MIRROR, OWNERS, T6_OVERLAY,
  frameSame, installDisplay, installReader, makeSetter, pokeAll, prepare, same, savedBank, shoot, watchEdge,
} from './lib_valid_t9d.mjs';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout] = process.argv.slice(2);
if (!checkout) { process.stderr.write('usage: node26 work/scripts/obs_k2_t9d.mjs om-emu\n'); process.exit(2); }
const k1e = JSON.parse(readFileSync(resolve('work/out/ref-k1e-a.json'), 'utf8'));
if (!(k1e.boundMs > 0)) throw new Error('k1e bound');
const OUT = resolve('work/out/obs-k2-t9d.jsonl');
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
    id: 'k2-plan', step: 'plan', pass: true, problems: [],
    expect: { model: 'E147', target: ALL, marks: [], boundMs: k1e.boundMs },
    actual: { modelEnv: 'E147', version: 2 },
    note: 'Full K2. T6 overlay, T6 reader, the T9d display hook, mirror unseeded.',
  });
  let failedAt = null;
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-k2-t9d.jsonl',
    tag: 'k2-t9d',
    candidate: true,
    fatalShots: true,
    overlayCsv: T6_OVERLAY,
    explanation: 'K2 full. T6 overlay, T6 profile reader, display hook, no mirror seed. Half-press All is test setup. EMULATOR-ONLY.',
    change: 'EMULATOR-ONLY display change at 0x6041935b and 0x6041a1fb. Unseeded mirror, so both calls pass through.',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'k2-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const readKey = await prepare(ctx, A);
      const setKey = makeSetter(ctx);
      pokeAll(setKey);
      const reader = installReader(ctx, readKey);
      let saved = savedBank(ctx, readKey);
      const display = installDisplay(ctx, () => saved);
      ctx.idle(k1e.idlePeriodMs);
      const mirror = Array.from(ctx.l.sim.read(MIRROR, 55));
      if (mirror.some((b) => b !== 0xff)) throw new Error('mirror seeded');
      const edges = [];
      let before = await shoot(ctx, words_to_rgb, null, null);
      let prevExpect = { boxes: before.boxes, pixels: before.pixels, n31: before.n31 };
      for (let i = 0; i < EDGES.length; i++) {
        reader.refreshBank();
        saved = savedBank(ctx, readKey);
        const expect = { boxes: [], pixels: 0, n31: 0 };
        const referenceChanged = !frameSame(prevExpect, expect);
        const t0 = ctx.l.lab_time();
        ctx.key(EDGES[i][0], EDGES[i][1]);
        const watched = await watchEdge(ctx, words_to_rgb, t0, before, k1e.boundMs, !referenceChanged);
        const file = resolve('work/out/k2-t9d-e' + i + '.png');
        const shot = await shoot(ctx, words_to_rgb, write_png, file);
        const owner = ctx.readOwn()[4];
        const target = Array.from(ctx.l.sim.read(0xa33ca384, 10));
        const subject = readKey(0x1e71, 0);
        const cell = readKey(0x88b2, 0);
        const problems = [];
        if (owner !== OWNERS[i]) problems.push('owner');
        if (!same(target, ALL)) problems.push('target');
        if (subject !== 0) problems.push('subject');
        if (cell !== 526) problems.push('cell');
        if (!frameSame(shot, expect)) problems.push('marks');
        if (referenceChanged && watched.latencyMs == null) problems.push('latency-none');
        if (watched.latencyMs != null && watched.latencyMs > k1e.boundMs) problems.push('latency');
        if (!referenceChanged && watched.drifted) problems.push('unchanged');
        const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
        emit({
          id: 'k2-e' + i, step: 'edge', pass: problems.length === 0, problems,
          expect: { owner: OWNERS[i], target: ALL, subject: 0, cell: 526, marks: [], pixels: 0, n31: 0, referenceChanged, latencyMs: referenceChanged ? '<=' + k1e.boundMs : 'unchanged' },
          actual: {
            key: EDGES[i][0], dir: EDGES[i][1], owner, target, subject, cell,
            marks: shot.marks, pixels: shot.pixels, n31: shot.n31,
            latencyMs: watched.latencyMs, drifted: watched.drifted, referenceChanged, sha256,
            bankSaved: saved, bankReader: reader.bankId(),
          },
        });
        edges.push({
          edge: i, key: EDGES[i][0], dir: EDGES[i][1], owner: OWNERS[i],
          marks: shot.boxes, pixels: shot.pixels, n31: shot.n31, sha256,
          file: 'work/out/k2-t9d-e' + i + '.png', latencyMs: watched.latencyMs, referenceChanged,
        });
        if (problems.length) { failedAt = i; throw new Error('stop ' + i); }
        before = shot;
        prevExpect = expect;
      }
      if (display.pos || display.zone || display.size) throw new Error('unseeded substitution');
      writeFileSync(resolve('work/out/ref-k2.json'), JSON.stringify({
        role: 'K2', version: 2, boundMs: k1e.boundMs, idlePeriodMs: k1e.idlePeriodMs,
        edges, counts: display,
      }, null, 2) + '\n');
      emit({ id: 'k2-done', step: 'done', pass: true, problems: [], expect: { failed: 0, substitutions: 0 }, actual: { failed: 0, counts: display } });
    },
  });
  if (!result.ok) {
    emit({ id: 'k2-done', step: 'done', pass: false, problems: ['edges'], expect: { ok: true }, actual: { ok: false, failedAt, error: result.failed } });
    process.exit(1);
  }
} catch (e) {
  emit({ id: 'k2-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
