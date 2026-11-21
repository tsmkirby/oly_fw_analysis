// Real session adapter: OM-Emu through session_v1.mjs (derived from zone_session_k1.mjs). EMULATOR-ONLY.
// Builds the gate with closure-private delivery functions; the executor receives { gate, observe } only.
// The accepted hook (afon_hooks_v7.mjs), state capture (state_v1.mjs) and recorder (refresh_v4.mjs) are byte-identical
// copies of the T12 files. Payloads follow drive_v12.mjs, display_v5.mjs and setup_v2.mjs; bring-up is five operations.
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { titleBand } from '../../ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { boxesOf, greyMarks } from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { installCombined, readGetter, setKey, writeMirrorBytes, writeMode } from './afon_hooks_v7.mjs';
import { createGate, guardDelivery } from './gate_v1.mjs';
import { installRefresh } from './refresh_v4.mjs';
import { runZone } from './session_v1.mjs';
import { captureState } from './state_v1.mjs';

export const DELIVERY_S = ['key', 'dial_input', 'inject', 'g4_set', 'set', 'switch_input'];
export const DELIVERY_CTX = ['key', 'press'];

export function asFrame(spec) {
  const boxes = spec.boxes || boxesOf(spec.marks || []);
  const body = { boxes, pixels: spec.pixels, n31: spec.n31 };
  return { ...body, sha256: createHash('sha256').update(JSON.stringify(body)).digest('hex') };
}

async function emuModules() {
  const use = (p) => import(pathToFileURL(resolve('om-emu', 'emu', p)).href);
  const modelMod = await use('src/fw/model.mjs');
  const menuMod = await use('src/lab/menu.mjs');
  const display = await use('src/lab/display.mjs');
  const png = await use('checks/lib/png.mjs');
  return { modelMod, menuMod, wordsToRgb: display.words_to_rgb, writePng: png.write_png };
}

export function createRealAdapter() {
  return {
    name: 'real',
    async runSession(spec, body, env) {
      if (process.env.OM_EMU_MODEL !== 'E147' || process.env.OM_EMU_NVRAM !== 'off') throw new Error('env');
      const { modelMod, menuMod, wordsToRgb, writePng } = await emuModules();
      if (modelMod.MODEL !== 'E147') throw new Error('model ' + modelMod.MODEL);
      const outDir = env.outDir;
      const refs = env.refs.display;
      const result = await runZone({
        checkout: 'om-emu',
        outDir,
        outPath: join(outDir, 'session-' + spec.id + '.jsonl'),
        tag: spec.id,
        candidate: spec.image === 'candidate',
        help: spec.help,
        rowLabel: spec.rowLabel,
        fatalShots: true,
        overlayCsv: spec.overlay,
        explanation: spec.explanation,
        change: spec.change,
        async drive(ctx) {
          await driveSession(ctx, spec, body, { ...env, modelMod, menuMod, wordsToRgb, writePng, refs, outDir });
        },
      });
      if (!result.ok) throw new Error(spec.id + ' ' + result.failed);
    },
  };
}

