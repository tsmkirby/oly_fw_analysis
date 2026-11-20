// T9d display validation on the combined hook. Frames come from the hashed K1e
// references. Every refresh keeps its getter calls, time and frame signature.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ALL, CENTRE, EDGES, OWNERS, SINGLE, STOCK, T6_OVERLAY,
  frameSame, greyMarks,
} from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { bindWriterSetter, installCombined, readGetter } from './afon_hooks_v5.mjs';
import { createGate } from './gate_v1.mjs';
import { installRefresh } from './refresh_v1.mjs';
import { captureState, structuralProblems } from './state_v1.mjs';
import { assertClean } from './static_check_v5.mjs';

const REF = 'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/';
const WRITER_A = [0x11, 0x02, 0x03, 0x00, 0x03, 0x00, 0x03, 0x00, 0x00, 0x00];

function shaFile(path) {
  const bytes = readFileSync(resolve(path));
  return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

function seedMirror(zone, pos, size0, size1, kind) {
  const m = new Uint8Array(55);
  m.fill(0xff);
  m[0] = zone;
  m[1] = zone;
  m[0x08] = 0;
  m[0x0a] = pos & 0xff;
  m[0x0b] = (pos >> 8) & 0xff;
  m[0x16] = size0;
  m[0x17] = size1;
  m[0x20] = kind;
  m[0x3f] = 0;
  return m;
}

function sigOf(shot, t) {
  const body = JSON.stringify({ boxes: shot.boxes, pixels: shot.pixels, n31: shot.n31 });
  return {
    t,
    sha256: createHash('sha256').update(body).digest('hex'),
    boxes: shot.boxes,
    pixels: shot.pixels,
    n31: shot.n31,
  };
}

async function shoot(ctx, wordsToRgb, writePng, file) {
  const fr = ctx.s.frame('boundary');
  if (!fr) throw new Error('screenshot failed');
  const rgb = wordsToRgb(fr[2]);
  if (file && writePng) writePng(file, fr[0], fr[1], rgb);
  return greyMarks(rgb, fr[0]);
}

async function watchEdge(ctx, wordsToRgb, t0, before, boundMs, expectSame) {
  let latencyMs = null;
  let drifted = false;
  const cap = t0 + boundMs * 1e6;
  let cursor = await shoot(ctx, wordsToRgb, null, null);
  if (!frameSame(cursor, before)) {
    latencyMs = (ctx.l.lab_time() - t0) / 1e6;
    if (expectSame) drifted = true;
  }
  while (ctx.l.lab_time() < cap) {
    ctx.idle(25);
    cursor = await shoot(ctx, wordsToRgb, null, null);
    if (!frameSame(cursor, before)) {
      if (latencyMs == null) latencyMs = (ctx.l.lab_time() - t0) / 1e6;
      if (expectSame) drifted = true;
    }
  }
  return { latencyMs, drifted };
}

export async function main({ which, tag }) {
  if (which !== 'ab' && which !== 'controls') throw new Error('which');
  assertClean();
  if (process.env.OM_EMU_MODEL !== 'E147' || process.env.OM_EMU_NVRAM !== 'off') throw new Error('env');
  const k1eA = JSON.parse(readFileSync(resolve(REF + 'ref-k1e-a.json'), 'utf8'));
  const k1eB = JSON.parse(readFileSync(resolve(REF + 'ref-k1e-b.json'), 'utf8'));
  const k2 = JSON.parse(readFileSync(resolve(REF + 'ref-k2.json'), 'utf8'));
  const refs = {
    a: shaFile(REF + 'ref-k1e-a.json'),
    b: shaFile(REF + 'ref-k1e-b.json'),
    k2: shaFile(REF + 'ref-k2.json'),
  };
  mkdirSync(resolve('work/out'), { recursive: true });
  const outJsonl = resolve('work/out/' + tag + '.jsonl');
  const lines = [];
  const log = (row) => {
    lines.push(JSON.stringify(row));
    writeFileSync(outJsonl, lines.join('\n') + '\n');
    console.log(JSON.stringify({ id: row.id, pass: row.pass }));
  };
  const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
  log({ id: 'refs', pass: true, problems: [], refs, boundMs: k1eA.boundMs });
  const jobs = which === 'ab'
    ? [
      { id: 'seed-a', profile: 'A', seed: seedMirror(2, 529, 3, 3, 3), frame: k1eA.frame, owner2: WRITER_A, hook: true },
      { id: 'seed-b', profile: 'B', seed: seedMirror(1, 529, 1, 1, 0), frame: k1eB.frame, owner2: SINGLE, hook: true },
    ]
    : [
      { id: 'k2', profile: 'K2', seed: null, frame: null, owner2: ALL, hook: true, k2: true },
      { id: 'k1', profile: 'K1', seed: null, frame: { marks: CENTRE, pixels: 444, n31: 444 }, owner2: STOCK, hook: false, stock: true },
    ];
  for (const job of jobs) await runJob({ job, tag, k1eA, k2, log, runZone });
  log({ id: tag + '-done', pass: true, ok: true, problems: [] });
}

async function runJob({ job, tag, k1eA, k2, log, runZone }) {
  const sessionPath = 'work/out/session-' + tag + '-' + job.id + '.jsonl';
  const result = await runZone({
    checkout: 'om-emu',
    outPath: sessionPath,
    tag: tag + '-' + job.id,
    candidate: !job.stock,
    fatalShots: true,
    overlayCsv: job.stock ? null : T6_OVERLAY,
    explanation: job.stock
      ? 'K1 stock. No overlay and no combined hook. EMULATOR-ONLY. Role: behaviour.'
      : 'Display ' + job.id + '. Combined hook. EMULATOR-ONLY. Role: behaviour.',
    change: job.hook ? 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.' : 'none',
    async drive(ctx) {
      const gate = createGate(ctx);
      const modelMod = await import(pathToFileURL(resolve('om-emu/emu/src/fw/model.mjs')).href);
      const menuMod = await import(pathToFileURL(resolve('om-emu/emu/src/lab/menu.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve('om-emu/emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve('om-emu/checks/lib/png.mjs')).href);
      if (modelMod.MODEL !== 'E147') throw new Error('model ' + modelMod.MODEL);
      let phase = 'boot';
      const refresh = installRefresh(ctx, { hookGetter: !job.hook, phase: () => phase });
      const hooks = job.hook ? installCombined(ctx, modelMod, menuMod, {
        onGetter: (rec) => refresh.noteGetter(rec),
        refreshId: () => refresh.currentId(),
      }) : null;
      bindWriterSetter(gate, ctx);
      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const api = modelMod.A(0x50ac4afe);
      const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
      ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
      ctx.idle(150);
      if (!job.stock) {
        gate.set(0x84d1, 0, 2);
        gate.set(0x1dd1, 0, 1);
        gate.set(0x1dd1, 1, 1);
        gate.set(0x99a1, 0, 0);
        gate.set(0x1db1, 0, 1);
        gate.set(0x1dc1, 0, 1);
      }
      if (job.seed) {
        ctx.l.sim.write(0xa031eeb0, Buffer.from(job.seed));
        ctx.l.sim.write(0x6031eeb0, Buffer.from(job.seed));
      }
      if (hooks) hooks.refresh();
      ctx.idle(k1eA.idlePeriodMs);
      phase = 'edges';
      let before = await shoot(ctx, words_to_rgb, null, null);
      let prev = { boxes: before.boxes, pixels: before.pixels, n31: before.n31 };
      for (let i = 0; i < EDGES.length; i++) {
        const ownerExpect = job.stock ? 255 : OWNERS[i];
        const frameExpect = job.k2
          ? { boxes: k2.edges[i].marks, pixels: k2.edges[i].pixels, n31: k2.edges[i].n31 }
          : (ownerExpect === 2
            ? { boxes: job.frame.marks, pixels: job.frame.pixels, n31: job.frame.n31 }
            : (job.stock
              ? { boxes: CENTRE, pixels: 444, n31: 444 }
              : { boxes: k2.edges[i].marks, pixels: k2.edges[i].pixels, n31: k2.edges[i].n31 }));
        const targetExpect = ownerExpect === 2 ? job.owner2 : (job.stock ? STOCK : ALL);
        const referenceChanged = !frameSame(prev, frameExpect);
        const t0 = ctx.l.lab_time();
        gate.key(EDGES[i][0], EDGES[i][1]);
        const watched = await watchEdge(ctx, words_to_rgb, t0, before, k1eA.boundMs, !referenceChanged);
        const file = resolve('work/out/' + tag + '-' + job.id + '-e' + i + '.png');
        const shot = await shoot(ctx, words_to_rgb, write_png, file);
        const sig = sigOf(shot, ctx.l.lab_time());
        const stamped = refresh.stamp(sig);
        const state = captureState(ctx, readGetter, sig);
        const problems = structuralProblems(state);
        if (state.owner !== ownerExpect) problems.push('owner');
        if (JSON.stringify(state.target) !== JSON.stringify(targetExpect)) problems.push('target');
        if (readGetter(ctx, 0x88b2, 0) !== 526) problems.push('cell');
        if (!frameSame(shot, frameExpect)) problems.push('marks');
        if (referenceChanged && watched.latencyMs == null) problems.push('latency-none');
        if (watched.latencyMs != null && watched.latencyMs > k1eA.boundMs) problems.push('latency');
        if (!referenceChanged && watched.drifted) problems.push('unchanged');
        log({
          id: job.id + '-e' + i, pass: problems.length === 0, problems,
          expect: { owner: ownerExpect, target: targetExpect, frame: frameExpect, referenceChanged },
          actual: {
            owner: state.owner, target: state.target, marks: shot.marks, pixels: shot.pixels, n31: shot.n31,
            latencyMs: watched.latencyMs, drifted: watched.drifted, stamped, slots: state.slots.length,
            frame: sig.sha256,
          },
        });
        if (problems.length) throw new Error(job.id + ' edge ' + i + ' ' + problems.join(','));
        before = shot;
        prev = frameExpect;
      }
      const calls = refresh.windows.reduce((n, w) => n + w.calls.length, 0);
      const unsigned = refresh.windows.filter((w) => w.tEnd != null && !w.sig);
      const problems = [];
      if (!refresh.windows.length) problems.push('no-refresh');
      if (!calls) problems.push('no-getters');
      if (unsigned.length) problems.push('unsigned');
      if (job.seed && hooks) {
        if (hooks.display.pos === 0) problems.push('pos');
        if (hooks.display.zone === 0) problems.push('zone');
        if (hooks.display.size === 0) problems.push('size');
      }
      const refreshPath = resolve('work/out/refresh-' + tag + '-' + job.id + '.jsonl');
      writeFileSync(refreshPath, refresh.windows.map((w) => JSON.stringify({
        id: w.id, tEntry: w.tEntry, tEnd: w.tEnd, nCalls: w.calls.length, calls: w.calls, sig: w.sig, phase: w.phase,
      })).join('\n') + '\n');
      log({
        id: job.id + '-refresh', pass: problems.length === 0, problems,
        windows: refresh.windows.length, calls, unsigned: unsigned.length,
        display: hooks ? hooks.display : null,
      });
      if (problems.length) throw new Error(job.id + ' refresh ' + problems.join(','));
    },
  });
  if (!result.ok) throw new Error(job.id + ' ' + result.failed);
}
