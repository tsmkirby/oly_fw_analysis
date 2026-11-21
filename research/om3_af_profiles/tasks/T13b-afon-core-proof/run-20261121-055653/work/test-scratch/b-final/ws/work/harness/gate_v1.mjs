// The only delivery path (design_v2 §3). EMULATOR-ONLY.
// - Commit class is decided here from the key alone (ok, menu, afon, s1); a plan flag cannot change it.
// - A commit is refused before any delivery when its identity row is absent (presence check).
// - Delivery APIs of the session are wrapped by guardDelivery and throw unless this gate is delivering.
// - The executor never holds the delivery functions: the session adapter passes them to createGate privately.
import { COMMIT_KEYS } from './plan_v1.mjs';

const COMMIT = new Set(COMMIT_KEYS);

export function classifyCommit(op) {
  return !!op && op.action === 'key' && COMMIT.has(op.key);
}

// Wrap named delivery methods of obj so they throw outside a delivery. Returns the originals, which only the
// session adapter keeps (closure-private) and hands to createGate.
export function guardDelivery(obj, names, isDelivering, label) {
  const raw = {};
  for (const name of names) {
    const f = obj[name];
    if (typeof f !== 'function') continue;
    const bound = f.bind(obj);
    raw[name] = bound;
    obj[name] = (...args) => {
      if (!isDelivering()) throw new Error('raw ' + label + '.' + name + ' outside the gate');
      return bound(...args);
    };
  }
  return raw;
}

// deliver: { key(k, d), dial(), pose(name), set(key, index, value), mode(v), mirror(bytes), enter(), setup(name), check(), prepare() }
// deps: { capture(frame) -> state, frame() -> sig|null, idle(ms), settleWindow(op) -> Promise<sig>, identityNow(),
//         presence(sessionId, op) -> { ok, problems }, requireFrame(op) -> bool }
export function createGate(sessionId, deliver, deps) {
  let delivering = false;
  let deliveries = 0;
  let refused = 0;
  const performed = [];

  async function perform(op, value) {
    if (!op || typeof op.id !== 'string') throw new Error('gate operation is missing');
    const commit = classifyCommit(op);
    if (commit) {
      const presence = deps.presence(sessionId, op);
      if (!presence.ok) {
        refused += 1;
        throw new Error(op.id + ' refused before delivery: ' + presence.problems.join('; '));
      }
    }
    const needsFrame = deps.requireFrame(op);
    const beforeFrame = needsFrame ? deps.frame() : null;
    if (needsFrame && beforeFrame == null) throw new Error(op.id + ' null frame before');
    const before = deps.capture(beforeFrame, op, 'before');
    if (delivering) throw new Error('gate re-entered at ' + op.id);
    delivering = true;
    deliveries += 1;
    let result;
    try {
      result = dispatch(op, value);
    } finally {
      delivering = false;
    }
    let afterFrame = null;
    if (op.settle === 'edge-window') afterFrame = await deps.settleWindow(op);
    else if (op.idleMs) deps.idle(op.idleMs);
    const ident = commit ? deps.identityNow() : null;
    if (needsFrame && afterFrame == null) afterFrame = deps.frame();
    if (needsFrame && afterFrame == null) throw new Error(op.id + ' null frame after');
    const after = deps.capture(afterFrame, op, 'after');
    performed.push(op.id);
    return { before, after, ident, commit, result: result === undefined ? null : result };
  }

  function dispatch(op, value) {
    switch (op.action) {
      case 'key': return deliver.key(op.key, op.dir);
      case 'dial': return deliver.dial();
      case 'pose': return deliver.pose(op.poseName);
      case 'set': return deliver.set(op.setterKey, op.index, value);
      case 'mode': return deliver.mode(op.value);
      case 'mirror': return deliver.mirror(op.bytes);
      case 'enter': return deliver.enter();
      case 'setup': return deliver.setup(op.setup);
      case 'check': return undefined;
      case 'prepare': return deliver.prepare();
      default: throw new Error('action ' + op.action);
    }
  }

  return {
    perform,
    delivering: () => delivering,
    deliveries: () => deliveries,
    refused: () => refused,
    performed: () => performed.slice(),
  };
}
