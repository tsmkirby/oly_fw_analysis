// Loaded with node --import before any task module. Hashing errors are fatal.
// exit, beforeExit, uncaughtException and unhandledRejection all run the exit check.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NON_MODULE, openInventory, writeCommand } from './inventory_v3.mjs';
import { noteFile } from './inventory_hook_v3.mjs';

const tag = process.env.T12_INVENTORY_TAG;
if (!tag) throw new Error('T12_INVENTORY_TAG is required');
const session = openInventory(tag);
writeFileSync(session.recordPath, '');
mkdirSync(dirname(session.recordPath), { recursive: true });
writeCommand(tag);
for (const rel of NON_MODULE) {
  appendFileSync(session.recordPath, JSON.stringify(noteFile(resolve(rel))) + '\n');
}
for (const rel of [
  'work/harness/inventory_register_v3.mjs',
  'work/harness/inventory_hook_v3.mjs',
  'work/harness/inventory_v3.mjs',
]) {
  appendFileSync(session.recordPath, JSON.stringify(noteFile(resolve(rel))) + '\n');
}
await register(pathToFileURL(resolve('work/harness/inventory_hook_v3.mjs')).href, {
  parentURL: import.meta.url,
  data: { recordPath: session.recordPath },
});
let exitRan = false;
function runExit() {
  if (exitRan) return;
  exitRan = true;
  const exit = session.finish();
  if (!exit.ok) process.exitCode = 1;
}
process.on('exit', () => {
  try { runExit(); }
  catch (error) {
    process.exitCode = 1;
    process.stderr.write('inventory exit failed: ' + (error && error.stack ? error.stack : error) + '\n');
  }
});
process.on('beforeExit', () => {
  try { runExit(); }
  catch (error) {
    process.exitCode = 1;
    process.stderr.write('inventory beforeExit failed: ' + (error && error.stack ? error.stack : error) + '\n');
  }
});
process.on('uncaughtException', (error) => {
  try { runExit(); }
  catch (finishError) {
    process.stderr.write('inventory exit failed: ' + (finishError && finishError.stack ? finishError.stack : finishError) + '\n');
  }
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  try { runExit(); }
  catch (finishError) {
    process.stderr.write('inventory exit failed: ' + (finishError && finishError.stack ? finishError.stack : finishError) + '\n');
  }
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  process.exit(1);
});
globalThis.__t12Inventory = session;
