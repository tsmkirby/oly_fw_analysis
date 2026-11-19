// Correction versions 4 and 5 of 6. Seeded profiles A and B.
// Same display hook as K2. AF-ON edges use the K1e frame hashed before this
// run. Owner 0 and 1 use ref:K2:<edge>. Stops at the first failure.
// Profile B must substitute size and kind at least once. The producer of
// 0x610c8b66 stays unresolved; the K1e latency bound is the criterion.
// OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_seed_r1.mjs om-emu A|B
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ALL, C1, EDGES, IDLE_PERIOD_MS, MIRROR, MIRROR_C, OWNERS, SMALL, T6_OVERLAY,
  idleUntil, installDisplay, installReader, makeSetter, mirrorA, mirrorB, pokeAll, prepare, same, shoot,
} from './lib_frame_r1.mjs';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout, profile] = process.argv.slice(2);
if (!checkout || (profile !== 'A' && profile !== 'B')) {
  process.stderr.write('usage: node26 work/scripts/obs_seed_r1.mjs om-emu A|B\n');
  process.exit(2);
}
const tag = profile === 'A' ? 'seed-a' : 'seed-b';
const version = profile === 'A' ? 4 : 5;
const k1e = JSON.parse(readFileSync(resolve('work/out/ref-k1e-' + (profile === 'A' ? 'a' : 'b') + '.json'), 'utf8'));
const k2 = JSON.parse(readFileSync(resolve('work/out/ref-k2.json'), 'utf8'));
if (!k1e.frame || !Array.isArray(k2.edges) || k2.edges.length !== 12) throw new Error('references');
const wantTen = profile === 'A' ? SMALL : C1;
const seedBytes = Buffer.from(profile === 'A' ? mirrorA() : mirrorB());
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
    expect: { model: 'E147', profile, afon: k1e.frame, boundMs: k1e.boundMs, k1eSha: k1e.frame.sha256 },
    actual: { modelEnv: 'E147', version },
    note: 'Seeded ' + profile + '. Expectations were hashed by K1e and K2 before this process.',
  });
  let failedAt = null;
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-' + tag + '.jsonl',
    tag,
    candidate: true,
    fatalShots: true,
    overlayCsv: T6_OVERLAY,
    explanation: tag + ' seeded profile ' + profile + '. T6 overlay, T6 reader, display hook. EMULATOR-ONLY. Mirror seed and half-press All are test setup.',
    change: 'EMULATOR-ONLY display change at 0x6041935b while owner is 2. Reused T6 configuration is test setup.',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: tag + '-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const readKey = await prepare(ctx, A);
      const setKey = makeSetter(ctx);
      pokeAll(setKey);
      ctx.l.sim.write(MIRROR, seedBytes);
      ctx.l.sim.write(MIRROR_C, seedBytes);
      const reader = installReader(ctx, readKey);
      const display = installDisplay(ctx, reader.bankId);
      ctx.idle(IDLE_PERIOD_MS);
      let before = await shoot(ctx, words_to_rgb, null, null);
      for (let i = 0; i < EDGES.length; i++) {
        reader.refreshBank();
        const ownerExpect = OWNERS[i];
        const frameExpect = ownerExpect === 2 ? k1e.frame : k2.edges[i];
        const targetExpect = ownerExpect === 2 ? wantTen : ALL;
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
        const file = resolve('work/out/' + tag + '-e' + i + '.png');
        const shot = await shoot(ctx, words_to_rgb, write_png, file);
        const owner = ctx.readOwn()[4];
        const target = Array.from(ctx.l.sim.read(0xa33ca384, 10));
        const subject = readKey(0x1e71, 0);
        const cell = readKey(0x88b2, 0);
        const wantMarks = frameExpect.marks;
        const problems = [];
        if (owner !== ownerExpect) problems.push('owner');
        if (!same(target, targetExpect)) problems.push('target');
        if (subject !== 0) problems.push('subject');
        if (cell !== 526) problems.push('cell');
        if (!same(shot.boxes, wantMarks)) problems.push('marks');
        if (shot.pixels !== frameExpect.pixels || shot.n31 !== frameExpect.n31) problems.push('colour');
        const mustChange = !same(before.boxes, wantMarks) || before.pixels !== frameExpect.pixels;
        if (mustChange && latencyMs == null) problems.push('latency-none');
        if (latencyMs != null && latencyMs > k1e.boundMs) problems.push('latency');
        emit({
          id: tag + '-e' + i, step: 'edge', pass: problems.length === 0, problems,
          expect: {
            owner: ownerExpect, target: targetExpect, subject: 0, cell: 526,
            marks: wantMarks, pixels: frameExpect.pixels, n31: frameExpect.n31,
            ref: ownerExpect === 2 ? 'K1e:' + profile : 'K2:' + i,
            latencyMs: '<=' + k1e.boundMs,
          },
          actual: {
            key: EDGES[i][0], dir: EDGES[i][1], owner, target, subject, cell,
            marks: shot.marks, pixels: shot.pixels, n31: shot.n31, latencyMs,
            sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
            bankId: reader.bankId(),
          },
        });
        if (problems.length) { failedAt = i; throw new Error('stop ' + i); }
        before = shot;
      }
      const problems = [];
      if (profile === 'B' && display.size === 0) problems.push('size');
      if (profile === 'B' && display.kind === 0) problems.push('kind');
      if (display.pos === 0) problems.push('pos');
      emit({
        id: tag + '-done', step: 'done', pass: problems.length === 0, problems,
        expect: { failed: 0, size: profile === 'B' ? '>0' : 'recorded', kind: profile === 'B' ? '>0' : 'recorded' },
        actual: { failed: 0, counts: display },
      });
      if (problems.length) throw new Error(problems.join(','));
    },
  });
  if (!result.ok) {
    emit({ id: tag + '-done', step: 'done', pass: false, problems: ['edges'], expect: { ok: true }, actual: { ok: false, failedAt, error: result.failed } });
    process.exit(1);
  }
} catch (e) {
  emit({ id: tag + '-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
