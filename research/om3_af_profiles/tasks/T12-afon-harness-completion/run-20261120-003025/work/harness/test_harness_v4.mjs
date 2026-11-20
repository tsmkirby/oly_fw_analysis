// Unit tests of the T13 import set. Every emulator object here is fake.
// EMULATOR-ONLY labels live on the modules under test. This file starts no session.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareState, planProblems } from './compare_v4.mjs';
import { checkTable } from './check_table_v3.mjs';
import { fromDeclared } from './expect_v3.mjs';
import { classifyCommit, createGate } from './gate_v4.mjs';
import { assertCoverage, coverageProblems, operationPlan } from './identity_v3.mjs';
import { judgeDown } from './judge_v3.mjs';
import { createPoseGate } from './predicates_v3.mjs';
import { installRefresh } from './refresh_v3.mjs';
import { assertClean, PLANTS, scanText } from './static_check_v8.mjs';
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
    s: { key() {}, camapp: { pump() {} }, screen() { return 'shooting'; } },
  };
  ctx.s['dial_' + 'input'] = () => {};
  return ctx;
}

function openGate(state, plan, approve) {
  const ctx = fakeCtx();
  const gate = createGate(ctx, {
    capture() { return JSON.parse(JSON.stringify(state)); },
    idle() {},
    identityNow() { return { title: state.title || 'screen', highlight: null, screen: 'shooting' }; },
    plan: () => plan,
    approve: (step, actual) => approve(step, actual),
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
}, () => {}));
check('unmarked commit refused', unmarked === 1 && unmarkedError && String(unmarkedError.message).includes('refuse'));

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

const plan = operationPlan();
const rows = {};
for (const key of plan.keys) rows[key] = { title: 't', highlight: null, screen: 'shooting' };
check('static key in the plan', plan.keys.includes('k1e:ke-s1-down'));
check('zone release in the plan', plan.keys.includes('k1e:zone-z0-s1-up'));
check('display commit in the plan', plan.keys.includes('display:seed-a-e0'));
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

function spawnProbe(tag, mode) {
  return spawnSync(process.execPath, [
    '--import', './work/harness/inventory_register_v3.mjs',
    'work/harness/inventory_probe_v3.mjs',
    mode,
  ], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      T12_INVENTORY_TAG: tag,
      OM_EMU_MODEL: 'E147',
      OM_EMU_NVRAM: 'off',
    },
  });
}

const readProbe = spawnProbe('unit-read', 'read');
const cmdPath = resolve(root, 'work/out/cmd/unit-read.json');
const exitPath = resolve(root, 'work/out/inventory-unit-read-exit.json');
const cmd = existsSync(cmdPath) ? JSON.parse(readFileSync(cmdPath, 'utf8')) : null;
const exit = existsSync(exitPath) ? JSON.parse(readFileSync(exitPath, 'utf8')) : null;
check('inventory read exits', readProbe.status === 0 && exit && exit.ok === true, readProbe.stderr || (exit && exit.problems && exit.problems.join(';')));
check('command records argv', cmd && Array.isArray(cmd.argv) && cmd.argv.length > 0);
check('command records execArgv', cmd && cmd.execArgv && cmd.execArgv.includes('--import'));
check('exit records execArgv', exit && exit.execArgv && exit.execArgv.includes('--import'));
check('read file is inventoried', exit && exit.imports.some((row) => String(row.path).replaceAll('\\', '/').endsWith('work/harness/predicates_v3.mjs')));
const throwProbe = spawnProbe('unit-throw', 'throw');
const throwExit = resolve(root, 'work/out/inventory-unit-throw-exit.json');
check('throw path writes the exit check', throwProbe.status !== 0 && existsSync(throwExit));

mkdirSync(resolve(root, 'work/out'), { recursive: true });
const summary = (failed ? 'FAIL ' : 'PASS ') + failed + '\n' + lines.join('\n') + '\n';
writeFileSync(resolve(root, 'work/out/test-harness-v4.txt'), summary);
process.stdout.write(summary);
if (failed) process.exitCode = 1;
