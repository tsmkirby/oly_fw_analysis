// T13 identity pass. Written by T12. The proof path is not run in T12.
import { existsSync, writeFileSync } from 'node:fs';
import { assertCoverage, writeSeal } from '../harness/identity_v4.mjs';
import { main as displayMain } from '../harness/display_v5.mjs';
import { main as driveMain } from '../harness/drive_v12.mjs';
import { IDENTITY_JSON, IDENTITY_SEAL, prepare } from './t13_env_v2.mjs';

if (process.env.T12_LOAD_ONLY === '1') {
  prepare(false);
  await driveMain({ loadOnly: true });
  await displayMain({ loadOnly: true });
  process.exit(0);
}

const { planState } = prepare(false);
const tag = 'identity-t13-v1';
if (existsSync('work/out/' + tag + '.jsonl') || existsSync(IDENTITY_JSON) || existsSync(IDENTITY_SEAL)) {
  process.stderr.write('refusing to overwrite identity output\n');
  process.exit(1);
}
const rows = {};
let code = 0;
try {
  await driveMain({ mode: 'identity', tag, rows, planState });
  await displayMain({ which: 'all', mode: 'identity', tag: tag + '-display', rows, planState });
  assertCoverage(rows, planState);
  writeFileSync(IDENTITY_JSON, JSON.stringify({ rows }, null, 2) + '\n');
  writeSeal(IDENTITY_JSON, IDENTITY_SEAL);
} catch (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  code = 1;
}
process.exitCode = code;
