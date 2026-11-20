// T12b correction tests. Every emulator object is a fake. EMULATOR-ONLY.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drive } from './driver_v2.mjs';
import { realInvocationCount, runWithGate } from './entry_v2.mjs';
import { createGate } from './gate_v6.mjs';
import { unclassifiedPromises } from './inventory_v5.mjs';
import {
  OPERATIONS,
  coverageIds,
  executionCoverageProblems,
  identitySpecs,
} from './operations_v2.mjs';
import { DRIVER_FILES, RUNNER_FILES, checkFiles, importProblems } from './static_check_v2.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lines = [];
let failed = 0;

function check(name, cond, detail) {
  lines.push((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' ' + detail : ''));
  if (!cond) failed += 1;
}

function sameBytes(left, right) {
  const a = readFileSync(resolve(root, left));
  const b = readFileSync(resolve(root, right));
  return a.equals(b);
}

function restore(saved) {
  OPERATIONS.splice(0, OPERATIONS.length, ...saved);
}

const accepted = [
  ['work/harness/afon_hooks_v8.mjs', 'ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/harness/afon_hooks_v7.mjs'],
  ['work/harness/predicates_v3.mjs', 'ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/harness/predicates_v3.mjs'],
  ['work/harness/state_v1.mjs', 'ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/harness/state_v1.mjs'],
  ['work/harness/table_v2.mjs', 'ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/harness/table_v2.mjs'],
  ['work/harness/compare_v4.mjs', 'ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/harness/compare_v4.mjs'],
  ['work/harness/refresh_v4.mjs', 'ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/harness/refresh_v4.mjs'],
];
for (const [copy, source] of accepted) {
  check(copy + ' matches the accepted T12 bytes', sameBytes(copy, source));
}
check('gate_v6.mjs is unchanged from the previous run', sameBytes(
  'work/harness/gate_v6.mjs',
  'ref/tasks/T12b-afon-harness-by-capability/run-20261120-011723/work/harness/gate_v6.mjs',
));

const entryText = readFileSync(resolve(root, 'work/harness/entry_v2.mjs'), 'utf8');
const runnerBody = entryText.slice(entryText.indexOf('export async function runRunner'));
check('createReal contains the T12 zone session', entryText.includes('runZone') && entryText.includes('zone_session_k1.mjs') && entryText.includes('emu/src/fw/model.mjs'));
check('runRunner does not call createReal', !runnerBody.includes('createReal'));
check('the handle has no setup callback', !entryText.includes('setupApply'));
check('promise classification is closed', unclassifiedPromises().length === 0, unclassifiedPromises().join(','));

const registerText = readFileSync(resolve(root, 'work/harness/inventory_register_v7.mjs'), 'utf8');
const exitAt = registerText.indexOf("process.on('exit'");
const tagAt = registerText.indexOf('T12B_INVENTORY_TAG');
check('exit handlers are installed before the tag check', exitAt >= 0 && tagAt > exitAt);
check('the freeze file is not an inventory exclusion', !registerText.includes('outputs.add(freezeFile())'));

check('runners and the driver import only the entry and the allow-list', checkFiles(RUNNER_FILES.concat(DRIVER_FILES)).length === 0, checkFiles(RUNNER_FILES.concat(DRIVER_FILES)).join('; '));
const fixture = [
  'const name = "./hidden.mjs";',
  'await import(name);',
  'import { createRequire } from "node:module";',
  'const require = createRequire(import.meta.url);',
  'require("./other.cjs");',
  'process.binding("fs");',
].join('\n');
const fixtureProblems = importProblems('fixture', fixture);
check('computed import is rejected', fixtureProblems.some((item) => item.includes('computed import')));
check('createRequire is rejected', fixtureProblems.some((item) => item.includes('createRequire')));
check('require is rejected', fixtureProblems.some((item) => item.includes(' require')));
check('process.binding is rejected', fixtureProblems.some((item) => item.includes('process.binding')));
check('node:module is rejected', fixtureProblems.some((item) => item.includes('node:module')));

const sources = new Set(OPERATIONS.map((op) => op.expectationSource));
check('setup operations use a sealed delta', OPERATIONS.filter((op) => op.group === 'setup').every((op) => op.expectationSource === 'sealed-delta'));
check('declared, plant, mirror, edge and hold sources are present', ['declared', 'plant', 'mirror', 'edge', 'hold'].every((item) => sources.has(item)));
check('setup-lever settles for 400 ms', OPERATIONS.find((op) => op.id === 'setup-lever').idleMs === 400);
check('a display edge uses the synchronous settle', OPERATIONS.some((op) => op.expectationSource === 'edge' && op.usesSettle && op.idleMs === 0));
const nonSetup = OPERATIONS.filter((op) => op.group !== 'setup');
check('non-setup operations are not all zero-idle holds', nonSetup.some((op) => op.expectationSource !== 'hold' && op.idleMs > 0));

