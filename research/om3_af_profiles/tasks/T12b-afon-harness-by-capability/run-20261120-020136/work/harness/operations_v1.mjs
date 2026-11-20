// The only operation definitions. Drivers iterate this array.
// Coverage and the identity-table generator read this array. EMULATOR-ONLY.
import { EDGES } from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { classifyCommit } from './gate_v6.mjs';
import { rowKey } from './identity_v5.mjs';
import { table } from './table_v2.mjs';

const DRIVE = ['identity', 'proof'];

function identityKeyFor(step, role, phase) {
  if (phase === 'up' && (step.key === 'ok' || step.key === 'menu')) return step.who[0] + ':' + step.id + '-up';
  if (step.identityFrom) {
    const parsed = rowKey(step.identityFrom);
    if (parsed) return parsed;
  }
  const suffix = phase && phase !== 'x' ? '-' + phase : '';
  return role + ':' + step.id + suffix;
}

function push(ops, spec) {
  ops.push({
    id: spec.id,
    group: spec.group,
    action: spec.action,
    key: spec.key || null,
    dir: spec.dir || null,
    role: spec.role || null,
    kinds: spec.kinds.slice(),
    expectationSource: spec.expectationSource,
    requireFrame: !!spec.requireFrame,
    afContext: !!spec.afContext,
    wantsCommit: !!spec.wantsCommit,
    identityKey: spec.identityKey || null,
    stepId: spec.stepId || spec.id,
  });
}

