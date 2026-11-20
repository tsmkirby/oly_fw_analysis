import { assertClean } from '../harness/static_check_v6.mjs';
import { spawnSync } from 'node:child_process';

try { assertClean(); }
catch (error) { process.stdout.write(String(error.message) + '\n'); }
const child = spawnSync('node26', ['--import', './work/harness/inventory_register_v2.mjs', 'work/harness/inventory_probe_v2.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, T11_INVENTORY_TAG: 'unit-inv-v2', OM_EMU_MODEL: 'E147', OM_EMU_NVRAM: 'off' },
  encoding: 'utf8',
});
process.stdout.write('status ' + child.status + '\n');
process.stdout.write('stdout ' + child.stdout + '\n');
process.stdout.write('stderr ' + child.stderr + '\n');
process.stdout.write('error ' + (child.error ? child.error.message : '') + '\n');
