// T13 identity pass. Written by T12. Not run in T12.
import { existsSync, writeFileSync } from 'node:fs';
import { assertCoverage, writeSeal } from '../harness/identity_v3.mjs';
import { IDENTITY_JSON, IDENTITY_SEAL, prepare } from './t13_env_v1.mjs';

const { planState } = prepare(false);
const tag = 'identity-t13-v1';
if (existsSync('work/out/' + tag + '.jsonl') || existsSync(IDENTITY_JSON) || existsSync(IDENTITY_SEAL)) {
  process.stderr.write('refusing to overwrite identity output\n');
  process.exit(1);
}
const rows = {};
let code = 0;
try {
  const { main } = await import('../harness/drive_v11.mjs');
  await main({ mode: 'identity', tag, rows, planState });
  const display = await import('../harness/display_v3.mjs');
  await display.main({ which: 'all', mode: 'identity', tag: tag + '-display', rows, planState });
  assertCoverage(rows, planState);
  writeFileSync(IDENTITY_JSON, JSON.stringify({ rows }, null, 2) + '\n');
  writeSeal(IDENTITY_JSON, IDENTITY_SEAL);
} catch (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  code = 1;
}
process.exitCode = code;
