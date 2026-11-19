// Hash the task outputs and write the manifest and its supplement.
// Command 17. The supplement does not include this command's .out, .err or .exit.
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
  'work/out/cmd/17.out',
  'work/out/cmd/17.err',
  'work/out/cmd/17.exit',
]);

const outputs = [];
for (const p of walk(resolve('work'))) {
  const r = rel(p);
  if (skip.has(r)) continue;
  if (r === 'work/out/manifest-supplement-t9.json') continue;
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

const commands = [];
for (const p of walk(resolve('work/out/cmd'))) {
  if (!p.endsWith('.exit')) continue;
  const id = rel(p).split('/').pop().replace('.exit', '');
  if (id === '17' || id === '18') continue;
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
    hashed: 'execution-files',
    ...Object.fromEntries(Object.entries(files).flatMap(([ext, h]) => {
      const key = ext === 'cmd.txt' ? 'cmd_file' : ext + '_file';
      return [[key, h.path], [key + '_sha256', h.sha256], [key + '_bytes', h.bytes]];
    })),
  });
}
commands.sort((a, b) => a.id.localeCompare(b.id));

const cmd17 = sha(resolve('work/out/cmd/17.cmd.txt'));
const supplement = {
  task: 'T9',
  note: 'Hashes taken by command 17. This file does not include work/out/cmd/17.out, 17.err or 17.exit. Command 18 seals those with the manifest.',
  command_17_cmd: { path: 'work/out/cmd/17.cmd.txt', sha256: cmd17.sha256, bytes: cmd17.bytes },
  outputs,
  commands,
};
writeFileSync(resolve('work/out/manifest-supplement-t9.json'), JSON.stringify(supplement, null, 2) + '\n');
const sup = sha(resolve('work/out/manifest-supplement-t9.json'));
outputs.push({ path: 'work/out/manifest-supplement-t9.json', sha256: sup.sha256, bytes: sup.bytes, hashed: 'later' });
outputs.sort((a, b) => a.path.localeCompare(b.path));

const brief = sha(resolve('brief.md'));
const manifest = {
  task: 'T9',
  brief_sha256: brief.sha256,
  brief_bytes: brief.bytes,
  brief_hashed: 'later',
  inputs: execution,
  sources: [
    { path: 'brief.md', sha256: brief.sha256, bytes: brief.bytes, hashed: 'later' },
  ],
  outputs,
  commands,
  tool_versions: { node: process.version },
  note: 'Command 18 seals 17.out, 17.err, 17.exit, this manifest and the supplement. Command 18 does not hash its own wrapper outputs.',
};
writeFileSync(resolve('work/evidence-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ outputs: outputs.length, inputs: execution.length, commands: commands.length, supplement: sup.sha256 }));