function build() {
  const ops = [];
  const setupNames = ['bring-up', 'lever', 'focus-arg', 'focus-289', 'focus-1712'];
  for (const name of setupNames) {
    push(ops, {
      id: 'setup-' + name,
      group: 'setup',
      action: 'setup',
      role: 'setup',
      kinds: DRIVE,
      expectationSource: 'sealed-delta',
      stepId: name,
    });
  }
  for (const step of table.steps) {
    for (const role of step.who) {
      if (step.action === 'key') {
        for (const dir of ['down', 'up']) {
          const commitUp = dir === 'up' && (step.key === 'ok' || step.key === 'menu');
          push(ops, {
            id: role + '-' + step.id + '-' + dir,
            group: 'table',
            action: 'key',
            key: step.key,
            dir,
            role,
            kinds: DRIVE,
            expectationSource: 'hold',
            wantsCommit: !!step.commit && (dir === 'down' || commitUp),
            identityKey: identityKeyFor(step, role, dir),
            stepId: step.id + '-' + dir,
          });
        }
      } else {
        push(ops, {
          id: role + '-' + step.id,
          group: 'table',
          action: step.action === 'edge' ? 'key' : step.action,
          key: step.key || null,
          dir: step.dir || null,
          role,
          kinds: DRIVE,
          expectationSource: 'hold',
          wantsCommit: !!step.commit,
          identityKey: identityKeyFor(step, role, step.action === 'edge' ? step.dir : 'x'),
          stepId: step.id,
        });
      }
    }
  }
  for (const role of ['k1e', 'k2', 'candidate']) {
    push(ops, {
      id: role + '-pose-landscape', group: 'pose', action: 'pose', role, kinds: DRIVE, expectationSource: 'hold', stepId: 'pose-landscape',
    });
    push(ops, {
      id: role + '-link-1db1', group: 'setter', action: 'set', role, kinds: DRIVE, expectationSource: 'hold', stepId: 'link-1db1',
    });
    push(ops, {
      id: role + '-link-1dc1', group: 'setter', action: 'set', role, kinds: DRIVE, expectationSource: 'hold', stepId: 'link-1dc1',
    });
  }
  const zoneNav = [
    { id: 'z0', nav: ['up'] },
    { id: 'z1', nav: ['up', 'dial'] },
    { id: 'z2', nav: ['up', 'dial'] },
    { id: 'z3', nav: ['up', 'dial'] },
    { id: 'z4', nav: ['up', 'dial'] },
    { id: 'z5', nav: ['up', 'dial'] },
  ];
  const pairNames = ['99a1', '84d1', '1dd1', '1dd1#2', '88b2', '5962', '9a41', '1df1'];
  function nav(prefix, names, role) {
    for (const name of names) {
      if (name === 'dial') {
        push(ops, {
          id: prefix + '-dial', group: 'zone', action: 'dial', role, kinds: DRIVE, expectationSource: 'hold', afContext: true,
        });
      } else {
        push(ops, {
          id: prefix + '-' + name + '-down', group: 'zone', action: 'key', key: name, dir: 'down', role, kinds: DRIVE, expectationSource: 'hold', afContext: true,
        });
        push(ops, {
          id: prefix + '-' + name + '-up', group: 'zone', action: 'key', key: name, dir: 'up', role, kinds: DRIVE, expectationSource: 'hold', afContext: true,
        });
      }
    }
  }
  for (const zone of zoneNav) {
    nav('zk1e-' + zone.id, zone.nav, 'k1e');
    push(ops, { id: 'zk1e-zone-' + zone.id + '-down', group: 'zone', action: 'key', key: 'ok', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'zk1e-zone-' + zone.id + '-up', group: 'zone', action: 'key', key: 'ok', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'zk1e-' + zone.id + '-s1-down', group: 'zone', action: 'key', key: 's1', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'zk1e-' + zone.id + '-s1-up', group: 'zone', action: 'key', key: 's1', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    nav('zcand-' + zone.id, zone.nav, 'candidate');
    push(ops, { id: 'zcand-enter-' + zone.id, group: 'zone', action: 'enter', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'zcand-zone-' + zone.id + '-down', group: 'zone', action: 'key', key: 'ok', dir: 'down', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'zcand-zone-' + zone.id + '-up', group: 'zone', action: 'key', key: 'ok', dir: 'up', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    for (const name of pairNames) {
      push(ops, { id: 'zcand-' + zone.id + '-set-' + name, group: 'setter', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    }
    push(ops, { id: 'zcand-' + zone.id + '-af-down', group: 'zone', action: 'key', key: 'afon', dir: 'down', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'zcand-' + zone.id + '-af-up', group: 'zone', action: 'key', key: 'afon', dir: 'up', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  }
  nav('zk1e-z6', ['up', 'dial'], 'k1e');
  push(ops, { id: 'zk1e-zone-dismiss-0-down', group: 'zone', action: 'key', key: 'ok', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  push(ops, { id: 'zk1e-zone-dismiss-0-up', group: 'zone', action: 'key', key: 'ok', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  push(ops, { id: 'offer-custom', group: 'setter', action: 'set', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  for (let i = 0; i < 4; i++) {
    push(ops, { id: 'seek-' + i + '-down', group: 'zone', action: 'key', key: 'up', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'seek-' + i + '-up', group: 'zone', action: 'key', key: 'up', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'seek-' + i + '-dial', group: 'zone', action: 'dial', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  }
  for (let i = 0; i < 3; i++) {
    push(ops, { id: 'seek-ok-' + i + '-down', group: 'zone', action: 'key', key: 'ok', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'seek-ok-' + i + '-up', group: 'zone', action: 'key', key: 'ok', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  }
  push(ops, { id: 'zk1e-zone-custom-down', group: 'custom', action: 'key', key: 'ok', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  push(ops, { id: 'zk1e-zone-custom-up', group: 'custom', action: 'key', key: 'ok', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  push(ops, { id: 'custom-s1-down', group: 'custom', action: 'key', key: 's1', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  push(ops, { id: 'custom-s1-up', group: 'custom', action: 'key', key: 's1', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  push(ops, { id: 'zcand-enter-custom', group: 'custom', action: 'enter', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  for (const name of pairNames) {
    push(ops, { id: 'custom-mirror-' + name, group: 'custom', action: 'mirror', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
    push(ops, { id: 'custom-live-' + name, group: 'custom', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  }
  push(ops, { id: 'custom-flag-clear', group: 'custom', action: 'mode', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  push(ops, { id: 'zcand-custom-af-down', group: 'custom', action: 'key', key: 'afon', dir: 'down', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  push(ops, { id: 'zcand-custom-af-up', group: 'custom', action: 'key', key: 'afon', dir: 'up', role: 'candidate', kinds: DRIVE, expectationSource: 'hold', afContext: true });
  for (const boot of ['zone-landscape', 'zone-landscape#2']) {
    push(ops, { id: boot, group: 'pose', action: 'pose', role: 'candidate', kinds: DRIVE, expectationSource: 'hold' });
    push(ops, { id: boot.replace('landscape', 'link-1db1'), group: 'setter', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'hold' });
    push(ops, { id: boot.replace('landscape', 'link-1dc1'), group: 'setter', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'hold' });
  }
  const jobs = [
    { id: 'seed-a', kind: 'display-a', stock: false, seed: true },
    { id: 'seed-b', kind: 'display-b', stock: false, seed: true },
    { id: 'k2', kind: 'display-k2', stock: false, seed: false },
    { id: 'k1', kind: 'display-k1', stock: true, seed: false },
  ];
  if (EDGES.length !== 12) throw new Error('display edges ' + EDGES.length);
  for (const job of jobs) {
    const kinds = DRIVE.concat([job.kind]);
    for (const name of setupNames) {
      push(ops, {
        id: job.id + '-' + name,
        group: 'setup',
        action: 'setup',
        role: 'display',
        kinds,
        expectationSource: 'sealed-delta',
        stepId: job.id + '-' + name,
      });
    }
    if (!job.stock) {
      for (const [key, index] of [[0x84d1, 0], [0x1dd1, 0], [0x1dd1, 1], [0x99a1, 0]]) {
        push(ops, {
          id: job.id + '-set-' + key.toString(16) + '-' + index,
          group: 'setter', action: 'set', role: 'display', kinds, expectationSource: 'hold', requireFrame: true,
        });
      }
      for (const key of [0x1db1, 0x1dc1]) {
        push(ops, {
          id: job.id + '-set-' + key.toString(16),
          group: 'setter', action: 'set', role: 'display', kinds, expectationSource: 'hold', requireFrame: true,
        });
      }
    }
    if (job.seed) {
      push(ops, {
        id: job.id + '-seed', group: 'display', action: 'mirror', role: 'display', kinds, expectationSource: 'hold', requireFrame: true,
      });
    }
    for (let i = 0; i < EDGES.length; i++) {
      const id = job.id + '-e' + i;
      push(ops, {
        id,
        group: 'display',
        action: 'key',
        key: EDGES[i][0],
        dir: EDGES[i][1],
        role: 'display',
        kinds,
        expectationSource: 'hold',
        requireFrame: true,
        afContext: true,
        identityKey: 'display:' + id,
        stepId: id,
      });
    }
  }
  const seen = new Set();
  for (const op of ops) {
    if (seen.has(op.id)) throw new Error('duplicate operation ' + op.id);
    seen.add(op.id);
  }
  const probeIds = new Set(ops.filter((op) => op.wantsCommit).map((op) => op.id));
  return ops.map((op) => {
    const decided = classifyCommit({ id: op.id, key: op.key }, { ids: probeIds, afContext: op.afContext });
    const identity = decided
      ? {
          required: true,
          key: op.identityKey || ((op.role || 'k1e') + ':' + String(op.id).replaceAll('#', '-')),
          recordRole: op.role || 'k1e',
          stepId: op.stepId || op.id,
        }
      : { required: false };
    return {
      id: op.id,
      group: op.group,
      action: op.action,
      key: op.key,
      dir: op.dir,
      role: op.role,
      kinds: op.kinds,
      expectationSource: op.expectationSource,
      requireFrame: op.requireFrame,
      afContext: op.afContext,
      commitClass: decided ? 'commit' : 'none',
      identity,
      idleMs: 0,
    };
  });
}

export const OPERATIONS = build();

export function coverageIds() {
  return OPERATIONS.map((op) => op.id);
}

export function identitySpecs() {
  const specs = [];
  for (const op of OPERATIONS) {
    if (!op.identity || !op.identity.required) continue;
    specs.push({
      id: op.id,
      key: op.identity.key,
      recordRole: op.identity.recordRole,
      stepId: op.identity.stepId,
      commitClass: op.commitClass,
      expectationSource: op.expectationSource,
    });
  }
  return specs;
}

export function executionCoverageProblems(executed) {
  const have = new Set(executed || []);
  const problems = [];
  for (const op of OPERATIONS) {
    if (!have.has(op.id)) problems.push('not executed ' + op.id);
  }
  return problems;
}

export function identityCoverageProblems(rows) {
  const have = new Set(Object.keys(rows || {}));
  const problems = [];
  for (const spec of identitySpecs()) {
    if (!have.has(spec.key)) problems.push('missing ' + spec.key);
  }
  return problems;
}
