import { existsSync, readFileSync } from 'node:fs';
import { assertClean } from '../harness/static_check_v5.mjs';
import { checkTable } from '../harness/check_table_v1.mjs';
import { writeSeal } from '../harness/identity_v1.mjs';
import { table } from '../harness/table_v1.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
assertClean();
const problems = checkTable(table);
if (problems.length) {
  process.stderr.write(problems.join('\n') + '\n');
  process.exit(1);
}
for (const path of [
  'work/out/identity-t11-v6.jsonl',
  'work/out/proof-t11-v1.jsonl',
  'work/out/display-ab-t11-v1.jsonl',
  'work/out/display-controls-t11-v1.jsonl',
]) {
  if (existsSync(path)) {
    process.stderr.write('refusing to overwrite ' + path + '\n');
    process.exit(1);
  }
}
const { beginSession } = await import('../harness/inventory_v1.mjs');
const session = await beginSession('accept-t11-v1');
let code = 0;
try {
  const { main } = await import('../harness/drive_v6.mjs');
  await main({ mode: 'identity', tag: 'identity-t11-v6' });
  const body = JSON.parse(readFileSync('work/out/identity-t11-v6.json', 'utf8'));
  if (body.ok !== true) throw new Error('identity run was not ok');
  const keys = Object.keys(body.rows || {});
  if (!keys.some((key) => key.startsWith('k1e:'))) throw new Error('no K1e identity rows');
  if (!keys.some((key) => key.startsWith('k2:'))) throw new Error('no K2 identity rows');
  if (!keys.some((key) => key.startsWith('k1e:zone-'))) throw new Error('no zone identity rows');
  const seal = writeSeal('work/out/identity-t11-v6.json', 'work/out/identity-t11-v6.seal.json');
  process.stdout.write(JSON.stringify({ id: 'identity-sealed', sha256: seal.sha256, bytes: seal.bytes }) + '\n');
  await main({ mode: 'proof', tag: 'proof-t11-v1' });
  const { main: show } = await import('../harness/display_v1.mjs');
  await show({ which: 'ab', tag: 'display-ab-t11-v1' });
  await show({ which: 'controls', tag: 'display-controls-t11-v1' });
} catch (e) {
  process.stderr.write(String(e && e.stack ? e.stack : e) + '\n');
  code = 1;
}
const exit = session.finish(['work/scripts/run_accept_v1.mjs']);
if (!exit.ok) {
  process.stderr.write('inventory changed: ' + exit.problems.join('; ') + '\n');
  code = 1;
}
process.exitCode = code;
