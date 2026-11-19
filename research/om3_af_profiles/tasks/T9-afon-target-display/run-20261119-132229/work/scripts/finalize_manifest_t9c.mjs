// External finalizer. Command 42.
// Hashes command 41's four wrapper files and the seal written by command 41.
// This process cannot hash its own .out, .err or .exit. The wrapper writes
// those after this process returns, and the .exit file contains a timestamp.
// Do not edit after it has run.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function sha(p) {
  const b = readFileSync(p);
  return { sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}

const listed = [
  'work/out/manifest-seal-t9c.json',
  'work/out/cmd/41.cmd.txt',
  'work/out/cmd/41.out',
  'work/out/cmd/41.err',
  'work/out/cmd/41.exit',
];
const files = listed.map((p) => ({ path: p, ...sha(resolve(p)) }));
const final = {
  task: 'T9',
  note: 'External finalizer. These hashes cover command 41 and the seal. This process does not hash work/out/cmd/42.out, 42.err or 42.exit, and it does not hash this file\'s own bytes: the wrapper writes the three command files after the process returns, and the .exit file contains a timestamp.',
  files,
};
writeFileSync(resolve('work/out/manifest-final-t9c.json'), JSON.stringify(final, null, 2) + '\n');
console.log(JSON.stringify(files));
