// Unit tests of the T13 import set. Every emulator object here is fake.
// EMULATOR-ONLY labels live on the modules under test. This file starts no session.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYOUT as MAP } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { CENTRE } from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { MODE } from './afon_hooks_v7.mjs';
import { compareState, planProblems } from './compare_v4.mjs';
import { checkTable } from './check_table_v3.mjs';
import { DECLARED } from './declared_v2.mjs';
import { driveJob, jobByName } from './display_v4.mjs';
import { bindSession, driveCandidateZone } from './drive_v12.mjs';
import { fromDeclared, holdAll as holdNamed, setupExpect } from './expect_v3.mjs';
import { classifyCommit, createGate } from './gate_v5.mjs';
import { approveCommit, assertCoverage, commitPresence, coverageProblems, operationPlan } from './identity_v4.mjs';
import { judgeDown } from './judge_v3.mjs';
import { declaredGaps } from './ops_v1.mjs';
import { createPoseGate } from './predicates_v3.mjs';
import { installRefresh } from './refresh_v4.mjs';
import { runSetup } from './setup_v2.mjs';
import { CONSUMER, EXT, HALF_TARGET, LIVE, MODE as MODE_ADDR, captureState } from './state_v1.mjs';
import { assertClean, PLANTS, scanText } from './static_check_v9.mjs';
import { table } from './table_v2.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lines = [];
let failed = 0;

function check(name, cond, detail) {
  lines.push((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' ' + detail : ''));
  if (!cond) failed += 1;
}

