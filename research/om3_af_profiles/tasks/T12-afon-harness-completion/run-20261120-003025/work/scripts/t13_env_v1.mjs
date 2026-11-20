// Shared setup for the T13 runners. This file is not a runner and T12 does not execute it.
import { checkTable } from '../harness/check_table_v3.mjs';
import { assertCoverage, loadSealed, operationPlan } from '../harness/identity_v3.mjs';
import { assertClean } from '../harness/static_check_v8.mjs';
import { table } from '../harness/table_v2.mjs';

export const IDENTITY_JSON = 'work/out/identity-t13-v1.json';
export const IDENTITY_SEAL = 'work/out/identity-t13-v1.seal.json';

export function prepare(loadSeal) {
  process.env.OM_EMU_MODEL = 'E147';
  process.env.OM_EMU_NVRAM = 'off';
  if (!globalThis.__t12Inventory) {
    process.stderr.write('refuse: inventory registrar was not loaded\n');
    process.exit(1);
  }
  assertClean();
  const problems = checkTable(table);
  if (problems.length) {
    process.stderr.write(problems.join('\n') + '\n');
    process.exit(1);
  }
  const planState = operationPlan();
  let sealed = null;
  if (loadSeal) {
    process.env.T12_REQUIRE_INPUTS = '1';
    process.env.T12_IDENTITY_JSON = IDENTITY_JSON;
    process.env.T12_IDENTITY_SEAL = IDENTITY_SEAL;
    sealed = loadSealed(IDENTITY_JSON, IDENTITY_SEAL);
    assertCoverage(sealed.rows, planState);
  }
  return { planState, sealed };
}
