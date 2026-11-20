// Freeze the import set by loading each T13 runner under the inventory registrar.
// The child is this process's node, which is the node26.cmd shim's node.exe.
// T12_LOAD_ONLY stops before runZone. No emulator process is started.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RUNNERS = [
  ['freeze-identity-v2', 'work/scripts/run_identity_t13_v2.mjs'],
  ['freeze-proof-v2', 'work/scripts/run_proof_t13_v2.mjs'],
  ['freeze-display-a-v2', 'work/scripts/run_display_a_t13_v2.mjs'],
  ['freeze-display-b-v2', 'work/scripts/run_display_b_t13_v2.mjs'],
  ['freeze-display-k2-v2', 'work/scripts/run_display_k2_t13_v2.mjs'],
  ['freeze-display-k1-v2', 'work/scripts/run_display_k1_t13_v2.mjs'],
];

const cwd = resolve('.').replaceAll('\\', '/');

function relOf(abs) {
  const norm = String(abs).replaceAll('\\', '/');
  const prefix = cwd + '/';
  if (norm.toLowerCase().startsWith(prefix.toLowerCase())) return norm.slice(prefix.length);
  return null;
}

function fileRec(rel) {
  const raw = readFileSync(resolve(rel));
  return {
    path: rel.replaceAll('\\', '/'),
    bytes: raw.length,
    sha256: createHash('sha256').update(raw).digest('hex'),
  };
}

const files = new Map();
function add(rel, notRun) {
  const rec = fileRec(rel);
  rec.notRun = notRun;
  const prev = files.get(rec.path);
  if (prev && prev.sha256 !== rec.sha256) throw new Error('hash drift ' + rec.path);
  if (!prev) files.set(rec.path, rec);
}

for (const [tag, runner] of RUNNERS) {
  const result = spawnSync(process.execPath, [
    '--import', './work/harness/inventory_register_v4.mjs',
    runner,
  ], {
    cwd: resolve('.'),
    encoding: 'utf8',
    env: {
      ...process.env,
      T12_LOAD_ONLY: '1',
      T12_INVENTORY_TAG: tag,
      OM_EMU_MODEL: 'E147',
      OM_EMU_NVRAM: 'off',
    },
  });
  if (result.status !== 0) {
    const detail = [
      result.error && result.error.message,
      'status ' + result.status,
      'signal ' + result.signal,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n');
    throw new Error(runner + ' load-only failed\n' + detail);
  }
  add(runner, true);
  const jsonl = readFileSync(resolve('work/out/inventory-' + tag + '.jsonl'), 'utf8');
  for (const line of jsonl.split(/\n/)) {
    if (!line) continue;
    const row = JSON.parse(line);
    if (!row.path || !row.sha256) continue;
    const rel = relOf(row.path);
    if (!rel) continue;
    if (rel.includes('/node_modules/')) continue;
    add(rel, rel.startsWith('work/scripts/run_') && rel.includes('t13'));
  }
}

const body = {
  task: 'T12',
  proofRun: false,
  note: 'Import graphs were loaded with T12_LOAD_ONLY=1 under the inventory registrar. runZone was not called. No emulator process was started.',
  files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
};
writeFileSync(resolve('work/harness-freeze.json'), JSON.stringify(body, null, 2) + '\n');
const runners = body.files.filter((row) => row.notRun).length;
const checkout = body.files.filter((row) => row.path.startsWith('om-emu/')).length;
const hasModel = body.files.some((row) => row.path.endsWith('src/fw/model.mjs'));
const hasMenu = body.files.some((row) => row.path.endsWith('src/lab/menu.mjs'));
const hasDisplay = body.files.some((row) => row.path.endsWith('src/lab/display.mjs'));
const hasPng = body.files.some((row) => row.path.endsWith('checks/lib/png.mjs'));
const hasZone = body.files.some((row) => row.path.endsWith('zone_session_k1.mjs'));
process.stdout.write(JSON.stringify({
  files: body.files.length, runners, checkout, hasModel, hasMenu, hasDisplay, hasPng, hasZone,
}) + '\n');
