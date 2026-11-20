// Manifest for T9d. Command 13.
// Hashes work products, command records that already exist, the transitive
// emulator modules, the cited reviews, and the three T6 baseline files.
// Does not hash this command's .out, .err or .exit: the wrapper writes them
// after this process returns. The external seal covers those three files.
// Do not edit after it has run.
// Usage: node26 work/scripts/write_manifest_t9d.mjs
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

const SELF = '13';
const root = resolve('.');
const rel = (p) => relative(root, p).split(sep).join('/');
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

const seeds = [
  'ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs',
  'om-emu/emu/src/fw/model.mjs',
  'om-emu/emu/src/fw/board.mjs',
  'om-emu/emu/src/fw/facts.mjs',
  'om-emu/emu/src/fw/sections.mjs',
  'om-emu/emu/src/lab/menu.mjs',
  'om-emu/emu/src/lab/sim.mjs',
  'om-emu/emu/src/lab/hle.mjs',
  'om-emu/emu/src/lab/display.mjs',
  'om-emu/emu/src/lab/play.mjs',
  'om-emu/emu/src/lab/player.mjs',
  'om-emu/emu/src/machine.mjs',
  'om-emu/emu/src/core/cpu.mjs',
  'om-emu/emu/src/core/interp.mjs',
  'om-emu/emu/src/core/mem.mjs',
  'om-emu/emu/src/lab/kernel.mjs',
  'om-emu/emu/src/lab/rtos.mjs',
  'om-emu/emu/checks/lib/png.mjs',
];
const importRe = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g;
function resolveSpec(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  const cands = [base, base + '.mjs', base + '.js', base + '.cjs', resolve(base, 'index.mjs'), resolve(base, 'index.js')];
  for (const c of cands) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}
const modules = [];
const seen = new Set();
const unresolved = [];
const queue = seeds.map((p) => resolve(p));
while (queue.length) {
  const file = queue.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  if (!existsSync(file)) { unresolved.push(rel(file)); continue; }
  const h = sha(file);
  modules.push({ path: rel(file), sha256: h.sha256, bytes: h.bytes });
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(importRe)) {
    const next = resolveSpec(file, m[1]);
    if (next) queue.push(next);
    else unresolved.push(rel(file) + ' -> ' + m[1]);
  }
}
modules.sort((a, b) => a.path.localeCompare(b.path));

const skip = new Set(['work/evidence-manifest.json', 'work/out/seal-t9d.json']);
const outputs = [];
for (const p of walk(resolve('work'))) {
  const r = rel(p);
  if (skip.has(r)) continue;
  if (r === 'work/out/cmd/' + SELF + '.out' || r === 'work/out/cmd/' + SELF + '.err' || r === 'work/out/cmd/' + SELF + '.exit') continue;
  const h = sha(p);
  outputs.push({ path: r, sha256: h.sha256, bytes: h.bytes });
}
outputs.sort((a, b) => a.path.localeCompare(b.path));

const commands = [];
for (const p of walk(resolve('work/out/cmd'))) {
  if (!p.endsWith('.exit') && !p.endsWith('.cmd.txt')) continue;
  const id = rel(p).split('/').pop().replace(/\.exit$/, '').replace(/\.cmd\.txt$/, '');
  if (commands.some((c) => c.id === id)) continue;
  const files = {};
  for (const ext of ['cmd.txt', 'out', 'err', 'exit']) {
    const fp = resolve('work/out/cmd', id + '.' + ext);
    if (!existsSync(fp)) {
      files[ext] = { path: 'work/out/cmd/' + id + '.' + ext, missing: true };
      continue;
    }
    files[ext] = { path: 'work/out/cmd/' + id + '.' + ext, ...sha(fp) };
  }
  let exit = null;
  if (existsSync(resolve('work/out/cmd', id + '.exit'))) {
    exit = JSON.parse(readFileSync(resolve('work/out/cmd', id + '.exit'), 'utf8'));
  }
  commands.push({
    id,
    status: exit ? exit.status : null,
    wrapper_sha256: exit ? exit.wrapper_sha256 : null,
    scripts: exit ? (exit.scripts || []) : [],
    cmd: files['cmd.txt'],
    out: files.out,
    err: files.err,
    exit: files.exit,
  });
}
commands.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

const sourcePaths = [
  'brief.md',
  'TASK.md',
  'work/result.md',
  'work/out/display.md',
  'ref/analysis/button-af/FEATURE-SPEC.md',
  'ref/tasks/T9c-afon-display-causal-input/decision.md',
  'ref/tasks/T9c-afon-display-causal-input/run-20261119-174959-review/review.md',
  'ref/tasks/T9c-afon-display-causal-input/run-20261119-184652-review/review.md',
  'ref/tasks/T8c-afon-bank-and-init-reconcile/decision.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/design.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/target-fields.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/scripts/accept_v1.mjs',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv',
];
const sources = sourcePaths.map((p) => ({ path: p, ...sha(resolve(p)) }));
const inputs = [
  { path: 'inputs/00_0100_50000020.decoded.bin', ...sha(resolve('inputs/00_0100_50000020.decoded.bin')) },
  { path: 'inputs/02_0106_458c0020.decoded.bin', ...sha(resolve('inputs/02_0106_458c0020.decoded.bin')) },
];
const manifest = {
  task: 'T9d',
  brief_sha256: sha(resolve('brief.md')).sha256,
  inputs,
  sources,
  outputs,
  commands,
  modules,
  unresolved_imports: unresolved,
  image_bytes_added: [],
  tool_versions: { node: process.version, execPath: process.execPath, ghidra: '12.2_PUBLIC' },
  note: 'No new image byte. The T6 overlay contributes only 0x610bf5e3, 0x610bf5e4 and 0x610bf5e5 in sections 6 and 7. Command 13 .out .err .exit are sealed externally after this wrapper exits. The seal is work/out/seal-t9d.json. Sources include the three T6 baseline files out/design.md, out/target-fields.md and scripts/accept_v1.mjs.',
};
writeFileSync(resolve('work/evidence-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
process.stdout.write(JSON.stringify({
  outputs: outputs.length,
  commands: commands.length,
  modules: modules.length,
  unresolved: unresolved.length,
  brief: manifest.brief_sha256,
  image: inputs[0].sha256,
  resource: inputs[1].sha256,
}) + '\n');
if (unresolved.length) process.exit(1);
