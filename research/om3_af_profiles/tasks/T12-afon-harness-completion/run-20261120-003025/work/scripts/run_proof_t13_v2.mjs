// T13 T8d proof. Written by T12. The proof path is not run in T12.
import { existsSync } from 'node:fs';
import { main as driveMain } from '../harness/drive_v12.mjs';
import { IDENTITY_JSON, prepare } from './t13_env_v2.mjs';

if (process.env.T12_LOAD_ONLY === '1') {
  prepare(false);
  await driveMain({ loadOnly: true });
  process.exit(0);
}

const { planState } = prepare(true);
const tag = 'proof-t13-v1';
if (existsSync('work/out/' + tag + '.jsonl')) {
  process.stderr.write('refusing to overwrite proof output\n');
  process.exit(1);
}
let code = 0;
try {
  await driveMain({ mode: 'proof', tag, sealedPath: IDENTITY_JSON, planState });
} catch (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  code = 1;
}
process.exitCode = code;
