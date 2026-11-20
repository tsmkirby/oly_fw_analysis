// T13 T8d proof. Written by T12. Not run in T12.
import { existsSync } from 'node:fs';
import { IDENTITY_JSON, prepare } from './t13_env_v1.mjs';

const { planState } = prepare(true);
const tag = 'proof-t13-v1';
if (existsSync('work/out/' + tag + '.jsonl')) {
  process.stderr.write('refusing to overwrite proof output\n');
  process.exit(1);
}
let code = 0;
try {
  const { main } = await import('../harness/drive_v11.mjs');
  await main({ mode: 'proof', tag, sealedPath: IDENTITY_JSON, planState });
} catch (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  code = 1;
}
process.exitCode = code;
