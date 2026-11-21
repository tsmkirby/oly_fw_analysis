// T13 plans as data (design_v2 §0, §5). EMULATOR-ONLY.
// The module computes plain objects at import and exports them deep-frozen. validatePlans() rejects any
// function, getter, symbol, unknown key or wrong type. Execution, completion coverage, identity coverage and the
// identity seal all derive from these objects; the seal records this file's SHA-256.
// Payloads, idle times and order are the accepted T12 drive_v12.mjs / display_v5.mjs / setup_v2.mjs values,
// with bring-up split into five operations and focus-arg kept separate (review correction 5).
import { table } from './table_v2.mjs';
import { checkTable } from './check_table_v3.mjs';
import { EDGES } from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';

export const T8_OVERLAY = 'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv';
export const T6_OVERLAY = 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv';

export const SETUP = [
  { setup: 'init-6071181e', idleMs: 0 },
  { setup: 'init-608fe1b0', idleMs: 0 },
  { setup: 'init-609df7e4', idleMs: 0 },
  { setup: 'take-focus-act', idleMs: 0 },
  { setup: 'take-focus-settle', idleMs: 0 },
  { setup: 'lever', idleMs: 400 },
  { setup: 'focus-arg', idleMs: 0 },
  { setup: 'focus-289', idleMs: 0 },
  { setup: 'focus-1712', idleMs: 300 },
];

const ZONE_NAV = [
  { id: 'z0', nav: ['up'] },
  { id: 'z1', nav: ['up', 'dial'] },
  { id: 'z2', nav: ['up', 'dial'] },
  { id: 'z3', nav: ['up', 'dial'] },
  { id: 'z4', nav: ['up', 'dial'] },
  { id: 'z5', nav: ['up', 'dial'] },
];
// drive_v12 pairArgs: setter key, index, source cell in the zone K1e S1-down state.
const PAIRS = [
  ['99a1', 0x99a1, 0, 'k99a1', 0],
  ['84d1', 0x84d1, 0, 'k84d1', 0],
  ['1dd1', 0x1dd1, 0, 'k1dd1', 0],
  ['1dd1#2', 0x1dd1, 1, 'k1dd1', 1],
  ['88b2', 0x88b2, 0, 'k88b2', 0],
  ['5962', 0x5962, 0, 'k88b2', 0],
  ['9a41', 0x9a41, 0, 'k9a41', 0],
  ['1df1', 0x1df1, 0, 'k1df1', 0],
];

function seedMirror(zone, pos, size0, size1, kind) {
  const m = Array(55).fill(0xff);
  m[0] = zone; m[1] = zone; m[0x08] = 0; m[0x0a] = pos & 0xff; m[0x0b] = (pos >> 8) & 0xff;
  m[0x16] = size0; m[0x17] = size1; m[0x20] = kind;
  // display_v5 also wrote 0x3f into a 55-byte Uint8Array, which drops it; kept identical by omitting it.
  return m;
}

function setupOps(prefix) {
  return SETUP.map((s) => ({ id: prefix + '-' + s.setup, action: 'setup', setup: s.setup, idleMs: s.idleMs }));
}

function bootOps(prefix, poseId) {
  return [
    { id: poseId, action: 'pose', poseName: 'landscape', idleMs: 500 },
    { id: poseId.replace('landscape', 'link-1db1'), action: 'set', setterKey: 0x1db1, index: 0, value: 1, idleMs: 0 },
    { id: poseId.replace('landscape', 'link-1dc1'), action: 'set', setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0, linkCheck: true },
  ];
}

