// Pure decisions for the combined hook. EMULATOR-ONLY behaviour lives in afon_hooks_v1.mjs.
// The writer arms itself when the native AF-ON path sees owner enter 2 after the builder.
// The pose gate refuses a copier store of the mirror's saved cell onto a different live cell,
// including when that live cell is no longer the reset value, and a store into another bank.
// The editor commit uses the same setter return. It is allowed while no pose change is in
// progress, unless the live cell is still the reset value.

export function shouldArmWriter(ownerAtEntry, owner, builderThisEntry) {
  return builderThisEntry === true && ownerAtEntry !== 2 && owner === 2;
}

export function shouldRefusePoseWrite({ mode, key, index, value, live, mirrored, bank, duringPose, reset }) {
  if (mode === 1) return false;
  if (key !== 0x5962 && key !== 0x99a1) return false;
  const inactive = index !== bank;
  const ontoReset = reset !== undefined && live === reset;
  const leak = mirrored !== null && mirrored === value && live !== value && (duringPose === true || ontoReset);
  return inactive || leak;
}
