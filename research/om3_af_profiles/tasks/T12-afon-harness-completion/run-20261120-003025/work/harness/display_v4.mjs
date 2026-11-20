// T9d display validation on the combined hook. Setup, seeds and edges go through the gate.
// Each edge is a commit. Identity is taken after the edge, at the screen that is up.
// A frame sample is linked only when its time falls inside that refresh window.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { titleBand } from '../../ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs';
import {
  ALL, CENTRE, EDGES, OWNERS, SINGLE, STOCK, T6_OVERLAY,
  boxesOf, frameSame, greyMarks,
} from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { bindWriterSetter, installCombined, readGetter, writeMirrorBytes } from './afon_hooks_v7.mjs';
import { loadCheckout } from './checkout_v1.mjs';
import { edgeExpect, holdAll, mirrorHeadExpect, plantExpect, setupExpect } from './expect_v3.mjs';
import { createGate } from './gate_v5.mjs';
import { approveCommit, commitPresence, identityFor } from './identity_v4.mjs';
import { readListed } from './inventory_v4.mjs';
import { installRefresh } from './refresh_v4.mjs';
import { runSetup } from './setup_v2.mjs';
import { captureState } from './state_v1.mjs';
import { assertClean } from './static_check_v9.mjs';

const REF = 'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/';

export async function importDisplayModules() {
  const modelMod = await import(pathToFileURL(resolve('om-emu/emu/src/fw/model.mjs')).href);
  const menuMod = await import(pathToFileURL(resolve('om-emu/emu/src/lab/menu.mjs')).href);
  const display = await import(pathToFileURL(resolve('om-emu/emu/src/lab/display.mjs')).href);
  const png = await import(pathToFileURL(resolve('om-emu/checks/lib/png.mjs')).href);
  return { modelMod, menuMod, wordsToRgb: display.words_to_rgb, writePng: png.write_png };
}

export function sampleFrame(ctx, wordsToRgb) {
  if (typeof ctx.frameSample === 'function') {
    return { sig: asFrame(ctx.frameSample()), t: ctx.l.lab_time() };
  }
  const fr = ctx.s.frame('boundary');
  if (!fr) {
    const view = ctx.screen ? ctx.screen() : null;
    const body = {
      boxes: [], pixels: 0, n31: 0, captured: true,
      title: view && view.frame ? titleBand(view.frame) : null,
    };
    body.sha256 = createHash('sha256').update(JSON.stringify(body)).digest('hex');
    return { sig: body, t: ctx.l.lab_time() };
  }
  const rgb = wordsToRgb(fr[2]);
  const marks = greyMarks(rgb, fr[0]);
  return { sig: asFrame(marks), t: ctx.l.lab_time(), marks };
}
const WRITER_A = [0x11, 0x02, 0x03, 0x00, 0x03, 0x00, 0x03, 0x00, 0x00, 0x00];

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
  return { ...body, sha256: createHash('sha256').update(JSON.stringify(body)).digest('hex') };
}

export function jobByName(which) { return JOBS[which]; }

const JOBS = {
  a: { id: 'seed-a', seed: seedMirror(2, 529, 3, 3, 3), frameKey: 'a', owner2: WRITER_A, hook: true },
  b: { id: 'seed-b', seed: seedMirror(1, 529, 1, 1, 0), frameKey: 'b', owner2: SINGLE, hook: true },
  k2: { id: 'k2', seed: null, frameKey: 'k2', owner2: ALL, hook: true, k2: true },
  k1: { id: 'k1', seed: null, frameKey: 'k1', owner2: STOCK, hook: false, stock: true },
};

