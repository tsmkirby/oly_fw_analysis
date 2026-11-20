// Spawns one inventoried node26 process. EMULATOR-ONLY. Not a T13 runner.
import { spawnSync } from 'node:child_process';

const [tag, script, ...rest] = process.argv.slice(2);
if (!tag || !script) {
  process.stderr.write('usage: invoke_v1.mjs <tag> <script> [KEY=value...]\n');
  process.exit(2);
}
const env = {
  ...process.env,
  OM_EMU_MODEL: 'E147',
  OM_EMU_NVRAM: 'off',
  T12B_INVENTORY_TAG: tag,
  T12B_INVENTORY_FAIL: '',
  T12B_RUNNER: '',
  T12B_FREEZE_CAPTURE: '',
  T12B_ALLOW_EMULATOR: '',
  T12B_FREEZE_PATH: '',
  T12B_FREEZE_SEAL: '',
  T12B_PROBE: '',
  T12B_FREEZE_ENFORCE: '',
};
for (const pair of rest) {
  const index = pair.indexOf('=');
  if (index < 1) continue;
  env[pair.slice(0, index)] = pair.slice(index + 1);
}
const result = spawnSync('node26', ['--import', './work/harness/inventory_register_v9.mjs', script], {
  encoding: 'utf8',
  shell: true,
  env,
});
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
process.exit(result.status == null ? 1 : result.status);
