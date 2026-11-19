// External final seal. Run this with node26 AFTER the manifest wrapper
// (command 54) has exited, not through run_logged.mjs. The wrapper writes a
// command's .out, .err and .exit after the child returns, so a seal that is
// itself a wrapper cannot cover its own last three files. This process starts
// only once those files exist. It hashes every command record, the correction
// manifest, and the addenda. It does not import the emulator.
// Usage: node26 work/scripts/seal_c_v1.mjs
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
  'work/evidence-manifest-c-v1.json',
  'work/evidence-manifest.json',
  'work/result.md',
  'work/result-addendum-v1.md',
  'work/out/display.md',
  'work/out/display-addendum-v1.md',
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
const ids = new Set(commands.map((c) => c.path.split('/').pop().split('.')[0]));
const seal = {
  task: 'T9b',
  round: 'correction-v1',
  note: 'External seal written after wrapper command 54 exited. Covers every command record under work/out/cmd, including command 54 and the earlier command 30, and the correction manifest. This process was not a wrapper and did not import the emulator. work/evidence-manifest.json is unchanged.',
  files,
  commands,
  command_ids: [...ids].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  missing,
};
writeFileSync(resolve('work/out/seal-c-v1.json'), JSON.stringify(seal, null, 2) + '\n');
const has54 = ['54.cmd.txt', '54.out', '54.err', '54.exit'].every((n) => commands.some((c) => c.path.endsWith(n)));
const has30 = ['30.cmd.txt', '30.out', '30.err', '30.exit'].every((n) => commands.some((c) => c.path.endsWith(n)));
const hasManifest = files.some((f) => f.path === 'work/evidence-manifest-c-v1.json');
process.stdout.write(JSON.stringify({ files: files.length, commands: commands.length, ids: ids.size, has54, has30, hasManifest, missing }) + '\n');
if (!has54 || !has30 || !hasManifest || missing.length) process.exit(1);