export async function main(opts) {
  if (opts && opts.loadOnly) {
    await loadCheckout('om-emu');
    await importDisplayModules();
    await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
    return {};
  }
  const { which, mode, tag, rows, sealed, planState } = opts;
  if (mode !== 'identity' && mode !== 'proof') throw new Error('mode');
  await loadCheckout('om-emu');
  assertClean();
  if (process.env.OM_EMU_MODEL !== 'E147' || process.env.OM_EMU_NVRAM !== 'off') throw new Error('env');
  const k1eA = JSON.parse(readListed(REF + 'ref-k1e-a.json').toString('utf8'));
  const k1eB = JSON.parse(readListed(REF + 'ref-k1e-b.json').toString('utf8'));
  const k2 = JSON.parse(readListed(REF + 'ref-k2.json').toString('utf8'));
  const frames = { a: k1eA.frame, b: k1eB.frame, k2: null, k1: { marks: CENTRE, pixels: 444, n31: 444 } };
  mkdirSync(resolve('work/out'), { recursive: true });
  const outJsonl = resolve('work/out/' + tag + '.jsonl');
  const lines = [];
  const log = (row) => {
    lines.push(JSON.stringify(row));
    writeFileSync(outJsonl, lines.join('\n') + '\n');
    console.log(JSON.stringify({ id: row.id, pass: row.pass }));
  };
  const saved = planState.afContext;
  planState.afContext = true;
  const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
  const selected = which === 'all' ? Object.values(JOBS) : [JOBS[which]];
  if (selected.some((job) => !job)) throw new Error('which');
  if (EDGES.length !== 12) throw new Error('edges');
  for (const job of selected) {
    await runJob({ job, tag, mode, rows, sealed, planState, log, runZone, frames, k1eA, k2 });
  }
  planState.afContext = saved;
  log({ id: tag + '-display-done', pass: true, ok: true, problems: [] });
  return rows;
}

async function shoot(ctx, wordsToRgb, writePng, file) {
  if (typeof ctx.frameSample === 'function') {
    return { marks: asFrame(ctx.frameSample()), t: ctx.l.lab_time() };
  }
  const fr = ctx.s.frame('boundary');
  if (!fr) throw new Error('screenshot failed');
  const rgb = wordsToRgb(fr[2]);
  if (file && writePng) writePng(file, fr[0], fr[1], rgb);
  return { marks: greyMarks(rgb, fr[0]), t: ctx.l.lab_time() };
}

async function runJob({ job, tag, mode, rows, sealed, planState, log, runZone, frames, k1eA, k2 }) {
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
    drive(ctx) {
      return driveJob(ctx, job, { mode, rows, sealed, planState, log, frames, k1eA, k2, tag });
    },
  });
  if (!result.ok) throw new Error(job.id + ' ' + result.failed);
}

