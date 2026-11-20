// Shared display entry. Written by T12. Not run in T12.
import { existsSync } from 'node:fs';
import { prepare } from './t13_env_v1.mjs';

export async function runDisplay(which) {
  const { planState, sealed } = prepare(true);
  const tag = 'display-t13-' + which;
  if (existsSync('work/out/' + tag + '.jsonl')) {
    process.stderr.write('refusing to overwrite display output\n');
    process.exit(1);
  }
  let code = 0;
  try {
    const display = await import('../harness/display_v3.mjs');
    await display.main({ which, mode: 'proof', tag, rows: {}, sealed, planState });
  } catch (error) {
    process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
    code = 1;
  }
  process.exitCode = code;
}
