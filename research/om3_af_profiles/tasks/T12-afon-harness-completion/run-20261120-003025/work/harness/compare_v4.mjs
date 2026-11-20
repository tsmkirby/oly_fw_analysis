// Full-state comparison. Every §1.2 field is a declared value or explicit preservation.
// A seal, a stale exemption, or a slot exemption without a declared value is a failure.
// EMULATOR-ONLY.

export const FULL_FIELDS = ['slots', 'mirror71', 'flag', 'target', 'halfTarget', 'owner', 'subject', 'frame'];

export function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function planProblems(expect) {
  const problems = [];
  if (!expect) return ['no expectation'];
  if (expect.seal && expect.seal.length) problems.push('seal is not a value');
  if (expect.allowStale) problems.push('stale exemption');
  const named = expect.named || {};
  const hold = new Set(expect.hold || []);
  const slotValues = named.slotValues || [];
  for (const slot of expect.slotExcept || []) {
    const declared = slotValues.find((spec) => spec.key === slot.key && spec.index === slot.index && spec.value !== undefined);
    if (!declared) problems.push('undeclared slot exemption ' + slot.key + ':' + slot.index);
  }
  if (named.slots === undefined && !hold.has('slots')) problems.push('slots uncovered');
  const mirror71 = named.mirror71 !== undefined || hold.has('mirror71');
  const mirrorSplit = named.mirror !== undefined && (named.mirrorTail !== undefined || hold.has('mirrorTail'));
  if (!mirror71 && !mirrorSplit) problems.push('mirror71 uncovered');
  for (const field of ['flag', 'target', 'halfTarget', 'owner', 'subject', 'frame']) {
    if (named[field] !== undefined || hold.has(field)) continue;
    problems.push(field + ' uncovered');
  }
  return problems;
}

function slotId(slot) {
  return slot.key + ':' + slot.index;
}

export function compareState(before, after, expect) {
  const problems = planProblems(expect);
  if (!expect || !after) return problems;
  const named = expect.named || {};
  const hold = new Set(expect.hold || []);
  const except = new Set((expect.slotExcept || []).map(slotId));
  const slotValues = named.slotValues || [];
  if (named.subject !== undefined && after.subject !== named.subject) problems.push('subject');
  if (named.flag !== undefined && after.flag !== named.flag) problems.push('flag');
  if (named.owner !== undefined && after.owner !== named.owner) problems.push('owner');
  if (named.target !== undefined && !same(after.target, named.target)) problems.push('target');
  if (named.halfTarget !== undefined && !same(after.halfTarget, named.halfTarget)) problems.push('halfTarget');
  if (named.frame !== undefined && !same(after.frame, named.frame)) problems.push('frame');
  if (named.mirror !== undefined && !same(after.mirror, named.mirror)) problems.push('mirror');
  if (named.mirrorTail !== undefined && !same((after.mirror71 || []).slice(55), named.mirrorTail)) problems.push('mirrorTail');
  if (named.mirror71 !== undefined && !same(after.mirror71, named.mirror71)) problems.push('mirror71');
  if (named.slots !== undefined && !same(after.slots, named.slots)) problems.push('slots');
  const checkDeclared = (slot, got) => {
    const declared = slotValues.find((spec) => spec.key === slot.key && spec.index === slot.index);
    if (!declared) return false;
    if (!got || got.value !== declared.value) problems.push('slot ' + slotId(slot));
    return true;
  };
  if (!hold.has('slots')) {
    for (const spec of slotValues) {
      const got = (after.slots || []).find((slot) => slot.key === spec.key && slot.index === spec.index);
      if (!got || got.value !== spec.value) problems.push('slot ' + spec.key + ':' + spec.index);
    }
  }
  if (hold.has('slots') && Array.isArray(before.slots)) {
    for (let i = 0; i < before.slots.length; i++) {
      const slot = before.slots[i];
      const got = after.slots && after.slots[i];
      if (checkDeclared(slot, got)) continue;
      if (except.has(slotId(slot))) problems.push('undeclared slot exemption ' + slotId(slot));
      if (!got || slot.value !== got.value) problems.push('held slot ' + slotId(slot));
    }
  }
  if (hold.has('mirror71') && !same(before.mirror71, after.mirror71)) problems.push('held mirror71');
  if (hold.has('mirrorTail') && !same((before.mirror71 || []).slice(55), (after.mirror71 || []).slice(55))) problems.push('held mirrorTail');
  if (hold.has('mirrorHead') && !same(before.mirror, after.mirror)) problems.push('held mirror');
  for (const field of ['flag', 'target', 'halfTarget', 'owner', 'subject', 'frame']) {
    if (!hold.has(field) || named[field] !== undefined) continue;
    if (!same(before[field], after[field])) problems.push('held ' + field);
  }
  return problems;
}
