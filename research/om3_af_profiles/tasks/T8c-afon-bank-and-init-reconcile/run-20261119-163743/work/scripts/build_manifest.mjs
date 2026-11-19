// Build work/evidence-manifest.json. Static. Do not edit after this runs.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function rec(path) {
  const data = readFileSync(resolve(path));
  return { path: path.replaceAll('\\', '/'), sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length };
}
function walk(dir, out) {
  for (const name of readdirSync(resolve(dir))) {
    const p = join(dir, name);
    const st = statSync(resolve(p));
    if (st.isDirectory()) walk(p, out);
    else out.push(p.replaceAll('\\', '/'));
  }
}
const sources = [
  'brief.md',
  'TASK.md',
  'inputs/00_0100_50000020.decoded.bin',
  'inputs/02_0106_458c0020.decoded.bin',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/design.md',
  'ref/tasks/T6-afon-target-size-position/brief.md',
  'ref/tasks/T6-afon-target-size-position/decision.md',
  'ref/tasks/T6-afon-target-size-position/run-20261119-092803-review/review.md',
  'ref/tasks/T6-afon-target-size-position/run-20261119-095259-review/review.md',
  'ref/tasks/T6-afon-target-size-position/run-20261119-110745-review/review.md',
  'ref/tasks/T3l-afon-editor-completion/brief.md',
  'ref/tasks/T3l-afon-editor-completion/decision.md',
  'ref/tasks/T3m-afon-editor-state-leak/brief.md',
  'ref/tasks/T3m-afon-editor-state-leak/decision.md',
  'ref/tasks/T3m-afon-editor-state-leak/run-20261119-111407-review/review.md',
  'ref/tasks/T3m-afon-editor-state-leak/run-20261119-121201-review/review.md',
  'ref/tasks/T7-orientation-producer/brief.md',
  'ref/tasks/T7-orientation-producer/decision.md',
  'ref/tasks/T8-afon-integrated-acceptance/brief.md',
  'ref/tasks/T8-afon-integrated-acceptance/decision.md',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-131023-review/review.md',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-141248-review/review.md',
  'ref/tasks/T8b-afon-integrated-acceptance-generated/brief.md',
  'ref/tasks/T8b-afon-integrated-acceptance-generated/decision.md',
  'ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-151728-review/review.md',
  'ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-162247-review/review.md',
  'ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
  'ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/accept_t8b_c1.mjs',
  'ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs',
];
const scripts = [];
walk('work/scripts', scripts);
const outputs = ['work/result.md'];
walk('work/out', outputs);
const commands = [];
for (let n = 1; n <= 20; n++) {
  const nn = String(n).padStart(2, '0');
  const cmd = readFileSync(resolve('work/out/cmd/' + nn + '.cmd.txt'), 'utf8');
  const exitDoc = JSON.parse(readFileSync(resolve('work/out/cmd/' + nn + '.exit'), 'utf8'));
  commands.push({
    n,
    requested: (cmd.match(/^requested: (.*)$/m) || [])[1] || '',
    status: exitDoc.status,
    wrapper_sha256: exitDoc.wrapper_sha256,
    scripts: exitDoc.scripts || [],
  });
}
const node = spawnSync('node26', ['--version'], { encoding: 'utf8' });
const py = spawnSync('python', ['--version'], { encoding: 'utf8' });
const doc = {
  task: 'T8c',
  brief_sha256: rec('brief.md').sha256,
  inputs: [
    rec('inputs/00_0100_50000020.decoded.bin'),
    rec('inputs/02_0106_458c0020.decoded.bin'),
  ],
  sources: sources.map(rec),
  scripts: scripts.map(rec),
  outputs: outputs.map(rec),
  commands,
  tool_versions: {
    node: (node.stdout || node.stderr || '').trim(),
    python: (py.stdout || py.stderr || '').trim(),
    ghidra: '12.2 PUBLIC, -noanalysis -readOnly',
  },
};
writeFileSync(resolve('work/evidence-manifest.json'), JSON.stringify(doc, null, 2) + '\n');
process.stdout.write(JSON.stringify({ sources: doc.sources.length, outputs: doc.outputs.length, commands: commands.length }) + '\n');
