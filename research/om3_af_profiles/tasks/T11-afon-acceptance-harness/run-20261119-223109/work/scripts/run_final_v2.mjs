// Last authorized emulator process: the sealed proof, then display A, B, K2 and K1.
// A failure stops the process before the next job.
import { existsSync } from 'node:fs';
import { checkTable } from '../harness/check_table_v2.mjs';
import { coverageProblems, loadSealed } from '../harness/identity_v2.mjs';
import { assertClean } from '../harness/static_check_v7.mjs';
import { table } from '../harness/table_v2.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
if (!globalThis.__t11Inventory) {
  process.stderr.write('refuse: inventory registrar was not loaded\n');
  process.exit(1);
}
assertClean();
const tableProblems = checkTable(table);
if (tableProblems.length) {
  process.stderr.write(tableProblems.join('\n') + '\n');
  process.exit(1);
}
const jsonPath = 'work/out/identity-t11-v10.json';
const sealPath = 'work/out/identity-t11-v10.seal.json';
if (!existsSync(jsonPath) || !existsSync(sealPath)) {
  process.stderr.write('refuse: identity table is not sealed\n');
  process.exit(1);
}
const sealed = loadSealed(jsonPath, sealPath);
const missing = coverageProblems(table, sealed.rows);
if (missing.length) {
  process.stderr.write('refuse: identity coverage\n' + missing.join('\n') + '\n');
  process.exit(1);
}
if (existsSync('work/out/proof-t11-v2.jsonl')) {
  process.stderr.write('refusing to overwrite proof output\n');
  process.exit(1);
}
let code = 0;
try {
  const { main } = await import('../harness/drive_v10.mjs');
  await main({ mode: 'proof', tag: 'proof-t11-v2', sealedPath: jsonPath });
  const { main: show } = await import('../harness/display_v2.mjs');
  await show({ which: 'ab', tag: 'display-ab-t11-v2' });
  await show({ which: 'controls', tag: 'display-controls-t11-v2' });
} catch (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  code = 1;
}
process.exitCode = code;
