// Capture runs for the freeze. Stops if a display reference file is not inventoried. EMULATOR-ONLY.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(tag, script, extra) {
  const result = spawnSync('node26', ['work/scripts/invoke_v3.mjs', tag, script, ...extra], {
    encoding: 'utf8',
    shell: true,
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.status !== 0) {
    process.stderr.write(tag + ' status ' + result.status + '\n');
    process.exit(result.status == null ? 1 : result.status);
  }
}

run('v4-edge', 'work/scripts/edge_read_v1.mjs', []);
const edge = JSON.parse(readFileSync('work/out/inventory-v4-edge-exit.json', 'utf8'));
const paths = (edge.imports || []).map((row) => row.path);
if (!edge.ok || !paths.some((path) => path.endsWith('/ref-k1e-a.json'))) {
  process.stderr.write('reference JSON was not inventoried\n');
  process.exit(1);
}
process.stdout.write('edge refs ok\n');

run('v4-forms', 'work/scripts/inventory_probe_v2.mjs', ['T12B_PROBE=forms']);
const captures = [
  ['v4-identity', 'work/scripts/run_identity_t13_v3.mjs'],
  ['v4-display-a', 'work/scripts/run_display_a_t13_v3.mjs'],
  ['v4-display-b', 'work/scripts/run_display_b_t13_v3.mjs'],
  ['v4-display-k2', 'work/scripts/run_display_k2_t13_v3.mjs'],
  ['v4-display-k1', 'work/scripts/run_display_k1_t13_v3.mjs'],
];
for (const [tag, script] of captures) {
  run(tag, script, ['T12B_FREEZE_CAPTURE=1', 'T12B_RUNNER=1']);
  process.stdout.write(tag + ' ok\n');
}
