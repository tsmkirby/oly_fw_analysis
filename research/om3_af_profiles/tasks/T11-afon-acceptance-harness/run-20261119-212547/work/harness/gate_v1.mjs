// The only function that delivers keys, dial detents, pose changes and setter writes.
// A raw call after the gate is installed fails the session.
export function createGate(ctx) {
  let depth = 0;
  const rawKey = ctx.key.bind(ctx);
  const rawPress = ctx.press.bind(ctx);
  const rawSKey = ctx.s.key.bind(ctx.s);
  const rawDial = ctx.s.dial_input.bind(ctx.s);
  const reject = (name) => { throw new Error('raw ' + name + ' outside the gate'); };
  ctx.key = (k, d) => { if (!depth) reject('key ' + k + ' ' + d); return rawKey(k, d); };
  ctx.press = (k) => { if (!depth) reject('press ' + k); return rawPress(k); };
  ctx.s.key = (k, d) => { if (!depth) reject('s.key'); return rawSKey(k, d); };
  ctx.s.dial_input = (...args) => { if (!depth) reject('dial'); return rawDial(...args); };
  let poseApi = null;
  let setImpl = null;
  function run(fn) {
    if (depth) throw new Error('gate re-entered');
    depth = 1;
    try { return fn(); }
    finally { depth = 0; }
  }
  return {
    key(k, d) { run(() => rawKey(k, d)); },
    press(k) { run(() => rawPress(k)); },
    dial() { run(() => { rawDial('main', 1); ctx.s.camapp.pump(); }); },
    pose(name) {
      if (!poseApi) throw new Error('pose is not bound');
      run(() => { poseApi.setPose(name); poseApi.deliver(); });
    },
    set(key, index, value) {
      if (!setImpl) throw new Error('setter is not bound');
      run(() => setImpl(key, index, value));
    },
    bindPose(poseApiNext) { poseApi = poseApiNext; },
    bindSet(fn) { setImpl = fn; },
  };
}
