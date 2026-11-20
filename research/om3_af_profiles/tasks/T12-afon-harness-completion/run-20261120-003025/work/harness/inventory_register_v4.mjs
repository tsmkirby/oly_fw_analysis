// Loaded with node --import before any task module.
// Exit handlers are installed before hashing, registration, or any other fallible step.
// exit, beforeExit, uncaughtException and unhandledRejection all run the exit check.
import { writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { installReadNote, openInventory, writeCommand } from './inventory_v4.mjs';

const tag = process.env.T12_INVENTORY_TAG;
if (!tag) throw new Error('T12_INVENTORY_TAG is required');

let session = null;
let exitRan = false;
function runExit() {
  if (exitRan) return null;
  exitRan = true;
  if (!session) return null;
  const exit = session.finish();
  if (!exit.ok) process.exitCode = 1;
  return exit;
}
function report(error) {
  process.exitCode = 1;
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
}
process.on('exit', () => {
  try { runExit(); }
  catch (error) { report(error); }
});
process.on('beforeExit', () => {
  try { runExit(); }
  catch (error) { report(error); }
});
process.on('uncaughtException', (error) => {
  try { runExit(); }
  catch (finishError) { report(finishError); }
  report(error);
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  try { runExit(); }
  catch (finishError) { report(finishError); }
  report(error);
  process.exit(1);
});

try {
  session = openInventory(tag);
  writeFileSync(session.recordPath, '');
  globalThis.__t12Inventory = session;
  if (process.env.T12_INVENTORY_FAIL === '1') throw new Error('inventory init failed');
  writeCommand(tag);
  installReadNote(session);
  await register(pathToFileURL(resolve('work/harness/inventory_hook_v4.mjs')).href, {
    parentURL: import.meta.url,
    data: { recordPath: session.recordPath },
  });
} catch (error) {
  try { runExit(); }
  catch (finishError) { report(finishError); }
  report(error);
  process.exit(1);
}
