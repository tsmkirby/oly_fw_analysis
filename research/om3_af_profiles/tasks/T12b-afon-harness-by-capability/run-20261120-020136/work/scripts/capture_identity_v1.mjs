// Runs the static check, the read-form probe, and the identity capture. EMULATOR-ONLY.
import { spawnSync } from 'node:child_process';
import { checkFiles, DRIVER_FILES, RUNNER_FILES } from '../harness/static_check_v3.mjs';

const problems = checkFiles(RUNNER_FILES.concat(DRIVER_FILES));
if (problems.length) {
  process.stderr.write(problems.join('\n') + '\n');
  process.exit(1);
}
process.stdout.write('static ok\n');

function run(tag, script, extra) {
  const result = spawnSync('node26', ['work/scripts/invoke_v2.mjs', tag, script, ...extra], {
    encoding: 'utf8',
    shell: true,
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.status !== 0) process.exit(result.status == null ? 1 : result.status);
}

run('v3-forms', 'work/scripts/inventory_probe_v2.mjs', ['T12B_PROBE=forms']);
run('v3-identity', 'work/scripts/run_identity_t13_v3.mjs', ['T12B_FREEZE_CAPTURE=1', 'T12B_RUNNER=1']);
process.stdout.write('capture identity ok\n');
