// Seal command 40. Command 41.
// Hashes the manifest, the supplement, and command 40's four wrapper files.
// This process cannot hash its own .out, .err or .exit. Command 42 does that.
// Do not edit after it has run.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function sha(p) {
  const b = readFileSync(p);
  return { sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}

const listed = [
  'work/evidence-manifest.json',
  'work/out/manifest-supplement-t9c.json',
  'work/out/cmd/40.cmd.txt',
  'work/out/cmd/40.out',
  'work/out/cmd/40.err',
  'work/out/cmd/40.exit',
];
const files = listed.map((p) => ({ path: p, ...sha(resolve(p)) }));
const seal = {
  task: 'T9',
  note: 'Command 41 seals command 40, the manifest and the supplement. Command 41 does not hash work/out/cmd/41.out, 41.err or 41.exit. Command 42, a separate process, hashes those three files and this seal. The wrapper writes a command\'s .out, .err and .exit after the process returns, and the .exit file contains a timestamp.',
  files,
};
writeFileSync(resolve('work/out/manifest-seal-t9c.json'), JSON.stringify(seal, null, 2) + '\n');
console.log(JSON.stringify(files));
