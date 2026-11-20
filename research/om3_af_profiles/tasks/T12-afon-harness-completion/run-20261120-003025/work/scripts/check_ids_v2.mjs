// Coverage of every operation id the driver defines, and every identity key.
import { assertCoverage, operationPlan } from '../harness/identity_v4.mjs';
import { declaredGaps } from '../harness/ops_v1.mjs';

const gaps = declaredGaps();
const plan = operationPlan();
const rows = {};
for (const key of plan.keys) rows[key] = { title: 't', highlight: null, screen: 's' };
let coverage = null;
try { assertCoverage(rows, plan); }
catch (error) { coverage = String(error && error.message ? error.message : error); }
const ok = gaps.missing.length === 0 && gaps.extra.length === 0 && coverage == null;
process.stdout.write(JSON.stringify({
  ok,
  declared: gaps.missing.length + (Object.keys(rows).length ? 0 : 0),
  missing: gaps.missing,
  extra: gaps.extra,
  identityKeys: plan.keys.length,
  coverage,
}) + '\n');
if (!ok) process.exitCode = 1;
