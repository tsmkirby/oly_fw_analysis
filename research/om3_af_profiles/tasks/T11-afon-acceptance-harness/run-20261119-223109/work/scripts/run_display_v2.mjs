import { assertClean } from '../harness/static_check_v7.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
if (!globalThis.__t11Inventory) {
  process.stderr.write('refuse: inventory registrar was not loaded\n');
  process.exit(1);
}
assertClean();
const which = process.argv[2];
if (which !== 'ab' && which !== 'controls') {
  process.stderr.write('usage: node26 work/scripts/run_display_v2.mjs ab|controls\n');
  process.exit(1);
}
const tag = which === 'ab' ? 'display-ab-t11-v2' : 'display-controls-t11-v2';
let code = 0;
try {
  const { main } = await import('../harness/display_v2.mjs');
  await main({ which, tag });
} catch (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  code = 1;
}
process.exitCode = code;
