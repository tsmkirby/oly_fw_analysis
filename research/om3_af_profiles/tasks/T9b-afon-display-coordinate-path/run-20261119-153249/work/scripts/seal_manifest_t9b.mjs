// Seal command 28. Command 29.
// Hashes the manifest and command 28's four wrapper files.
// Does not hash work/out/cmd/29.out, 29.err or 29.exit. Command 30 does that.
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
  'work/result.md',
  'work/out/display.md',
  'work/out/cmd/28.cmd.txt',
  'work/out/cmd/28.out',
  'work/out/cmd/28.err',
  'work/out/cmd/28.exit',
];
const files = listed.map((p) => ({ path: p, ...sha(resolve(p)) }));
const seal = {
  task: 'T9b',
  note: 'Command 29 seals command 28 and the manifest. Command 29 does not hash work/out/cmd/29.out, 29.err or 29.exit. Command 30 hashes those three files and this seal. The wrapper writes a command\'s .out, .err and .exit after the process returns, and the .exit file contains a timestamp.',
  files,
};
writeFileSync(resolve('work/out/manifest-seal-t9b.json'), JSON.stringify(seal, null, 2) + '\n');
console.log(JSON.stringify(files));
