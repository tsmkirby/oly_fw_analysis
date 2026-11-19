// Correction-round manifest. Command 54.
// Hashes work products, every command record that already exists, the transitive
// emulator modules, and the cited T9 reviews. Writes work/evidence-manifest-c-v1.json.
// Does not modify work/evidence-manifest.json. Does not hash this command's
// .out, .err or .exit: the wrapper writes them after this process returns.
// The external seal runs after that wrapper and covers those three files.
// Do not edit after it has run.
// Usage: node26 work/scripts/write_manifest_c_v1.mjs
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

const SELF = '54';
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

const skip = new Set(['work/evidence-manifest-c-v1.json']);
const outputs = [];
for (const p of walk(resolve('work'))) {
  const r = rel(p);
  if (skip.has(r)) continue;
  if (r === 'work/out/cmd/' + SELF + '.out' || r === 'work/out/cmd/' + SELF + '.err' || r === 'work/out/cmd/' + SELF + '.exit') continue;
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
    start: exit ? exit.start : null,
    end: exit ? exit.end : null,
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
  'brief.md', 'TASK.md', 'work/result.md', 'work/result-addendum-v1.md',
  'work/out/display.md', 'work/out/display-addendum-v1.md',
  'ref/analysis/button-af/FEATURE-SPEC.md',
  'ref/tasks/T9-afon-target-display/brief.md',
  'ref/tasks/T9-afon-target-display/decision.md',
  'ref/tasks/T9-afon-target-display/run-20261119-131450-review/review.md',
  'ref/tasks/T9-afon-target-display/run-20261119-141920-review/review.md',
  'audit/previous-review.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv',
];
const sources = sourcePaths.map((p) => ({ path: p, ...sha(resolve(p)) }));
const inputs = [
  { path: 'inputs/00_0100_50000020.decoded.bin', ...sha(resolve('inputs/00_0100_50000020.decoded.bin')) },
  { path: 'inputs/02_0106_458c0020.decoded.bin', ...sha(resolve('inputs/02_0106_458c0020.decoded.bin')) },
];
const manifest = {
  task: 'T9b',
  round: 'correction-v1',
  brief_sha256: sha(resolve('brief.md')).sha256,
  inputs,
  sources,
  outputs,
  commands,
  modules,
  unresolved_imports: unresolved,
  execution_hashes: execution,
  tool_versions: { node: process.version, execPath: process.execPath },
  preserved: ['work/result.md', 'work/out/display.md', 'work/evidence-manifest.json'],
  note: 'Correction-round manifest. work/evidence-manifest.json is unchanged and is listed in outputs. Command 54 does not hash work/out/cmd/54.out, 54.err or 54.exit. The wrapper writes them after this process returns. The external seal, started after this wrapper exits, hashes those three files, this manifest, and every command record.',
};
writeFileSync(resolve('work/evidence-manifest-c-v1.json'), JSON.stringify(manifest, null, 2) + '\n');
const need = ['om-emu/emu/src/lab/kernel.mjs', 'om-emu/emu/src/lab/rtos.mjs', 'om-emu/emu/src/fw/board.mjs', 'om-emu/emu/src/fw/facts.mjs', 'om-emu/emu/src/fw/sections.mjs'];
const have = new Set(modules.map((m) => m.path));
const missing = need.filter((p) => !have.has(p));
const reviews = sources.filter((s) => s.path.includes('review.md')).map((s) => s.path);
console.log(JSON.stringify({
  modules: modules.length,
  outputs: outputs.length,
  commands: commands.length,
  execution: execution.length,
  unresolved: unresolved.length,
  missing,
  reviews,
  laterMismatch: execution.filter((e) => !e.later_matches).length,
}));
if (missing.length || reviews.length < 2) process.exit(1);
