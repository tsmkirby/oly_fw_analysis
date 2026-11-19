// Rebuild the T9 manifest after the correction. Command 40.
// Includes commands 01-39, both overlay CSVs, menu.mjs, sim.mjs,
// the transitive emulator modules and the cited research inputs.
// Does not hash work/out/cmd/40.out, 40.err or 40.exit: the wrapper writes
// those after this process returns. Command 41 seals them.
// Do not edit after it has run.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

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

const skip = new Set([
  'work/evidence-manifest.json',
  'work/out/manifest-supplement-t9c.json',
  'work/out/cmd/40.out',
  'work/out/cmd/40.err',
  'work/out/cmd/40.exit',
]);

const outputs = [];
for (const p of walk(resolve('work'))) {
  const r = rel(p);
  if (skip.has(r)) continue;
  const h = sha(p);
  outputs.push({ path: r, sha256: h.sha256, bytes: h.bytes, hashed: 'later' });
}

const execution = [];
const seenExec = new Set();
function takeHashes(text, where) {
  for (const line of text.split(/\n/)) {
    if (!line.includes('helper-hashes')) continue;
    let row;
    try { row = JSON.parse(line); } catch { continue; }
    if (row.step !== 'helper-hashes') continue;
    for (const item of [...(row.helpers || []), ...(row.resources || [])]) {
      const key = item.path + '|' + item.sha256;
      if (seenExec.has(key)) {
        const found = execution.find((e) => e.path === item.path);
        if (found && !found.execution_where.includes(where)) found.execution_where.push(where);
        continue;
      }
      seenExec.add(key);
      execution.push({
        path: item.path,
        sha256: item.sha256,
        bytes: item.bytes,
        hashed: 'execution',
        execution_where: [where],
      });
    }
  }
}
for (const p of walk(resolve('work/out'))) {
  const r = rel(p);
  if (!r.endsWith('.jsonl') && !r.endsWith('.out')) continue;
  takeHashes(readFileSync(p, 'utf8'), r);
}
for (const item of execution) {
  try {
    const later = sha(item.path);
    item.later_sha256 = later.sha256;
    item.later_bytes = later.bytes;
    item.later_matches = later.sha256 === item.sha256 && later.bytes === item.bytes;
  } catch (e) {
    item.later_matches = false;
    item.later_error = String(e.message || e);
  }
}

