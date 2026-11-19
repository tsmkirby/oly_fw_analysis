// Builds accept_lib_r2.mjs and accept_run2.mjs. mk_r2 missed the function
// text. This one finds the slice lines by a short marker.
import { readFileSync, writeFileSync } from 'node:fs';

let lib = readFileSync('work/scripts/accept_lib.mjs', 'utf8');
const marker = 'const added = api.saves().slice(before);';
const endMarker = 'const hashes = api.saveHashes.slice(hashBefore);';
const start = lib.indexOf(marker);
const end = lib.indexOf(endMarker);
if (start < 0 || end < 0) throw new Error('markers ' + start + ' ' + end);
const neu = [
  'const added = api.saves();',
  '  const reported = api.statuses.slice();',
  '  const hashes = api.saveHashes.slice();',
].join('\n');
lib = lib.slice(0, start) + neu + lib.slice(end + endMarker.length);
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
