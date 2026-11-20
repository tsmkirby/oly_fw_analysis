// Freeze the import set recorded while each T13 runner loads under the registrar.
// ref/ is a junction, so those modules are mapped back to workspace paths.
// The registrar loads before its own hook, so its three files are added explicitly.
// T12_LOAD_ONLY stops before runZone. No emulator process is started.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RUNNERS = [
  ['freeze-identity-v3', 'work/scripts/run_identity_t13_v2.mjs'],
  ['freeze-proof-v3', 'work/scripts/run_proof_t13_v2.mjs'],
  ['freeze-display-a-v3', 'work/scripts/run_display_a_t13_v2.mjs'],
  ['freeze-display-b-v3', 'work/scripts/run_display_b_t13_v2.mjs'],
  ['freeze-display-k2-v3', 'work/scripts/run_display_k2_t13_v2.mjs'],
  ['freeze-display-k1-v3', 'work/scripts/run_display_k1_t13_v2.mjs'],
];

const SEEDED = [
  'work/harness/inventory_register_v4.mjs',
  'work/harness/inventory_hook_v4.mjs',
  'work/harness/inventory_v4.mjs',
];

const REQUIRED = [
  'ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs',
  'ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs',
  'ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs',
  'ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs',
  'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs',
  'om-emu/emu/src/fw/model.mjs',
  'om-emu/emu/src/lab/menu.mjs',
  'om-emu/emu/src/lab/display.mjs',
  'om-emu/emu/checks/lib/png.mjs',
  ...SEEDED,
];

const cwd = resolve('.').replaceAll('\\', '/');
const refRoot = realpathSync(resolve('ref')).replaceAll('\\', '/');

function relOf(abs) {
  const norm = String(abs).replaceAll('\\', '/');
  const lower = norm.toLowerCase();
  const cwdPrefix = cwd.toLowerCase() + '/';
  if (lower.startsWith(cwdPrefix)) return norm.slice(cwd.length + 1);
  const refPrefix = refRoot.toLowerCase() + '/';
  if (lower.startsWith(refPrefix)) return 'ref/' + norm.slice(refRoot.length + 1);
  return norm;
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

for (const rel of SEEDED) add(rel, false);

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
    if (rel.includes('/node_modules/')) continue;
    const notRun = rel.startsWith('work/scripts/run_') && rel.includes('t13');
    add(rel, notRun);
  }
}

const missing = REQUIRED.filter((rel) => !files.has(rel));
if (missing.length) throw new Error('freeze missing ' + missing.join(', '));

const body = {
  task: 'T12',
  proofRun: false,
  note: 'Import graphs were loaded with T12_LOAD_ONLY=1 under the inventory registrar. Junction paths under ref/ are stored as workspace paths. runZone was not called. No emulator process was started.',
  files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
};
writeFileSync(resolve('work/harness-freeze.json'), JSON.stringify(body, null, 2) + '\n');
const runners = body.files.filter((row) => row.notRun).length;
const checkout = body.files.filter((row) => row.path.startsWith('om-emu/')).length;
const refFiles = body.files.filter((row) => row.path.startsWith('ref/')).length;
process.stdout.write(JSON.stringify({ files: body.files.length, runners, checkout, refFiles, missing: missing.length }) + '\n');
