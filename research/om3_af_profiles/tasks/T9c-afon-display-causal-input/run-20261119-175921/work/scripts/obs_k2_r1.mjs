// Correction version 3 of 6. Full K2.
// T6 overlay, T6 profile-reader hook, and the same display hook as the
// candidate, unseeded. Half-press All is the reused test setup. The producer
// of 0x610c8b66 is not named. Each edge is timed against the K1e bound.
// OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_k2_r1.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ALL, EDGES, IDLE_PERIOD_MS, MIRROR, OWNERS, T6_OVERLAY,
  idleUntil, installDisplay, installReader, makeSetter, pokeAll, prepare, same, shoot,
} from './lib_frame_r1.mjs';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout] = process.argv.slice(2);
if (!checkout) { process.stderr.write('usage: node26 work/scripts/obs_k2_r1.mjs om-emu\n'); process.exit(2); }
const k1e = JSON.parse(readFileSync(resolve('work/out/ref-k1e-a.json'), 'utf8'));
if (!(k1e.boundMs > 0)) throw new Error('k1e bound');
const OUT = resolve('work/out/obs-k2-r1.jsonl');
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
    actual: { modelEnv: 'E147', version: 3 },
    note: 'Full K2. T6 overlay, T6 reader, same display hook, mirror unseeded. Version 5 of the first six remains the Z5 control.',
  });
  let failedAt = null;
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-k2-r1.jsonl',
    tag: 'k2-r1',
    candidate: true,
    fatalShots: true,
    overlayCsv: T6_OVERLAY,
    explanation: 'K2 full. T6 overlay, T6 profile reader, display hook at 0x6041935b, no mirror seed. Half-press All is test setup. EMULATOR-ONLY.',
    change: 'EMULATOR-ONLY display change at 0x6041935b. Unseeded mirror, so the call passes through. T6 reader is the reused profile hook.',
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
      const display = installDisplay(ctx, reader.bankId);
      ctx.idle(IDLE_PERIOD_MS);
      const mirror = Array.from(ctx.l.sim.read(MIRROR, 55));
      if (mirror.some((b) => b !== 0xff)) throw new Error('mirror seeded');
      const edges = [];
      let before = await shoot(ctx, words_to_rgb, null, null);
      for (let i = 0; i < EDGES.length; i++) {
        reader.refreshBank();
        const t0 = ctx.l.lab_time();
        ctx.key(EDGES[i][0], EDGES[i][1]);
        let latencyMs = null;
        let cursor = await shoot(ctx, words_to_rgb, null, null);
        if (cursor.sig !== before.sig) latencyMs = (ctx.l.lab_time() - t0) / 1e6;
        while (ctx.l.lab_time() < t0 + k1e.boundMs * 1e6) {
          ctx.idle(25);
          cursor = await shoot(ctx, words_to_rgb, null, null);
          if (latencyMs == null && cursor.sig !== before.sig) latencyMs = (ctx.l.lab_time() - t0) / 1e6;
        }
        await idleUntil(ctx, t0, Math.max(k1e.boundMs, IDLE_PERIOD_MS));
        const file = resolve('work/out/k2-r1-e' + i + '.png');
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
        if (shot.boxes.length !== 0 || shot.pixels !== 0) problems.push('marks');
        if (latencyMs != null && latencyMs > k1e.boundMs) problems.push('latency');
        const row = {
          id: 'k2-e' + i, step: 'edge', pass: problems.length === 0, problems,
          expect: { owner: OWNERS[i], target: ALL, subject: 0, cell: 526, marks: [], pixels: 0, latencyMs: '<=' + k1e.boundMs },
          actual: {
            key: EDGES[i][0], dir: EDGES[i][1], owner, target, subject, cell,
            marks: shot.marks, pixels: shot.pixels, n31: shot.n31, latencyMs,
            sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
            bankId: reader.bankId(),
          },
        };
        emit(row);
        edges.push({
          edge: i, key: EDGES[i][0], dir: EDGES[i][1], owner,
          marks: shot.boxes, pixels: shot.pixels, n31: shot.n31,
          sha256: row.actual.sha256, file: 'work/out/k2-r1-e' + i + '.png',
          latencyMs,
        });
        if (problems.length) { failedAt = i; throw new Error('stop ' + i); }
        before = shot;
      }
      const counts = { display: display, reader: reader.counts };
      if (display.pos || display.zone || display.size || display.kind) throw new Error('unseeded substitution');
      writeFileSync(resolve('work/out/ref-k2.json'), JSON.stringify({
        role: 'K2', version: 3, boundMs: k1e.boundMs, idlePeriodMs: IDLE_PERIOD_MS,
        edges, counts, mirrorHead: mirror.slice(0, 8),
      }, null, 2) + '\n');
      emit({ id: 'k2-done', step: 'done', pass: true, problems: [], expect: { failed: 0 }, actual: { failed: 0, counts } });
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