let applied = 0;
let missingRow = null;
try {
  const gate = createGate({}, {
    mode: 'proof',
    capture() { return { slots: [] }; },
    plan: () => ({ ids: new Set(['commit-row']), afContext: false }),
    presence: () => ({ ok: false, problems: ['refuse commit: no sealed row'] }),
  });
  gate.perform({ id: 'commit-row', key: 'ok', identity: { required: true, key: 'k:commit-row' } }, () => { applied += 1; });
} catch (error) { missingRow = error; }
check('a missing sealed row is refused before delivery', applied === 0 && missingRow && String(missingRow.message).includes('refuse commit'), missingRow && missingRow.message);

const shown = await runWithGate({}, async (gate) => {
  const ops = gate.operations();
  check('operation descriptions are frozen', Object.isFrozen(ops) && ops.length > 0 && Object.isFrozen(ops[0]));
  check('a description has no function and no state', typeof ops[0].id === 'string' && !Object.values(ops[0]).some((value) => typeof value === 'function' || (value && value.slots)));
  let rejected = null;
  try { await gate.perform(ops[0]); }
  catch (error) { rejected = error; }
  check('perform accepts only an id string', rejected && String(rejected.message).includes('operation id'));
  await gate.perform('setup-bring-up');
  await gate.perform('setup-lever');
  return gate.results();
});
check('the combined hook and the recorder are installed', shown.hooksInstalled === true && shown.refreshInstalled === true);
check('setup calls the real API and records lever idle', shown.apiCalls >= 2 && shown.idleMs.includes(400));
check('refresh problems are empty on that path', shown.refreshProblems.length === 0, shown.refreshProblems.slice(0, 4).join(','));
check('createReal has not been called', realInvocationCount() === 0);

let fault = null;
try {
  await runWithGate({ fault: { id: 'k1e-pose-landscape', flag: 1 } }, async (gate) => {
    await gate.perform('k1e-pose-landscape');
  });
} catch (error) { fault = error; }
check('a planted flag mismatch fails the real comparison', fault && String(fault.message).includes('flag'), fault && fault.message);

const savedDelta = OPERATIONS.slice();
const bring = OPERATIONS.find((op) => op.id === 'setup-bring-up');
OPERATIONS.splice(0, OPERATIONS.length, bring);
try {
  const identity = await drive({ kind: 'identity', mode: 'identity', setupFlag: 7 });
  const delta = identity.results.setupDeltas['setup-bring-up'];
  check('bring-up seals the flag it wrote', delta && delta.flag === 7, JSON.stringify(delta));
  const sealed = { rows: identity.results.rows, setupDeltas: identity.results.setupDeltas, sealed: true };
  const proof = await drive({ kind: 'proof', mode: 'proof', setupFlag: 7, sealed });
  check('proof accepts the sealed bring-up delta', proof.executed.length === 1 && proof.results.deliveries === 1);
  let different = null;
  try { await drive({ kind: 'proof', mode: 'proof', setupFlag: 9, sealed }); }
  catch (error) { different = error; }
  check('proof rejects a different bring-up flag', different && String(different.message).includes('flag'), different && different.message);
} finally {
  restore(savedDelta);
}

const beforeIds = coverageIds();
const savedDelete = OPERATIONS.slice();
const victim = OPERATIONS.find((op) => op.identity && op.identity.required);
const victimAt = OPERATIONS.indexOf(victim);
OPERATIONS.splice(victimAt, 1);
try {
  const out = await drive({ kind: 'identity', mode: 'identity' });
  check('deleting an identity-bearing operation removes it from execution', !out.executed.includes(victim.id) && out.executed.length === beforeIds.length - 1);
  check('deleting it removes it from coverage and the identity generator together', !coverageIds().includes(victim.id) && !identitySpecs().some((spec) => spec.id === victim.id) && executionCoverageProblems(out.executed).length === 0);
} catch (error) {
  check('deleting an identity-bearing operation removes it from execution', false, error.message);
  check('deleting it removes it from coverage and the identity generator together', false, error.message);
} finally {
  restore(savedDelete);
}
check('the operation list is restored', coverageIds().length === beforeIds.length);
check('createReal stayed uncalled after the drives', realInvocationCount() === 0);

function spawn(args, env) {
  return spawnSync('node26', args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, T12B_ALLOW_EMULATOR: '', T12B_FREEZE_CAPTURE: '', T12B_RUNNER: '', T12B_FREEZE_ENFORCE: '', ...env },
  });
}

const registrar = './work/harness/inventory_register_v7.mjs';
const baseEnv = { OM_EMU_MODEL: 'E147', OM_EMU_NVRAM: 'off' };

const missingTag = spawn(['--import', registrar, 'work/scripts/inventory_init_v1.mjs'], {
  ...baseEnv,
  T12B_INVENTORY_TAG: '',
});
let missingExit = null;
try { missingExit = JSON.parse(readFileSync(resolve(root, 'work/out/inventory-missing-tag-exit.json'), 'utf8')); }
catch { missingExit = null; }
check('a missing tag still writes a failing exit record', missingTag.status !== 0 && missingExit && missingExit.ok === false, missingTag.stderr);

