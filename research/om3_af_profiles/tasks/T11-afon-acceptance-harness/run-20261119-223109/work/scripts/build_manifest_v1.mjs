import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve('work');
const exits = readdirSync(resolve('work/out')).filter((name) => name.startsWith('inventory-') && name.endsWith('-exit.json'));
const metas = readdirSync(resolve('work/out')).filter((name) => name.startsWith('inventory-') && name.endsWith('-meta.json'));

function fileRec(path) {
  const raw = readFileSync(path);
  return { path: path.replaceAll('\\', '/'), sha256: createHash('sha256').update(raw).digest('hex'), bytes: raw.length };
}

const inputs = new Map();
const sources = new Map();
for (const name of exits) {
  const body = JSON.parse(readFileSync(resolve('work/out', name), 'utf8'));
  for (const row of body.imports || []) {
    const path = String(row.path).replaceAll('\\', '/');
    const rec = { path, sha256: row.sha256, bytes: row.bytes };
    const underWork = path.includes('/ws/work/');
    const bucket = underWork ? sources : inputs;
    if (!bucket.has(path)) bucket.set(path, rec);
  }
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else out.push(path);
  }
}
const created = [];
walk(root, created);
const outputs = [];
for (const path of created) {
  const rel = path.replaceAll('\\', '/');
  if (rel.endsWith('/work/evidence-manifest.json')) continue;
  if (rel.endsWith('/work/out/evidence-manifest.seal.json')) continue;
  if (rel.includes('/work/harness/') || rel.includes('/work/scripts/') || rel.endsWith('/work/harness.md') || rel.endsWith('/work/result.md') || rel.includes('/work/out/')) {
    outputs.push(fileRec(path));
  }
}
outputs.sort((a, b) => a.path.localeCompare(b.path));

const commands = [];
for (const name of metas.sort()) {
  const meta = JSON.parse(readFileSync(resolve('work/out', name), 'utf8'));
  commands.push({ tag: meta.tag || name, argv: meta.argv, env: meta.env, started: meta.started });
}
commands.push({
  tag: 'pure-node',
  argv: [
    'node26 work/harness/table_v1.mjs',
    'node26 work/harness/check_table_v1.mjs work/out/proof-table-t11-v1.json work/out/table-check-t11-v1.json',
    'node26 work/harness/test_harness_v1.mjs',
    'node26 work/scripts/build_manifest_v1.mjs',
  ],
});

const brief = fileRec(resolve('brief.md'));
const manifest = {
  task: 'T11',
  brief_sha256: brief.sha256,
  inputs: [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path)),
  sources: [...sources.values()].sort((a, b) => a.path.localeCompare(b.path)),
  outputs: outputs.map((row) => ({ path: row.path, sha256: row.sha256, bytes: row.bytes })),
  commands,
  tool_versions: { node: process.version, execPath: process.execPath },
};
const text = JSON.stringify(manifest, null, 2) + '\n';
const manifestPath = resolve('work/evidence-manifest.json');
writeFileSync(manifestPath, text);
const raw = readFileSync(manifestPath);
const seal = {
  sha256: createHash('sha256').update(raw).digest('hex'),
  bytes: raw.length,
  path: 'work/evidence-manifest.json',
};
writeFileSync(resolve('work/out/evidence-manifest.seal.json'), JSON.stringify(seal, null, 2) + '\n');
process.stdout.write(JSON.stringify({ outputs: outputs.length, inputs: inputs.size, sources: sources.size, sha256: seal.sha256 }) + '\n');
