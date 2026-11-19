// Build work/evidence-manifest.json. Commands 01-21 are sealed here.
// Command 22 is this process. Its wrapper outputs are hashed by seal_t3m.mjs.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
function rel(p) { return relative(root, p).replaceAll('\\', '/'); }
function shaFile(p) {
  const data = readFileSync(p);
  return { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length };
}
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function record(p) {
  const h = shaFile(p);
  return { path: rel(p), sha256: h.sha256, bytes: h.bytes };
}

const inputPaths = [
  'brief.md',
  'TASK.md',
  'templates/result.md',
  'inputs/00_0100_50000020.decoded.bin',
  'inputs/02_0106_458c0020.decoded.bin',
];
const researchPaths = [
  'ref/tasks/T3l-afon-editor-completion/decision.md',
  'ref/tasks/T3l-afon-editor-completion/run-20261119-092300-review/review.md',
  'ref/tasks/T3l-afon-editor-completion/brief.md',
  'ref/tasks/T3j-afon-acceptance-assertions/brief.md',
  'ref/tasks/T5-afon-button-handoff/brief.md',
  'ref/tasks/T3b-afon-target-editor/brief.md',
  'ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/result.md',
  'ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/out/profile-layout.md',
  'ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/out/design.md',
  'ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/scripts/entry_m3.mjs',
  'ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/scripts/accept_m6.mjs',
];
const resourcePaths = [
  ['om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk00000000.OE.0100.bin', 'emulator resource loaded as 0100'],
  ['om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin', 'emulator resource loaded as 0101'],
];

function must(p) {
  const abs = resolve(p);
  if (!statSync(abs).isFile()) throw new Error('missing ' + p);
  return record(abs);
}

const inputs = inputPaths.map(must);
inputs.find((x) => x.path.includes('02_0106_')).note = 'resource 0106. loadBlock reads the unpacked 0100 and 0101 files, not this extract.';
const research = researchPaths.map(must);
const resources = resourcePaths.map(([p, role]) => ({ ...must(p), role }));

const sources = walk(resolve('work/scripts')).map(record).sort((a, b) => a.path.localeCompare(b.path));
const outputs = [resolve('work/result.md'), ...walk(resolve('work/out'))].map(record).sort((a, b) => a.path.localeCompare(b.path));

const dyn = new Map();
for (const inv of walk(resolve('work/out')).filter((p) => p.includes('import-inventory') && p.endsWith('.json'))) {
  const doc = JSON.parse(readFileSync(inv, 'utf8'));
  for (const m of doc.modules || []) {
    const path = String(m.path).replaceAll('\\', '/').replace(/^.*?\/ws\//, '');
    const key = path + '|' + m.sha256;
    if (!dyn.has(key)) dyn.set(key, { path, sha256: m.sha256, bytes: m.bytes, hashed: m.hashed || 'execution', inventories: [] });
    dyn.get(key).inventories.push(rel(inv));
  }
}
const dynamic_imports = [...dyn.values()].sort((a, b) => a.path.localeCompare(b.path) || a.sha256.localeCompare(b.sha256));

const commands = [];
for (let n = 1; n <= 21; n++) {
  const nn = String(n).padStart(2, '0');
  const cmdPath = resolve('work/out/cmd', nn + '.cmd.txt');
  const text = readFileSync(cmdPath, 'utf8');
  const requested = (text.match(/^requested: (.*)$/m) || [])[1] || '';
  const start = (text.match(/^start (.*)$/m) || [])[1] || '';
  const exitDoc = JSON.parse(readFileSync(resolve('work/out/cmd', nn + '.exit'), 'utf8'));
  const files = {};
  for (const ext of ['cmd.txt', 'out', 'err', 'exit']) {
    const name = nn + '.' + ext;
    const rec = record(resolve('work/out/cmd', name));
    files[ext === 'cmd.txt' ? 'cmd' : ext] = rec;
  }
  commands.push({
    n,
    start,
    requested,
    status: exitDoc.status,
    wrapper_sha256: exitDoc.wrapper_sha256,
    script_sha256: exitDoc.scripts && exitDoc.scripts[0] ? exitDoc.scripts[0].sha256 : 'none',
    files,
  });
}

const py = spawnSync('python', ['-I', '-c', 'import sys; print(sys.version)'], { encoding: 'utf8' });
const java = spawnSync('java', ['-version'], { encoding: 'utf8' });
const brief = inputs.find((x) => x.path === 'brief.md');
const doc = {
  task: 'T3m',
  brief_sha256: brief.sha256,
  note: 'Six experiment versions ran: leak_p1, leak_p2, leak_p3, accept_run, accept_run2, accept_run3. accept_run3 ended ok:false. Command 22 is this build. Its outputs are in evidence-supplement.json.',
  inputs,
  research,
  resources,
  sources,
  dynamic_imports,
  outputs,
  commands,
  tool_versions: {
    node: process.version,
    node_path: process.execPath,
    python: (py.stdout || '').trim(),
    java: (java.stderr || java.stdout || '').trim().split(/\r?\n/)[0],
    wrapper_sha256: '34e42c59c553a1e4213e2b223034bd31142c7000c6aef4aac2ac9d5e7f1fe0ef',
  },
};
const textOut = JSON.stringify(doc, null, 2) + '\n';
writeFileSync(resolve('work/evidence-manifest.json'), textOut);
process.stdout.write('wrote work/evidence-manifest.json bytes ' + textOut.length + '\n');
process.stdout.write('outputs ' + outputs.length + ' sources ' + sources.length + ' dynamic ' + dynamic_imports.length + ' commands ' + commands.length + '\n');