const initFail = spawn(['--import', registrar, 'work/scripts/inventory_init_v1.mjs'], {
  ...baseEnv,
  T12B_INVENTORY_TAG: 'v2-init-fail',
  T12B_INVENTORY_FAIL: '1',
});
let initExit = null;
try { initExit = JSON.parse(readFileSync(resolve(root, 'work/out/inventory-v2-init-fail-exit.json'), 'utf8')); }
catch { initExit = null; }
check('an init failure still writes a failing exit record', initFail.status !== 0 && initExit && initExit.ok === false, initFail.stderr);

mkdirSync(resolve(root, 'work/out'), { recursive: true });
writeFileSync(resolve(root, 'work/out/probe-identity.json'), '{"probe":1}\n');
writeFileSync(resolve(root, 'work/out/probe-buffer.txt'), 'buffer-path\n');
writeFileSync(resolve(root, 'work/out/probe-url.txt'), 'url-path\n');
writeFileSync(resolve(root, 'work/out/probe-fd.txt'), 'fd-path\n');
writeFileSync(resolve(root, 'work/out/probe-promise.json'), '{"p":1}\n');
writeFileSync(resolve(root, 'work/out/probe-stream.txt'), 'stream-path\n');
writeFileSync(resolve(root, 'work/out/probe-changed.txt'), 'before\n');

const forms = spawn(['--import', registrar, 'work/scripts/inventory_probe_v2.mjs'], {
  ...baseEnv,
  T12B_INVENTORY_TAG: 'v2-forms',
  T12B_PROBE: 'forms',
});
let formsExit = null;
try { formsExit = JSON.parse(readFileSync(resolve(root, 'work/out/inventory-v2-forms-exit.json'), 'utf8')); }
catch { formsExit = null; }
const formPaths = new Set((formsExit && formsExit.imports || []).map((row) => row.path));
function saw(suffix) {
  return [...formPaths].some((path) => path.endsWith(suffix));
}
check('string, Buffer, URL, descriptor, promise and stream reads are inventoried', forms.status === 0 && formsExit && formsExit.ok && saw('/probe-identity.json') && saw('/probe-buffer.txt') && saw('/probe-url.txt') && saw('/probe-fd.txt') && saw('/probe-promise.json') && saw('/probe-stream.txt'), forms.stderr || (formsExit && (formsExit.problems || []).join(';')));

const changed = spawn(['--import', registrar, 'work/scripts/inventory_probe_v2.mjs'], {
  ...baseEnv,
  T12B_INVENTORY_TAG: 'v2-changed',
  T12B_PROBE: 'changed',
});
let changedExit = null;
try { changedExit = JSON.parse(readFileSync(resolve(root, 'work/out/inventory-v2-changed-exit.json'), 'utf8')); }
catch { changedExit = null; }
check('a file changed after the read fails the exit record', changed.status !== 0 && changedExit && changedExit.ok === false && (changedExit.problems || []).some((item) => item.includes('changed')), changed.stderr);

const planted = spawn(['--import', registrar, 'work/harness/planted_import_v1.mjs'], {
  ...baseEnv,
  T12B_INVENTORY_TAG: 'v2-plant',
});
check('a resolvable emulator import is refused by policy', planted.status === 0 && String(planted.stdout).includes('POLICY_REFUSED'), planted.stdout + planted.stderr);

const missingFreeze = spawn(['--import', registrar, 'work/scripts/run_identity_t13_v2.mjs'], {
  ...baseEnv,
  T12B_INVENTORY_TAG: 'v2-missing-freeze',
  T12B_RUNNER: '1',
  T12B_FREEZE_PATH: 'work/out/no-such-freeze.json',
});
check('a runner refuses to start when the freeze is missing', missingFreeze.status !== 0 && String(missingFreeze.stderr).includes('freeze missing'), missingFreeze.stderr);

const captureProof = spawn(['--import', registrar, 'work/scripts/run_proof_t13_v2.mjs'], {
  ...baseEnv,
  T12B_INVENTORY_TAG: 'v2-capture-proof',
  T12B_RUNNER: '1',
  T12B_FREEZE_CAPTURE: '1',
});
let captureCmd = null;
try { captureCmd = JSON.parse(readFileSync(resolve(root, 'work/out/cmd/v2-capture-proof.json'), 'utf8')); }
catch { captureCmd = null; }
check('capture mode cannot be combined with proof', captureProof.status !== 0 && String(captureProof.stderr).includes('cannot be combined with proof'), captureProof.stderr);
check('capture mode is logged on the command record', captureCmd && typeof captureCmd.captureException === 'string' && captureCmd.captureException.includes('cannot be combined with proof'));

process.stdout.write(lines.join('\n') + '\n');
process.stdout.write((failed === 0 ? 'PASS' : 'FAIL') + ' ' + (lines.length - failed) + '/' + lines.length + '\n');
process.exit(failed === 0 ? 0 : 1);
