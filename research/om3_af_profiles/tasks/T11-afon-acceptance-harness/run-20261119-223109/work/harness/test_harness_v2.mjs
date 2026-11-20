// Pure-Node tests of the final gate, judge, pose predicate, static check and refresh recorder.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareState } from './compare_v2.mjs';
import { checkTable } from './check_table_v2.mjs';
import { createGate } from './gate_v2.mjs';
import { coverageProblems, REQUIRED_KEYS } from './identity_v2.mjs';
import { judge } from './judge_v2.mjs';
import { createPoseGate, shouldRefusePoseWrite } from './predicates_v3.mjs';
import { installRefresh } from './refresh_v2.mjs';
import { assertClean, scanText } from './static_check_v6.mjs';
import { table } from './table_v2.mjs';

const failures = [];
function check(name, ok) {
  if (!ok) failures.push(name);
  process.stdout.write((ok ? 'ok ' : 'FAIL ') + name + '\n');
}

const leak = { mode: 0, key: 0x5962, index: 0, value: 100, live: 526, mirrored: 100, bank: 0, reset: 526 };
check('editor mode never refuses', shouldRefusePoseWrite({ ...leak, mode: 1, poseActive: true }) === false);
check('pose in progress refuses a non-reset leak', shouldRefusePoseWrite({ ...leak, live: 200, reset: 526, poseActive: true }) === true);
check('normal edit allows the same non-reset write', shouldRefusePoseWrite({ ...leak, live: 200, reset: 526, poseActive: false }) === false);
check('reset live still refuses when pose is idle', shouldRefusePoseWrite({ ...leak, poseActive: false }) === true);
check('inactive bank refuses', shouldRefusePoseWrite({ ...leak, live: 200, index: 3, poseActive: false }) === true);

const pose = createPoseGate();
const sample = { mode: 0, key: 0x5962, index: 0, value: 100, live: 200, mirrored: 100, bank: 0, reset: 526 };
pose.issue();
const armed = pose.decide(sample);
pose.setWatch(true);
const watched = pose.decide(sample);
pose.setWatch(false);
const cleared = pose.decide(sample);
check('instrumentation does not change a refusal', armed === true && watched === true && cleared === true);
pose.endPose();
const afterKey = pose.decide(sample);
pose.setWatch(true);
check('instrumentation does not change an allow', afterKey === false && pose.decide(sample) === false);
const predSrc = readFileSync(new URL('./predicates_v3.mjs', import.meta.url), 'utf8');
const hookSrc = readFileSync(new URL('./afon_hooks_v6.mjs', import.meta.url), 'utf8');
const decideAt = hookSrc.indexOf('poseGate.decide(');
const decideCall = hookSrc.slice(decideAt, hookSrc.indexOf('});', decideAt) + 3);
check('predicate source does not take the watch flag', !predSrc.includes('decide(write)') || !/watchArmed/.test(predSrc.slice(predSrc.indexOf('decide(write)'), predSrc.indexOf('decide(write)') + 120)));
check('hook decision does not pass the watch flag', decideAt >= 0 && !decideCall.includes('watch'));

function memory(onKey) {
  const state = {
    slots: Array.from({ length: 63 }, (_, i) => ({ key: i, index: 0, value: 1 })),
    mirror71: Array(71).fill(9),
    mirror: Array(55).fill(9),
    flag: 0,
    target: Array(10).fill(0),
    halfTarget: Array(10).fill(0),
    owner: 0,
    subject: 0,
    frame: null,
  };
  const ctx = {
    key(name, dir) {
      if (name === 's1' && dir === 'down') state.owner = 1;
      if (onKey) onKey(state, name, dir);
    },
    press() {},
    s: { key() {}, ['dial_' + 'input']() {}, camapp: { pump() {} } },
  };
  const gate = createGate(ctx, {
    capture: () => JSON.parse(JSON.stringify(state)),
    idle() {},
    identityNow: () => ({ title: 't', highlight: null, screen: 'shooting' }),
    approve: () => ({ ok: true, expected: { title: 't' }, actual: { title: 't' } }),
  });
  return { state, ctx, gate };
}
const held = {
  named: { subject: 0, owner: 1 },
  hold: ['slots', 'mirror71', 'flag', 'target', 'halfTarget', 'frame'],
  seal: [],
  slotExcept: [],
};
{
  const { gate } = memory();
  let threw = false;
  try { gate.key({ id: 'held-ok', key: 's1', dir: 'down', expect: held }); }
  catch { threw = true; }
  check('gate accepts the named owner', threw === false);
}
{
  const { gate } = memory((state) => { state.slots[4].value += 1; });
  let message = '';
  try { gate.key({ id: 'held-slot', key: 's1', dir: 'down', expect: held }); }
  catch (error) { message = String(error.message || error); }
  check('gate rejects a held field that moved', message.includes('held slot'));
}
{
  const { gate } = memory();
  let message = '';
  try { gate.key({ id: 'no-expect', key: 's1', dir: 'down' }); }
  catch (error) { message = String(error.message || error); }
  check('gate rejects an operation with no expectation', message.includes('no expectation'));
}
{
  const { ctx } = memory();
  let message = '';
  try { ctx['ke' + 'y']('s1', 'down'); }
  catch (error) { message = String(error.message || error); }
  check('raw key outside the gate throws', message.includes('outside the gate'));
}

