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
const tag = 'identity-t11-v5';
if (existsSync('work/out/' + tag + '.jsonl')) {
  process.stderr.write('refusing to overwrite identity output\n');
  process.exit(1);
}
const { beginSession } = await import('../harness/inventory_v1.mjs');
const session = await beginSession(tag);
let code = 0;
try {
  const { main } = await import('../harness/drive_v5.mjs');
  await main({ mode: 'identity', tag });
} catch (e) {
  process.stderr.write(String(e && e.stack ? e.stack : e) + '\n');
  code = 1;
}
const exit = session.finish(['work/scripts/run_identity_v5.mjs']);
if (!exit.ok) {
  process.stderr.write('inventory changed: ' + exit.problems.join('; ') + '\n');
  code = 1;
}
process.exitCode = code;
