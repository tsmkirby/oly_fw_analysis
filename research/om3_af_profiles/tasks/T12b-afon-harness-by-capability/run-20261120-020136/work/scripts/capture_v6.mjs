// Capture the v4 runners. The identity inventory must include the display reference JSON. EMULATOR-ONLY.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { checkFiles, DRIVER_FILES, RUNNER_FILES } from '../harness/static_check_v4.mjs';

const problems = checkFiles(RUNNER_FILES.concat(DRIVER_FILES));
if (problems.length) {
  process.stderr.write(problems.join('\n') + '\n');
  process.exit(1);
}
process.stdout.write('static ok\n');

function run(tag, script, extra) {
  const result = spawnSync('node26', ['work/scripts/invoke_v4.mjs', tag, script, ...extra], {
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

run('v5-forms', 'work/scripts/inventory_probe_v2.mjs', ['T12B_PROBE=forms']);
const forms = JSON.parse(readFileSync('work/out/inventory-v5-forms-exit.json', 'utf8'));
if (!forms.ok) {
  process.stderr.write('forms ' + (forms.problems || []).join('; ') + '\n');
  process.exit(1);
}
process.stdout.write('forms ok\n');

const captures = [
  ['v5-identity', 'work/scripts/run_identity_t13_v4.mjs'],
  ['v5-display-a', 'work/scripts/run_display_a_t13_v4.mjs'],
  ['v5-display-b', 'work/scripts/run_display_b_t13_v4.mjs'],
  ['v5-display-k2', 'work/scripts/run_display_k2_t13_v4.mjs'],
  ['v5-display-k1', 'work/scripts/run_display_k1_t13_v4.mjs'],
];
for (const [tag, script] of captures) {
  run(tag, script, ['T12B_FREEZE_CAPTURE=1', 'T12B_RUNNER=1']);
  const exit = JSON.parse(readFileSync('work/out/inventory-' + tag + '-exit.json', 'utf8'));
  if (!exit.ok) {
    process.stderr.write(tag + ' ' + (exit.problems || []).join('; ') + '\n');
    process.exit(1);
  }
  process.stdout.write(tag + ' ok imports ' + exit.imports.length + '\n');
}
const identity = JSON.parse(readFileSync('work/out/inventory-v5-identity-exit.json', 'utf8'));
const paths = identity.imports.map((row) => row.path);
for (const name of ['ref-k1e-a.json', 'ref-k1e-b.json', 'ref-k2.json']) {
  if (!paths.some((path) => path.endsWith('/' + name))) {
    process.stderr.write('missing ' + name + '\n');
    process.exit(1);
  }
}
process.stdout.write('reference JSON inventoried\n');
