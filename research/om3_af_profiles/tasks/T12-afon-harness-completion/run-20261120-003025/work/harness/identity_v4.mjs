// Identity rows and the pre-session coverage list.
// The gate classifies the key. commitPresence runs before any commit input.
// The value comparison still runs after the key, at the screen that is up.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readListed } from './inventory_v4.mjs';
import { table } from './table_v2.mjs';

export function rowKey(identityFrom) {
  if (!identityFrom) return null;
  const match = /^(?:ref:)?(k1e|k2|candidate|display|zcand|K1e|K2):([A-Za-z0-9-]+)$/.exec(identityFrom);
  if (!match) return null;
  const role = match[1] === 'K1e' ? 'k1e' : match[1] === 'K2' ? 'k2' : match[1];
  return role + ':' + match[2];
}

export function opId(role, step, phase) {
  if (step.action === 'key') return role + '-' + step.id + '-' + phase;
  return role + '-' + step.id;
}

const ZONE_IDS = ['z0', 'z1', 'z2', 'z3', 'z4', 'z5', 'custom'];
const DISPLAY_JOBS = ['seed-a', 'seed-b', 'k2', 'k1'];
export const DISPLAY_EDGE_COUNT = 12;

function add(specs, spec) {
  specs.push(spec);
}

export function commitSpecs() {
  const specs = [];
  for (const step of table.steps) {
    if (!step.commit) continue;
    const downKey = rowKey(step.identityFrom);
    for (const role of step.who) {
      if (step.action === 'key') {
        add(specs, { id: opId(role, step, 'down'), key: downKey, recordRole: role, stepId: step.id });
        if (step.key === 'ok' || step.key === 'menu') {
          const producer = step.who[0];
          add(specs, {
            id: opId(role, step, 'up'),
            key: producer + ':' + step.id + '-up',
            recordRole: role,
            stepId: step.id + '-up',
          });
        }
      } else {
        add(specs, { id: opId(role, step, step.dir), key: downKey, recordRole: role, stepId: step.id });
      }
    }
  }
  for (const id of ZONE_IDS) {
    add(specs, { id: 'zk1e-zone-' + id + '-down', key: 'k1e:zone-' + id, recordRole: 'k1e', stepId: 'zone-' + id });
    add(specs, { id: 'zk1e-zone-' + id + '-up', key: 'k1e:zone-' + id + '-up', recordRole: 'k1e', stepId: 'zone-' + id + '-up' });
    add(specs, { id: 'zcand-zone-' + id + '-down', key: 'k1e:zone-' + id, recordRole: 'zcand', stepId: 'zone-' + id });
    add(specs, { id: 'zcand-zone-' + id + '-up', key: 'k1e:zone-' + id + '-up', recordRole: 'zcand', stepId: 'zone-' + id + '-up' });
    if (id === 'custom') {
      add(specs, { id: 'custom-s1-down', key: 'k1e:zone-custom-s1', recordRole: 'k1e', stepId: 'zone-custom-s1' });
      add(specs, { id: 'custom-s1-up', key: 'k1e:zone-custom-s1-up', recordRole: 'k1e', stepId: 'zone-custom-s1-up' });
      add(specs, { id: 'zcand-custom-af-down', key: 'k1e:zone-custom-s1', recordRole: 'zcand', stepId: 'zone-custom-s1' });
      add(specs, { id: 'zcand-custom-af-up', key: 'k1e:zone-custom-s1-up', recordRole: 'zcand', stepId: 'zone-custom-s1-up' });
    } else {
      add(specs, { id: 'zk1e-' + id + '-s1-down', key: 'k1e:zone-' + id + '-s1', recordRole: 'k1e', stepId: 'zone-' + id + '-s1' });
      add(specs, { id: 'zk1e-' + id + '-s1-up', key: 'k1e:zone-' + id + '-s1-up', recordRole: 'k1e', stepId: 'zone-' + id + '-s1-up' });
      add(specs, { id: 'zcand-' + id + '-af-down', key: 'k1e:zone-' + id + '-s1', recordRole: 'zcand', stepId: 'zone-' + id + '-s1' });
      add(specs, { id: 'zcand-' + id + '-af-up', key: 'k1e:zone-' + id + '-s1-up', recordRole: 'zcand', stepId: 'zone-' + id + '-s1-up' });
    }
  }
  for (const seek of [0, 1, 2]) {
    add(specs, { id: 'seek-ok-' + seek + '-down', key: 'k1e:zone-seek-' + seek, recordRole: 'k1e', stepId: 'zone-seek-' + seek });
    add(specs, { id: 'seek-ok-' + seek + '-up', key: 'k1e:zone-seek-' + seek + '-up', recordRole: 'k1e', stepId: 'zone-seek-' + seek + '-up' });
  }
  add(specs, { id: 'zk1e-zone-dismiss-0-down', key: 'k1e:zone-dismiss-0', recordRole: 'k1e', stepId: 'zone-dismiss-0' });
  add(specs, { id: 'zk1e-zone-dismiss-0-up', key: 'k1e:zone-dismiss-0-up', recordRole: 'k1e', stepId: 'zone-dismiss-0-up' });
  for (const job of DISPLAY_JOBS) {
    for (let i = 0; i < DISPLAY_EDGE_COUNT; i++) {
      const id = job + '-e' + i;
      add(specs, { id, key: 'display:' + id, recordRole: 'display', stepId: id });
    }
  }
  return specs;
}

