// Manifest and external seal. The manifest and the seal are not listed as outputs. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function fileRec(path) {
  const raw = readFileSync(path);
  return {
    path: path.replaceAll('\\', '/'),
    sha256: createHash('sha256').update(raw).digest('hex'),
    bytes: raw.length,
  };
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
}

const outDir = resolve('work/out');
mkdirSync(resolve('work/out/cmd'), { recursive: true });
writeFileSync(resolve('work/out/cmd/build-manifest-v1.json'), JSON.stringify({
  tag: 'build-manifest-v1',
  started: new Date().toISOString(),
  argv: process.argv.map(String),
  execArgv: process.execArgv.map(String),
  execPath: process.execPath,
  env: { OM_EMU_MODEL: process.env.OM_EMU_MODEL || null, OM_EMU_NVRAM: process.env.OM_EMU_NVRAM || null },
}, null, 2) + '\n');

const exits = readdirSync(outDir).filter((name) => name.startsWith('inventory-') && name.endsWith('-exit.json'));
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
const brief = fileRec(resolve('brief.md'));
inputs.set('brief.md', { path: 'brief.md', sha256: brief.sha256, bytes: brief.bytes });

const created = [];
walk(resolve('work'), created);
const outputs = [];
for (const path of created) {
  const rel = path.replaceAll('\\', '/');
  if (rel.endsWith('/work/evidence-manifest.json')) continue;
  if (rel.endsWith('/evidence-manifest.seal.json')) continue;
  outputs.push(fileRec(path));
}
outputs.sort((a, b) => a.path.localeCompare(b.path));

const commands = [];
const cmdDir = resolve('work/out/cmd');
for (const name of readdirSync(cmdDir).filter((item) => item.endsWith('.json')).sort()) {
  const body = JSON.parse(readFileSync(resolve(cmdDir, name), 'utf8'));
  commands.push({
    tag: body.tag || name,
    argv: body.argv,
    execArgv: body.execArgv,
    env: body.env,
    started: body.started,
    execPath: body.execPath,
  });
}

const manifest = {
  task: 'T12b',
  brief_sha256: brief.sha256,
  inputs: [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path)),
  sources: [...sources.values()].sort((a, b) => a.path.localeCompare(b.path)),
  outputs,
  commands,
  tool_versions: { node: process.version },
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
process.stdout.write(JSON.stringify({ outputs: outputs.length, inputs: manifest.inputs.length, sources: manifest.sources.length, seal: seal.sha256 }) + '\n');