async function driveSession(ctx, spec, body, env) {
  const { modelMod, menuMod, wordsToRgb, writePng, refs, outDir } = env;
  const display = spec.kind === 'display';
  let phase = 'boot';
  let asserting = false;
  const outsideCategory = () => (asserting ? 'assert' : (phase === 'edges' ? null : phase));
  // display_v5 sampleFrame: with no boundary frame yet, a captured placeholder signature (title band only).
  const sampleFrame = () => {
    const fr = ctx.s.frame('boundary');
    if (!fr) {
      const view = ctx.screen ? assertRead(() => ctx.screen()) : null;
      const body = { boxes: [], pixels: 0, n31: 0, captured: true, title: view && view.frame ? titleBand(view.frame) : null };
      body.sha256 = createHash('sha256').update(JSON.stringify(body)).digest('hex');
      return { sig: body, t: ctx.l.lab_time() };
    }
    const marks = greyMarks(wordsToRgb(fr[2]), fr[0]);
    return { sig: asFrame(marks), t: ctx.l.lab_time(), marks };
  };
  const shoot = (file) => {
    const fr = ctx.s.frame('boundary');
    if (!fr) throw new Error('screenshot failed');
    const rgb = wordsToRgb(fr[2]);
    if (file) writePng(file, fr[0], fr[1], rgb);
    return { marks: greyMarks(rgb, fr[0]), t: ctx.l.lab_time() };
  };
  const refresh = spec.recorder ? installRefresh(ctx, {
    hookGetter: !spec.hooks,
    phase: () => phase,
    category: outsideCategory,
    sampleNow: () => {
      const taken = sampleFrame();
      if (taken) refresh.sample(taken.sig, taken.t);
    },
  }) : null;
  const hooks = spec.hooks ? installCombined(ctx, modelMod, menuMod, refresh ? {
    onGetter: (rec) => refresh.noteGetter(rec, outsideCategory()),
    refreshId: () => refresh.currentId(),
  } : {}) : null;
  const poseApi = attachPose(ctx.l);
  let gate = null;
  const isDelivering = () => !!gate && gate.delivering();
  const rawS = guardDelivery(ctx.s, DELIVERY_S, isDelivering, 'ctx.s');
  const rawCtx = guardDelivery(ctx, DELIVERY_CTX, isDelivering, 'ctx');
  const setupBox = { argument: null };
  let readMark = 0;
  const assertRead = (fn) => {
    asserting = true;
    try { return fn(); } finally { asserting = false; }
  };
  const setup = (name) => {
    if (ctx.bringUpSteps[name]) {
      const r = ctx.bringUpSteps[name]();
      if (name === 'take-focus-settle') ctx.emit('behaviour', { step: 'bring-up', label: 'EMULATOR-ONLY T8 bring-up and TAKE_FOCUS. Role: test setup.' });
      return r;
    }
    if (name === 'lever') { rawS.switch_input('lever', 1); ctx.s.camapp.pump(); return null; }
    if (name === 'focus-arg') {
      setupBox.argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      return setupBox.argument;
    }
    if (name === 'focus-289' || name === 'focus-1712') {
      if (name === 'focus-289' && setupBox.argument == null) throw new Error('focus-289 before focus-arg');
      const api = modelMod.A(0x50ac4afe);
      ctx.l.call(api, { d0: name === 'focus-289' ? 289 : 1712, d1: name === 'focus-289' ? setupBox.argument : 0 }, null, null, 200000);
      if (name === 'focus-1712') ctx.emit('behaviour', { step: 's-af', label: 'EMULATOR-ONLY test setup. S-AF through the public focus API. Role: test setup.' });
      return null;
    }
    throw new Error('setup ' + name);
  };
  const deliver = {
    key: (k, d) => rawCtx.key(k, d),
    dial: () => { rawS.dial_input('main', 1); ctx.s.camapp.pump(); },
    pose: (name) => { poseApi.setPose(name); poseApi.deliver(); },
    set: (key, index, value) => { if (display && phase !== 'edges') phase = 'link'; setKey(ctx, key, index, value); },
    mode: (v) => writeMode(ctx, v),
    mirror: (bytes) => { phase = 'seed'; writeMirrorBytes(ctx, bytes); },
    enter: () => { if (!hooks) throw new Error('enter without the combined hook'); hooks.enter(); },
    setup: (name) => { if (display) phase = 'boot'; return setup(name); },
    prepare: () => {
      if (phase === 'boot') phase = 'link';
      if (hooks) hooks.refresh();
      ctx.idle(refs.idlePeriodMs);
      phase = 'edges';
      const first = shoot(null);
      if (refresh) refresh.sample(asFrame(first.marks), first.t);
    },
  };
  const capture = (frame, op, when) => {
    const state = assertRead(() => captureState(ctx, readGetter, frame));
    const own = ctx.readOwn();
    state.edge = { status: own[5], enabled: own[6] };
    let readBank = null;
    if (when === 'after' && hooks) {
      const banks = hooks.reads.slice(readMark).filter((row) => row.kind === 'zone' || row.kind === 'pos').map((row) => row.bank);
      readBank = banks.length && banks.every((b) => b === banks[0]) ? banks[0] : null;
    }
    state.readBank = readBank;
    delete state.seals;
    return state;
  };
  gate = createGate(spec.id, deliver, {
    capture,
    frame: () => { const f = sampleFrame(); return f ? f.sig : null; },
    idle: (ms) => ctx.idle(ms),
    settleWindow: async (op) => {
      const cap = ctx.l.lab_time() + refs.boundMs * 1e6;
      let shot = null;
      while (ctx.l.lab_time() < cap) {
        ctx.idle(25);
        shot = shoot(join(outDir, spec.id + '-' + op.id + '.png'));
        if (refresh) refresh.sample(asFrame(shot.marks), shot.t);
      }
      return shot ? asFrame(shot.marks) : null;
    },
    identityNow: () => assertRead(() => {
      const view = ctx.screen();
      return { title: view && view.frame ? titleBand(view.frame) : null, highlight: view ? view.highlight : null, screen: ctx.s.screen() };
    }),
    presence: env.presence,
    requireFrame: (op) => !!op.requireFrame,
  });
  const observe = {
    hooksRefresh: () => { if (hooks) hooks.refresh(); },
    markReads: () => { readMark = hooks ? hooks.reads.length : 0; },
    armWatches: (id) => { if (hooks) hooks.armWatches(id); },
    poseWatch: (stepId) => {
      if (!hooks) return null;
      const hits = hooks.drainWatches();
      const stores = hits.filter((hit) => hit.kind === 'store' && hit.id !== 'mirror' && hit.id !== 'mirrora');
      if (stepId === 'pose-after-edit') {
        const mirrorPos = ctx.l.sim.read(0xa031eeb0 + 0x0a, 2);
        const saved = mirrorPos[0] | (mirrorPos[1] << 8);
        return stores.filter((hit) => hit.value === saved).map((hit) => hit.id + '=' + hit.value);
      }
      return stores.map((hit) => hit.id + '@' + hit.pc.toString(16));
    },
    readGetter: (key, index) => assertRead(() => readGetter(ctx, key, index)),
    writerCount: () => (hooks ? hooks.counts.writer : null),
    refreshProblems: () => {
      if (!refresh) return { problems: ['no recorder'], windows: 0, calls: 0, outside: 0 };
      const calls = refresh.windows.reduce((n, w) => n + w.calls.length, 0) + refresh.outside.length;
      return { problems: refresh.problems(), windows: refresh.windows.length, calls, outside: refresh.outside.length };
    },
    shot: (name) => ctx.shot(name),
  };
  await body({ gate, observe });
}
