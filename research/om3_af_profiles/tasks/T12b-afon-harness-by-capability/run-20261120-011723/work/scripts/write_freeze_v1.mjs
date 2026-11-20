// Freeze from the inventories of the six T13 fake runs. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tags = [
  'freeze-identity',
  'freeze-proof',
  'freeze-display-a',
  'freeze-display-b',
  'freeze-display-k2',
  'freeze-display-k1',
];

const files = new Map();
for (const tag of tags) {
  const exit = JSON.parse(readFileSync(resolve('work/out/inventory-' + tag + '-exit.json'), 'utf8'));
  if (!exit.ok) throw new Error(tag + ' ' + (exit.problems || []).join('; '));
  for (const row of exit.imports || []) {
    const path = String(row.path).replaceAll('\\', '/');
    const prev = files.get(path);
    if (prev && (prev.sha256 !== row.sha256 || prev.bytes !== row.bytes)) throw new Error('conflict ' + path);
    const raw = readFileSync(path);
    const sha256 = createHash('sha256').update(raw).digest('hex');
    if (sha256 !== row.sha256 || raw.length !== row.bytes) throw new Error('stale ' + path);
    files.set(path, { path, sha256, bytes: raw.length });
  }
}

const body = {
  task: 'T12b',
  method: 'union of modules loaded and files read while every T13 runner ran to completion on the fake',
  runners: ['identity', 'proof', 'display-a', 'display-b', 'display-k2', 'display-k1'],
  files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
};
writeFileSync(resolve('work/harness-freeze.json'), JSON.stringify(body, null, 2) + '\n');
mkdirSync(resolve('work/out/cmd'), { recursive: true });
writeFileSync(resolve('work/out/cmd/write-freeze-v1.json'), JSON.stringify({
  tag: 'write-freeze-v1',
  started: new Date().toISOString(),
  argv: process.argv.map(String),
  execArgv: process.execArgv.map(String),
  execPath: process.execPath,
  env: { OM_EMU_MODEL: process.env.OM_EMU_MODEL || null, OM_EMU_NVRAM: process.env.OM_EMU_NVRAM || null },
  files: body.files.length,
}, null, 2) + '\n');
process.stdout.write(JSON.stringify({ files: body.files.length }) + '\n');
