// Loaded with node --import before any task module. Hashing errors are fatal.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NON_MODULE, openInventory, writeCommand } from './inventory_v2.mjs';
import { noteFile } from './inventory_hook_v2.mjs';

const tag = process.env.T11_INVENTORY_TAG;
if (!tag) throw new Error('T11_INVENTORY_TAG is required');
const session = openInventory(tag);
writeFileSync(session.recordPath, '');
mkdirSync(dirname(session.recordPath), { recursive: true });
writeCommand(tag);
for (const rel of NON_MODULE) {
  appendFileSync(session.recordPath, JSON.stringify(noteFile(resolve(rel))) + '\n');
}
for (const rel of [
  'work/harness/inventory_register_v2.mjs',
  'work/harness/inventory_hook_v2.mjs',
  'work/harness/inventory_v2.mjs',
]) {
  appendFileSync(session.recordPath, JSON.stringify(noteFile(resolve(rel))) + '\n');
}
await register(pathToFileURL(resolve('work/harness/inventory_hook_v2.mjs')).href, {
  parentURL: import.meta.url,
  data: { recordPath: session.recordPath },
});
process.on('exit', () => {
  try {
    const exit = session.finish();
    if (!exit.ok) process.exitCode = 1;
  } catch (error) {
    process.exitCode = 1;
    process.stderr.write('inventory exit failed: ' + (error && error.stack ? error.stack : error) + '\n');
  }
});
globalThis.__t11Inventory = session;
