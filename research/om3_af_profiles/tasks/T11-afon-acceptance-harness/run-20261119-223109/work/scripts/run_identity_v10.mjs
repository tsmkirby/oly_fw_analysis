import { existsSync } from 'node:fs';
import { checkTable } from '../harness/check_table_v2.mjs';
import { writeSeal } from '../harness/identity_v2.mjs';
import { assertClean } from '../harness/static_check_v7.mjs';
import { table } from '../harness/table_v2.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
if (!globalThis.__t11Inventory) {
  process.stderr.write('refuse: inventory registrar was not loaded\n');
  process.exit(1);
}
assertClean();
const problems = checkTable(table);
if (problems.length) {
  process.stderr.write(problems.join('\n') + '\n');
  process.exit(1);
}
const tag = 'identity-t11-v10';
if (existsSync('work/out/' + tag + '.jsonl')) {
  process.stderr.write('refusing to overwrite identity output\n');
  process.exit(1);
}
let code = 0;
try {
  const { main } = await import('../harness/drive_v10.mjs');
  await main({ mode: 'identity', tag });
  writeSeal('work/out/' + tag + '.json', 'work/out/' + tag + '.seal.json');
} catch (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  code = 1;
}
process.exitCode = code;