export function operationPlan() {
  const specs = commitSpecs();
  return {
    ids: new Set(specs.map((spec) => spec.id)),
    keys: [...new Set(specs.map((spec) => spec.key))],
    specs,
    afContext: false,
  };
}

export function identityFor(plan, id) {
  const spec = plan.specs.find((item) => item.id === id);
  if (!spec) return null;
  return { id: spec.stepId, identityFrom: spec.key, recordRole: spec.recordRole, commit: true };
}

export function coverageProblems(rows, plan = operationPlan()) {
  const problems = [];
  const have = new Set(Object.keys(rows || {}));
  for (const key of plan.keys) {
    if (!have.has(key)) problems.push('missing ' + key);
  }
  return problems;
}

export function assertCoverage(rows, plan = operationPlan()) {
  const problems = coverageProblems(rows, plan);
  if (problems.length) throw new Error('identity coverage: ' + problems.join('; '));
  return problems;
}

export function commitPresence(mode, sealed, step) {
  const key = rowKey(step && (step.identityFrom || step.key));
  if (!key) return { ok: false, problems: ['refuse commit: no expectation key'], expected: null, actual: null, key: null };
  if (mode === 'identity') return { ok: true, problems: [], expected: null, actual: null, key };
  if (!sealed || sealed.sealed !== true || !sealed.sha256) {
    return { ok: false, problems: ['refuse commit: identity table is not sealed'], expected: null, actual: null, key };
  }
  const want = sealed.rows && sealed.rows[key];
  if (!want) return { ok: false, problems: ['refuse commit: sealed table has no ' + key], expected: null, actual: null, key };
  return { ok: true, problems: [], expected: want, actual: null, key };
}

export function approveCommit(mode, sealed, step, actual, rows) {
  const key = rowKey(step && (step.identityFrom || step.key));
  if (!key) return { ok: false, problems: ['refuse commit: no expectation key'], expected: null, actual, key: null };
  if (mode === 'identity') {
    if (step.recordRole && key.startsWith(step.recordRole + ':')) rows[key] = actual;
    if (step.recordRole) rows[step.recordRole + ':' + (step.id || key)] = actual;
    return { ok: true, problems: [], expected: actual, actual, key, recorded: true };
  }
  if (!sealed || sealed.sealed !== true || !sealed.sha256) {
    return { ok: false, problems: ['refuse commit: identity table is not sealed'], expected: null, actual, key };
  }
  const want = sealed.rows && sealed.rows[key];
  if (!want) return { ok: false, problems: ['refuse commit: sealed table has no ' + key], expected: null, actual, key };
  const problems = [];
  if (actual.title !== want.title) problems.push('title');
  if (JSON.stringify(actual.highlight) !== JSON.stringify(want.highlight)) problems.push('highlight');
  if (want.screen != null && actual.screen !== want.screen) problems.push('screen');
  return { ok: problems.length === 0, problems, expected: want, actual, key };
}

export function loadSealed(jsonPath, sealPath) {
  const raw = readListed(jsonPath);
  const sha256 = createHash('sha256').update(raw).digest('hex');
  const seal = JSON.parse(readListed(sealPath).toString('utf8'));
  if (seal.sha256 !== sha256) throw new Error('identity seal mismatch');
  if (seal.bytes !== raw.length) throw new Error('identity seal length');
  const tableBody = JSON.parse(raw.toString('utf8'));
  tableBody.sealed = true;
  tableBody.sha256 = sha256;
  return tableBody;
}

export function writeSeal(jsonPath, sealPath) {
  const raw = readListed(jsonPath);
  const seal = {
    sha256: createHash('sha256').update(raw).digest('hex'),
    bytes: raw.length,
    path: jsonPath.replaceAll('\\', '/'),
  };
  writeFileSync(resolve(sealPath), JSON.stringify(seal, null, 2) + '\n');
  readListed(sealPath);
  return seal;
}
