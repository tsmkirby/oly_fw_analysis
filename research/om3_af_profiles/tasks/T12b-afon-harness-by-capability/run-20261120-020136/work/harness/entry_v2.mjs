// The only module runners and drivers import.
// The session object stays in this closure. It is not exported and not placed on globalThis.
// createReal is the OM-Emu session constructor used by T11 and T12. Runners do not call it.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deliver, prepare } from './execute_v1.mjs';
import { createFakeSession } from './fake_session_v1.mjs';
import { createGate } from './gate_v6.mjs';
import { approveCommit, commitPresence } from './identity_v5.mjs';
import { OPERATIONS } from './operations_v2.mjs';

export const IDENTITY_JSON = 'work/out/identity-t13-v2.json';
export const IDENTITY_SEAL = 'work/out/identity-t13-v2.seal.json';

const INVENTORY = Symbol.for('t12b.inventory');
const OVERLAY = 'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv';

let openSession = null;
let realInvocations = 0;

export function realInvocationCount() {
  return realInvocations;
}

function describe(op) {
  return Object.freeze({
    id: op.id,
    group: op.group,
    action: op.action,
    key: op.key,
    dir: op.dir,
    role: op.role,
    kinds: Object.freeze(op.kinds.slice()),
    expectationSource: op.expectationSource,
    idleMs: op.idleMs,
    commitClass: op.commitClass,
    identityRequired: !!(op.identity && op.identity.required),
    poseName: op.poseName,
    setterKey: op.setterKey,
    index: op.index,
    value: op.value,
  });
}

function planFor(op) {
  const ids = new Set();
  for (const item of OPERATIONS) {
    if (item.identity && item.identity.required) ids.add(item.id);
  }
  return { ids, afContext: !!(op && op.afContext) };
}

export async function createReal(opts = {}) {
  realInvocations += 1;
  const checkout = opts.checkout || 'om-emu';
  process.env.OM_EMU_MODEL = 'E147';
  process.env.OM_EMU_NVRAM = 'off';
  process.env.T12B_ALLOW_EMULATOR = '1';
  const zoneHref = pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href;
  const { runZone } = await import(zoneHref);
  const modelMod = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
  const menuMod = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
  const display = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
  const png = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
  const poseMod = await import(pathToFileURL(resolve('ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs')).href);
  return {
    checkout,
    runZone,
    modelMod,
    menuMod,
    wordsToRgb: display.words_to_rgb,
    writePng: png.write_png,
    attachPose: poseMod.attachPose,
    async start(drive, zoneOpts) {
      return runZone({
        checkout,
        outPath: zoneOpts.outPath,
        tag: zoneOpts.tag,
        candidate: zoneOpts.candidate !== false,
        help: true,
        rowLabel: true,
        fatalShots: true,
        nvramPath: zoneOpts.nvramPath,
        overlayCsv: zoneOpts.overlayCsv === undefined ? OVERLAY : zoneOpts.overlayCsv,
        explanation: zoneOpts.explanation || 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.',
        change: zoneOpts.change || 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.',
        drive,
      });
    },
  };
}

export async function runWithGate(opts, driveFn) {
  if (opts && opts.session === 'real') return createReal(opts);
  if (openSession) throw new Error('session already open');
  const session = createFakeSession(opts || {});
  openSession = session;
  const bag = { rows: {}, setupDeltas: {} };
  const mode = (opts && opts.mode) || 'identity';
  const gate = createGate(session.ctx, {
    mode,
    sealed: opts && opts.sealed,
    bag,
    capture(frame) { return session.capture(frame); },
    idle(ms) { session.idle(ms); },
    identityNow() { return session.identityNow(); },
    frame() { return { n: 1 }; },
    plan: planFor,
    presence(identity) { return commitPresence(mode, opts && opts.sealed, identity); },
    approve(identity, actual) { return approveCommit(mode, opts && opts.sealed, identity, actual, bag.rows); },
  });
  const handle = Object.create(null);
  const described = Object.freeze(OPERATIONS.map(describe));
  handle.perform = (id) => {
    if (typeof id !== 'string') throw new Error('operation id required');
    const op = OPERATIONS.find((item) => item.id === id);
    if (!op) throw new Error('unknown operation ' + id);
    const body = prepare(op, session);
    return gate.perform(body, () => deliver(session, body));
  };
  handle.operations = () => described;
  handle.results = () => JSON.parse(JSON.stringify({
    deliveries: gate.deliveries(),
    rows: bag.rows,
    setupDeltas: bag.setupDeltas,
    hooksInstalled: session.hooksInstalled,
    refreshInstalled: session.refreshInstalled,
    apiCalls: session.apiLog.length,
    idleMs: session.idleLog.slice(),
    refreshProblems: session.refresh.problems(),
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
  const text = JSON.stringify({ rows: results.rows, setupDeltas: results.setupDeltas }, null, 2) + '\n';
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
  process.env.T12B_RUNNER = '1';
  process.env.OM_EMU_MODEL = 'E147';
  process.env.OM_EMU_NVRAM = 'off';
  if (!fs[INVENTORY]) throw new Error('refuse: inventory registrar was not loaded');
  const capture = process.env.T12B_FREEZE_CAPTURE === '1';
  if (capture && kind === 'proof') throw new Error('refuse: capture mode cannot be combined with proof mode');
  if (!capture) {
    const problems = fs[INVENTORY].enforceNoted();
    if (problems.length) throw new Error('refuse to start: ' + problems.join('; '));
  }
  const { drive } = await import('./driver_v2.mjs');
  const mode = kind === 'proof' ? 'proof' : 'identity';
  const sealed = kind === 'proof' ? loadSealed() : null;
  const out = await drive({ kind, mode, sealed });
  const summary = {
    kind,
    executed: out.executed.length,
    ok: true,
    hooksInstalled: out.results.hooksInstalled,
    refreshInstalled: out.results.refreshInstalled,
    apiCalls: out.results.apiCalls,
    idleCount: out.results.idleMs.length,
    refreshProblems: out.results.refreshProblems,
  };
  if (out.results.refreshProblems.length) {
    throw new Error(kind + ' refresh ' + out.results.refreshProblems.slice(0, 8).join(','));
  }
  if (kind === 'identity') writeIdentity(out.results);
  fs.mkdirSync(resolve('work/out'), { recursive: true });
  fs.writeFileSync(resolve('work/out/' + kind + '-t13-v2.json'), JSON.stringify(summary, null, 2) + '\n');
  return out;
}