function tableOps(role, hooks) {
  const ops = [];
  for (const step of table.steps) {
    if (!step.who.includes(role)) continue;
    const base = { table: { step: step.id, role } };
    if (step.action === 'key') {
      ops.push({ ...base, id: role + '-' + step.id + '-down', action: 'key', key: step.key, dir: 'down', idleMs: 80, table: { ...base.table, phase: 'down' } });
      ops.push({ ...base, id: role + '-' + step.id + '-up', action: 'key', key: step.key, dir: 'up', idleMs: 400, table: { ...base.table, phase: 'up' }, shotAfter: step.id });
    } else if (step.action === 'edge') {
      const op = { ...base, id: role + '-' + step.id, action: 'key', key: step.key, dir: step.dir, idleMs: step.dir === 'down' ? 80 : 400, table: { ...base.table, phase: step.dir }, shotAfter: step.id };
      if (hooks) op.refreshBefore = true;
      ops.push(op);
    } else if (step.action === 'enter') {
      ops.push({ ...base, id: role + '-' + step.id, action: 'enter', idleMs: 200, table: { ...base.table, phase: 'enter' }, shotAfter: step.id });
    } else if (step.action === 'pose') {
      const op = { ...base, id: role + '-' + step.id, action: 'pose', poseName: step.key, idleMs: 600, table: { ...base.table, phase: 'pose' }, shotAfter: step.id, linkCheck: true };
      if (hooks) { op.watch = true; op.refreshAfter = true; }
      ops.push(op);
    } else if (step.action === 'check') {
      ops.push({ ...base, id: role + '-' + step.id, action: 'check', idleMs: 0, table: { ...base.table, phase: 'check' }, shotAfter: step.id });
    } else throw new Error('table action ' + step.action);
  }
  return ops;
}

function t8dSession(role) {
  const hooks = role === 'candidate';
  const ops = [...setupOps(role), ...bootOps(role, role + '-pose-landscape')];
  if (hooks) ops[ops.length - 1] = { ...ops[ops.length - 1], refreshAfter: true };
  ops.push(...tableOps(role, hooks));
  return {
    id: role, kind: 't8d', role, hooks, overlay: T8_OVERLAY, image: 'candidate', help: true, rowLabel: true,
    writerCalls: hooks ? 3 : null,
    explanation: hooks
      ? 'Candidate. Combined hook, self-armed writer, saved-bank feed, native pose gate. EMULATOR-ONLY. Role: behaviour.'
      : (role === 'k2' ? 'K2. Combined overlay, no hooks. EMULATOR-ONLY. Role: behaviour.' : 'K1e, the overlay S1 reference. EMULATOR-ONLY. Role: behaviour.'),
    change: hooks ? 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.' : 'none',
    ops,
  };
}

function navOps(prefix, names) {
  const ops = [];
  for (const name of names) {
    if (name === 'dial') ops.push({ id: prefix + '-dial', action: 'dial', idleMs: 400, afContext: true });
    else {
      ops.push({ id: prefix + '-' + name + '-down', action: 'key', key: name, dir: 'down', idleMs: 80, afContext: true });
      ops.push({ id: prefix + '-' + name + '-up', action: 'key', key: name, dir: 'up', idleMs: 400, afContext: true });
    }
  }
  return ops;
}

function okPair(id) {
  return [
    { id: id + '-down', action: 'key', key: 'ok', dir: 'down', idleMs: 80, afContext: true },
    { id: id + '-up', action: 'key', key: 'ok', dir: 'up', idleMs: 400, afContext: true },
  ];
}

function zoneK1eSession() {
  const ops = [...setupOps('zk1e'), ...bootOps('zk1e', 'zone-landscape')];
  for (const zone of ZONE_NAV) {
    ops.push(...navOps('zk1e-' + zone.id, zone.nav));
    ops.push(...okPair('zk1e-zone-' + zone.id));
    ops.push({ id: 'zk1e-' + zone.id + '-s1-down', action: 'key', key: 's1', dir: 'down', idleMs: 80, afContext: true, zoneRef: { zone: zone.id, which: 'press' } });
    ops.push({ id: 'zk1e-' + zone.id + '-s1-up', action: 'key', key: 's1', dir: 'up', idleMs: 400, afContext: true, zoneRef: { zone: zone.id, which: 'release' } });
  }
  ops.push(...navOps('zk1e-z6', ['up', 'dial']));
  ops.push(...okPair('zk1e-zone-dismiss-0'));
  ops.push({ id: 'offer-custom', action: 'set', setterKey: 0x5a11, index: 5, value: 1, idleMs: 0, afContext: true });
  const seek = (n) => [
    { id: 'seek-' + n + '-down', action: 'key', key: 'up', dir: 'down', idleMs: 80, afContext: true },
    { id: 'seek-' + n + '-up', action: 'key', key: 'up', dir: 'up', idleMs: 400, afContext: true },
    { id: 'seek-' + n + '-dial', action: 'dial', idleMs: 400, afContext: true },
  ];
  for (let i = 0; i < 3; i++) { ops.push(...seek(i)); ops.push(...okPair('seek-ok-' + i)); }
  ops.push(...seek(3));
  ops.push(...okPair('zk1e-zone-custom'));
  ops.push({ id: 'custom-s1-down', action: 'key', key: 's1', dir: 'down', idleMs: 80, afContext: true, zoneRef: { zone: 'custom', which: 'press' } });
  ops.push({ id: 'custom-s1-up', action: 'key', key: 's1', dir: 'up', idleMs: 400, afContext: true, zoneRef: { zone: 'custom', which: 'release' } });
  return {
    id: 'zk1e', kind: 'zone', role: 'zk1e', hooks: false, overlay: T8_OVERLAY, image: 'candidate', help: true, rowLabel: true,
    writerCalls: null,
    explanation: 'Zone K1e, the overlay S1 reference. EMULATOR-ONLY. Role: behaviour.', change: 'none', ops,
  };
}

