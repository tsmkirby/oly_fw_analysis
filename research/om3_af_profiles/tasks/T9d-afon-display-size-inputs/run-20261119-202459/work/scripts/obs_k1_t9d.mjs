// Version 5 of 6. Stock K1. No overlay, no hook, no cell write.
// The 12 edges keep the centre frame, the stock ten-byte and owner 255.
// Edges whose reference frame does not change must stay unchanged through the
// K1e window. OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_k1_t9d.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CENTRE, EDGES, STOCK, frameSame, prepare, same, shoot, watchEdge,
} from './lib_valid_t9d.mjs';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout] = process.argv.slice(2);
if (!checkout) { process.stderr.write('usage: node26 work/scripts/obs_k1_t9d.mjs om-emu\n'); process.exit(2); }
const k1e = JSON.parse(readFileSync(resolve('work/out/ref-k1e-a.json'), 'utf8'));
const OUT = resolve('work/out/obs-k1-t9d.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const expect = { boxes: CENTRE, pixels: 444, n31: 444 };

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  emit({
    id: 'k1-plan', step: 'plan', pass: true, problems: [],
    expect: { model: 'E147', marks: CENTRE, target: STOCK, boundMs: k1e.boundMs },
    actual: { modelEnv: 'E147', version: 5 },
    note: 'Stock K1. No display change. The reference frame does not change on any edge.',
  });
  let failedAt = null;
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-k1-t9d.jsonl',
    tag: 'k1-t9d',
    candidate: false,
    fatalShots: true,
    explanation: 'K1 stock. No overlay and no display change. The 12 edges stay on the centre frame.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'k1-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const readKey = await prepare(ctx, A);
      let before = await shoot(ctx, words_to_rgb, null, null);
      for (let i = 0; i < EDGES.length; i++) {
        const referenceChanged = false;
        const t0 = ctx.l.lab_time();
        ctx.key(EDGES[i][0], EDGES[i][1]);
        const watched = await watchEdge(ctx, words_to_rgb, t0, before, k1e.boundMs, !referenceChanged);
        const file = resolve('work/out/k1-t9d-e' + i + '.png');
        const shot = await shoot(ctx, words_to_rgb, write_png, file);
        const owner = ctx.readOwn()[4];
        const target = Array.from(ctx.l.sim.read(0xa33ca384, 10));
        const subject = readKey(0x1e71, 0);
        const cell = readKey(0x88b2, 0);
        const problems = [];
        if (owner !== 255) problems.push('owner');
        if (!same(target, STOCK)) problems.push('target');
        if (subject !== 0) problems.push('subject');
        if (cell !== 526) problems.push('cell');
        if (!frameSame(shot, expect)) problems.push('marks');
        if (watched.drifted) problems.push('unchanged');
        if (watched.latencyMs != null && watched.latencyMs > k1e.boundMs) problems.push('latency');
        emit({
          id: 'k1-e' + i, step: 'edge', pass: problems.length === 0, problems,
          expect: { owner: 255, target: STOCK, subject: 0, cell: 526, marks: CENTRE, pixels: 444, n31: 444, referenceChanged: false, latencyMs: 'unchanged' },
          actual: {
            key: EDGES[i][0], dir: EDGES[i][1], owner, target, subject, cell,
            marks: shot.marks, pixels: shot.pixels, n31: shot.n31,
            latencyMs: watched.latencyMs, drifted: watched.drifted, referenceChanged: false,
            sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
          },
        });
        if (problems.length) { failedAt = i; throw new Error('stop ' + i); }
        before = shot;
      }
      emit({ id: 'k1-done', step: 'done', pass: true, problems: [], expect: { failed: 0 }, actual: { failed: 0 } });
    },
  });
  if (!result.ok) {
    emit({ id: 'k1-done', step: 'done', pass: false, problems: ['edges'], expect: { ok: true }, actual: { ok: false, failedAt, error: result.failed } });
    process.exit(1);
  }
} catch (e) {
  emit({ id: 'k1-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
