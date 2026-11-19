// Builds work/evidence-manifest.json for the correction round. Static.
// Commands 01-35 are hashed in full. This command is 36.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

function fileRec(name) {
  const data = readFileSync(resolve(name));
  return { path: name.replaceAll('\\', '/'), sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length };
}
function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, acc);
    else acc.push(relative(resolve('.'), abs).replaceAll('\\', '/'));
  }
}
function commandRec(n) {
  const nn = String(n).padStart(2, '0');
  const exitDoc = JSON.parse(readFileSync(resolve('work/out/cmd/' + nn + '.exit'), 'utf8'));
  const cmdText = readFileSync(resolve('work/out/cmd/' + nn + '.cmd.txt'), 'utf8');
  return {
    n,
    requested: (cmdText.match(/^requested: (.*)$/m) || [])[1] || '',
    status: exitDoc.status,
    wrapper_sha256: exitDoc.wrapper_sha256,
    scripts: exitDoc.scripts || [],
    files: {
      cmd: fileRec('work/out/cmd/' + nn + '.cmd.txt'),
      out: fileRec('work/out/cmd/' + nn + '.out'),
      err: fileRec('work/out/cmd/' + nn + '.err'),
      exit: fileRec('work/out/cmd/' + nn + '.exit'),
    },
  };
}

const inputs = [
  'brief.md',
  'TASK.md',
  'templates/result.md',
  'audit/previous-review.md',
  'ref/PROJECT-STATE.md',
  'ref/tasks/T8-afon-integrated-acceptance/brief.md',
  'ref/tasks/T8-afon-integrated-acceptance/decision.md',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-131023-review/review.md',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-141248-review/review.md',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/result.md',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/scripts/accept_t8_r5.mjs',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
  'ref/tasks/T3l-afon-editor-completion/decision.md',
  'ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/out/design.md',
  'ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/out/profile-layout.md',
  'ref/tasks/T3m-afon-editor-state-leak/decision.md',
  'ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/README.md',
  'ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/fix_v1.mjs',
  'ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs',
  'ref/tasks/T6-afon-target-size-position/decision.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/README.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/design.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/scripts/accept_v1.mjs',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/scripts/save_v3.mjs',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/save-table-v3.json',
  'ref/tasks/T7-orientation-producer/decision.md',
  'ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs',
  'ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs',
  'ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/observe_c1.mjs',
  'inputs/00_0100_50000020.decoded.bin',
  'inputs/02_0106_458c0020.decoded.bin',
];
for (const path of inputs) if (!existsSync(resolve(path))) throw new Error('missing input ' + path);

const outputPaths = [];
walk(resolve('work/out'), outputPaths);
outputPaths.sort();
const outputs = ['work/result.md', ...outputPaths].map(fileRec);

const sourceSet = new Map();
const root = resolve('.').replaceAll('\\', '/').toLowerCase();
function addSource(path) {
  let key = String(path).replaceAll('\\', '/');
  if (key.toLowerCase().startsWith(root + '/')) key = key.slice(root.length + 1);
  if (sourceSet.has(key)) return;
  if (!existsSync(resolve(key))) return;
  sourceSet.set(key, fileRec(key));
}
const scriptPaths = [];
walk(resolve('work/scripts'), scriptPaths);
for (const path of scriptPaths) addSource(path);
for (const inv of outputPaths.filter((p) => p.includes('import-inventory-'))) {
  const doc = JSON.parse(readFileSync(resolve(inv), 'utf8'));
  for (const row of doc.rows || []) addSource(row.path);
}
const sources = [...sourceSet.values()].sort((a, b) => a.path.localeCompare(b.path));
const commands = [];
for (let n = 1; n <= 35; n++) commands.push(commandRec(n));

const doc = {
  task: 'T8b',
  brief_sha256: fileRec('brief.md').sha256,
  note: 'Commands 01-35 are hashed in full. Command 36 writes this manifest. Round-1 emulator versions are commands 04, 07, 11, 15, 19, and 23. This correction used command 34 only and stopped at subject 4. reference-t8b.json sha256 649fc573bc46437c55fa54085c52abc01f373b357e618c28e4bfd08264aef2d1. Acceptance did not end ok:true.',
  inputs: inputs.map(fileRec),
  sources,
  outputs,
  commands,
  tool_versions: {
    node: process.version,
    node_path: process.execPath.replaceAll('\\', '/'),
  },
};
writeFileSync(resolve('work/evidence-manifest.json'), JSON.stringify(doc, null, 2) + '\n');
process.stdout.write(JSON.stringify({
  ok: true,
  inputs: doc.inputs.length,
  sources: doc.sources.length,
  outputs: doc.outputs.length,
  commands: doc.commands.length,
  brief_sha256: doc.brief_sha256,
}) + '\n');
