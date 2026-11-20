// Full-state comparison used by the gate before it returns.
// A named field must equal its resolved source. Every other full-state field must equal
// the value captured before the operation. A plan that leaves a field unnamed and unheld is rejected.

export const FULL_FIELDS = ['slots', 'mirror71', 'flag', 'target', 'halfTarget', 'owner', 'subject', 'frame'];

export function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function stale(bytes) {
  return Array.isArray(bytes) && bytes.length >= 7 && bytes[4] === 27 && bytes[6] === 39;
}

export function planCovers(expect) {
  const problems = [];
  const named = expect.named || {};
  const hold = new Set(expect.hold || []);
  const seal = new Set(expect.seal || []);
  if (named.slots || hold.has('slots') || seal.has('slots')) {
    /* slots covered; slotExcept still sit under the slots hold */
  } else problems.push('slots uncovered');
  const mirrorNamed = named.mirror !== undefined || named.mirror71 !== undefined;
  const tailNamed = named.mirrorTail !== undefined;
  if (named.mirror71 !== undefined || hold.has('mirror71') || (mirrorNamed && (tailNamed || hold.has('mirrorTail')))) {
    /* mirror covered */
  } else problems.push('mirror71 uncovered');
  for (const field of ['flag', 'target', 'halfTarget', 'owner', 'subject', 'frame']) {
    if (named[field] !== undefined || hold.has(field) || seal.has(field)) continue;
    problems.push(field + ' uncovered');
  }
  return problems;
}

export function compareState(before, after, expect) {
  if (!expect) return ['no expectation'];
  const problems = planCovers(expect);
  const named = expect.named || {};
  const hold = new Set(expect.hold || []);
  const seal = new Set(expect.seal || []);
  const except = new Set((expect.slotExcept || []).map((slot) => slot.key + ':' + slot.index));

  if (named.subject !== undefined && after.subject !== named.subject) problems.push('subject');
  if (named.flag !== undefined && after.flag !== named.flag) problems.push('flag');
  if (named.owner !== undefined && after.owner !== named.owner) problems.push('owner');
  if (named.target !== undefined && !same(after.target, named.target)) problems.push('target');
  if (named.halfTarget !== undefined && !same(after.halfTarget, named.halfTarget)) problems.push('halfTarget');
  if (named.frame !== undefined && !same(after.frame, named.frame)) problems.push('frame');
  if (named.mirror !== undefined && !same(after.mirror, named.mirror)) problems.push('mirror');
  if (named.mirrorTail !== undefined && !same(after.mirror71.slice(55), named.mirrorTail)) problems.push('mirrorTail');
  if (named.mirror71 !== undefined && !same(after.mirror71, named.mirror71)) problems.push('mirror71');
  if (named.slots !== undefined && !same(after.slots, named.slots)) problems.push('slots');
  if (named.slotValues) {
    for (const spec of named.slotValues) {
      const got = after.slots.find((slot) => slot.key === spec.key && slot.index === spec.index);
      if (!got || got.value !== spec.value) problems.push('slot ' + spec.key.toString(16) + ':' + spec.index);
    }
  }
  for (const field of seal) {
    if (field === 'target' || field === 'halfTarget') {
      if (!after[field] || after[field].length !== 10) problems.push('seal ' + field);
      if (stale(after[field])) problems.push('stale ' + field);
    }
    if (field === 'slots' && (!after.slots || after.slots.length !== 63)) problems.push('seal slots');
    if (field === 'owner' && typeof after.owner !== 'number') problems.push('seal owner');
  }
  if (hold.has('slots')) {
    for (let i = 0; i < before.slots.length; i++) {
      const id = before.slots[i].key + ':' + before.slots[i].index;
      if (except.has(id)) continue;
      if (before.slots[i].value !== after.slots[i].value) problems.push('held slot ' + id);
    }
  }
  if (hold.has('mirror71') && !same(before.mirror71, after.mirror71)) problems.push('held mirror71');
  if (hold.has('mirrorTail') && !same(before.mirror71.slice(55), after.mirror71.slice(55))) problems.push('held mirrorTail');
  if (hold.has('mirrorHead') && !same(before.mirror, after.mirror)) problems.push('held mirror');
  for (const field of ['flag', 'target', 'halfTarget', 'owner', 'subject', 'frame']) {
    if (!hold.has(field) || named[field] !== undefined || seal.has(field)) continue;
    if (!same(before[field], after[field])) problems.push('held ' + field);
  }
  return problems;
}
