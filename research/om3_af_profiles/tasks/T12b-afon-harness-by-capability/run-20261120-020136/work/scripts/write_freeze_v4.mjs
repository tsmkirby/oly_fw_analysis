// Freeze from capture runs of the identity runner and the four display runners.
// Proof is not a capture input. The OM-Emu source tree is listed by revision,
// diff digest and per-file hash. The emulator is not started. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const tags = ['v6-identity', 'v6-display-a', 'v6-display-b', 'v6-display-k2', 'v6-display-k1'];

function sha(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function norm(path) {
  return resolve(path).replaceAll('\\', '/');
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
}

const files = new Map();
for (const tag of tags) {
  const exit = JSON.parse(readFileSync(resolve('work/out/inventory-' + tag + '-exit.json'), 'utf8'));
  if (!exit.ok) throw new Error(tag + ' ' + (exit.problems || []).join('; '));
  if (exit.captureException == null) throw new Error(tag + ' was not a logged capture');
  for (const row of exit.imports || []) {
    const path = String(row.path).replaceAll('\\', '/');
    const raw = readFileSync(path);
    const sha256 = sha(raw);
    if (sha256 !== row.sha256 || raw.length !== row.bytes) throw new Error('stale ' + path);
    const prev = files.get(path);
    if (prev && (prev.sha256 !== sha256 || prev.bytes !== raw.length)) throw new Error('conflict ' + path);
    files.set(path, { path, sha256, bytes: raw.length });
  }
}

const rev = spawnSync('git', ['-C', 'om-emu', 'rev-parse', 'HEAD'], { encoding: 'utf8' });
if (rev.status !== 0) throw new Error('git rev-parse ' + (rev.stderr || rev.stdout || rev.status));
const diff = spawnSync('git', ['-C', 'om-emu', 'diff', 'HEAD'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (diff.status !== 0) throw new Error('git diff ' + (diff.stderr || diff.status));
const checkoutFiles = [];
const tree = [];
walk(resolve('om-emu/emu'), tree);
for (const path of tree) {
  const key = norm(path);
  const raw = readFileSync(path);
  const rec = { path: key, sha256: sha(raw), bytes: raw.length };
  const prev = files.get(key);
  if (prev && (prev.sha256 !== rec.sha256 || prev.bytes !== rec.bytes)) throw new Error('checkout conflict ' + key);
  checkoutFiles.push(rec);
}
checkoutFiles.sort((a, b) => a.path.localeCompare(b.path));

const body = {
  task: 'T12b',
  method: 'union of files read by the identity runner and the four display runners in logged capture mode, plus every file under om-emu/emu by revision, diff digest and sha256; proof is not a capture input and the emulator is not started',
  runners: ['identity', 'display-a', 'display-b', 'display-k2', 'display-k1'],
  captureException: 'capture mode skips freeze enforcement and cannot be combined with proof mode',
  checkout: {
    root: 'om-emu/emu',
    revision: rev.stdout.trim(),
    diffDigest: sha(diff.stdout),
    files: checkoutFiles,
  },
  files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
};
const freezePath = resolve('work/harness-freeze.json');
writeFileSync(freezePath, JSON.stringify(body, null, 2) + '\n');
const raw = readFileSync(freezePath);
const seal = { sha256: sha(raw), bytes: raw.length, path: 'work/harness-freeze.json' };
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/harness-freeze.seal.json'), JSON.stringify(seal, null, 2) + '\n');
mkdirSync(resolve('work/out/cmd'), { recursive: true });
writeFileSync(resolve('work/out/cmd/write-freeze-v4.json'), JSON.stringify({
  tag: 'write-freeze-v4',
  started: new Date().toISOString(),
  argv: process.argv.map(String),
  execArgv: process.execArgv.map(String),
  execPath: process.execPath,
  env: { OM_EMU_MODEL: process.env.OM_EMU_MODEL || null, OM_EMU_NVRAM: process.env.OM_EMU_NVRAM || null },
  files: body.files.length,
  checkoutFiles: checkoutFiles.length,
  revision: body.checkout.revision,
  diffDigest: body.checkout.diffDigest,
}, null, 2) + '\n');
process.stdout.write(JSON.stringify({
  files: body.files.length,
  checkoutFiles: checkoutFiles.length,
  revision: body.checkout.revision,
  diffDigest: body.checkout.diffDigest,
  seal: seal.sha256,
}) + '\n');
