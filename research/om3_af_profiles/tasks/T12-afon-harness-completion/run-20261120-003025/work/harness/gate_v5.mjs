// The only function that delivers keys, dial detents, pose changes and setter writes.
// A commit-class input is delivered only after its sealed row is present.
// Identity is still read after that call returns, at the screen that is up.
// Commit class is decided here from the key. A caller commitClass flag is ignored.
// EMULATOR-ONLY.
import { compareState } from './compare_v4.mjs';
import { rowKey } from './identity_v4.mjs';

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
  const key = rowKey(step && (step.identityFrom || step.key));
  if (!key) return { ok: false, problems: ['refuse commit: no expectation key'], expected: null, actual: null, key: null };
  return { ok: true, problems: [], expected: null, actual: null, key };
}

export function createGate(ctx, deps) {
  let depth = 0;
  const rawKey = ctx.key.bind(ctx);
  const rawPress = ctx.press.bind(ctx);
  const rawSKey = ctx.s.key.bind(ctx.s);
  const rawDial = ctx.s['dial_' + 'input'].bind(ctx.s);
  const reject = (name) => { throw new Error('raw ' + name + ' outside the gate'); };
  ctx.key = (key, dir) => { if (!depth) reject('key ' + key + ' ' + dir); return rawKey(key, dir); };
  ctx.press = () => { reject('press'); };
  ctx.s.key = (key, dir) => { if (!depth) reject('s.key'); return rawSKey(key, dir); };
  ctx.s['dial_' + 'input'] = (...args) => { if (!depth) reject('dial'); return rawDial(...args); };
  let poseApi = null;
  let setImpl = null;
  let plantImpl = null;
  let modeImpl = null;
  let mirrorImpl = null;
  void rawPress;

  function readFrame(op) {
    if (op.frame) return op.frame();
    if (deps.frame) return deps.frame();
    return null;
  }

  function operate(op, fn) {
    if (!op || !op.expect) throw new Error('gate operation has no expectation');
    const plan = deps.plan ? deps.plan() : { ids: new Set(), afContext: false };
    const commit = classifyCommit(op, plan);
    if (commit) {
      const presence = (deps.presence || defaultPresence)(op.identity || { id: op.id, key: op.key });
      if (!presence.ok) {
        if (deps.onIdentity) deps.onIdentity(op, presence, null);
        throw new Error((op.id || 'commit') + ' ' + (presence.problems || []).join('; '));
      }
    }
    const beforeFrame = readFrame(op);
    if (deps.requireFrame && beforeFrame == null) throw new Error('null frame');
    const before = deps.capture(beforeFrame, op);
    if (depth) throw new Error('gate re-entered');
    depth = 1;
    let thrown = null;
    try { fn(); }
    catch (error) { thrown = error; }
    finally { depth = 0; }
    if (thrown) throw thrown;
    const finish = () => {
      const ident = commit ? deps.identityNow() : null;
      const afterFrame = readFrame(op);
      if (deps.requireFrame && afterFrame == null) throw new Error('null frame');
      const after = deps.capture(afterFrame, op);
      const problems = compareState(before, after, op.expect);
      if (op.check) problems.push(...op.check(before, after));
      if (deps.onState) deps.onState(op, before, after, problems);
      if (problems.length) throw new Error((op.id || 'op') + ' ' + problems.join('; '));
      if (commit) {
        const decision = deps.approve(op.identity || { id: op.id, key: op.key }, ident);
        if (deps.onIdentity) deps.onIdentity(op, decision, ident);
        if (!decision.ok) throw new Error((op.id || 'commit') + ' ' + (decision.problems || []).join('; '));
        after.identity = { expected: decision.expected, actual: decision.actual, key: decision.key };
      }
      return after;
    };
    const settled = op.settle ? op.settle() : (op.idleMs ? deps.idle(op.idleMs) : undefined);
    if (settled && typeof settled.then === 'function') return settled.then(finish);
    return finish();
  }

  return {
    act(op, fn) { return operate(op, fn); },
    key(op) { return operate(op, () => rawKey(op.key, op.dir)); },
    dial(op) { return operate({ ...op, id: op.id || 'dial' }, () => { rawDial('main', 1); ctx.s.camapp.pump(); }); },
    pose(op) {
      if (!poseApi) throw new Error('pose is not bound');
      return operate(op, () => { poseApi.setPose(op.poseName); poseApi.deliver(); });
    },
    set(op) {
      if (!setImpl) throw new Error('setter is not bound');
      return operate(op, () => setImpl(op.setterKey, op.index, op.value));
    },
    plant(op) {
      if (!plantImpl) throw new Error('plant is not bound');
      return operate(op, () => plantImpl(op.setterKey, op.index, op.value));
    },
    mode(op) {
      if (!modeImpl) throw new Error('mode is not bound');
      return operate(op, () => modeImpl(op.value));
    },
    mirror(op) {
      if (!mirrorImpl) throw new Error('mirror is not bound');
      return operate(op, () => mirrorImpl(op.bytes));
    },
    bindPose(next) { poseApi = next; },
    bindSet(fn) { setImpl = fn; },
    bindPlant(fn) { plantImpl = fn; },
    bindMode(fn) { modeImpl = fn; },
    bindMirror(fn) { mirrorImpl = fn; },
  };
}
