// T12b harness tests. Every emulator object is a fake. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkTable } from './check_table_v3.mjs';
import { compareState, planProblems } from './compare_v4.mjs';
import { drive } from './driver_v1.mjs';
import { runWithGate } from './entry_v1.mjs';
import { classifyCommit, createGate } from './gate_v6.mjs';
import { approveCommit, commitPresence } from './identity_v5.mjs';
import { unclassifiedPromises } from './inventory_v5.mjs';
import { freezeProblems } from './inventory_v5.mjs';
import {
  OPERATIONS,
  coverageIds,
  executionCoverageProblems,
  identitySpecs,
} from './operations_v1.mjs';
import { createPoseGate } from './predicates_v3.mjs';
import { installRefresh } from './refresh_v4.mjs';
import { DRIVER_FILES, RUNNER_FILES, checkFiles, importProblems } from './static_check_v1.mjs';
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

function throws(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

function restore(saved) {
  OPERATIONS.length = 0;
  for (const op of saved) OPERATIONS.push(op);
}

const prior = 'ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/harness/';
const copies = [
  ['work/harness/afon_hooks_v8.mjs', prior + 'afon_hooks_v7.mjs'],
  ['work/harness/predicates_v3.mjs', prior + 'predicates_v3.mjs'],
  ['work/harness/state_v1.mjs', prior + 'state_v1.mjs'],
  ['work/harness/table_v2.mjs', prior + 'table_v2.mjs'],
  ['work/harness/compare_v4.mjs', prior + 'compare_v4.mjs'],
  ['work/harness/refresh_v4.mjs', prior + 'refresh_v4.mjs'],
];
for (const [copy, source] of copies) {
  const a = sha(resolve(root, copy));
  const b = sha(resolve(root, source));
  check('byte copy ' + copy, a === b, a);
}

const tableProblems = checkTable(table);
check('table', tableProblems.length === 0, tableProblems.join('; '));

const hookText = readFileSync(resolve(root, 'work/harness/afon_hooks_v8.mjs'), 'utf8');
check('hook contains bank', hookText.includes('const bank = () =>'));
check('hook contains initMirror', hookText.includes('const initMirror = () =>'));
const decideAt = hookText.indexOf('poseGate.decide({');
const decideEnd = hookText.indexOf('});', decideAt);
const decideText = hookText.slice(decideAt, decideEnd);
check('hook decide omits the watch', decideAt >= 0 && !decideText.includes('watch'));
const predicateText = readFileSync(resolve(root, 'work/harness/predicates_v3.mjs'), 'utf8');
const decideLine = predicateText.slice(predicateText.indexOf('decide(write)'));
check('predicate decide does not read the watch', decideLine.startsWith('decide(write)') && !decideLine.slice(0, 80).includes('watchArmed'));

const pose = createPoseGate();
const sample = { mode: 0, key: 0x5962, index: 1, value: 1, live: 0, mirrored: 1, bank: 0 };
const refusedOff = pose.decide(sample);
pose.setWatch(true);
const refusedOn = pose.decide(sample);
pose.setWatch(false);
const refusedAgain = pose.decide(sample);
check('watch toggle does not change pose refusal', refusedOff === true && refusedOn === true && refusedAgain === true);

const quiet = { ids: new Set(), afContext: false };
check('ok is a commit without a caller flag', classifyCommit({ id: 'mark', key: 'ok', commitClass: 'none' }, quiet) === true);
check('afon outside commit context', classifyCommit({ id: 'mark', key: 'afon', commitClass: 'commit' }, quiet) === false);
check('afon in commit context', classifyCommit({ id: 'mark', key: 'afon' }, { ids: new Set(), afContext: true }) === true);

const state = blank();
const opened = createGate({ key() {}, press() {} }, {
  capture() { return JSON.parse(JSON.stringify(state)); },
  idle() {},
  identityNow() { return { title: 'screen', highlight: null, screen: 'shooting' }; },
  plan: () => quiet,
  approve: () => ({ ok: false, problems: ['refused'], expected: null, actual: null }),
});
check('gate has no press', typeof opened.press !== 'function');
const held = throws(() => opened.act({ id: 'held', expect: holdAll(), idleMs: 0 }, () => { state.slots[0].value = 527; }));
check('changed unexpected slot', held && String(held.message).includes('held slot'), held && held.message);
state.slots[0].value = 526;
const exemptPlan = holdAll();
exemptPlan.slotExcept = [{ key: 0x88b2, index: 0 }];
const exempt = throws(() => opened.act({ id: 'exempt', expect: exemptPlan, idleMs: 0 }, () => { state.slots[0].value = 527; }));
check('changed exempt-looking slot', exempt && String(exempt.message).includes('undeclared slot exemption') && String(exempt.message).includes('held slot'));
state.slots[0].value = 526;
const wrongPlan = holdAll();
wrongPlan.named = { ...wrongPlan.named, owner: 9 };
wrongPlan.hold = wrongPlan.hold.filter((field) => field !== 'owner');
const wrong = throws(() => opened.act({ id: 'owner', expect: wrongPlan, idleMs: 0 }, () => {}));
check('wrong declared value', wrong && String(wrong.message).includes('owner'));
check('seal is not a value', planProblems({ ...holdAll(), seal: [1] }).includes('seal is not a value'));
check('shape-only compare still values', compareState(blank(), { ...blank(), owner: 4 }, wrongPlan).includes('owner'));

let unmarked = 0;
const unmarkedGate = createGate({ key() { unmarked += 1; } }, {
  capture() { return blank(); },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => quiet,
  approve() { unmarked += 1; return { ok: false, problems: ['refuse commit: no expectation key'], expected: null, actual: null }; },
});
const unmarkedError = throws(() => unmarkedGate.act({
  id: 'unmarked', key: 'ok', dir: 'down', commitClass: 'none', expect: holdAll(), idleMs: 0,
}, () => { unmarked += 1; }));
check('unmarked commit refused before delivery', unmarked === 0 && unmarkedError && String(unmarkedError.message).includes('refuse'));

const screen = { title: 'before' };
let releaseActual = null;
const releaseGate = createGate({ key() { screen.title = 'during'; } }, {
  capture() { return blank(); },
  idle() {},
  identityNow() { return { title: screen.title, highlight: null, screen: 'shooting' }; },
  plan: () => ({ ids: new Set(['candidate-af-up']), afContext: true }),
  approve(_step, actual) {
    releaseActual = actual;
    return { ok: true, problems: [], expected: { title: 'sealed-after', highlight: null, screen: 'shooting' }, actual, key: 'k1e:ke-s1-up' };
  },
});
const released = releaseGate.key({
  id: 'candidate-af-up', key: 'afon', dir: 'up', commitClass: 'none', expect: holdAll(),
  identity: { identityFrom: 'k1e:ke-s1-up', recordRole: 'candidate', commit: true },
  settle() { screen.title = 'after'; },
});
check('identity after the key', releaseActual && releaseActual.title === 'after');
check('success retains expected and actual', released.identity && released.identity.expected.title === 'sealed-after' && released.identity.actual.title === 'after');

let missingDelivered = 0;
const missingSealed = { sealed: true, sha256: 'abc', rows: {} };
const missingGate = createGate({ key() { missingDelivered += 1; } }, {
  capture() { return blank(); },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => ({ ids: new Set(['mark']), afContext: false }),
  presence: (step) => commitPresence('proof', missingSealed, step),
  approve: (step, actual) => approveCommit('proof', missingSealed, step, actual, {}),
});
const missingRow = throws(() => missingGate.key({
  id: 'mark', key: 'ok', dir: 'down', commitClass: 'none', expect: holdAll(),
  identity: { identityFrom: 'k1e:ke-s1-down', recordRole: 'k1e', commit: true },
}));
check('missing sealed row delivers zero inputs', missingDelivered === 0 && missingRow && String(missingRow.message).includes('no k1e:ke-s1-down'));

let presentDelivered = 0;
const presentSealed = {
  sealed: true,
  sha256: 'abc',
  rows: { 'k1e:ke-s1-down': { title: 't', highlight: null, screen: 'shooting' } },
};
const presentGate = createGate({ key() { presentDelivered += 1; } }, {
  capture() { return blank(); },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => ({ ids: new Set(['mark']), afContext: false }),
  presence: (step) => commitPresence('proof', presentSealed, step),
  approve: (step, actual) => approveCommit('proof', presentSealed, step, actual, {}),
});
const presentRow = presentGate.key({
  id: 'mark', key: 'ok', dir: 'down', expect: holdAll(),
  identity: { identityFrom: 'k1e:ke-s1-down', recordRole: 'k1e', commit: true },
});
check('present sealed row delivers the key', presentDelivered === 1 && presentRow && presentRow.identity && presentRow.identity.expected.title === 't');

const nullFrameError = throws(() => createGate({ key() {} }, {
  requireFrame: true,
  frame: () => null,
  capture() { return blank(); },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => quiet,
  approve: () => ({ ok: true, problems: [], expected: null, actual: null }),
}).act({ id: 'null-frame', expect: holdAll(), idleMs: 0 }, () => {}));
check('null frame refused', nullFrameError && String(nullFrameError.message).includes('null frame'));

let frameN = 0;
const changedFrameError = throws(() => createGate({ key() {} }, {
  requireFrame: true,
  frame: () => ({ n: frameN += 1 }),
  capture(frame, op) {
    const next = blank();
    const named = (op.expect && op.expect.named) || {};
    for (const key of Object.keys(named)) next[key] = named[key];
    next.frame = frame;
    return next;
  },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => quiet,
  approve: () => ({ ok: true, problems: [], expected: null, actual: null }),
}).act({ id: 'changed-frame', expect: holdAll(), idleMs: 0 }, () => {}));
check('changed frame fails the hold', changedFrameError && String(changedFrameError.message).includes('held frame'));

const stableFrame = { boxes: [], pixels: 1, n31: 1, sha256: 'stable' };
const stableResult = createGate({ key() {} }, {
  requireFrame: true,
  frame: () => stableFrame,
  capture(frame) {
    const next = blank();
    next.frame = frame;
    return next;
  },
  idle() {},
  identityNow() { return { title: 't', highlight: null, screen: 'shooting' }; },
  plan: () => quiet,
  approve: () => ({ ok: true, problems: [], expected: null, actual: null }),
}).act({ id: 'stable-frame', expect: holdAll(), idleMs: 0 }, () => {});
check('stable frame passes the hold', stableResult && stableResult.frame && stableResult.frame.sha256 === 'stable');

let clock = 1000;
const hooks = new Map();
let entryFn = null;
const refresh = installRefresh({
  native(addr) { return addr; },
  l: {
    lab_time() { return clock; },
    hooks,
    passthrough() {},
    observe(_addr, fn) { entryFn = fn; },
    hook_rt(addr, fn) { hooks.set(addr, fn); },
  },
}, {});
const lab = { lab_time() { return clock; } };
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
const hooked = installRefresh({
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
}, { hookGetter: true, category: () => 'assert' });
observed.get(0x60063380)[0]({ lab_time() { return 5; } }, { d0: 0x1e71, d1: 0, mdr: 0x5000abcd });
hookMap.get(0x5000abcd)({}, { d0: 9 });
const asserted = hooked.outside.find((row) => row.key === 0x1e71);
check('return hook fills the getter', asserted && asserted.ret === 9 && asserted.category === 'assert' && hookPasses === 1);

let sampleClock = 50;
const sampleHooks = new Map();
let sampleEntry = null;
const sampled = installRefresh({
  native(addr) { return addr; },
  l: {
    lab_time() { return sampleClock; },
    hooks: sampleHooks,
    passthrough() {},
    observe(_addr, fn) { sampleEntry = fn; },
    hook_rt(addr, fn) { sampleHooks.set(addr, fn); },
  },
}, {
  sampleNow(win) {
    openDuringSample = win.tEnd == null;
    sampled.sample('inside', sampleClock);
  },
});
let openDuringSample = false;
sampleEntry({ lab_time() { return sampleClock; } }, { mdr: 0x50000021 });
sampleClock = 80;
sampleHooks.get(0x50000021)({}, {});
sampled.sample('later', 90);
const sampleWin = sampled.windows[0];
check('sample taken inside the open window', openDuringSample && sampleWin.sampleT === 50 && sampleWin.tEntry === 50 && sampleWin.tEnd === 80 && sampleWin.sig === 'inside');

const groups = {};
for (const op of OPERATIONS) groups[op.group] = (groups[op.group] || 0) + 1;
for (const name of ['setup', 'table', 'setter', 'pose', 'zone', 'custom', 'display']) {
  check('operation group ' + name, groups[name] > 0, String(groups[name] || 0));
}
check('every operation has one expectation source', OPERATIONS.every((op) => op.expectationSource === 'hold' || op.expectationSource === 'sealed-delta'));
check('commit class is commit or none', OPERATIONS.every((op) => op.commitClass === 'commit' || op.commitClass === 'none'));
const driverText = readFileSync(resolve(root, 'work/harness/driver_v1.mjs'), 'utf8');
check('driver iterates gate.operations', driverText.includes('for (const op of gate.operations())'));
check('driver has no private operation id', !driverText.includes('setup-bring-up') && !driverText.includes('ZONE_NAV'));

const staticProblems = checkFiles(RUNNER_FILES.concat(DRIVER_FILES));
check('runners and driver import only the entry', staticProblems.length === 0, staticProblems.join('; '));
const plantedText = readFileSync(resolve(root, 'work/harness/planted_runner_v1.mjs'), 'utf8');
const plantedProblems = importProblems('planted_runner_v1.mjs', plantedText);
check('planted emulator import is rejected', plantedProblems.some((item) => item.includes('om-emu')));

check('unclassified fs.promises', unclassifiedPromises().length === 0, unclassifiedPromises().join(','));
const noted = [{ path: 'a', sha256: 'aa', bytes: 1 }];
check('freeze accepts the noted file', freezeProblems(noted, { files: [{ path: 'a', sha256: 'aa', bytes: 1 }] }).length === 0);
check('freeze refuses a missing file', freezeProblems(noted, { files: [] }).some((item) => item.startsWith('missing')));
check('freeze refuses a different hash', freezeProblems(noted, { files: [{ path: 'a', sha256: 'bb', bytes: 1 }] }).some((item) => item.startsWith('differs')));

const registrarText = readFileSync(resolve(root, 'work/harness/inventory_register_v6.mjs'), 'utf8');
const exitAt = registrarText.indexOf("process.on('exit'");
const tagAt = registrarText.indexOf('T12B_INVENTORY_TAG');
check('exit handler is installed before the tag check', exitAt >= 0 && tagAt > exitAt);

try {
  await runWithGate({ session: 'real' }, async () => {});
  check('real session is refused', false, 'returned');
} catch (error) {
  check('real session is refused', String(error.message).includes('does not start the emulator'), error.message);
}

let plantedError = null;
let handleShape = null;
try {
  await runWithGate({ session: 'fake', mode: 'identity' }, async (handle) => {
    handleShape = {
      proto: Object.getPrototypeOf(handle),
      press: handle.press,
      key: handle.key,
      apply: handle.apply,
    };
    const first = handle.operations()[0];
    await handle.perform(first);
    handleShape.deliveries = handle.results().deliveries;
    const seen = new Set();
    const hits = [];
    function walk(value) {
      if (value == null) return;
      const kind = typeof value;
      if (kind !== 'object' && kind !== 'function') return;
      if (seen.has(value)) return;
      seen.add(value);
      let current = value;
      while (current && current !== Object.prototype && current !== Function.prototype) {
        for (const key of Reflect.ownKeys(current)) {
          let child;
          try { child = current[key]; }
          catch { continue; }
          if (child && typeof child === 'object' && typeof child.token === 'string' && child.token.startsWith('sess-')) hits.push('token');
        }
        current = Object.getPrototypeOf(current);
      }
    }
    walk(handle);
    for (const name of ['session', 'ctx', 'lab', 'sim', '__t12Session', '__t12bSession', '__t12Inventory']) {
      if (globalThis[name]) hits.push('global ' + name);
    }
    let importError = null;
    try { await import('om-emu/emu/src/lab/play.mjs'); }
    catch (error) { importError = error; }
    if (!importError) hits.push('import returned');
    if (hits.length) throw new Error('obtained session via ' + hits.join(','));
    throw new Error('planted runner failed to obtain the session');
  });
} catch (error) {
  plantedError = error;
}
check('handle has no prototype and no session methods', handleShape && handleShape.proto === null && handleShape.press === undefined && handleShape.key === undefined && handleShape.apply === undefined && handleShape.deliveries === 1);
check('planted runner cannot obtain the session', plantedError && plantedError.message === 'planted runner failed to obtain the session', plantedError && plantedError.message);

const savedForDelta = OPERATIONS.slice();
OPERATIONS.length = 0;
OPERATIONS.push(savedForDelta.find((op) => op.id === 'setup-bring-up'));
try {
  const ident = await drive({
    kind: 'identity',
    mode: 'identity',
    session: 'fake',
    setupApply(state) { state.flag = 7; },
  });
  const delta = ident.results.setupDeltas['setup-bring-up'];
  check('identity pass seals the observed setup delta', delta && delta.changed && delta.changed.flag === 7, JSON.stringify(delta));
  const sealed = { sealed: true, sha256: 'abc', rows: {}, setupDeltas: ident.results.setupDeltas };
  const same = await drive({
    kind: 'proof', mode: 'proof', session: 'fake', sealed,
    setupApply(state) { state.flag = 7; },
  });
  check('proof passes on the sealed setup change', same.executed.length === 1 && same.results.deliveries === 1);
  let different = null;
  try {
    await drive({
      kind: 'proof', mode: 'proof', session: 'fake', sealed,
      setupApply(state) { state.flag = 9; },
    });
  } catch (error) { different = error; }
  check('proof fails on a different setup change', different && String(different.message).includes('flag'), different && different.message);
} finally {
  restore(savedForDelta);
}

const beforeIds = coverageIds();
check('setup-lever is in the shared definition list', beforeIds.includes('setup-lever'));
const savedForDelete = OPERATIONS.slice();
const victimAt = OPERATIONS.findIndex((op) => op.id === 'setup-lever');
const victim = OPERATIONS[victimAt];
OPERATIONS.splice(victimAt, 1);
try {
  const out = await drive({ kind: 'identity', mode: 'identity', session: 'fake' });
  check('deleting a definition removes it from execution', !out.executed.includes(victim.id) && out.executed.length === beforeIds.length - 1);
  check('deleting a definition removes it from coverage', !coverageIds().includes(victim.id) && executionCoverageProblems(out.executed).length === 0);
  check('deleting a definition removes it from the identity generator', !identitySpecs().some((spec) => spec.id === victim.id));
} finally {
  restore(savedForDelete);
}
check('definition list restored', coverageIds().length === beforeIds.length);

function spawn(args, env) {
  return spawnSync('node26', args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, ...env },
  });
}

