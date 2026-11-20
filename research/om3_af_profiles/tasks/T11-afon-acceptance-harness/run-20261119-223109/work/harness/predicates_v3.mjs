// Pure decisions for the combined hook. EMULATOR-ONLY behaviour lives in afon_hooks_v6.mjs.
// The writer arms itself when the native AF-ON path sees owner enter 2 after the builder.
// Pose refusal reads poseActive, which the installed hook sets from the native pose path.
// It does not read watchArmed or any other runner flag.

export function shouldArmWriter(ownerAtEntry, owner, builderThisEntry) {
  return builderThisEntry === true && ownerAtEntry !== 2 && owner === 2;
}

export function shouldRefusePoseWrite({ mode, key, index, value, live, mirrored, bank, poseActive, reset }) {
  if (mode === 1) return false;
  if (key !== 0x5962 && key !== 0x99a1) return false;
  const inactive = index !== bank;
  const ontoReset = reset !== undefined && live === reset;
  const leak = mirrored !== null && mirrored === value && live !== value && (poseActive === true || ontoReset);
  return inactive || leak;
}

// The object the hook uses. issue/publish come from the native pose path.
// endPose runs when the next key or dial is dispatched through the wrapped session input.
// setWatch only records instrumentation. decide never reads it.
export function createPoseGate() {
  let poseActive = false;
  let watchArmed = false;
  return {
    issue() { poseActive = true; },
    publish() { poseActive = true; },
    endPose() { poseActive = false; },
    setWatch(value) { watchArmed = !!value; },
    watchArmed() { return watchArmed; },
    poseActive() { return poseActive; },
    decide(write) { return shouldRefusePoseWrite({ ...write, poseActive }); },
  };
}
