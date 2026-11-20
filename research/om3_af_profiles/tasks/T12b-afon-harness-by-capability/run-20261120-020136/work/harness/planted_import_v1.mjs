// Planted import of a real emulator module. The policy must refuse it. EMULATOR-ONLY.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const path = resolve('om-emu/emu/src/fw/model.mjs');
if (!existsSync(path)) {
  process.stderr.write('plant is not resolvable\n');
  process.exit(2);
}
try {
  await import(pathToFileURL(path).href);
  process.stdout.write('UNEXPECTED_LOAD\n');
  process.exit(2);
} catch (error) {
  const message = String(error && error.message ? error.message : error);
  const code = error && error.code;
  if (code === 'POLICY_EMULATOR' || message.includes('policy-refuse: emulator module')) {
    process.stdout.write('POLICY_REFUSED\n');
    process.exit(0);
  }
  process.stdout.write('OTHER ' + code + ' ' + message + '\n');
  process.exit(1);
}