const registrar = './work/harness/inventory_register_v6.mjs';
const initRun = spawn(['--import', registrar, 'work/scripts/inventory_init_v1.mjs'], {
  T12B_INVENTORY_TAG: '',
  T12B_INVENTORY_FAIL: '',
  T12B_FREEZE_ENFORCE: '',
  T12B_FREEZE_CAPTURE: '',
});
const initExitPath = resolve(root, 'work/out/inventory-init-exit.json');
let initExit = null;
try { initExit = JSON.parse(readFileSync(initExitPath, 'utf8')); }
catch { initExit = null; }
check('missing tag still writes a failing exit record', initRun.status !== 0 && initExit && initExit.ok === false, initRun.stderr);

const namedInit = spawn(['--import', registrar, 'work/scripts/inventory_init_v1.mjs'], {
  T12B_INVENTORY_TAG: 'unit-init',
  T12B_INVENTORY_FAIL: '1',
  T12B_FREEZE_ENFORCE: '',
  T12B_FREEZE_CAPTURE: '',
});
const namedExitPath = resolve(root, 'work/out/inventory-unit-init-exit.json');
let namedExit = null;
try { namedExit = JSON.parse(readFileSync(namedExitPath, 'utf8')); }
catch { namedExit = null; }
check('init failure still writes a failing exit record', namedInit.status !== 0 && namedExit && namedExit.ok === false && String(namedInit.stderr).includes('inventory init failed'));

