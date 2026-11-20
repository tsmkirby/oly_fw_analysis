// T9d display validation on the combined hook. Every edge and every setup write
// goes through the gate, which compares the full state before it returns.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ALL, CENTRE, EDGES, OWNERS, SINGLE, STOCK, T6_OVERLAY,
  boxesOf, frameSame, greyMarks,
} from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { bindWriterSetter, installCombined, readGetter, writeMirrorBytes } from './afon_hooks_v6.mjs';
import { holdAll, mirrorBytesExpect, plantExpect } from './expect_v2.mjs';
import { createGate } from './gate_v2.mjs';
import { installRefresh } from './refresh_v2.mjs';
import { captureState } from './state_v1.mjs';
import { assertClean } from './static_check_v7.mjs';

const REF = 'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/';
const WRITER_A = [0x11, 0x02, 0x03, 0x00, 0x03, 0x00, 0x03, 0x00, 0x00, 0x00];

function shaFile(path) {
  const bytes = readFileSync(resolve(path));
  return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

function seedMirror(zone, pos, size0, size1, kind) {
  const mirror = new Uint8Array(55);
  mirror.fill(0xff);
  mirror[0] = zone;
  mirror[1] = zone;
  mirror[0x08] = 0;
  mirror[0x0a] = pos & 0xff;
  mirror[0x0b] = (pos >> 8) & 0xff;
  mirror[0x16] = size0;
  mirror[0x17] = size1;
  mirror[0x20] = kind;
  mirror[0x3f] = 0;
  return mirror;
}

function asFrame(spec) {
  const boxes = spec.boxes || boxesOf(spec.marks || []);
  const body = { boxes, pixels: spec.pixels, n31: spec.n31 };
  return {
    ...body,
    sha256: createHash('sha256').update(JSON.stringify(body)).digest('hex'),
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

function edgeExpect(ownerExpect, targetExpect, frameExpect) {
  const named = {
    subject: 0,
    owner: ownerExpect,
    target: Array.from(targetExpect),
    frame: frameExpect,
    slotValues: [{ key: 0x88b2, index: 0, value: 526 }],
  };
  const hold = ['slots', 'mirror71', 'flag'];
  // S1 moves the half-press record with the consumer record. AF-ON and stock do not.
  if (ownerExpect === 1) named.halfTarget = Array.from(targetExpect);
  else hold.push('halfTarget');
  return { named, hold, seal: [], slotExcept: [] };
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
      const gate = createGate(ctx, {
        capture: (frame) => captureState(ctx, readGetter, frame),
        idle: (ms) => ctx.idle(ms),
        identityNow: () => ({ title: null, highlight: null, screen: ctx.s.screen() }),
        approve: () => ({ ok: true, skipped: true }),
        onState: (op, _before, after, problems) => {
          log({
            id: op.id, pass: problems.length === 0, problems,
            owner: after.owner, target: after.target, halfTarget: after.halfTarget, frame: after.frame,
          });
        },
      });
      bindWriterSetter(gate, ctx);
      gate.bindMirror((bytes) => writeMirrorBytes(ctx, bytes));
      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const api = modelMod.A(0x50ac4afe);
      const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
      ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
      ctx.idle(150);
      let cursor = captureState(ctx, readGetter, null);
      if (!job.stock) {
        const live = [[0x84d1, 0, 2], [0x1dd1, 0, 1], [0x1dd1, 1, 1], [0x99a1, 0, 0]];
        for (const [key, index, value] of live) {
          cursor = gate.set({
            id: job.id + '-set-' + key.toString(16) + '-' + index,
            setterKey: key, index, value, idleMs: 0,
            expect: plantExpect(cursor, key, index, value),
          });
        }
        for (const [key, index, value] of [[0x1db1, 0, 1], [0x1dc1, 0, 1]]) {
          cursor = gate.set({
            id: job.id + '-set-' + key.toString(16),
            setterKey: key, index, value, idleMs: 0,
            expect: holdAll(),
          });
        }
      }
      if (job.seed) {
        cursor = gate.mirror({
          id: job.id + '-seed', bytes: job.seed, idleMs: 0, expect: mirrorBytesExpect(job.seed),
        });
      }
      if (hooks) hooks.refresh();
      ctx.idle(k1eA.idlePeriodMs);
      phase = 'edges';
      let before = await shoot(ctx, words_to_rgb, null, null);
      let prev = { boxes: before.boxes, pixels: before.pixels, n31: before.n31 };
      for (let i = 0; i < EDGES.length; i++) {
        const ownerExpect = job.stock ? 255 : OWNERS[i];
        const frameSpec = job.k2
          ? k2.edges[i]
          : (ownerExpect === 2 ? job.frame : (job.stock ? { marks: CENTRE, pixels: 444, n31: 444 } : k2.edges[i]));
        const frameExpect = asFrame(frameSpec);
        const targetExpect = ownerExpect === 2 ? job.owner2 : (job.stock ? STOCK : ALL);
        const referenceChanged = !frameSame(prev, frameExpect);
        const t0 = ctx.l.lab_time();
        let watched = null;
        let shot = null;
        await gate.key({
          id: job.id + '-e' + i,
          key: EDGES[i][0],
          dir: EDGES[i][1],
          settle: async () => {
            watched = await watchEdge(ctx, words_to_rgb, t0, before, k1eA.boundMs, !referenceChanged);
            const file = resolve('work/out/' + tag + '-' + job.id + '-e' + i + '.png');
            shot = await shoot(ctx, words_to_rgb, write_png, file);
          },
          frame: () => asFrame(shot),
          expect: edgeExpect(ownerExpect, targetExpect, frameExpect),
          check: () => {
            const problems = [];
            if (!shot || !watched) problems.push('shot');
            else {
              if (!frameSame(shot, frameExpect)) problems.push('marks');
              if (referenceChanged && watched.latencyMs == null) problems.push('latency-none');
              if (watched.latencyMs != null && watched.latencyMs > k1eA.boundMs) problems.push('latency');
              if (!referenceChanged && watched.drifted) problems.push('unchanged');
            }
            return problems;
          },
        });
        refresh.stamp(asFrame(shot));
        log({
          id: job.id + '-e' + i + '-watch', pass: true, problems: [],
          latencyMs: watched.latencyMs, drifted: watched.drifted, referenceChanged,
        });
        before = shot;
        prev = frameExpect;
      }
      ctx.idle(80);
      const calls = refresh.windows.reduce((n, win) => n + win.calls.length, 0);
      const unsigned = refresh.windows.filter((win) => win.tEnd != null && !win.sig);
      const problems = refresh.problems();
      if (!refresh.windows.length) problems.push('no-refresh');
      if (!calls) problems.push('no-getters');
      if (unsigned.length) problems.push('unsigned');
      if (job.seed && hooks) {
        if (hooks.display.pos === 0) problems.push('pos');
        if (hooks.display.zone === 0) problems.push('zone');
        if (hooks.display.size === 0) problems.push('size');
      }
      const refreshPath = resolve('work/out/refresh-' + tag + '-' + job.id + '.jsonl');
      writeFileSync(refreshPath, refresh.windows.map((win) => JSON.stringify({
        id: win.id, tEntry: win.tEntry, tEnd: win.tEnd, unclosed: win.unclosed,
        nCalls: win.calls.length, calls: win.calls, sig: win.sig, phase: win.phase,
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
