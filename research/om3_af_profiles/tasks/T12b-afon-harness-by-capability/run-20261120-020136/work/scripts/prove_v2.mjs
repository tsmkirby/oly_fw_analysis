// Proof against the freeze, then a bad freeze that omits the harness entry. EMULATOR-ONLY.
import { spawnSync } from 'node:child_process';

function run(tag, script, extra) {
  return spawnSync('node26', ['work/scripts/invoke_v4.mjs', tag, script, ...extra], {
    encoding: 'utf8',
    shell: true,
  });
}

const proof = run('v5-proof', 'work/scripts/run_proof_t13_v4.mjs', ['T12B_RUNNER=1']);
process.stdout.write(proof.stdout || '');
process.stderr.write(proof.stderr || '');
if (proof.status !== 0) {
  process.stderr.write('proof status ' + proof.status + '\n');
  process.exit(proof.status == null ? 1 : proof.status);
}
process.stdout.write('proof ok\n');

const wrote = spawnSync('node26', ['work/scripts/write_bad_freeze_v2.mjs'], { encoding: 'utf8', shell: true });
process.stdout.write(wrote.stdout || '');
process.stderr.write(wrote.stderr || '');
if (wrote.status !== 0) process.exit(wrote.status == null ? 1 : wrote.status);

const bad = run('v5-bad-freeze', 'work/scripts/run_identity_t13_v4.mjs', [
  'T12B_RUNNER=1',
  'T12B_FREEZE_PATH=work/out/bad-freeze-v2.json',
  'T12B_FREEZE_SEAL=work/out/bad-freeze-v2.seal.json',
]);
process.stdout.write(bad.stdout || '');
process.stderr.write(bad.stderr || '');
if (bad.status === 0 || !String(bad.stderr).includes('entry_v4.mjs')) {
  process.stderr.write('bad freeze was not refused\n');
  process.exit(1);
}
process.stdout.write('bad freeze refused\n');