mkdirSync(resolve(root, 'work/out'), { recursive: true });
writeFileSync(resolve(root, 'work/out/probe-identity.json'), JSON.stringify({ rows: { demo: 1 } }) + '\n');
writeFileSync(resolve(root, 'work/out/probe-promise.json'), '{"promise":true}\n');
writeFileSync(resolve(root, 'work/out/probe-open.txt'), 'open\n');
writeFileSync(resolve(root, 'work/out/probe-stream.txt'), 'stream\n');
writeFileSync(resolve(root, 'work/out/probe-changed.txt'), 'original\n');
const identityRun = spawn(['--import', registrar, 'work/scripts/inventory_probe_v1.mjs'], {
  T12B_INVENTORY_TAG: 'unit-identity',
  T12B_PROBE: 'identity',
  T12B_INVENTORY_FAIL: '',
  T12B_FREEZE_ENFORCE: '',
  T12B_FREEZE_CAPTURE: '',
});
const identityExitPath = resolve(root, 'work/out/inventory-unit-identity-exit.json');
let identityExit = null;
try { identityExit = JSON.parse(readFileSync(identityExitPath, 'utf8')); }
catch { identityExit = null; }
const identityPaths = identityExit ? identityExit.imports.map((row) => row.path) : [];
const identityRow = identityExit && identityExit.imports.find((row) => row.path.endsWith('/work/out/probe-identity.json'));
const identityHash = sha(resolve(root, 'work/out/probe-identity.json'));
check('identity json under work/out is recorded', identityRun.status === 0 && identityExit && identityExit.ok === true && identityRow && identityRow.sha256 === identityHash, identityRun.stderr || (identityExit && identityExit.problems.join(';')));
check('promise read is recorded', identityPaths.some((path) => path.endsWith('/work/out/probe-promise.json')));
check('open is recorded', identityPaths.some((path) => path.endsWith('/work/out/probe-open.txt')));
check('callback read is recorded', identityPaths.some((path) => path.endsWith('/work/out/probe-stream.txt')));
check('registrar output is not an input', !identityPaths.some((path) => path.endsWith('/inventory-unit-identity.jsonl') || path.endsWith('/inventory-unit-identity-exit.json')));
let identityCmd = null;
try { identityCmd = JSON.parse(readFileSync(resolve(root, 'work/out/cmd/unit-identity.json'), 'utf8')); }
catch { identityCmd = null; }
check('command records argv', identityCmd && Array.isArray(identityCmd.argv) && identityCmd.argv.length > 0, identityRun.stderr);
check('command records execArgv', identityCmd && identityCmd.execArgv && identityCmd.execArgv.includes('--import'));
check('exit records execArgv', identityExit && identityExit.execArgv && identityExit.execArgv.includes('--import'));

