// Native setup calls. Each mutation is one gated operation.
// EMULATOR-ONLY. Role: test setup.
export function bringUp(ctx) {
  ctx.bringUp();
  ctx.emit('behaviour', { step: 'bring-up', label: 'EMULATOR-ONLY T8 bring-up and TAKE_FOCUS. Role: test setup.' });
}

export function lever(ctx) {
  ctx.s.switch_input('lever', 1);
  ctx.s.camapp.pump();
}

export function focusArgument(ctx) {
  return ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
}

export function focusApply(ctx, modelMod, mode, argument) {
  const api = modelMod.A(0x50ac4afe);
  ctx.l.call(api, { d0: mode, d1: argument }, null, null, 200000);
}

export function markSaf(ctx) {
  ctx.emit('behaviour', { step: 's-af', label: 'EMULATOR-ONLY test setup. S-AF through the public focus API. Role: test setup.' });
}

export const SETUP_STEPS = ['bring-up', 'lever', 'focus-arg', 'focus-289', 'focus-1712'];

export async function runSetup(ctx, modelMod, gate, bodyFor) {
  const box = { argument: 0 };
  const steps = [
    ['bring-up', 0, () => bringUp(ctx)],
    ['lever', 400, () => lever(ctx)],
    ['focus-arg', 0, () => { box.argument = focusArgument(ctx); }],
    ['focus-289', 0, () => focusApply(ctx, modelMod, 289, box.argument)],
    ['focus-1712', 300, () => { focusApply(ctx, modelMod, 1712, 0); markSaf(ctx); }],
  ];
  let cursor;
  for (const [suffix, idleMs, fn] of steps) {
    cursor = await gate.act(bodyFor(suffix, idleMs), fn);
  }
  return cursor;
}
