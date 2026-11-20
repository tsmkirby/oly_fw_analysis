import { existsSync } from 'node:fs';
import { assertClean } from '../harness/static_check_v5.mjs';
import { checkTable } from '../harness/check_table_v1.mjs';
import { table } from '../harness/table_v1.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
assertClean();
const problems = checkTable(table);
if (problems.length) {
  process.stderr.write(problems.join('\n') + '\n');
  process.exit(1);
}
if (!existsSync('work/out/identity-t11-v5.seal.json')) {
  process.stderr.write('refuse: identity table is not sealed\n');
  process.exit(1);
}
const tag = 'proof-t11-v1';
const { beginSession } = await import('../harness/inventory_v1.mjs');
const session = await beginSession(tag);
let code = 0;
try {
  const { main } = await import('../harness/drive_v5.mjs');
  await main({ mode: 'proof', tag });
  const { main: show } = await import('../harness/display_v1.mjs');
  await show({ which: 'ab', tag: 'display-ab-t11-v1' });
  await show({ which: 'controls', tag: 'display-controls-t11-v1' });
} catch (e) {
  process.stderr.write(String(e && e.stack ? e.stack : e) + '\n');
  code = 1;
}
const exit = session.finish(['work/scripts/run_proof_v1.mjs']);
if (!exit.ok) {
  process.stderr.write('inventory changed: ' + exit.problems.join('; ') + '\n');
  code = 1;
}
process.exitCode = code;
