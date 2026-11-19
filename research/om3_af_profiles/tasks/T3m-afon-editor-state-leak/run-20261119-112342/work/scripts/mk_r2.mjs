// Builds accept_lib_r2.mjs and accept_run2.mjs.
// accept_lib.mjs counts only the saves that happen inside nativeSave.
// On this firmware E is written earlier in the session, and the closing
// menu keys write nothing more once size-leave has already committed.
// r2 asserts the session log, the callback d0 values, and the file.
import { readFileSync, writeFileSync } from 'node:fs';

const oldFn = `export function nativeSave(api) {
  const before = api.saves().length;
  const statusBefore = api.statuses.length;
  const hashBefore = api.saveHashes.length;
  const extra = api.saveExpect || {};
  api.press('menu');
  api.step('save-open', { ...extra, screen: 'menu' });
  api.press('menu');
  api.step('save-close', { ...extra, screen: 'shooting' });
  const added = api.saves().slice(before);
  const reported = api.statuses.slice(statusBefore);
  const hashes = api.saveHashes.slice(hashBefore);`;

const newFn = `export function nativeSave(api) {
  const extra = api.saveExpect || {};
  api.press('menu');
  api.step('save-open', { ...extra, screen: 'menu' });
  api.press('menu');
  api.step('save-close', { ...extra, screen: 'shooting' });
  const added = api.saves();
  const reported = api.statuses.slice();
  const hashes = api.saveHashes.slice();`;

let lib = readFileSync('work/scripts/accept_lib.mjs', 'utf8');
if (!lib.includes(oldFn)) throw new Error('nativeSave head not found');
lib = lib.replace(oldFn, newFn);
lib = lib.replace('// Shared acceptance helpers.', '// Shared acceptance helpers, r2. The session log is the save record.');
writeFileSync('work/scripts/accept_lib_r2.mjs', lib);

let run = readFileSync('work/scripts/accept_run.mjs', 'utf8');
run = run.replace("from './accept_lib.mjs'", "from './accept_lib_r2.mjs'");
run = run.replace('work/out/accept.jsonl', 'work/out/accept-r2.jsonl');
run = run.replace("work/out/accept-' + name", "work/out/accept-r2-' + name");
run = run.replaceAll('nvram-accept-', 'nvram-accept-r2-');
run = run.replace('import-inventory-accept.json', 'import-inventory-accept-r2.json');
run = run.replace('work/scripts/accept_run.mjs', 'work/scripts/accept_run2.mjs');
run = run.replace('work/scripts/accept_lib.mjs', 'work/scripts/accept_lib_r2.mjs');
writeFileSync('work/scripts/accept_run2.mjs', run);
console.log('wrote r2');
