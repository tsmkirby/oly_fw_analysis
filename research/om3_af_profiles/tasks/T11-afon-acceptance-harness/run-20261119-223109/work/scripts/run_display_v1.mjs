import { assertClean } from '../harness/static_check_v5.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
assertClean();
const which = process.argv[2];
if (which !== 'ab' && which !== 'controls') {
  process.stderr.write('usage: node26 work/scripts/run_display_v1.mjs ab|controls\n');
  process.exit(1);
}
const tag = which === 'ab' ? 'display-ab-t11-v1' : 'display-controls-t11-v1';
const { beginSession } = await import('../harness/inventory_v1.mjs');
const session = await beginSession(tag);
let code = 0;
try {
  const { main } = await import('../harness/display_v1.mjs');
  await main({ which, tag });
} catch (e) {
  process.stderr.write(String(e && e.stack ? e.stack : e) + '\n');
  code = 1;
}
const exit = session.finish(['work/scripts/run_display_v1.mjs']);
if (!exit.ok) {
  process.stderr.write('inventory changed: ' + exit.problems.join('; ') + '\n');
  code = 1;
}
process.exitCode = code;
