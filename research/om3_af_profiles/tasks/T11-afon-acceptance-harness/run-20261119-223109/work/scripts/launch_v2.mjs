// Starts one inventoried Node process. The emulator version is the child, not this launcher.
import { spawn } from 'node:child_process';

const tag = process.argv[2];
const script = process.argv[3];
const extra = process.argv.slice(4);
if (!tag || !script) {
  process.stderr.write('usage: node26 work/scripts/launch_v2.mjs <tag> <script> [args]\n');
  process.exit(1);
}
const child = spawn(process.execPath, ['--import', './work/harness/inventory_register_v2.mjs', script, ...extra], {
  env: { ...process.env, T11_INVENTORY_TAG: tag, OM_EMU_MODEL: 'E147', OM_EMU_NVRAM: 'off' },
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code == null ? 1 : code));