const cited = [
  ['overlay-t6', 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv'],
  ['overlay-z5', 'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes-c1.csv'],
  ['menu', 'om-emu/emu/src/lab/menu.mjs'],
  ['sim', 'om-emu/emu/src/lab/sim.mjs'],
  ['hle', 'om-emu/emu/src/lab/hle.mjs'],
  ['osd', 'om-emu/emu/src/lab/osd.mjs'],
  ['text', 'om-emu/emu/src/lab/text.mjs'],
  ['mem', 'om-emu/emu/src/core/mem.mjs'],
  ['machine', 'om-emu/emu/src/machine.mjs'],
  ['model', 'om-emu/emu/src/fw/model.mjs'],
  ['display', 'om-emu/emu/src/lab/display.mjs'],
  ['png', 'om-emu/emu/checks/lib/png.mjs'],
  ['env', 'om-emu/emu/checks/lib/env.mjs'],
  ['player', 'om-emu/emu/src/lab/player.mjs'],
  ['play', 'om-emu/emu/src/lab/play.mjs'],
  ['session-replay', 'om-emu/emu/scenarios/session_replay.mjs'],
  ['menuwalk', 'om-emu/emu/src/lab/menuwalk.mjs'],
  ['nvram', 'om-emu/emu/host/nvram.mjs'],
  ['cpu', 'om-emu/emu/src/core/cpu.mjs'],
  ['interp', 'om-emu/emu/src/core/interp.mjs'],
  ['zone-session', 'ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs'],
  ['t6-hook', 'ref/analysis/button-af/readiness/t6-afon-target-size-position/scripts/exp_q1_t6.mjs'],
  ['feature-spec', 'ref/analysis/button-af/FEATURE-SPEC.md'],
  ['t6-readme', 'ref/analysis/button-af/readiness/t6-afon-target-size-position/README.md'],
  ['t6-design', 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/design.md'],
  ['t5-readme', 'ref/analysis/button-af/readiness/t5-afon-button-handoff/README.md'],
  ['t5-design', 'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/design.md'],
  ['t5-target-bytes', 'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/target-bytes.md'],
  ['brief-t3j', 'ref/tasks/T3j-afon-acceptance-assertions/brief.md'],
  ['brief-t5', 'ref/tasks/T5-afon-button-handoff/brief.md'],
  ['brief-t6', 'ref/tasks/T6-afon-target-size-position/brief.md'],
  ['brief', 'brief.md'],
  ['task', 'TASK.md'],
  ['review', 'audit/previous-review.md'],
  ['image', 'inputs/00_0100_50000020.decoded.bin'],
  ['resource', 'inputs/02_0106_458c0020.decoded.bin'],
];
const dependencies = cited.map(([role, path]) => {
  const h = sha(resolve(path));
  return { role, path, sha256: h.sha256, bytes: h.bytes, hashed: 'later' };
});

const commands = [];
for (const p of walk(resolve('work/out/cmd'))) {
  if (!p.endsWith('.exit')) continue;
  const id = rel(p).split('/').pop().replace('.exit', '');
  if (id === '40') continue;
  const exit = JSON.parse(readFileSync(p, 'utf8'));
  const files = {};
  for (const ext of ['cmd.txt', 'out', 'err', 'exit']) {
    const fp = resolve('work/out/cmd', id + '.' + ext);
    const h = sha(fp);
    files[ext] = { path: 'work/out/cmd/' + id + '.' + ext, sha256: h.sha256, bytes: h.bytes };
  }
  commands.push({
    id,
    spawn: exit.spawn,
    status: exit.status,
    start: exit.start,
    end: exit.end,
    wrapper_sha256: exit.wrapper_sha256,
    hashed: 'execution-files',
    ...Object.fromEntries(Object.entries(files).flatMap(([ext, h]) => {
      const key = ext === 'cmd.txt' ? 'cmd_file' : ext + '_file';
      return [[key, h.path], [key + '_sha256', h.sha256], [key + '_bytes', h.bytes]];
    })),
  });
}
commands.sort((a, b) => a.id.localeCompare(b.id));

const cmd40 = sha(resolve('work/out/cmd/40.cmd.txt'));
const supplement = {
  task: 'T9',
  note: 'Hashes taken by command 40. This file does not include work/out/cmd/40.out, 40.err or 40.exit. Command 41 seals those with the manifest. Command 42 then seals command 41.',
  command_40_cmd: { path: 'work/out/cmd/40.cmd.txt', sha256: cmd40.sha256, bytes: cmd40.bytes },
  dependencies,
  outputs,
  commands,
};
writeFileSync(resolve('work/out/manifest-supplement-t9c.json'), JSON.stringify(supplement, null, 2) + '\n');
const sup = sha(resolve('work/out/manifest-supplement-t9c.json'));
outputs.push({ path: 'work/out/manifest-supplement-t9c.json', sha256: sup.sha256, bytes: sup.bytes, hashed: 'later' });
outputs.sort((a, b) => a.path.localeCompare(b.path));

const brief = sha(resolve('brief.md'));
const manifest = {
  task: 'T9',
  brief_sha256: brief.sha256,
  brief_bytes: brief.bytes,
  brief_hashed: 'later',
  inputs: execution,
  dependencies,
  sources: dependencies.filter((d) => ['brief', 'feature-spec', 'brief-t3j', 'brief-t5', 'brief-t6', 'review'].includes(d.role)),
  outputs,
  commands,
  tool_versions: { node: process.version },
  note: 'Command 41 seals 40.out, 40.err, 40.exit, this manifest and the supplement. Command 42 is the external finalizer and seals command 41. Command 42 does not hash its own wrapper outputs: the wrapper writes them after the process returns, and the .exit file contains a timestamp.',
};
writeFileSync(resolve('work/evidence-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const missingLater = execution.filter((e) => e.later_matches !== true).map((e) => e.path);
console.log(JSON.stringify({
  outputs: outputs.length,
  inputs: execution.length,
  dependencies: dependencies.length,
  commands: commands.length,
  commandIds: commands.map((c) => c.id),
  missingLater,
  supplement: sup.sha256,
}));
if (missingLater.length) process.exit(1);
