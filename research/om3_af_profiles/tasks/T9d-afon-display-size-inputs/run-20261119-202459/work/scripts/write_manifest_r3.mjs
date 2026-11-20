// Supplemental manifest for the T9d correction round.
// Hashes the updated result, the display addendum, the correction evidence,
// and the command records that already exist. Does not hash this command's
// own .out, .err or .exit. The refreshed seal covers those.
// Does not modify work/evidence-manifest.json.
// Do not edit after it has run.
// Usage: node26 work/scripts/write_manifest_r3.mjs
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function sha(p) {
  const b = readFileSync(p);
  return { sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}

const listed = [
  'work/result.md',
  'work/out/display.md',
  'work/out/display-addendum-r3.md',
  'work/evidence-manifest.json',
  'work/out/sealed-r1/result.md',
  'work/out/sealed-r1/display.md',
  'work/out/sealed-r1/evidence-manifest.json',
  'work/out/seal-t9d.json',
  'work/scripts/lib_valid_t9d.mjs',
  'work/out/marks-full-t9d.json',
  'work/out/pre-r2.json',
  'work/out/sweep-r2-summary.json',
  'work/out/refresh-r2.jsonl',
  'work/out/refresh-index-r2.json',
  'work/out/pre-mode-r3.json',
  'work/out/mode-r3-summary.json',
  'work/out/mode-copies-r3.jsonl',
  'work/out/pre-mode-r4.json',
  'work/out/mode-r4-summary.json',
  'work/out/mode-stores-r4.jsonl',
  'work/out/mode-table-r4.json',
  'work/out/disasm-tpl-r4.txt',
  'work/out/disasm-tplcall-r4.txt',
  'work/out/disasm-slot14-r4.txt',
  'work/out/disasm-slot14b-r4.txt',
  'work/out/disasm-zonefn-r4.txt',
];
const files = [];
const missing = [];
for (const p of listed) {
  if (!existsSync(resolve(p))) { missing.push(p); continue; }
  files.push({ path: p, ...sha(resolve(p)) });
}
const commands = [];
for (const name of readdirSync(resolve('work/out/cmd'))) {
  const p = 'work/out/cmd/' + name;
  commands.push({ path: p, ...sha(resolve(p)) });
}
commands.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
const manifest = {
  task: 'T9d',
  note: 'Supplemental manifest for the correction round. work/evidence-manifest.json is unchanged. The sealed result, display note and original manifest are copied under work/out/sealed-r1 and their hashes are the hashes in work/out/seal-t9d.json. This file does not include its own wrapper .out, .err or .exit.',
  libValid: sha(resolve('work/scripts/lib_valid_t9d.mjs')),
  files,
  commands,
  missing,
};
writeFileSync(resolve('work/out/evidence-manifest-r3.json'), JSON.stringify(manifest, null, 2) + '\n');
process.stdout.write(JSON.stringify({ files: files.length, commands: commands.length, missing }) + '\n');
if (missing.length) process.exit(1);
