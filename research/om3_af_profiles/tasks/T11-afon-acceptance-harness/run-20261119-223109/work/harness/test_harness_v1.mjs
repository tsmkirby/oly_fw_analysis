// Pure Node checks for the harness. Not an emulator version.
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkTable } from './check_table_v1.mjs';
import { commitDecision, rowKey } from './identity_v1.mjs';
import { judgeDown, RESET } from './judge_v1.mjs';
import { shouldArmWriter, shouldRefusePoseWrite } from './predicates_v1.mjs';
import { assertClean, scanText } from './static_check_v1.mjs';
import { slotCount, structuralProblems } from './state_v1.mjs';
import { table } from './table_v1.mjs';

const failures = [];
const check = (name, ok) => {
  if (!ok) failures.push(name);
  process.stdout.write((ok ? 'PASS ' : 'FAIL ') + name + '\n');
};

check('63 slots', slotCount() === 63);
check('arm on owner entry', shouldArmWriter(0, 2, true) === true);
check('no arm without builder', shouldArmWriter(0, 2, false) === false);
check('no arm if already owner', shouldArmWriter(2, 2, true) === false);
check('no runner flag in the predicate', shouldArmWriter(1, 2, true) === true);
check('refuse leak off reset', shouldRefusePoseWrite({ mode: 0, key: 0x5962, index: 0, value: 292, live: 400, mirrored: 292, bank: 0 }) === true);
check('refuse inactive bank', shouldRefusePoseWrite({ mode: 0, key: 0x5962, index: 4, value: 10, live: 526, mirrored: 11, bank: 0 }) === true);
check('allow same value', shouldRefusePoseWrite({ mode: 0, key: 0x5962, index: 0, value: 400, live: 400, mirrored: 400, bank: 0 }) === false);
check('editor still writes', shouldRefusePoseWrite({ mode: 1, key: 0x5962, index: 0, value: 292, live: 526, mirrored: 292, bank: 0 }) === false);

const sealed = { sealed: true, sha256: 'abc', rows: { 'k1e:e-ok': { title: 'aa', highlight: null, screen: 'direct' } } };
check('refuse without seal', commitDecision(null, { commit: true, id: 'e-ok', identityFrom: 'k1e:e-ok' }, { title: 'aa', highlight: null, screen: 'direct' }).ok === false);
check('refuse missing row', commitDecision(sealed, { commit: true, id: 'missing', identityFrom: 'k1e:missing' }, { title: 'aa', highlight: null, screen: 'direct' }).ok === false);
check('commit matches', commitDecision(sealed, { commit: true, id: 'e-ok', identityFrom: 'k1e:e-ok' }, { title: 'aa', highlight: null, screen: 'direct' }).ok === true);
check('commit title mismatch', commitDecision(sealed, { commit: true, id: 'e-ok', identityFrom: 'k1e:e-ok' }, { title: 'bb', highlight: null, screen: 'direct' }).ok === false);
check('row key', rowKey('k1e:e-ok') === 'k1e:e-ok' && rowKey('ref:K1e:e-ok') === 'k1e:e-ok');

const tableProblems = checkTable(table);
check('table ' + tableProblems.join('; '), tableProblems.length === 0);
check('pose-after-edit present', table.steps.some((step) => step.id === 'pose-after-edit'));
check('zone release declared', !!(table.zoneRule && table.zoneRule.release));
check('down assert on keys', table.steps.filter((step) => step.action === 'key').every((step) => step.assertDown === true));
check('k2 afon commits', table.steps.filter((step) => step.who.includes('k2') && step.key === 'afon').every((step) => step.commit === true));

const half = {};
for (const [name, cells] of Object.entries(RESET)) half[name] = cells.slice();
const actual = {
  subject: 0, poseWord: 1, slots: new Array(63), mirror71: new Array(71),
  target: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], halfTarget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  half, mirror: new Array(55).fill(255),
};
const recorded = { k1e: {}, k2: {}, candidate: {} };
const down = judgeDown('candidate', { id: 'n-open', pose: 1, who: ['k2', 'candidate'], bank: 0 }, actual, recorded);
check('down half matches reset', down.length === 0);
half.k5962 = [1, 526, 526, 526, 526, 526];
const drifted = judgeDown('candidate', { id: 'n-open', pose: 1, who: ['k2', 'candidate'], bank: 0 }, actual, recorded);
check('down catches one bank', drifted.some((item) => item.startsWith('half')));

check('clean tree', (() => { try { assertClean(); return true; } catch (e) { process.stderr.write(String(e.message) + '\n'); return false; } })());
const raw = 'ctx.' + 'key("ok", "down")';
check('static flags raw key', scanText('runner.mjs', raw).length === 1);
check('gate is allowed', scanText('gate_v1.mjs', raw).length === 0);

const empty = structuralProblems({ slots: [], mirror71: [], target: [], halfTarget: [], subject: 1, owner: 0, flag: 0 });
check('structural rejects a short state', empty.length >= 4);

const dir = mkdtempSync(join(resolve('work/out'), 'unit-'));
const fixture = join(dir, 'fixture.mjs');
writeFileSync(fixture, 'export const n = 1;\n');
const { beginSession } = await import('./inventory_v1.mjs');
const session = await beginSession('unit-inventory');
await import(new URL('file:///' + fixture.replaceAll('\\', '/')).href);
writeFileSync(fixture, 'export const n = 2;\n');
const changed = session.finish();
check('rehash catches a change', changed.ok === false && changed.problems.some((item) => item.startsWith('changed')));
const digest = createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
check('unit file hashed', digest.length === 64);

if (failures.length) {
  process.stderr.write(failures.join('\n') + '\n');
  process.exit(1);
}
process.stdout.write('ok\n');