function pairOps(prefix, zone) {
  return PAIRS.map(([name, key, index, cell, cellIndex]) => ({
    id: prefix + name, action: 'set', setterKey: key, index, idleMs: 0, afContext: true,
    valueFrom: { op: zone === 'custom' ? 'custom-s1-down' : 'zk1e-' + zone + '-s1-down', cell, index: cellIndex },
  }));
}

function zoneCandSession() {
  const ops = [...setupOps('zcand'), ...bootOps('zcand', 'zone-landscape#2')];
  for (const zone of ZONE_NAV) {
    ops.push({ id: 'zcand-enter-' + zone.id, action: 'enter', idleMs: 200, afContext: true });
    ops.push(...navOps('zcand-' + zone.id, zone.nav));
    ops.push(...okPair('zcand-zone-' + zone.id));
    ops.push(...pairOps('zcand-' + zone.id + '-set-', zone.id));
    ops.push({ id: 'zcand-' + zone.id + '-af-down', action: 'key', key: 'afon', dir: 'down', idleMs: 80, afContext: true, refreshBefore: true, zoneRef: { zone: zone.id, which: 'press' } });
    ops.push({ id: 'zcand-' + zone.id + '-af-up', action: 'key', key: 'afon', dir: 'up', idleMs: 400, afContext: true, zoneRef: { zone: zone.id, which: 'release' } });
  }
  ops.push({ id: 'zcand-enter-custom', action: 'enter', idleMs: 200, afContext: true });
  ops.push(...pairOps('custom-mirror-', 'custom'));
  ops.push({ id: 'custom-flag-clear', action: 'mode', value: 0, idleMs: 0, afContext: true });
  ops.push(...pairOps('custom-live-', 'custom'));
  ops.push({ id: 'zcand-custom-af-down', action: 'key', key: 'afon', dir: 'down', idleMs: 80, afContext: true, refreshBefore: true, zoneRef: { zone: 'custom', which: 'press' } });
  ops.push({ id: 'zcand-custom-af-up', action: 'key', key: 'afon', dir: 'up', idleMs: 400, afContext: true, zoneRef: { zone: 'custom', which: 'release' } });
  return {
    id: 'zcand', kind: 'zone', role: 'zcand', hooks: true, overlay: T8_OVERLAY, image: 'candidate', help: true, rowLabel: true,
    writerCalls: 7,
    explanation: 'Zone candidate. Same combined hook. EMULATOR-ONLY. Role: behaviour.',
    change: 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.', ops,
  };
}

const JOBS = [
  { job: 'seed-a', seed: seedMirror(2, 529, 3, 3, 3), stock: false },
  { job: 'seed-b', seed: seedMirror(1, 529, 1, 1, 0), stock: false },
  { job: 'k2', seed: null, stock: false },
  { job: 'k1', seed: null, stock: true },
];