export async function driveJob(ctx, job, env) {
  const { mode, rows, sealed, planState, log, frames, k1eA, k2, tag } = env;
  const { modelMod, menuMod, wordsToRgb, writePng } = await importDisplayModules();
  if (ctx && ctx.loadOnly) return null;
  if (modelMod.MODEL !== 'E147') throw new Error('model ' + modelMod.MODEL);
  let phase = 'boot';
  let asserting = false;
  const outsideCategory = () => (asserting ? 'assert' : (phase === 'edges' ? null : phase));
  const refresh = installRefresh(ctx, {
    hookGetter: !job.hook,
    phase: () => phase,
    category: outsideCategory,
    sampleNow: () => {
      const taken = sampleFrame(ctx, wordsToRgb);
      refresh.sample(taken.sig, taken.t);
    },
  });
  const hooks = job.hook ? installCombined(ctx, modelMod, menuMod, {
    onGetter: (rec) => refresh.noteGetter(rec, outsideCategory()),
    refreshId: () => refresh.currentId(),
  }) : null;
  const gate = createGate(ctx, {
    requireFrame: true,
    frame: () => sampleFrame(ctx, wordsToRgb).sig,
    capture: (frame) => {
      asserting = true;
      try { return captureState(ctx, readGetter, frame); }
      finally { asserting = false; }
    },
        idle: (ms) => ctx.idle(ms),
        identityNow: () => {
          const view = ctx.screen();
          return {
            title: view && view.frame ? titleBand(view.frame) : null,
            highlight: view ? view.highlight : null,
            screen: ctx.s.screen(),
          };
        },
        plan: () => planState,
        presence: (step) => commitPresence(mode, sealed, step),
        approve: (step, actual) => approveCommit(mode, sealed, step, actual, rows),
        onIdentity: (op, decision, actual) => {
          log({
            id: op.id + '-identity', pass: decision.ok, problems: decision.problems || [],
            expected: decision.expected || null, actual: decision.actual || actual, key: decision.key || null,
          });
        },
        onState: (op, _before, after, problems) => {
          log({
            id: op.id, pass: problems.length === 0, problems,
            owner: after.owner, target: after.target, halfTarget: after.halfTarget, frame: after.frame,
          });
        },
      });
      bindWriterSetter(gate, ctx);
      gate.bindMirror((bytes) => writeMirrorBytes(ctx, bytes));
      let cursor = await runSetup(ctx, modelMod, gate, (suffix, idleMs) => ({
        id: job.id + '-' + suffix,
        idleMs,
        expect: suffix === 'bring-up' || suffix === 'focus-1712' ? setupExpect() : holdAll(),
      }));
      phase = 'link';
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
        phase = 'seed';
        cursor = gate.mirror({
          id: job.id + '-seed', bytes: job.seed, idleMs: 0, expect: mirrorHeadExpect(cursor, job.seed),
        });
      }
      if (hooks) hooks.refresh();
      ctx.idle(k1eA.idlePeriodMs);
      phase = 'edges';
      let before = await shoot(ctx, wordsToRgb, null, null);
      refresh.sample(asFrame(before.marks), before.t);
      let prev = { boxes: before.marks.boxes, pixels: before.marks.pixels, n31: before.marks.n31 };
      for (let i = 0; i < EDGES.length; i++) {
        const ownerExpect = job.stock ? 255 : OWNERS[i];
        const frameSpec = job.k2
          ? k2.edges[i]
          : (ownerExpect === 2 ? frames[job.frameKey] : (job.stock ? frames.k1 : k2.edges[i]));
        const frameExpect = asFrame(frameSpec);
        const targetExpect = ownerExpect === 2 ? job.owner2 : (job.stock ? STOCK : ALL);
        const referenceChanged = !frameSame(prev, frameExpect);
        const id = job.id + '-e' + i;
        const ident = identityFor(planState, id);
        let shot = null;
        await gate.key({
          id,
          key: EDGES[i][0],
          dir: EDGES[i][1],
          identity: ident,
          settle: async () => {
            const cap = ctx.l.lab_time() + k1eA.boundMs * 1e6;
            while (ctx.l.lab_time() < cap) {
              ctx.idle(25);
              shot = await shoot(ctx, wordsToRgb, writePng, resolve('work/out/' + tag + '-' + id + '.png'));
              refresh.sample(asFrame(shot.marks), shot.t);
            }
          },
          frame: () => asFrame(shot.marks),
          expect: edgeExpect(ownerExpect, targetExpect, frameExpect),
          check: () => {
            const problems = [];
            if (!shot) problems.push('shot');
            else if (!frameSame(shot.marks, frameExpect)) problems.push('marks');
            if (referenceChanged && shot == null) problems.push('latency-none');
            return problems;
          },
        });
        before = shot;
        prev = frameExpect;
        void referenceChanged;
      }
      const problems = refresh.problems();
      if (!refresh.windows.length) problems.push('no-refresh');
      const calls = refresh.windows.reduce((n, win) => n + win.calls.length, 0) + refresh.outside.length;
      if (!calls) problems.push('no-getters');
      const refreshPath = resolve('work/out/refresh-' + tag + '-' + job.id + '.jsonl');
      writeFileSync(refreshPath, refresh.windows.map((win) => JSON.stringify({
        id: win.id, tEntry: win.tEntry, tEnd: win.tEnd, sampleT: win.sampleT,
        nCalls: win.calls.length, calls: win.calls, sig: win.sig, phase: win.phase,
      })).join('\n') + '\n');
      log({
        id: job.id + '-refresh', pass: problems.length === 0, problems,
        windows: refresh.windows.length, calls, outside: refresh.outside.length,
        display: hooks ? hooks.display : null,
      });
      if (problems.length) throw new Error(job.id + ' refresh ' + problems.join(','));
      void cursor;
      return refresh;
}
