// Capture, freeze, proof, and the freeze check. EMULATOR-ONLY.
import { spawnSync } from 'node:child_process';

function step(script) {
  const result = spawnSync('node26', [script], { encoding: 'utf8', shell: true });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.status !== 0) {
    process.stderr.write(script + ' status ' + result.status + '\n');
    process.exit(result.status == null ? 1 : result.status);
  }
}

step('work/scripts/capture_v7.mjs');
step('work/scripts/write_freeze_v4.mjs');
step('work/scripts/prove_v3.mjs');
step('work/scripts/check_freeze_v1.mjs');
process.stdout.write('close ok\n');