function displaySession({ job, seed, stock }) {
  const id = 'disp-' + job;
  const ops = setupOps(id).map((op) => ({ ...op, requireFrame: true }));
  if (!stock) {
    for (const [key, index, value] of [[0x84d1, 0, 2], [0x1dd1, 0, 1], [0x1dd1, 1, 1], [0x99a1, 0, 0]]) {
      ops.push({ id: job + '-set-' + key.toString(16) + '-' + index, action: 'set', setterKey: key, index, value, idleMs: 0, requireFrame: true, relation: 'plant' });
    }
    for (const key of [0x1db1, 0x1dc1]) {
      ops.push({ id: job + '-set-' + key.toString(16), action: 'set', setterKey: key, index: 0, value: 1, idleMs: 0, requireFrame: true, relation: 'hold' });
    }
  }
  if (seed) ops.push({ id: job + '-seed', action: 'mirror', bytes: seed, idleMs: 0, requireFrame: true, relation: 'mirror-seed' });
  ops.push({ id: job + '-prepare', action: 'prepare', idleMs: 0, requireFrame: true });
  for (let i = 0; i < EDGES.length; i++) {
    ops.push({
      id: job + '-e' + i, action: 'key', key: EDGES[i][0], dir: EDGES[i][1], idleMs: 0, requireFrame: true, afContext: true,
      settle: 'edge-window', display: { job, edge: i },
    });
  }
  return {
    id, kind: 'display', role: 'display', job, hooks: !stock, overlay: stock ? null : T6_OVERLAY, image: stock ? 'stock' : 'candidate',
    help: false, rowLabel: false, writerCalls: null, recorder: true,
    explanation: stock ? 'K1 stock. No overlay and no combined hook. EMULATOR-ONLY. Role: behaviour.' : 'Display ' + job + '. Combined hook. EMULATOR-ONLY. Role: behaviour.',
    change: stock ? 'none' : 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.',
    ops,
  };
}

const SESSIONS = {
  k1e: t8dSession('k1e'),
  k2: t8dSession('k2'),
  candidate: t8dSession('candidate'),
  zk1e: zoneK1eSession(),
  zcand: zoneCandSession(),
  'disp-seed-a': displaySession(JOBS[0]),
  'disp-seed-b': displaySession(JOBS[1]),
  'disp-k2': displaySession(JOBS[2]),
  'disp-k1': displaySession(JOBS[3]),
};

const PLAN_SESSIONS = {
  identity: ['k1e', 'k2', 'candidate', 'zk1e', 'zcand', 'disp-seed-a', 'disp-seed-b', 'disp-k2', 'disp-k1'],
  proof: ['k1e', 'k2', 'candidate', 'zk1e', 'zcand'],
  'display-a': ['disp-seed-a'],
  'display-b': ['disp-seed-b'],
  'display-k2': ['disp-k2'],
  'display-k1': ['disp-k1'],
};

function deepFreeze(x) {
  if (x && typeof x === 'object') {
    for (const v of Object.values(x)) deepFreeze(v);
    Object.freeze(x);
  }
  return x;
}

export const PLAN = deepFreeze({
  version: 1,
  sessions: SESSIONS,
  plans: PLAN_SESSIONS,
  pressReference: 'k1e-s1-down-halfTarget',
});

// ---- validation ----
const SESSION_KEYS = {
  id: 'string', kind: 'string', role: 'string', hooks: 'boolean', overlay: 'string|null', image: 'string', help: 'boolean',
  rowLabel: 'boolean', writerCalls: 'number|null', explanation: 'string', change: 'string', ops: 'array', job: 'string',
  recorder: 'boolean',
};
const OP_KEYS = {
  id: 'string', action: 'string', key: 'string', dir: 'string', setup: 'string', poseName: 'string', setterKey: 'number',
  index: 'number', value: 'number', valueFrom: 'object', bytes: 'array', idleMs: 'number', settle: 'string', table: 'object',
  afContext: 'boolean', watch: 'boolean', refreshBefore: 'boolean', refreshAfter: 'boolean', shotAfter: 'string',
  linkCheck: 'boolean', display: 'object', zoneRef: 'object', requireFrame: 'boolean', relation: 'string',
};
const NESTED = {
  valueFrom: { op: 'string', cell: 'string', index: 'number' },
  table: { step: 'string', role: 'string', phase: 'string' },
  display: { job: 'string', edge: 'number' },
  zoneRef: { zone: 'string', which: 'string' },
};
const ACTIONS = new Set(['setup', 'key', 'dial', 'pose', 'set', 'mode', 'mirror', 'enter', 'check', 'prepare']);
const SETUP_NAMES = new Set(SETUP.map((s) => s.setup));

