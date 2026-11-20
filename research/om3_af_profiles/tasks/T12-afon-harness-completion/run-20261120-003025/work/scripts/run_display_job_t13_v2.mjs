// Shared display entry. Written by T12. The proof path is not run in T12.
import { existsSync } from 'node:fs';
import { main as displayMain } from '../harness/display_v5.mjs';
import { prepare } from './t13_env_v2.mjs';

export async function runDisplay(which) {
  if (process.env.T12_LOAD_ONLY === '1') {
    prepare(false);
    await displayMain({ loadOnly: true });
    process.exit(0);
  }
  const { planState, sealed } = prepare(true);
  const tag = 'display-t13-' + which;
  if (existsSync('work/out/' + tag + '.jsonl')) {
    process.stderr.write('refusing to overwrite display output\n');
    process.exit(1);
  }
  let code = 0;
  try {
    await displayMain({ which, mode: 'proof', tag, rows: {}, sealed, planState });
  } catch (error) {
    process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
    code = 1;
  }
  process.exitCode = code;
}