function sha(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function blank() {
  return {
    slots: [
      { key: 0x88b2, index: 0, value: 526 },
      { key: 0x5962, index: 0, value: 1 },
    ],
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

function fakeCtx() {
  const ctx = {
    key() {},
    press() {},
    emit() {},
    idle() {},
    screen() { return { frame: null, highlight: null }; },
    s: { key() {}, camapp: { pump() {} }, screen() { return 'shooting'; } },
  };
  ctx.s['dial_' + 'input'] = () => {};
  return ctx;
}

function openGate(state, plan, approve, extra) {
  const ctx = fakeCtx();
  const gate = createGate(ctx, {
    capture() { return JSON.parse(JSON.stringify(state)); },
    idle() {},
    identityNow() { return { title: state.title || 'screen', highlight: null, screen: 'shooting' }; },
    plan: () => plan,
    approve: (step, actual) => approve(step, actual),
    ...extra,
  });
  return { ctx, gate };
}

function throws(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

function satisfy(expect) {
  const state = blank();
  const named = (expect && expect.named) || {};
  for (const key of Object.keys(named)) state[key] = named[key];
  return JSON.parse(JSON.stringify(state));
}

const pairs = [
  ['work/harness/afon_hooks_v7.mjs', 'ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/harness/afon_hooks_v6.mjs'],
  ['work/harness/predicates_v3.mjs', 'ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/harness/predicates_v3.mjs'],
  ['work/harness/state_v1.mjs', 'ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/harness/state_v1.mjs'],
  ['work/harness/table_v2.mjs', 'ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/harness/table_v2.mjs'],
];
for (const [copy, prior] of pairs) {
  const a = sha(resolve(root, copy));
  const b = sha(resolve(root, prior));
  const bytes = readFileSync(resolve(root, copy)).length;
  check('byte copy ' + copy, a === b, a + ' ' + bytes);
}

const tableProblems = checkTable(table);
check('table', tableProblems.length === 0, tableProblems.join('; '));

const declared = fromDeclared('candidate-af-up');
check('candidate-af-up full state', declared && planProblems(declared).length === 0, declared ? planProblems(declared).join('; ') : 'missing');
check('no seal field', !declared || !declared.seal);
check('no slot exemption', !declared || !declared.slotExcept || declared.slotExcept.length === 0);

const state = blank();
const quiet = { ids: new Set(), afContext: false };
let approved = 0;
const opened = openGate(state, quiet, () => { approved += 1; return { ok: false, problems: ['refused'], expected: null, actual: null }; });
check('no paired press', typeof opened.gate.press !== 'function');
const rawPress = throws(() => opened.ctx['press']());
check('raw press rejected', rawPress && String(rawPress.message).includes('press'));
const rawKey = throws(() => opened.ctx['key']('up', 'down'));
check('raw key rejected', rawKey && String(rawKey.message).includes('key'));
const rawSKey = throws(() => opened.ctx.s['key']('up', 'down'));
check('raw s.key rejected', rawSKey && String(rawSKey.message).includes('s.key'));

const held = throws(() => opened.gate.act({ id: 'held', expect: holdAll(), idleMs: 0 }, () => { state.slots[0].value = 527; }));
check('changed unexpected slot', held && String(held.message).includes('held slot'));

state.slots[0].value = 526;
const exemptPlan = holdAll();
exemptPlan.slotExcept = [{ key: 0x88b2, index: 0 }];
const exempt = throws(() => opened.gate.act({ id: 'exempt', expect: exemptPlan, idleMs: 0 }, () => { state.slots[0].value = 527; }));
check('changed exempt-looking slot', exempt && String(exempt.message).includes('undeclared slot exemption') && String(exempt.message).includes('held slot'));

state.slots[0].value = 526;
const wrongPlan = holdAll();
wrongPlan.named = { ...wrongPlan.named, owner: 9 };
wrongPlan.hold = wrongPlan.hold.filter((field) => field !== 'owner');
const wrong = throws(() => opened.gate.act({ id: 'owner', expect: wrongPlan, idleMs: 0 }, () => {}));
check('wrong declared value', wrong && String(wrong.message).includes('owner'));
check('shape-only compare still values', compareState(blank(), { ...blank(), owner: 4 }, wrongPlan).includes('owner'));

check('ok is a commit without a caller flag', classifyCommit({ id: 'mark', key: 'ok', commitClass: false }, quiet) === true);
check('afon outside commit context', classifyCommit({ id: 'mark', key: 'afon', commitClass: true }, quiet) === false);
check('afon in commit context', classifyCommit({ id: 'mark', key: 'afon' }, { ids: new Set(), afContext: true }) === true);

let unmarked = 0;
const unmarkedGate = openGate(blank(), quiet, () => {
  unmarked += 1;
  return { ok: false, problems: ['refuse commit: no expectation key'], expected: null, actual: null };
});
const unmarkedError = throws(() => unmarkedGate.gate.act({
  id: 'unmarked', key: 'ok', dir: 'down', commitClass: false, expect: holdAll(), idleMs: 0,
}, () => { unmarked += 1; }));
check('unmarked commit refused before delivery', unmarked === 0 && unmarkedError && String(unmarkedError.message).includes('refuse'));

const screen = { title: 'before' };
const releaseState = blank();
const releaseCtx = fakeCtx();
releaseCtx.key = () => { screen.title = 'during'; };
let releaseActual = null;
const releaseGate = createGate(releaseCtx, {
  capture() { return JSON.parse(JSON.stringify(releaseState)); },
  idle() {},
  identityNow() { return { title: screen.title, highlight: null, screen: 'shooting' }; },
  plan: () => ({ ids: new Set(['candidate-af-up']), afContext: true }),
  approve(_step, actual) {
    releaseActual = actual;
    return { ok: true, problems: [], expected: { title: 'sealed-after', highlight: null, screen: 'shooting' }, actual, key: 'k1e:ke-s1-up' };
  },
});
const released = releaseGate.key({
  id: 'candidate-af-up',
  key: 'afon',
  dir: 'up',
  commitClass: false,
  identity: { id: 'ke-s1-up', identityFrom: 'k1e:ke-s1-up', recordRole: 'candidate', commit: true },
  expect: holdAll(),
  settle() { screen.title = 'after'; },
});
check('identity after the key', releaseActual && releaseActual.title === 'after');
check('success retains expected and actual', released.identity && released.identity.expected.title === 'sealed-after' && released.identity.actual.title === 'after');

let missingDelivered = 0;
const missingCtx = fakeCtx();
missingCtx.key = () => { missingDelivered += 1; };
const missingSealed = { sealed: true, sha256: 'abc', rows: {} };
const missingGate = createGate(missingCtx, {
  capture() { return blank(); },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => ({ ids: new Set(['mark']), afContext: false }),
  presence: (step) => commitPresence('proof', missingSealed, step),
  approve: (step, actual) => approveCommit('proof', missingSealed, step, actual, {}),
});
const missingRow = throws(() => missingGate.key({
  id: 'mark', key: 'ok', dir: 'down', expect: holdAll(), idleMs: 0,
  identity: { identityFrom: 'k1e:ke-s1-down', recordRole: 'k1e', commit: true },
}));
check('missing sealed row delivers zero inputs', missingDelivered === 0 && missingRow && String(missingRow.message).includes('no k1e:ke-s1-down'));

let presentDelivered = 0;
const presentCtx = fakeCtx();
presentCtx.key = () => { presentDelivered += 1; };
const presentSealed = {
  sealed: true,
  sha256: 'abc',
  rows: { 'k1e:ke-s1-down': { title: 't', highlight: null, screen: 'shooting' } },
};
const presentGate = createGate(presentCtx, {
  capture() { return blank(); },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => ({ ids: new Set(['mark']), afContext: false }),
  presence: (step) => commitPresence('proof', presentSealed, step),
  approve: (step, actual) => approveCommit('proof', presentSealed, step, actual, {}),
});
const presentRow = presentGate.key({
  id: 'mark', key: 'ok', dir: 'down', expect: holdAll(), idleMs: 0,
  identity: { identityFrom: 'k1e:ke-s1-down', recordRole: 'k1e', commit: true },
});
check('present sealed row delivers the key', presentDelivered === 1 && presentRow && presentRow.identity && presentRow.identity.expected.title === 't');

let frameN = 0;
const nullFrame = openGate(blank(), quiet, () => ({ ok: true, problems: [], expected: null, actual: null }), {
  requireFrame: true,
  frame: () => null,
});
const nullFrameError = throws(() => nullFrame.gate.act({ id: 'null-frame', expect: holdAll(), idleMs: 0 }, () => {}));
check('null frame refused', nullFrameError && String(nullFrameError.message).includes('null frame'));

const changedFrame = openGate(blank(), quiet, () => ({ ok: true, problems: [], expected: null, actual: null }), {
  requireFrame: true,
  frame: () => ({ n: frameN += 1 }),
  capture(_frame, op) { return satisfy(op.expect); },
});
const changedFrameError = throws(() => changedFrame.gate.act({ id: 'changed-frame', expect: holdAll(), idleMs: 0 }, () => {}));
check('changed frame fails the hold', changedFrameError && String(changedFrameError.message).includes('held frame'));

const stableFrame = { boxes: [], pixels: 1, n31: 1, sha256: 'stable' };
const stableGate = openGate(blank(), quiet, () => ({ ok: true, problems: [], expected: null, actual: null }), {
  requireFrame: true,
  frame: () => stableFrame,
  capture(frame, op) {
    const next = satisfy(op.expect);
    next.frame = frame;
    return next;
  },
});
const stableResult = stableGate.gate.act({ id: 'stable-frame', expect: holdAll(), idleMs: 0 }, () => {});
check('stable frame passes the hold', stableResult && stableResult.frame && stableResult.frame.sha256 === 'stable');

const setupCounts = { up: 0, lever: 0, calls: [] };
const setupCtx = fakeCtx();
setupCtx['bring' + 'Up'] = () => { setupCounts.up += 1; };
setupCtx.s['switch_' + 'input'] = () => { setupCounts.lever += 1; };
setupCtx.native = function native(addr) { return addr; };
setupCtx.l = {
  call(_addr, args) {
    setupCounts.calls.push(args ? args.d1 : null);
    return { d0: 41 };
  },
};
const setupIds = [];
const setupGate = createGate(setupCtx, {
  capture(_frame, op) { return satisfy(op.expect); },
  idle() {},
  plan: () => quiet,
  onState(op) { setupIds.push(op.id); },
});
await runSetup(setupCtx, { A() { return 7; } }, setupGate, (suffix, idleMs) => ({
  id: 'role-' + suffix,
  idleMs,
  expect: suffix === 'bring-up' || suffix === 'focus-1712' ? setupExpect() : holdNamed(),
}));
check('setup is five gated steps', setupIds.join(',') === 'role-bring-up,role-lever,role-focus-arg,role-focus-289,role-focus-1712');
check('setup argument flows into the next call', setupCounts.up === 1 && setupCounts.lever === 1 && setupCounts.calls.length === 3 && setupCounts.calls[1] === 41 && setupCounts.calls[2] === 0);

const plan = operationPlan();
const rows = {};
for (const key of plan.keys) rows[key] = { title: 't', highlight: null, screen: 'shooting' };
check('static key in the plan', plan.keys.includes('k1e:ke-s1-down'));
check('zone release in the plan', plan.keys.includes('k1e:zone-z0-s1-up'));
check('display commit in the plan', plan.keys.includes('display:seed-a-e0'));
let droppedOk = 0;
for (const key of plan.keys) {
  const copy = { ...rows };
  delete copy[key];
  if (coverageProblems(copy, plan).length === 0) droppedOk += 1;
}
check('every plan key is required', droppedOk === 0 && plan.keys.length > 3, String(plan.keys.length));
const gaps = declaredGaps();
check('declared ids match the generator', gaps.missing.length === 0 && gaps.extra.length === 0, 'missing ' + gaps.missing.length + ' extra ' + gaps.extra.length);
delete rows['k1e:ke-s1-down'];
delete rows['k1e:zone-z0-s1-up'];
delete rows['display:seed-a-e0'];
const missing = coverageProblems(rows, plan);
check('missing static row', missing.some((item) => item.includes('k1e:ke-s1-down')));
check('missing dynamic zone row', missing.some((item) => item.includes('k1e:zone-z0-s1-up')));
check('missing display row', missing.some((item) => item.includes('display:seed-a-e0')));
const coverageError = throws(() => assertCoverage(rows, plan));
check('missing rows refuse the session', coverageError && String(coverageError.message).includes('identity coverage'));

const pose = createPoseGate();
const write = { mode: 0, key: 0x5962, index: 0, value: 1, live: 0, mirrored: 1, bank: 1 };
pose.issue();
const refusedOff = pose.decide(write);
pose.setWatch(true);
const refusedOn = pose.decide(write);
pose.setWatch(false);
const refusedAgain = pose.decide(write);
check('watch toggle does not change pose refusal', refusedOff === true && refusedOn === true && refusedAgain === true);
const predicateSrc = readFileSync(resolve(root, 'work/harness/predicates_v3.mjs'), 'utf8');
const decideAt = predicateSrc.indexOf('decide(write)');
const decideLine = predicateSrc.slice(decideAt, predicateSrc.indexOf('\n', decideAt));
check('decide does not read the watch', decideAt >= 0 && !decideLine.includes('watch'));
const hookSrc = readFileSync(resolve(root, 'work/harness/afon_hooks_v7.mjs'), 'utf8');
const callAt = hookSrc.indexOf('poseGate.decide(');
const callText = hookSrc.slice(callAt, hookSrc.indexOf(');', callAt));
check('hook decide call omits the watch', callAt >= 0 && !callText.includes('watch'));

const step = table.steps.find((item) => item.action === 'key' && item.who.includes('k1e') && item.who.includes('candidate'));
const badActual = { subject: 0, poseWord: step.pose, half: null, owner: -1, target: null, halfTarget: null, flag: -1 };
const controlJudge = judgeDown('k1e', step, badActual);
const candidateJudge = judgeDown('candidate', step, badActual);
check('control-role judge compares values', controlJudge.length > 0, controlJudge.join(','));
check('candidate judge compares values', candidateJudge.length > 0, candidateJudge.join(','));

for (const [name, text] of PLANTS) {
  const hit = scanText('planted-' + name + '.mjs', text);
  check('planted ' + name, hit.some((item) => item.endsWith(' ' + name)), hit.join(','));
}
const cleanError = throws(() => assertClean(root + '/work'));
check('scanner accepts the tree', cleanError == null, cleanError ? cleanError.message : '');

let clock = 1000;
const hooks = new Map();
let entryFn = null;
const refreshCtx = {
  native(addr) { return addr; },
  l: {
    lab_time() { return clock; },
    hooks,
    passthrough() {},
    observe(_addr, fn) { entryFn = fn; },
    hook_rt(addr, fn) { hooks.set(addr, fn); },
  },
};
const refresh = installRefresh(refreshCtx, {});
const lab = { lab_time() { return clock; } };
clock = 1000;
entryFn(lab, { mdr: 0x50000010 });
clock = 1100;
const kept = refresh.noteGetter({ key: 1, index: 0, back: 1, ret: 42 }, null);
const substituted = refresh.noteGetter({ key: 2, index: 0, back: 2, ret: 7, substituted: true }, null);
clock = 1500;
hooks.get(0x50000010)({}, {});
refresh.sample('sig-a', 1200);
refresh.sample('sig-later', 9000);
clock = 2000;
entryFn(lab, { mdr: 0x50000010 });
clock = 2500;
hooks.get(0x50000010)({}, {});
refresh.sample('sig-late', 4000);
refresh.sample('sig-b', 2200);
refresh.sample('sig-after', 5000);
const outside = refresh.noteGetter({ key: 3, index: 0, back: 3, ret: 1 }, 'setup');
const orphan = refresh.noteGetter({ key: 4, index: 0, back: 4, ret: 1 }, null);
refresh.noteGetter({ key: 5, index: 0, back: 5, ret: null }, 'boot');
const recorderProblems = refresh.problems();
check('passthrough return kept', kept.ret === 42 && kept.refresh === 'r0');
check('substitution kept', substituted.ret === 7 && substituted.substituted === true);
check('outside getter categorised', outside.category === 'setup' && refresh.outside.includes(outside));
check('uncategorised getter is an orphan', refresh.orphans.includes(orphan) && recorderProblems.includes('orphan'));
check('null outside fails', recorderProblems.includes('null-outside'));
check('window keeps its own sample', refresh.windows[0].sig === 'sig-a' && refresh.windows[1].sig === 'sig-b');
check('later sample does not replace', refresh.windows[0].sig !== 'sig-later' && refresh.windows[1].sig !== 'sig-late' && refresh.windows[1].sig !== 'sig-after');
check('windows stamped', !recorderProblems.some((item) => item.startsWith('unstamped')));

let hookPasses = 0;
const hookMap = new Map();
const observed = new Map();
const hookCtx = {
  native(addr) { return addr; },
  l: {
    lab_time() { return 5; },
    hooks: hookMap,
    passthrough() { hookPasses += 1; },
    observe(addr, fn) {
      const list = observed.get(addr) || [];
      list.push(fn);
      observed.set(addr, list);
    },
    hook_rt(addr, fn) { hookMap.set(addr, fn); },
  },
};
const hooked = installRefresh(hookCtx, { hookGetter: true, category: () => 'assert' });
const getterObs = observed.get(0x60063380)[0];
getterObs({ lab_time() { return 5; } }, { d0: 0x1e71, d1: 0, mdr: 0x5000abcd });
hookMap.get(0x5000abcd)({}, { d0: 9 });
const asserted = hooked.outside.find((row) => row.key === 0x1e71);
check('return hook fills the getter', asserted && asserted.ret === 9 && asserted.category === 'assert' && hookPasses === 1);

let sampleClock = 50;
const sampleHooks = new Map();
let sampleEntry = null;
const sampleCtx = {
  native(addr) { return addr; },
  l: {
    lab_time() { return sampleClock; },
    hooks: sampleHooks,
    passthrough() {},
    observe(_addr, fn) { sampleEntry = fn; },
    hook_rt(addr, fn) { sampleHooks.set(addr, fn); },
  },
};
let openDuringSample = false;
const sampled = installRefresh(sampleCtx, {
  sampleNow(win) {
    openDuringSample = win.tEnd == null;
    sampled.sample('inside', sampleClock);
  },
});
sampleEntry({ lab_time() { return sampleClock; } }, { mdr: 0x50000021 });
sampleClock = 80;
sampleHooks.get(0x50000021)({}, {});
sampled.sample('later', 90);
const sampleWin = sampled.windows[0];
check('sample taken inside the open window', openDuringSample && sampleWin.sampleT === 50 && sampleWin.tEntry === 50 && sampleWin.tEnd === 80 && sampleWin.sig === 'inside');

const down = DECLARED.steps['zcand-custom-af-down'];
const up = DECLARED.steps['zcand-custom-af-up'];
const zonePlan = operationPlan();
let modeWrites = 0;
const zoneCtx = fakeCtx();
zoneCtx.native = function native(addr) { return addr; };
zoneCtx.l = {
  call() { return { d0: 0 }; },
  sim: {
    write(addr) { if (addr === MODE) modeWrites += 1; },
    read() { return new Uint8Array(8); },
    registers() { return {}; },
    reset() {},
  },
};
const zoneGate = createGate(zoneCtx, {
  capture(_frame, op) { return satisfy(op.expect); },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => zonePlan,
  approve(_step, actual) {
    return { ok: true, problems: [], expected: { title: 't', highlight: null, screen: 'shooting' }, actual, key: 'k' };
  },
});
const zonePose = { deliver() {} };
zonePose['set' + 'Pose'] = function poseName() {};
bindSession(zoneGate, zoneCtx, zonePose);
const zoneStore = {
  rows: [{
    id: 'custom',
    zone0: 0,
    press: down.target,
    release: up.target,
    cells: { k84d1: [0], k1dd1: [0, 0], k88b2: [0], k9a41: [0], k1df1: [0] },
  }],
};
const zoneLog = [];
let zoneError = null;
try {
  driveCandidateZone(zoneCtx, zoneGate, { enter() {}, refresh() {}, counts: { writer: 7 } }, zonePlan, zoneStore, {}, (row) => zoneLog.push(row));
} catch (error) {
  zoneError = error;
}
const modeStep = zoneLog.find((row) => row.id === 'zone-writer-calls');
check('custom zone reaches the mode step', zoneError == null && modeWrites > 0 && modeStep && modeStep.pass === true, zoneError ? zoneError.message : '');

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
  put(MODE_ADDR, [DECLARED.setup.flag & 255]);
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
    tag: 'unit-display-k1',
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

function spawnProbe(tag, mode, extra) {
  return spawnSync(process.execPath, [
    '--import', './work/harness/inventory_register_v4.mjs',
    'work/harness/inventory_probe_v4.mjs',
    mode,
  ], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      T12_INVENTORY_TAG: tag,
      OM_EMU_MODEL: 'E147',
      OM_EMU_NVRAM: 'off',
      ...extra,
    },
  });
}

const inputProbe = spawnProbe('unit-inputs-v4', 'inputs');
const inputExitPath = resolve(root, 'work/out/inventory-unit-inputs-v4-exit.json');
const inputCmdPath = resolve(root, 'work/out/cmd/unit-inputs-v4.json');
const inputExit = existsSync(inputExitPath) ? JSON.parse(readFileSync(inputExitPath, 'utf8')) : null;
const inputCmd = existsSync(inputCmdPath) ? JSON.parse(readFileSync(inputCmdPath, 'utf8')) : null;
const inputPaths = inputExit ? inputExit.imports.map((row) => String(row.path).replaceAll('\\', '/')) : [];
check('inventory inputs exit', inputProbe.status === 0 && inputExit && inputExit.ok === true, inputProbe.stderr || (inputExit && inputExit.problems && inputExit.problems.join(';')));
check('command records argv', inputCmd && Array.isArray(inputCmd.argv) && inputCmd.argv.length > 0);
check('command records execArgv', inputCmd && inputCmd.execArgv && inputCmd.execArgv.includes('--import'));
check('exit records execArgv', inputExit && inputExit.execArgv && inputExit.execArgv.includes('--import'));
check('T6 overlay read is inventoried', inputPaths.some((path) => path.endsWith('overlay-changed-bytes.csv')));
check('firmware block read is inventoried', inputPaths.some((path) => path.includes('blk00000000')));
check('resource block read is inventoried', inputPaths.some((path) => path.includes('blk02000000')));
const nandNote = inputExit && inputExit.notes.find((row) => row.kind === 'loadNand');
check('empty NAND is recorded at read time', nandNote && nandNote.empty === true && nandNote.backing == null);

const throwProbe = spawnProbe('unit-throw-v4', 'throw');
const throwExit = resolve(root, 'work/out/inventory-unit-throw-v4-exit.json');
check('throw path writes the exit check', throwProbe.status !== 0 && existsSync(throwExit));

const initProbe = spawnProbe('unit-init-v4', 'ok', { T12_INVENTORY_FAIL: '1' });
const initExit = resolve(root, 'work/out/inventory-unit-init-v4-exit.json');
check('init failure still writes the exit check', initProbe.status !== 0 && existsSync(initExit) && String(initProbe.stderr).includes('inventory init failed'));

mkdirSync(resolve(root, 'work/out'), { recursive: true });
const summary = (failed ? 'FAIL ' : 'PASS ') + failed + '\n' + lines.join('\n') + '\n';
writeFileSync(resolve(root, 'work/out/test-harness-v5.txt'), summary);
process.stdout.write(summary);
if (failed) process.exitCode = 1;