function typeOk(v, want) {
  return want.split('|').some((t) => (t === 'null' ? v === null : t === 'array' ? Array.isArray(v) : t === 'object' ? (v !== null && typeof v === 'object' && !Array.isArray(v)) : typeof v === t));
}

function plainKeys(obj, allowed, where, problems) {
  if (obj === null || typeof obj !== 'object') { problems.push(where + ' is not an object'); return; }
  if (Object.getPrototypeOf(obj) !== Object.prototype) problems.push(where + ' is not a plain object');
  if (Object.getOwnPropertySymbols(obj).length) problems.push(where + ' has symbol keys');
  for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(obj))) {
    if (d.get || d.set) { problems.push(where + '.' + k + ' is an accessor'); continue; }
    if (typeof d.value === 'function') { problems.push(where + '.' + k + ' is a function'); continue; }
    if (!(k in allowed)) { problems.push(where + ' unknown key ' + k); continue; }
    if (!typeOk(d.value, allowed[k])) problems.push(where + '.' + k + ' type');
  }
}

export function validatePlans(plan = PLAN) {
  const problems = [];
  const top = { version: 'number', sessions: 'object', plans: 'object', pressReference: 'string' };
  plainKeys(plan, top, 'plan', problems);
  const seen = new Set();
  for (const [sid, s] of Object.entries(plan.sessions || {})) {
    plainKeys(s, SESSION_KEYS, 'session ' + sid, problems);
    if (s.id !== sid) problems.push('session id ' + sid);
    for (const op of s.ops || []) {
      plainKeys(op, OP_KEYS, 'op ' + (op && op.id), problems);
      if (!op || typeof op !== 'object') continue;
      if (seen.has(op.id)) problems.push('duplicate op ' + op.id);
      seen.add(op.id);
      if (!ACTIONS.has(op.action)) problems.push('op ' + op.id + ' action ' + op.action);
      if (op.action === 'setup' && !SETUP_NAMES.has(op.setup)) problems.push('op ' + op.id + ' setup ' + op.setup);
      if (op.action === 'key' && (!op.key || (op.dir !== 'down' && op.dir !== 'up'))) problems.push('op ' + op.id + ' key');
      if (op.action === 'set' && (typeof op.setterKey !== 'number' || (op.value === undefined && !op.valueFrom))) problems.push('op ' + op.id + ' set');
      if (typeof op.idleMs !== 'number') problems.push('op ' + op.id + ' idleMs');
      for (const [k, allowed] of Object.entries(NESTED)) if (op[k] !== undefined) plainKeys(op[k], allowed, 'op ' + op.id + '.' + k, problems);
      if (op.bytes) for (const b of op.bytes) if (!Number.isInteger(b) || b < 0 || b > 255) problems.push('op ' + op.id + ' byte');
    }
  }
  for (const [name, list] of Object.entries(plan.plans || {})) {
    if (!Array.isArray(list)) { problems.push('plan ' + name); continue; }
    for (const sid of list) if (!plan.sessions[sid]) problems.push('plan ' + name + ' session ' + sid);
  }
  problems.push(...checkTable(table).map((p) => 'table: ' + p));
  return problems;
}

export function sessionsOf(planName, plan = PLAN) {
  const list = plan.plans[planName];
  if (!list) throw new Error('unknown plan ' + planName);
  return list.map((sid) => plan.sessions[sid]);
}

// The exact operation ids a plan executes, in order (the completion check compares with this list).
export function expectedOps(planName, plan = PLAN) {
  return sessionsOf(planName, plan).flatMap((s) => s.ops.map((op) => s.id + ':' + op.id));
}

export const COMMIT_KEYS = Object.freeze(['ok', 'menu', 'afon', 's1']);

// Commit operations of a plan: every key edge whose key is a commit key. Classification is by key only, so an
// operation cannot opt out (the gate applies the same rule; review correction 6, unmarked classification).
export function commitOps(planName, plan = PLAN) {
  return sessionsOf(planName, plan).flatMap((s) => s.ops.filter((op) => op.action === 'key' && COMMIT_KEYS.includes(op.key)).map((op) => s.id + ':' + op.id));
}

export { table, EDGES };
