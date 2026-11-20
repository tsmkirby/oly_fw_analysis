// The only delivery path. Commit class is decided here from the key.
// A stored commitClass flag is ignored. A missing sealed row is refused before delivery.
// Identity is read after settle. EMULATOR-ONLY.
import { compareState } from './compare_v4.mjs';
import { identityKey } from './identity_v5.mjs';
import { diffState, expectFromDelta, holdAll } from './setup_delta_v1.mjs';

const COMMIT_KEYS = new Set(['ok', 'menu', 'afon', 's1']);

export function classifyCommit(op, plan) {
  const key = op && op.key;
  if (!COMMIT_KEYS.has(key)) return false;
  const ids = plan && plan.ids;
  if (ids && op.id && ids.has(op.id)) return true;
  if (key === 'ok' || key === 'menu') return true;
  if ((key === 'afon' || key === 's1') && plan && plan.afContext) return true;
  return false;
}

function defaultPresence(step) {
  const key = identityKey(step);
  if (!key) return { ok: false, problems: ['refuse commit: no expectation key'], expected: null, actual: null, key: null };
  return { ok: true, problems: [], expected: null, actual: null, key };
}

function expectationFor(op, before, after, deps) {
  if (op.expect) return op.expect;
  if (op.expectationSource === 'sealed-delta') {
    const mode = deps.mode || 'identity';
    if (mode === 'identity') {
      const delta = diffState(before, after);
      if (deps.bag) deps.bag.setupDeltas[op.id] = delta;
      return expectFromDelta(delta);
    }
    const delta = deps.sealed && deps.sealed.setupDeltas && deps.sealed.setupDeltas[op.id];
    if (!delta) throw new Error((op.id || 'setup') + ' no sealed delta');
    return expectFromDelta(delta);
  }
  if (op.expectationSource === 'hold' || !op.expectationSource) return holdAll();
  throw new Error('expectation source ' + op.expectationSource);
}

export function createGate(session, deps) {
  let depth = 0;
  let delivered = 0;
  const ctx = session || {};

  function readFrame(op) {
    if (op.frame) return op.frame();
    if (deps.frame) return deps.frame();
    return null;
  }

  function perform(op, fn) {
    if (!op) throw new Error('gate operation is missing');
    const plan = deps.plan ? deps.plan(op) : { ids: new Set(), afContext: false };
    const commit = classifyCommit(op, plan);
    const identity = op.identity || { id: op.id, identityFrom: op.identityFrom, key: op.key };
    if (commit) {
      const presence = (deps.presence || defaultPresence)(identity);
      if (!presence.ok) {
        if (deps.onIdentity) deps.onIdentity(op, presence, null);
        throw new Error((op.id || 'commit') + ' ' + (presence.problems || []).join('; '));
      }
    }
    const needsFrame = !!(deps.requireFrame || op.requireFrame);
    const beforeFrame = readFrame(op);
    if (needsFrame && beforeFrame == null) throw new Error('null frame');
    const before = deps.capture(beforeFrame, op);
    if (depth) throw new Error('gate re-entered');
    depth = 1;
    delivered += 1;
    let thrown = null;
    try {
      if (typeof fn === 'function') fn();
      else if (typeof ctx.apply === 'function') ctx.apply(op);
      else if (typeof ctx.key === 'function') ctx.key(op.key, op.dir);
    } catch (error) {
      thrown = error;
    } finally {
      depth = 0;
    }
    if (thrown) throw thrown;
    if (op.settle) op.settle();
    else if (op.idleMs && deps.idle) deps.idle(op.idleMs);
    const ident = commit ? deps.identityNow() : null;
    const afterFrame = readFrame(op);
    if (needsFrame && afterFrame == null) throw new Error('null frame');
    const after = deps.capture(afterFrame, op);
    const expect = expectationFor(op, before, after, deps);
    const problems = compareState(before, after, expect);
    if (op.check) problems.push(...op.check(before, after));
    if (deps.onState) deps.onState(op, before, after, problems);
    if (problems.length) throw new Error((op.id || 'op') + ' ' + problems.join('; '));
    if (commit) {
      const decision = (deps.approve || ((step, actual) => ({ ok: true, problems: [], expected: actual, actual, key: identityKey(step) })))(identity, ident);
      if (deps.onIdentity) deps.onIdentity(op, decision, ident);
      if (!decision.ok) throw new Error((op.id || 'commit') + ' ' + (decision.problems || []).join('; '));
      after.identity = { expected: decision.expected, actual: decision.actual, key: decision.key };
    }
    return after;
  }

  return {
    perform,
    act(op, fn) { return perform(op, fn); },
    key(op) { return perform(op); },
    deliveries() { return delivered; },
  };
}
