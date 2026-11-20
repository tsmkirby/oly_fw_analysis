// Versions 3 and 4 of 6. Seeded profiles A and B.
// Owner 2 uses the K1e frame hashed before this run. Owner 0 and 1 use the
// K2 frame hashed before this run. Stops at the first failure. Every display
// branch must substitute at least once. OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_seed_t9d.mjs om-emu A|B
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ALL, EDGES, MIRROR, MIRROR_C, OWNERS, SINGLE, SMALL, T6_OVERLAY,
  frameSame, installDisplay, installReader, makeSetter, mirrorProfile, pokeAll, prepare, same, savedBank, shoot, watchEdge,
} from './lib_valid_t9d.mjs';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout, profile] = process.argv.slice(2);
if (!checkout || (profile !== 'A' && profile !== 'B')) {
  process.stderr.write('usage: node26 work/scripts/obs_seed_t9d.mjs om-emu A|B\n');
  process.exit(2);
}
const tag = profile === 'A' ? 'seed-a' : 'seed-b';
const version = profile === 'A' ? 3 : 4;
const k1e = JSON.parse(readFileSync(resolve('work/out/ref-k1e-' + (profile === 'A' ? 'a' : 'b') + '.json'), 'utf8'));
const k2 = JSON.parse(readFileSync(resolve('work/out/ref-k2.json'), 'utf8'));
if (!k1e.frame || !Array.isArray(k2.edges) || k2.edges.length !== 12) throw new Error('references');
const wantTen = profile === 'A' ? SMALL : SINGLE;
const seedBytes = Buffer.from(profile === 'A' ? mirrorProfile(2, 529, 3, 3) : mirrorProfile(1, 529, 1, 1));
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
    expect: { model: 'E147', profile, afon: k1e.frame.sha256, boundMs: k1e.boundMs, k2Edges: 12 },
    actual: { modelEnv: 'E147', version },
    note: 'Seeded ' + profile + '. K1e and K2 frames were hashed before this process.',
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
    change: 'EMULATOR-ONLY display change at 0x6041935b and 0x6041a1fb while owner is 2. Saved-bank mirror position, zone and size.',
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
      let saved = savedBank(ctx, readKey);
      const display = installDisplay(ctx, () => saved);
      ctx.idle(k1e.idlePeriodMs);
      let before = await shoot(ctx, words_to_rgb, null, null);
      let prevExpect = { boxes: before.boxes, pixels: before.pixels, n31: before.n31 };
      for (let i = 0; i < EDGES.length; i++) {
        reader.refreshBank();
        saved = savedBank(ctx, readKey);
        const ownerExpect = OWNERS[i];
        const frameExpect = ownerExpect === 2 ? k1e.frame : k2.edges[i];
        const targetExpect = ownerExpect === 2 ? wantTen : ALL;
        const expectFrame = { boxes: frameExpect.marks, pixels: frameExpect.pixels, n31: frameExpect.n31 };
        const referenceChanged = !frameSame(prevExpect, expectFrame);
        const t0 = ctx.l.lab_time();
        ctx.key(EDGES[i][0], EDGES[i][1]);
        const watched = await watchEdge(ctx, words_to_rgb, t0, before, k1e.boundMs, !referenceChanged);
        const file = resolve('work/out/' + tag + '-e' + i + '.png');
        const shot = await shoot(ctx, words_to_rgb, write_png, file);
        const owner = ctx.readOwn()[4];
        const target = Array.from(ctx.l.sim.read(0xa33ca384, 10));
        const subject = readKey(0x1e71, 0);
        const cell = readKey(0x88b2, 0);
        const problems = [];
        if (owner !== ownerExpect) problems.push('owner');
        if (!same(target, targetExpect)) problems.push('target');
        if (subject !== 0) problems.push('subject');
        if (cell !== 526) problems.push('cell');
        if (!frameSame(shot, expectFrame)) problems.push('marks');
        if (referenceChanged && watched.latencyMs == null) problems.push('latency-none');
        if (watched.latencyMs != null && watched.latencyMs > k1e.boundMs) problems.push('latency');
        if (!referenceChanged && watched.drifted) problems.push('unchanged');
        emit({
          id: tag + '-e' + i, step: 'edge', pass: problems.length === 0, problems,
          expect: {
            owner: ownerExpect, target: targetExpect, subject: 0, cell: 526,
            marks: frameExpect.marks, pixels: frameExpect.pixels, n31: frameExpect.n31,
            ref: ownerExpect === 2 ? 'K1e:' + profile : 'K2:' + i,
            referenceChanged, latencyMs: referenceChanged ? '<=' + k1e.boundMs : 'unchanged',
          },
          actual: {
            key: EDGES[i][0], dir: EDGES[i][1], owner, target, subject, cell,
            marks: shot.marks, pixels: shot.pixels, n31: shot.n31,
            latencyMs: watched.latencyMs, drifted: watched.drifted, referenceChanged,
            sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
            bankSaved: saved, bankReader: reader.bankId(),
          },
        });
        if (problems.length) { failedAt = i; throw new Error('stop ' + i); }
        before = shot;
        prevExpect = expectFrame;
      }
      const problems = [];
      if (display.pos === 0) problems.push('pos');
      if (display.zone === 0) problems.push('zone');
      if (display.size === 0) problems.push('size');
      emit({
        id: tag + '-done', step: 'done', pass: problems.length === 0, problems,
        expect: { failed: 0, pos: '>0', zone: '>0', size: '>0' },
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
