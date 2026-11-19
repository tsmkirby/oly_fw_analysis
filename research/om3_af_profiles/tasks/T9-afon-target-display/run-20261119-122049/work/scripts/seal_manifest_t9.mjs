// Seal command 17's wrapper outputs, the manifest and the supplement.
// Command 18. This process cannot hash its own .out, .err or .exit.
// Do not edit after it has run.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function sha(p) {
  const b = readFileSync(p);
  return { path: p.replaceAll('\\', '/').replace(/^.*\/ws\//, ''), sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}

const files = [
  'work/evidence-manifest.json',
  'work/out/manifest-supplement-t9.json',
  'work/out/cmd/17.cmd.txt',
  'work/out/cmd/17.out',
  'work/out/cmd/17.err',
  'work/out/cmd/17.exit',
].map((p) => ({ listed: p, ...sha(resolve(p)) }));

const seal = {
  task: 'T9',
  note: 'Command 18 seals command 17. Command 18 does not hash work/out/cmd/18.out, 18.err or 18.exit. The wrapper writes those after this process returns, and the .exit file contains a timestamp.',
  files,
};
writeFileSync(resolve('work/out/manifest-seal-t9.json'), JSON.stringify(seal, null, 2) + '\n');
console.log(JSON.stringify(files.map((f) => ({ listed: f.listed, sha256: f.sha256, bytes: f.bytes }))));
