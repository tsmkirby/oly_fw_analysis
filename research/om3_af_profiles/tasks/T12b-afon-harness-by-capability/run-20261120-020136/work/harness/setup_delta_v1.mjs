// Observed full-state deltas for setup operations whose live effect is unknown.
// A field absent from the sealed delta must be preserved. EMULATOR-ONLY.
import { FULL_FIELDS, same } from './compare_v4.mjs';

export function diffState(before, after) {
  const changed = {};
  for (const field of FULL_FIELDS) {
    if (!same(before[field], after[field])) changed[field] = JSON.parse(JSON.stringify(after[field]));
  }
  return { changed };
}

export function expectFromDelta(delta) {
  const changed = (delta && delta.changed) || {};
  const named = {};
  const hold = [];
  for (const field of FULL_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(changed, field)) named[field] = changed[field];
    else hold.push(field);
  }
  return { named, hold, slotExcept: [], source: 'sealed setup delta' };
}

export function holdAll() {
  return {
    named: { subject: 0 },
    hold: ['slots', 'mirror71', 'flag', 'target', 'halfTarget', 'owner', 'frame'],
    slotExcept: [],
  };
}
