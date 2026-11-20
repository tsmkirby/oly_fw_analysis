// Native setup calls. Runners reach these only through the gate.
// EMULATOR-ONLY. Role: test setup.
export function bootInputs(ctx, modelMod) {
  ctx.bringUp();
  ctx.emit('behaviour', { step: 'bring-up', label: 'EMULATOR-ONLY T8 bring-up and TAKE_FOCUS. Role: test setup.' });
  ctx.s.switch_input('lever', 1);
  ctx.s.camapp.pump();
  ctx.idle(400);
  const api = modelMod.A(0x50ac4afe);
  const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
  ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
  ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
  ctx.idle(300);
  ctx.emit('behaviour', { step: 's-af', label: 'EMULATOR-ONLY test setup. S-AF through the public focus API. Role: test setup.' });
}
