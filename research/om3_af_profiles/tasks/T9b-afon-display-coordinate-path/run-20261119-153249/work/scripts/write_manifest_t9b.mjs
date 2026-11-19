// Manifest for T9b. Command 28.
// Hashes work products, commands 01-27, and the transitive emulator modules.
// Does not hash work/out/cmd/28.out, 28.err or 28.exit. Command 29 seals those.
// Do not edit after it has run.
// Usage: node26 work/scripts/write_manifest_t9b.mjs
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

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
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const seeds = [
  'ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs',
  'om-emu/emu/src/fw/model.mjs',
  'om-emu/emu/src/lab/menu.mjs',
  'om-emu/emu/src/lab/sim.mjs',
  'om-emu/emu/src/lab/hle.mjs',
  'om-emu/emu/src/lab/display.mjs',
  'om-emu/emu/src/lab/play.mjs',
  'om-emu/emu/src/lab/player.mjs',
  'om-emu/emu/src/lab/menuwalk.mjs',
  'om-emu/emu/src/machine.mjs',
  'om-emu/emu/src/core/cpu.mjs',
  'om-emu/emu/src/core/interp.mjs',
  'om-emu/emu/src/core/mem.mjs',
  'om-emu/emu/checks/lib/png.mjs',
  'om-emu/emu/checks/lib/env.mjs',
  'om-emu/emu/host/nvram.mjs',
  'om-emu/emu/scenarios/session_replay.mjs',
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
  modules.push({ path: rel(file), sha256: h.sha256, bytes: h.bytes, hashed: 'later' });
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(importRe)) {
    const next = resolveSpec(file, m[1]);
    if (next) queue.push(next);
    else unresolved.push(rel(file) + ' -> ' + m[1]);
  }
}
modules.sort((a, b) => a.path.localeCompare(b.path));

const skip = new Set(['work/evidence-manifest.json']);
const outputs = [];
for (const p of walk(resolve('work'))) {
  const r = rel(p);
  if (skip.has(r)) continue;
  if (r === 'work/out/cmd/28.out' || r === 'work/out/cmd/28.err' || r === 'work/out/cmd/28.exit') continue;
  const h = sha(p);
  outputs.push({ path: r, sha256: h.sha256, bytes: h.bytes });
}
outputs.sort((a, b) => a.path.localeCompare(b.path));

const execution = [];
const seenExec = new Set();
for (const p of walk(resolve('work/out'))) {
  const r = rel(p);
  if (!r.endsWith('.jsonl') && !r.endsWith('.out')) continue;
  let text;
  try { text = readFileSync(p, 'utf8'); } catch { continue; }
  for (const line of text.split(/\n/)) {
    if (!line.includes('helper-hashes')) continue;
    let row;
    try { row = JSON.parse(line); } catch { continue; }
    if (row.step !== 'helper-hashes') continue;
    for (const item of [...(row.helpers || []), ...(row.resources || [])]) {
      const key = item.path + '|' + item.sha256;
      if (seenExec.has(key)) continue;
      seenExec.add(key);
      let later = null;
      try { later = sha(item.path); } catch { later = null; }
      execution.push({
        path: item.path,
        sha256: item.sha256,
        bytes: item.bytes,
        hashed: 'execution',
        later_sha256: later ? later.sha256 : null,
        later_matches: later ? later.sha256 === item.sha256 && later.bytes === item.bytes : false,
      });
    }
  }
}

const commands = [];
for (const p of walk(resolve('work/out/cmd'))) {
  if (!p.endsWith('.exit')) continue;
  const id = rel(p).split('/').pop().replace('.exit', '');
  if (id === '28') continue;
  const exit = JSON.parse(readFileSync(p, 'utf8'));
  const files = {};
  for (const ext of ['cmd.txt', 'out', 'err', 'exit']) {
    const fp = resolve('work/out/cmd', id + '.' + ext);
    files[ext] = { path: 'work/out/cmd/' + id + '.' + ext, ...sha(fp) };
  }
  commands.push({
    id,
    status: exit.status,
    start: exit.start,
    end: exit.end,
    wrapper_sha256: exit.wrapper_sha256,
    scripts: exit.scripts || [],
    cmd: files['cmd.txt'],
    out: files.out,
    err: files.err,
    exit: files.exit,
  });
}
commands.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

const brief = sha(resolve('brief.md'));
const inputs = [
  { path: 'inputs/00_0100_50000020.decoded.bin', ...sha(resolve('inputs/00_0100_50000020.decoded.bin')) },
  { path: 'inputs/02_0106_458c0020.decoded.bin', ...sha(resolve('inputs/02_0106_458c0020.decoded.bin')) },
];
const sourcePaths = [
  'brief.md', 'TASK.md', 'work/result.md', 'work/out/display.md',
  'ref/analysis/button-af/FEATURE-SPEC.md',
  'ref/tasks/T9-afon-target-display/brief.md',
  'ref/tasks/T9-afon-target-display/decision.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv',
];
const sources = sourcePaths.map((p) => ({ path: p, ...sha(resolve(p)) }));
const manifest = {
  task: 'T9b',
  brief_sha256: brief.sha256,
  inputs,
  sources,
  outputs,
  commands,
  modules,
  unresolved_imports: unresolved,
  execution_hashes: execution,
  tool_versions: { node: process.version, execPath: process.execPath },
  note: 'Command 28 does not hash work/out/cmd/28.out, 28.err or 28.exit. The wrapper writes them after this process returns, and the .exit file contains a timestamp. Command 29 seals this manifest and those three files. Command 30 seals command 29.',
};
writeFileSync(resolve('work/evidence-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const need = ['om-emu/emu/src/lab/kernel.mjs', 'om-emu/emu/src/lab/rtos.mjs', 'om-emu/emu/src/fw/board.mjs', 'om-emu/emu/src/fw/facts.mjs', 'om-emu/emu/src/fw/sections.mjs'];
const have = new Set(modules.map((m) => m.path));
const missing = need.filter((p) => !have.has(p));
console.log(JSON.stringify({
  modules: modules.length,
  outputs: outputs.length,
  commands: commands.length,
  execution: execution.length,
  unresolved: unresolved.length,
  missing,
  laterMismatch: execution.filter((e) => !e.later_matches).length,
}));
if (missing.length) process.exit(1);
