// Refreshed external seal for the T9d correction round.
// Run with node26 AFTER wrapper command 30 has exited. Not through run_logged.mjs.
// Does not import the emulator. Does not modify work/out/seal-t9d.json.
// Usage: node26 work/scripts/seal_t9d_r3.mjs
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function sha(p) {
  const b = readFileSync(p);
  return { sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const listed = [
  'work/result.md',
  'work/out/display-addendum-r3.md',
  'work/out/evidence-manifest-r3.json',
  'work/out/sealed-r1/result.md',
  'work/evidence-manifest.json',
];
const files = [];
const missing = [];
for (const p of listed) {
  if (!existsSync(resolve(p))) { missing.push(p); continue; }
  files.push({ path: p, ...sha(resolve(p)) });
}
const commands = [];
for (const p of walk(resolve('work/out/cmd'))) {
  const name = p.split(/[/\\]/).pop();
  commands.push({ path: 'work/out/cmd/' + name, ...sha(p) });
}
commands.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
const seal = {
  task: 'T9d',
  note: 'Refreshed seal written after wrapper command 30 exited. Covers the updated result, the display addendum, the supplemental manifest, and every command record under work/out/cmd, including command 30. work/out/seal-t9d.json is unchanged. The copy work/out/sealed-r1/result.md is the result that work/out/seal-t9d.json hashed.',
  files,
  commands,
  missing,
};
writeFileSync(resolve('work/out/seal-t9d-r3.json'), JSON.stringify(seal, null, 2) + '\n');
const has30 = ['30.cmd.txt', '30.out', '30.err', '30.exit'].every((n) => commands.some((c) => c.path.endsWith(n)));
const oldResult = files.find((f) => f.path === 'work/out/sealed-r1/result.md');
process.stdout.write(JSON.stringify({
  files: files.length,
  commands: commands.length,
  has30,
  missing,
  sealedResult: oldResult ? oldResult.sha256 : null,
}) + '\n');
if (!has30 || missing.length) process.exit(1);
