// Evaluates relations_v1 on the retained T11 identity-v10 emulator records (real states, pure Node).
// Those records predate T13 and lack mirror71, sizeRecord, edge, readBank and slots; the judge runs
// lenient here, so absent fields are skipped and reported as a count, never as passes. EMULATOR-ONLY data.
import { readFileSync } from 'node:fs';
import { table } from './table_v2.mjs';
import { createJudge, judgeIdentityFrom, judgeTableOp, judgeZone } from './relations_v1.mjs';

export const T11_DIR = 'ref/analysis/button-af/readiness/t11-afon-acceptance-harness/out/';

export function loadT11() {
  const lines = readFileSync(T11_DIR + 'identity-t11-v10.jsonl', 'utf8').trim().split('\n').map((x) => JSON.parse(x));
  const rows = JSON.parse(readFileSync(T11_DIR + 'identity-t11-v10.json', 'utf8')).rows;
  return { lines, rows };
}

function opsOf(step, role) {
  if (step.action === 'key') return [['down', role + '-' + step.id + '-down'], ['up', role + '-' + step.id + '-up']];
  if (step.action === 'edge') return [[step.dir, role + '-' + step.id]];
  return [[step.action, role + '-' + step.id]];
}

export function evaluateT11({ lines, rows }, mutate) {
  const byId = new Map();
  const identity = new Map();
  for (const line of lines) {
    if (line.id.endsWith('-identity')) identity.set(line.id.slice(0, -'-identity'.length), line.actual);
    else if (line.actual && !byId.has(line.id)) byId.set(line.id, line);
  }
  const judge = createJudge({ lenient: true });
  const recorded = { k1e: {}, k2: {}, candidate: {} };
  let evaluated = 0;
  for (const role of ['k1e', 'k2', 'candidate']) {
    for (const step of table.steps) {
      if (!step.who.includes(role)) continue;
      for (const [phase, opId] of opsOf(step, role)) {
        const line = byId.get(opId);
        if (!line) { judge.fail(opId, 'record', 'T11 log', 'missing'); continue; }
        const after = mutate ? mutate(opId, structuredClone(line.actual)) : line.actual;
        judgeTableOp(judge, recorded, { opId, role, step, phase, before: line.before, after });
        evaluated += 1;
        if (step.commit && (phase === 'down' || step.action === 'edge' || ((step.key === 'ok' || step.key === 'menu') && phase === 'up'))) {
          const key = phase === 'up' && step.action === 'key' ? step.who[0] + ':' + step.id + '-up' : step.identityFrom;
          const producer = rows[key];
          const own = identity.get(opId);
          if (own) judgeIdentityFrom(judge, opId, own, producer, key);
        }
        recorded[role][step.id] = after;
        if (phase === 'down' && step.action === 'key') recorded[role][step.id + '-down'] = after;
      }
    }
  }
  for (const zone of ['z0', 'z1', 'z2', 'z3', 'z4', 'z5', 'custom']) {
    const k1eDown = byId.get(zone === 'custom' ? 'custom-s1-down' : 'zk1e-' + zone + '-s1-down');
    const k1eUp = byId.get(zone === 'custom' ? 'custom-s1-up' : 'zk1e-' + zone + '-s1-up');
    const cDown = byId.get('zcand-' + zone + '-af-down');
    const cUp = byId.get('zcand-' + zone + '-af-up');
    judgeZone(judge, zone, k1eDown && k1eDown.actual, k1eUp && k1eUp.actual, cDown && (mutate ? mutate('zcand-' + zone + '-af-down', structuredClone(cDown.actual)) : cDown.actual), cUp && cUp.actual);
  }
  return { judge, evaluated };
}
