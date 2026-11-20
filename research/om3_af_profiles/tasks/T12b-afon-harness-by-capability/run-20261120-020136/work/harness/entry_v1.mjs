// The only module runners and drivers import.
// The session object stays in this closure. It is not exported and not placed on globalThis.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { createGate } from './gate_v6.mjs';
import { approveCommit, commitPresence } from './identity_v5.mjs';
import { OPERATIONS } from './operations_v1.mjs';

export const IDENTITY_JSON = 'work/out/identity-t13-v1.json';
export const IDENTITY_SEAL = 'work/out/identity-t13-v1.seal.json';

const INVENTORY = Symbol.for('t12b.inventory');

let openSession = null;

function baseState() {
  return {
    slots: [{ key: 0x88b2, index: 0, value: 526 }],
    mirror71: [1, 2, 3],
    mirror: [1, 2, 3],
    flag: 0,
    target: [1, 2],
    halfTarget: [1, 2],
    owner: 0,
    subject: 0,
    frame: { n: 1 },
  };
}

export function defaultSetupApply(state, op) {
  let n = 0;
  const id = String(op.id);
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % 251;
  state.flag = n;
}

function createFake(opts) {
  const state = baseState();
  const session = {
    token: 'sess-' + Math.random().toString(16).slice(2),
    apply(op) {
      if (op.expectationSource === 'sealed-delta') {
        const apply = opts.setupApply || defaultSetupApply;
        apply(state, op);
      }
    },
    capture() {
      return JSON.parse(JSON.stringify({
        slots: state.slots,
        mirror71: state.mirror71,
        mirror: state.mirror,
        flag: state.flag,
        target: state.target,
        halfTarget: state.halfTarget,
        owner: state.owner,
        subject: state.subject,
        frame: state.frame,
      }));
    },
    frame() {
      return { n: 1 };
    },
    identityNow() {
      return { title: 'shooting', highlight: [0], screen: 'shooting' };
    },
  };
  return session;
}

function createReal() {
  throw new Error('T12b does not start the emulator');
}

function planFor(op) {
  const ids = new Set();
  for (const item of OPERATIONS) {
    if (item.identity && item.identity.required) ids.add(item.id);
  }
  return { ids, afContext: !!op.afContext };
}

export async function runWithGate(opts, driveFn) {
  if (opts && opts.session === 'real') createReal();
  if (openSession) throw new Error('session already open');
  const session = createFake(opts || {});
  openSession = session;
  const bag = { rows: {}, setupDeltas: {} };
  const mode = (opts && opts.mode) || 'identity';
  const gate = createGate(session, {
    mode,
    sealed: opts && opts.sealed,
    bag,
    capture(frame) {
      const state = session.capture();
      if (frame) state.frame = frame;
      return state;
    },
    idle() {},
    identityNow() { return session.identityNow(); },
    frame() { return session.frame(); },
    plan: planFor,
    presence(identity) { return commitPresence(mode, opts && opts.sealed, identity); },
    approve(identity, actual) { return approveCommit(mode, opts && opts.sealed, identity, actual, bag.rows); },
  });
  const handle = Object.create(null);
  handle.perform = (op) => gate.perform(op);
  handle.operations = () => OPERATIONS;
  handle.results = () => JSON.parse(JSON.stringify({
    deliveries: gate.deliveries(),
    rows: bag.rows,
    setupDeltas: bag.setupDeltas,
  }));
  try {
    return await driveFn(handle);
  } finally {
    openSession = null;
  }
}

function loadSealed() {
  const raw = fs.readFileSync(resolve(IDENTITY_JSON));
  const sha256 = createHash('sha256').update(raw).digest('hex');
  const seal = JSON.parse(fs.readFileSync(resolve(IDENTITY_SEAL), 'utf8'));
  if (seal.sha256 !== sha256) throw new Error('identity seal mismatch');
  if (seal.bytes !== raw.length) throw new Error('identity seal length');
  const body = JSON.parse(raw.toString('utf8'));
  body.sealed = true;
  body.sha256 = sha256;
  return body;
}

function writeIdentity(results) {
  const body = { rows: results.rows, setupDeltas: results.setupDeltas };
  const text = JSON.stringify(body, null, 2) + '\n';
  fs.writeFileSync(resolve(IDENTITY_JSON), text);
  const raw = fs.readFileSync(resolve(IDENTITY_JSON));
  const seal = {
    sha256: createHash('sha256').update(raw).digest('hex'),
    bytes: raw.length,
    path: IDENTITY_JSON,
  };
  fs.writeFileSync(resolve(IDENTITY_SEAL), JSON.stringify(seal, null, 2) + '\n');
  fs.readFileSync(resolve(IDENTITY_SEAL));
  return seal;
}

export async function runRunner(kind) {
  process.env.OM_EMU_MODEL = 'E147';
  process.env.OM_EMU_NVRAM = 'off';
  if (!fs[INVENTORY]) throw new Error('refuse: inventory registrar was not loaded');
  if (process.env.T12B_FREEZE_ENFORCE === '1' && fs[INVENTORY].enforceNoted) {
    const problems = fs[INVENTORY].enforceNoted();
    if (problems.length) throw new Error('refuse to start: ' + problems.join('; '));
  }
  const { drive } = await import('./driver_v1.mjs');
  const mode = kind === 'proof' ? 'proof' : 'identity';
  const sealed = kind === 'proof' ? loadSealed() : null;
  const out = await drive({ kind, mode, sealed, session: 'fake' });
  if (kind === 'identity') writeIdentity(out.results);
  else {
    fs.mkdirSync(resolve('work/out'), { recursive: true });
    fs.writeFileSync(
      resolve('work/out/' + kind + '-t13-v1.json'),
      JSON.stringify({ kind, executed: out.executed.length, ok: true }, null, 2) + '\n',
    );
  }
  return out;
}
