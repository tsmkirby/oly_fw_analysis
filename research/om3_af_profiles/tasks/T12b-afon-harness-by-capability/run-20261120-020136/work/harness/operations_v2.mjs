// The only operation definitions. Drivers iterate this array.
// Coverage and the identity-table generator read this array.
// Payloads, idle times and expectation sources are the T12 values.
// EMULATOR-ONLY.
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

function keyIdle(dir) {
  return dir === 'down' ? 80 : 400;
}

function setupIdle(stepId) {
  const id = String(stepId);
  if (id.endsWith('lever')) return 400;
  if (id.endsWith('focus-1712')) return 300;
  return 0;
}

function seedMirror(zone, pos, size0, size1, kind) {
  const mirror = new Uint8Array(55);
  mirror.fill(0xff);
  mirror[0] = zone;
  mirror[1] = zone;
  mirror[0x08] = 0;
  mirror[0x0a] = pos & 0xff;
  mirror[0x0b] = (pos >> 8) & 0xff;
  mirror[0x16] = size0;
  mirror[0x17] = size1;
  mirror[0x20] = kind;
  mirror[0x3f] = 0;
  return Array.from(mirror);
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
    tableStepId: spec.tableStepId || null,
    phase: spec.phase || null,
    pose: spec.pose ?? null,
    poseName: spec.poseName || null,
    setterKey: spec.setterKey ?? null,
    index: spec.index ?? null,
    value: spec.value ?? null,
    bytes: spec.bytes || null,
    edgeIndex: spec.edgeIndex ?? null,
    jobId: spec.jobId || null,
    usesSettle: !!spec.usesSettle,
    idleMs: spec.idleMs,
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
      idleMs: setupIdle(name),
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
            expectationSource: 'declared',
            wantsCommit: !!step.commit && (dir === 'down' || commitUp),
            identityKey: identityKeyFor(step, role, dir),
            stepId: step.id + '-' + dir,
            tableStepId: step.id,
            phase: dir,
            pose: step.pose,
            idleMs: keyIdle(dir),
          });
        }
      } else {
        const phase = step.action === 'edge' ? step.dir : step.action;
        const idleMs = step.action === 'edge' ? keyIdle(step.dir) : (step.action === 'pose' ? 600 : (step.action === 'enter' ? 200 : 0));
        push(ops, {
          id: role + '-' + step.id,
          group: 'table',
          action: step.action === 'edge' ? 'key' : step.action,
          key: step.key || null,
          dir: step.dir || null,
          role,
          kinds: DRIVE,
          expectationSource: 'declared',
          wantsCommit: !!step.commit,
          identityKey: identityKeyFor(step, role, step.action === 'edge' ? step.dir : 'x'),
          stepId: step.id,
          tableStepId: step.id,
          phase,
          pose: step.pose,
          poseName: step.action === 'pose' ? step.key : null,
          idleMs,
        });
      }
    }
  }
  for (const role of ['k1e', 'k2', 'candidate']) {
    push(ops, {
      id: role + '-pose-landscape', group: 'pose', action: 'pose', role, kinds: DRIVE,
      expectationSource: 'declared', poseName: 'landscape', pose: 1, idleMs: 500, stepId: 'pose-landscape',
    });
    push(ops, {
      id: role + '-link-1db1', group: 'setter', action: 'set', role, kinds: DRIVE,
      expectationSource: 'declared', setterKey: 0x1db1, index: 0, value: 1, idleMs: 0, stepId: 'link-1db1',
    });
    push(ops, {
      id: role + '-link-1dc1', group: 'setter', action: 'set', role, kinds: DRIVE,
      expectationSource: 'declared', setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0, stepId: 'link-1dc1',
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
          id: prefix + '-dial', group: 'zone', action: 'dial', role, kinds: DRIVE,
          expectationSource: 'declared', afContext: true, idleMs: 400,
        });
      } else {
        push(ops, {
          id: prefix + '-' + name + '-down', group: 'zone', action: 'key', key: name, dir: 'down', role, kinds: DRIVE,
          expectationSource: 'declared', afContext: true, idleMs: 80,
        });
        push(ops, {
          id: prefix + '-' + name + '-up', group: 'zone', action: 'key', key: name, dir: 'up', role, kinds: DRIVE,
          expectationSource: 'declared', afContext: true, idleMs: 400,
        });
      }
    }
  }
  for (const zone of zoneNav) {
    nav('zk1e-' + zone.id, zone.nav, 'k1e');
    push(ops, { id: 'zk1e-zone-' + zone.id + '-down', group: 'zone', action: 'key', key: 'ok', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
    push(ops, { id: 'zk1e-zone-' + zone.id + '-up', group: 'zone', action: 'key', key: 'ok', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
    push(ops, { id: 'zk1e-' + zone.id + '-s1-down', group: 'zone', action: 'key', key: 's1', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
    push(ops, { id: 'zk1e-' + zone.id + '-s1-up', group: 'zone', action: 'key', key: 's1', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
    nav('zcand-' + zone.id, zone.nav, 'candidate');
    push(ops, { id: 'zcand-enter-' + zone.id, group: 'zone', action: 'enter', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 200 });
    push(ops, { id: 'zcand-zone-' + zone.id + '-down', group: 'zone', action: 'key', key: 'ok', dir: 'down', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
    push(ops, { id: 'zcand-zone-' + zone.id + '-up', group: 'zone', action: 'key', key: 'ok', dir: 'up', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
    for (const name of pairNames) {
      push(ops, { id: 'zcand-' + zone.id + '-set-' + name, group: 'setter', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 0 });
    }
    push(ops, { id: 'zcand-' + zone.id + '-af-down', group: 'zone', action: 'key', key: 'afon', dir: 'down', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
    push(ops, { id: 'zcand-' + zone.id + '-af-up', group: 'zone', action: 'key', key: 'afon', dir: 'up', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
  }
  nav('zk1e-z6', ['up', 'dial'], 'k1e');
  push(ops, { id: 'zk1e-zone-dismiss-0-down', group: 'zone', action: 'key', key: 'ok', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
  push(ops, { id: 'zk1e-zone-dismiss-0-up', group: 'zone', action: 'key', key: 'ok', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
  push(ops, { id: 'offer-custom', group: 'setter', action: 'set', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 0, setterKey: 0x5a11, index: 5, value: 1 });
  for (let i = 0; i < 4; i++) {
    push(ops, { id: 'seek-' + i + '-down', group: 'zone', action: 'key', key: 'up', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
    push(ops, { id: 'seek-' + i + '-up', group: 'zone', action: 'key', key: 'up', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
    push(ops, { id: 'seek-' + i + '-dial', group: 'zone', action: 'dial', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
  }
  for (let i = 0; i < 3; i++) {
    push(ops, { id: 'seek-ok-' + i + '-down', group: 'zone', action: 'key', key: 'ok', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
    push(ops, { id: 'seek-ok-' + i + '-up', group: 'zone', action: 'key', key: 'ok', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
  }
  push(ops, { id: 'zk1e-zone-custom-down', group: 'custom', action: 'key', key: 'ok', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
  push(ops, { id: 'zk1e-zone-custom-up', group: 'custom', action: 'key', key: 'ok', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
  push(ops, { id: 'custom-s1-down', group: 'custom', action: 'key', key: 's1', dir: 'down', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
  push(ops, { id: 'custom-s1-up', group: 'custom', action: 'key', key: 's1', dir: 'up', role: 'k1e', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
  push(ops, { id: 'zcand-enter-custom', group: 'custom', action: 'enter', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 200 });
  for (const name of pairNames) {
    push(ops, { id: 'custom-mirror-' + name, group: 'custom', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 0 });
    push(ops, { id: 'custom-live-' + name, group: 'custom', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 0 });
  }
  push(ops, { id: 'custom-flag-clear', group: 'custom', action: 'mode', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 0, value: 0 });
  push(ops, { id: 'zcand-custom-af-down', group: 'custom', action: 'key', key: 'afon', dir: 'down', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 80 });
  push(ops, { id: 'zcand-custom-af-up', group: 'custom', action: 'key', key: 'afon', dir: 'up', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', afContext: true, idleMs: 400 });
  for (const boot of ['zone-landscape', 'zone-landscape#2']) {
    push(ops, { id: boot, group: 'pose', action: 'pose', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', poseName: 'landscape', pose: 1, idleMs: 500 });
    push(ops, { id: boot.replace('landscape', 'link-1db1'), group: 'setter', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', setterKey: 0x1db1, index: 0, value: 1, idleMs: 0 });
    push(ops, { id: boot.replace('landscape', 'link-1dc1'), group: 'setter', action: 'set', role: 'candidate', kinds: DRIVE, expectationSource: 'declared', setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0 });
  }
  const jobs = [
    { id: 'seed-a', kind: 'display-a', stock: false, seed: seedMirror(2, 529, 3, 3, 3) },
    { id: 'seed-b', kind: 'display-b', stock: false, seed: seedMirror(1, 529, 1, 1, 0) },
    { id: 'k2', kind: 'display-k2', stock: false, seed: null },
    { id: 'k1', kind: 'display-k1', stock: true, seed: null },
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
        jobId: job.id,
        idleMs: setupIdle(name),
      });
    }
    if (!job.stock) {
      for (const [key, index, value] of [[0x84d1, 0, 2], [0x1dd1, 0, 1], [0x1dd1, 1, 1], [0x99a1, 0, 0]]) {
        push(ops, {
          id: job.id + '-set-' + key.toString(16) + '-' + index,
          group: 'setter', action: 'set', role: 'display', kinds, expectationSource: 'plant',
          requireFrame: true, setterKey: key, index, value, idleMs: 0, jobId: job.id,
        });
      }
      for (const key of [0x1db1, 0x1dc1]) {
        push(ops, {
          id: job.id + '-set-' + key.toString(16),
          group: 'setter', action: 'set', role: 'display', kinds, expectationSource: 'hold',
          requireFrame: true, setterKey: key, index: 0, value: 1, idleMs: 0, jobId: job.id,
        });
      }
    }
    if (job.seed) {
      push(ops, {
        id: job.id + '-seed', group: 'display', action: 'mirror', role: 'display', kinds,
        expectationSource: 'mirror', requireFrame: true, bytes: job.seed, idleMs: 0, jobId: job.id,
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
        expectationSource: 'edge',
        requireFrame: true,
        afContext: true,
        identityKey: 'display:' + id,
        stepId: id,
        edgeIndex: i,
        jobId: job.id,
        usesSettle: true,
        idleMs: 0,
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
    return { ...op, commitClass: decided ? 'commit' : 'none', identity };
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