const changedRun = spawn(['--import', registrar, 'work/scripts/inventory_probe_v1.mjs'], {
  T12B_INVENTORY_TAG: 'unit-changed',
  T12B_PROBE: 'changed',
  T12B_INVENTORY_FAIL: '',
  T12B_FREEZE_ENFORCE: '',
  T12B_FREEZE_CAPTURE: '',
});
let changedExit = null;
try { changedExit = JSON.parse(readFileSync(resolve(root, 'work/out/inventory-unit-changed-exit.json'), 'utf8')); }
catch { changedExit = null; }
check('file changed between read and exit fails', changedRun.status !== 0 && changedExit && changedExit.ok === false && changedExit.problems.some((item) => item.includes('changed') && item.includes('probe-changed.txt')), changedRun.stderr);

mkdirSync(resolve(root, 'work/out/cmd'), { recursive: true });
writeFileSync(resolve(root, 'work/out/cmd/unit-v3.json'), JSON.stringify({
  tag: 'unit-v3',
  started: new Date().toISOString(),
  argv: process.argv.map(String),
  execArgv: process.execArgv.map(String),
  execPath: process.execPath,
  env: { OM_EMU_MODEL: null, OM_EMU_NVRAM: process.env.OM_EMU_NVRAM || null },
}, null, 2) + '\n');

writeFileSync(resolve(root, 'work/out/test-harness-v3.txt'), lines.join('\n') + '\n');
process.stdout.write(lines.join('\n') + '\n');
process.exitCode = failed ? 1 : 0;
