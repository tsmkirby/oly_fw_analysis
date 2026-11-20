// The only function that delivers keys, dial detents, pose changes and setter writes.
// It captures the full state, performs one operation, and compares before it returns.
import { compareState } from './compare_v3.mjs';

export function createGate(ctx, deps) {
  let depth = 0;
  const rawKey = ctx.key.bind(ctx);
  const rawPress = ctx.press.bind(ctx);
  const rawSKey = ctx.s.key.bind(ctx.s);
  const rawDial = ctx.s.dial_input.bind(ctx.s);
  const reject = (name) => { throw new Error('raw ' + name + ' outside the gate'); };
  ctx.key = (key, dir) => { if (!depth) reject('key ' + key + ' ' + dir); return rawKey(key, dir); };
  ctx.press = (key) => { if (!depth) reject('press ' + key); return rawPress(key); };
  ctx.s.key = (key, dir) => { if (!depth) reject('s.key'); return rawSKey(key, dir); };
  ctx.s.dial_input = (...args) => { if (!depth) reject('dial'); return rawDial(...args); };
  let poseApi = null;
  let setImpl = null;
  let plantImpl = null;
  let modeImpl = null;
  let mirrorImpl = null;

  function operate(op, fn) {
    if (!op || !op.expect) throw new Error('gate operation has no expectation');
    if (op.commitClass) {
      const ident = deps.identityNow();
      const decision = deps.approve(op, ident);
      if (deps.onIdentity) deps.onIdentity(op, decision, ident);
      if (!decision.ok) throw new Error((op.id || 'commit') + ' ' + (decision.problems || []).join('; '));
    }
    const before = deps.capture(null);
    if (depth) throw new Error('gate re-entered');
    depth = 1;
    let thrown = null;
    try { fn(); }
    catch (error) { thrown = error; }
    finally { depth = 0; }
    if (thrown) throw thrown;
    const finish = () => {
      const frame = op.frame ? op.frame() : null;
      const after = deps.capture(frame);
      const problems = compareState(before, after, op.expect);
      if (op.check) problems.push(...op.check(before, after));
      if (deps.onState) deps.onState(op, before, after, problems);
      if (problems.length) throw new Error((op.id || 'op') + ' ' + problems.join('; '));
      return after;
    };
    const settled = op.settle ? op.settle() : (op.idleMs ? deps.idle(op.idleMs) : undefined);
    if (settled && typeof settled.then === 'function') return settled.then(finish);
    return finish();
  }

  return {
    act(op, fn) { return operate(op, fn); },
    key(op) { return operate(op, () => rawKey(op.key, op.dir)); },
    press(op) { return operate(op, () => rawPress(op.key)); },
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
