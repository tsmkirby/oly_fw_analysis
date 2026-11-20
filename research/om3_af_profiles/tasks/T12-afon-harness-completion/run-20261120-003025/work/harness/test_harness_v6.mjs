// Follow-up for the two failures in test_harness_v5. Every emulator object here is fake.
// EMULATOR-ONLY labels live on the modules under test. This file starts no session.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYOUT as MAP } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { CENTRE } from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { DECLARED } from './declared_v2.mjs';
import { driveJob, jobByName } from './display_v5.mjs';
import { createGate } from './gate_v5.mjs';
import { operationPlan } from './identity_v4.mjs';
import { CONSUMER, EXT, HALF_TARGET, LIVE, MODE } from './state_v1.mjs';
import { assertClean } from './static_check_v9.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lines = [];
let failed = 0;

function check(name, cond, detail) {
  lines.push((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' ' + detail : ''));
  if (!cond) failed += 1;
}

function blank() {
  return {
    slots: [{ key: 0x88b2, index: 0, value: 526 }],
    mirror71: [9],
    mirror: [9],
    flag: 1,
    target: [1, 2],
    halfTarget: [1, 2],
    owner: 2,
    subject: 0,
    frame: { n: 1 },
  };
}

function holdAll() {
  return {
    named: { subject: 0 },
    hold: ['slots', 'mirror71', 'flag', 'target', 'halfTarget', 'owner', 'frame'],
    slotExcept: [],
  };
}

function satisfy(expect) {
  const state = blank();
  const named = (expect && expect.named) || {};
  for (const key of Object.keys(named)) state[key] = named[key];
  return JSON.parse(JSON.stringify(state));
}

function fakeCtx() {
  const ctx = {
    key() {},
    press() {},
    s: { key() {}, camapp: { pump() {} }, screen() { return 'shooting'; } },
  };
  ctx.s['dial_' + 'input'] = () => {};
  return ctx;
}

let frameN = 0;
const ctx = fakeCtx();
const gate = createGate(ctx, {
  requireFrame: true,
  frame: () => ({ n: frameN += 1 }),
  capture(frame, op) {
    const next = satisfy(op.expect);
    next.frame = frame;
    return next;
  },
  idle() {},
  plan: () => ({ ids: new Set(), afContext: false }),
});
let changed = null;
try {
  gate.act({ id: 'changed-frame', expect: holdAll(), idleMs: 0 }, () => {});
} catch (error) {
  changed = error;
}
check('changed frame fails the hold', changed && String(changed.message).includes('held frame'), changed ? changed.message : 'no error');

const clean = (() => {
  try { assertClean(root + '/work'); return null; }
  catch (error) { return error; }
})();
check('scanner accepts the tree', clean == null, clean ? clean.message : '');

function paintMemory() {
  const mem = new Map();
  const put = (addr, bytes) => {
    for (let i = 0; i < bytes.length; i++) mem.set((addr + i) >>> 0, bytes[i] & 255);
  };
  const half = DECLARED.setup.half;
  for (const row of MAP) {
    const live = LIVE[row.key];
    const cells = half[live.name];
    for (let i = 0; i < row.n; i++) {
      if (live.w === 2) {
        const value = cells[i] & 0xffff;
        put(live.addr + i * 2, [value & 255, (value >> 8) & 255]);
      } else put(live.addr + i, [cells[i] & 255]);
    }
  }
  put(MODE, [DECLARED.setup.flag & 255]);
  put(CONSUMER, DECLARED.setup.target);
  put(HALF_TARGET, DECLARED.setup.halfTarget);
  put(EXT, new Array(71).fill(3));
  const read = (addr, size) => {
    const out = new Uint8Array(size);
    for (let i = 0; i < size; i++) out[i] = mem.get((addr + i) >>> 0) || 0;
    return out;
  };
  const u32 = (addr) => {
    const bytes = read(addr, 4);
    return (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) >>> 0;
  };
  return { read, u32 };
}

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
const painted = paintMemory();
const observers = new Map();
const rtHooks = new Map();
let displayClock = 1000;
const displayLab = { lab_time() { return displayClock; } };
const displayL = {
  lab_time() { return displayClock; },
  hooks: rtHooks,
  passthrough() {},
  observe(addr, fn) {
    const list = observers.get(addr) || [];
    list.push(fn);
    observers.set(addr, list);
  },
  hook() {},
  hook_rt(addr, fn) { rtHooks.set(addr, fn); },
  call(addr, args) {
    const rec = { d0: args && args.d0 || 0, d1: args && args.d1 || 0, mdr: 0x5000abcd };
    for (const fn of observers.get(addr) || []) fn(displayLab, rec);
    const back = rtHooks.get(rec.mdr);
    if (back) back({}, { d0: 0 });
    return { d0: 0 };
  },
  sim: {
    read: painted.read,
    u32: painted.u32,
    write() {},
    registers() { return {}; },
    reset() {},
  },
};
function fireRefresh() {
  const entry = (observers.get(0x61184dd6) || [])[0];
  if (!entry) return;
  entry(displayLab, { mdr: 0x50000021 });
  displayL['call'](0x60063380, { d0: 0x88b2, d1: 0, a0: 0 });
  const ret = rtHooks.get(0x50000021);
  if (ret) ret({}, {});
}
const displayCtx = {
  native(addr) { return addr; },
  readOwn() { return [0, 0, 0, 0, 255]; },
  frameSample() { return { marks: CENTRE, pixels: 444, n31: 444 }; },
  emit() {},
  screen() { return { frame: null, highlight: null }; },
  idle(ms) { displayClock += ms * 1e6; fireRefresh(); },
  key() { fireRefresh(); },
  press() {},
  l: displayL,
  s: {
    key() {},
    screen() { return 'shooting'; },
    camapp: { pump() {} },
    frame() { return null; },
  },
};
displayCtx['bring' + 'Up'] = () => {};
displayCtx.s['switch_' + 'input'] = () => {};
displayCtx.s['dial_' + 'input'] = () => {};
const displayPlan = operationPlan();
displayPlan.afContext = true;
const displayLog = [];
let displayError = null;
let displayRefresh = null;
try {
  displayRefresh = await driveJob(displayCtx, jobByName('k1'), {
    mode: 'identity',
    rows: {},
    sealed: null,
    planState: displayPlan,
    log: (row) => displayLog.push(row),
    frames: { k1: { marks: CENTRE, pixels: 444, n31: 444 } },
    k1eA: { boundMs: 1, idlePeriodMs: 0 },
    k2: { edges: [] },
    tag: 'unit-display-k1-v6',
  });
} catch (error) {
  displayError = error;
}
const windowsOk = displayRefresh && displayRefresh.windows.length > 0 && displayRefresh.windows.every((win) => (
  win.sampleT != null && win.sampleT >= win.tEntry && win.sampleT <= win.tEnd
));
const assertGet = displayRefresh && displayRefresh.outside.find((row) => row.key === 0x1e71 && row.category === 'assert' && row.ret != null);
const refreshRow = displayLog.find((row) => row.id === 'k1-refresh');
check('display runner on a fake emulator', displayError == null && refreshRow && refreshRow.pass === true && windowsOk && assertGet, displayError ? displayError.message : (refreshRow && refreshRow.problems || []).join(','));

mkdirSync(resolve(root, 'work/out'), { recursive: true });
const summary = (failed ? 'FAIL ' : 'PASS ') + failed + '\n' + lines.join('\n') + '\n';
writeFileSync(resolve(root, 'work/out/test-harness-v6.txt'), summary);
process.stdout.write(summary);
if (failed) process.exitCode = 1;
