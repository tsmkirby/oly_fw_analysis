// External seal for the correction round. Run with node26 AFTER wrapper
// command 41 has exited. Not through run_logged.mjs. Does not import the
// emulator. Does not rewrite seal-t9c.json.
// Usage: node26 work/scripts/seal_r1.mjs
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
  'work/evidence-manifest.json',
  'work/result.md',
  'work/result-addendum-t9c.md',
  'work/result-addendum-sol-r1.md',
  'work/out/display.md',
  'work/out/display-addendum-t9c.md',
  'work/out/display-addendum-sol-r1.md',
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
  task: 'T9c',
  note: 'External seal written after wrapper command 41 exited. Covers every command record under work/out/cmd, including command 41. seal-t9c.json is the previous round and was not rewritten. This process was not a wrapper and did not import the emulator.',
  files,
  commands,
  missing,
};
writeFileSync(resolve('work/out/seal-r1.json'), JSON.stringify(seal, null, 2) + '\n');
const has41 = ['41.cmd.txt', '41.out', '41.err', '41.exit'].every((n) => commands.some((c) => c.path.endsWith(n)));
process.stdout.write(JSON.stringify({ files: files.length, commands: commands.length, has41, missing }) + '\n');
if (!has41 || missing.length) process.exit(1);
