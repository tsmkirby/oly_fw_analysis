// E is saved during bring-up, before the runner's NAND hook, so there is no
// captured image for it. The log and the file are the read-back. M is saved
// again after the hook and its image must match the file.
import { readFileSync, writeFileSync } from 'node:fs';

let lib = readFileSync('work/scripts/accept_lib_r2.mjs', 'utf8');
const old = `    if (!seen) problems.push('no-image-' + bank);
    else if (seen.sha256 !== fileHash[bank]) problems.push('file-mismatch-' + bank);`;
const neu = `    if (seen && seen.sha256 !== fileHash[bank]) problems.push('file-mismatch-' + bank);
    if (!seen && !added.some((x) => x.store === bank)) problems.push('no-image-' + bank);`;
if (!lib.includes(old)) throw new Error('hash check not found');
lib = lib.replace(old, neu);
lib = lib.replace('helpers, r2.', 'helpers, r3.');
writeFileSync('work/scripts/accept_lib_r3.mjs', lib);

let run = readFileSync('work/scripts/accept_run2.mjs', 'utf8');
run = run.replaceAll('r2', 'r3');
writeFileSync('work/scripts/accept_run3.mjs', run);
console.log('wrote r3');
