// External seal for T9d. Run with node26 AFTER wrapper command 13 has
// exited. Not through run_logged.mjs. Does not import the emulator.
// Usage: node26 work/scripts/seal_t9d.mjs
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
  'work/out/display.md',
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
  note: 'External seal written after wrapper command 13 exited. Covers every command record under work/out/cmd, including command 13. This process was not a wrapper and did not import the emulator.',
  files,
  commands,
  missing,
};
writeFileSync(resolve('work/out/seal-t9d.json'), JSON.stringify(seal, null, 2) + '\n');
const has13 = ['13.cmd.txt', '13.out', '13.err', '13.exit'].every((n) => commands.some((c) => c.path.endsWith(n)));
process.stdout.write(JSON.stringify({ files: files.length, commands: commands.length, has13, missing }) + '\n');
if (!has13 || missing.length) process.exit(1);