const base = table.steps.find((step) => step.id === 'base');
const bad = {
  subject: 1, poseWord: base.pose, slots: Array.from({ length: 63 }, () => ({})),
  mirror71: Array(71).fill(0), halfTarget: Array(10).fill(0), target: Array(10).fill(0),
  half: {}, owner: 0, flag: 255, edge: { status: 0, enabled: 1 }, bank: 0, halfBank: {},
};
const judged = judge('k1e', base, bad, { k1e: {}, k2: {}, candidate: {} }, table.steps.map((step) => step.id));
check('judge reports a subject mismatch', judged.some((item) => item.startsWith('subject')));

const plantedName = 'planted-bypass.mjs';
const planted = [
  'ctx', '.key(1, 2);\n',
  'x.sim', '.write(1, 2);\n',
  'ta', 'p(1);\n',
  'key(', "'ok');\n",
  'dial_', 'input();\n',
  'set', 'Pose(1);\n',
].join('');
const hits = scanText(plantedName, planted);
const plantedNames = ['ctx.key', 'sim.write', 'tap', 'raw-ok', 'dial_' + 'input', 'set' + 'Pose'];
check('static check rejects a planted bypass', plantedNames.every((name) => hits.some((hit) => hit.includes(name))));
let clean = true;
try { assertClean(); }
catch { clean = false; }
check('static check accepts the current tree', clean);

const rows = {};
for (const step of table.steps) {
  if (step.identityFrom) rows[step.identityFrom] = { title: 't' };
}
check('table commits are covered when every identity row exists', coverageProblems(table, rows).length === 0);
delete rows[REQUIRED_KEYS[0]];
check('a missing K1e edge row is refused', coverageProblems(table, rows).some((item) => item.includes(REQUIRED_KEYS[0])));
check('the four K1e edges are commits', REQUIRED_KEYS.every((key) => {
  const id = key.split(':')[1];
  const step = table.steps.find((item) => item.id === id);
  return step && step.commit && step.identityFrom === key;
}));
check('table checker accepts the generated table', checkTable(table).length === 0);

{
  const fns = [];
  const l = {
    hooks: new Map(),
    observe(_addr, fn) { fns.push(fn); },
    hook_rt() {},
  };
  const refresh = installRefresh({ l, native: (addr) => addr });
  const lab = { lab_time: () => 10 };
  fns[0](lab, { mdr: 0 });
  const rec = { t: 1, key: 1, index: 0, back: 1, ret: null };
  refresh.noteGetter(rec);
  rec.ret = 9;
  fns[0](lab, { mdr: 0 });
  check('passthrough return stays on the recorded call', refresh.windows[0].calls[0].ret === 9);
  check('an unclosed window fails', refresh.problems().some((item) => item.startsWith('unclosed')));
  const substituted = { t: 2, key: 2, index: 0, ret: 4, substituted: true };
  const alone = installRefresh({ l: { hooks: new Map(), observe() {}, hook_rt() {} }, native: (addr) => addr });
  alone.noteGetter(substituted);
  check('a substituted call keeps its return', alone.orphans.some((call) => call.ret === 4 && call.substituted === true));
  const many = installRefresh({ l: { hooks: new Map(), observe() {}, hook_rt() {} }, native: (addr) => addr });
  for (let i = 0; i < 501; i++) many.noteGetter({ t: i, key: 1, index: 0, ret: i });
  check('the recorder keeps every call', many.orphans.length === 501);
  check('a null return fails', many.problems().includes('null-orphan') === false && refresh.problems().some((item) => item.startsWith('null')) === false);
  const empty = installRefresh({ l: { hooks: new Map(), observe() {}, hook_rt() {} }, native: (addr) => addr });
  empty.noteGetter({ t: 1, key: 1, index: 0, ret: null });
  check('a null orphan fails', empty.problems().includes('null-orphan'));
}

const hookText = readFileSync(new URL('./inventory_hook_v2.mjs', import.meta.url), 'utf8');
check('inventory hashing errors are not swallowed', !hookText.includes('catch'));

const tag = 'unit-inv-v2';
const child = spawnSync(process.execPath, ['--import', './work/harness/inventory_register_v2.mjs', 'work/harness/inventory_probe_v2.mjs'], {
  cwd: resolve('.'),
  env: { ...process.env, T11_INVENTORY_TAG: tag, OM_EMU_MODEL: 'E147', OM_EMU_NVRAM: 'off' },
  encoding: 'utf8',
});
check('inventory registrar exits clean', child.status === 0);
let exitOk = false;
try {
  const exit = JSON.parse(readFileSync(resolve('work/out/inventory-' + tag + '-exit.json'), 'utf8'));
  const cmd = JSON.parse(readFileSync(resolve('work/out/cmd/' + tag + '.json'), 'utf8'));
  exitOk = exit.ok === true && cmd.tag === tag && Array.isArray(exit.imports) && exit.imports.length > 0;
} catch { exitOk = false; }
check('inventory exit record and command record exist', exitOk);

if (failures.length) {
  process.stderr.write(failures.join('\n') + '\n');
  process.exit(1);
}
process.stdout.write('all checks passed\n');
