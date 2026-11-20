// Supplemental manifest. Built from inventory exit records and command records, not by hand.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve('work');
const outDir = resolve('work/out');
const exits = readdirSync(outDir).filter((name) => name.startsWith('inventory-') && name.endsWith('-exit.json'));
const metas = readdirSync(outDir).filter((name) => name.startsWith('inventory-') && name.endsWith('-meta.json'));
let commandsOnDisk = [];
try { commandsOnDisk = readdirSync(resolve(outDir, 'cmd')).filter((name) => name.endsWith('.json')); }
catch { commandsOnDisk = []; }

function fileRec(path) {
  const raw = readFileSync(path);
  return { path: path.replaceAll('\\', '/'), sha256: createHash('sha256').update(raw).digest('hex'), bytes: raw.length };
}

const inputs = new Map();
const sources = new Map();
for (const name of exits) {
  const body = JSON.parse(readFileSync(resolve(outDir, name), 'utf8'));
  for (const row of body.imports || []) {
    const path = String(row.path).replaceAll('\\', '/');
    const rec = { path, sha256: row.sha256, bytes: row.bytes };
    const bucket = path.includes('/ws/work/') ? sources : inputs;
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
  const meta = JSON.parse(readFileSync(resolve(outDir, name), 'utf8'));
  commands.push({ tag: meta.tag || name, argv: meta.argv, env: meta.env, started: meta.started });
}
for (const name of commandsOnDisk.sort()) {
  const body = JSON.parse(readFileSync(resolve(outDir, 'cmd', name), 'utf8'));
  commands.push({ tag: body.tag || name, argv: body.argv, env: body.env, started: body.started, execPath: body.execPath });
}
commands.push({
  tag: 'pure-node',
  argv: [
    'node26 work/harness/table_v2.mjs',
    'node26 work/harness/check_table_v2.mjs work/out/proof-table-t11-v2.json work/out/table-check-t11-v2.json',
    'node26 work/harness/test_harness_v2.mjs',
    'node26 work/scripts/preflight_expect_v2.mjs',
    'node26 work/scripts/build_manifest_v2.mjs',
  ],
});

const brief = fileRec(resolve('brief.md'));
const manifest = {
  task: 'T11',
  round: 'correction-2026-11-19',
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
  prior: 'work/out/evidence-manifest-v1.seal.json',
};
writeFileSync(resolve('work/out/evidence-manifest.seal.json'), JSON.stringify(seal, null, 2) + '\n');
process.stdout.write(JSON.stringify({ outputs: outputs.length, inputs: inputs.size, sources: sources.size, sha256: seal.sha256 }) + '\n');
