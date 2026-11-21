// §4.1 reproduction against the sealed identity pass, and the per-operation source map. EMULATOR-ONLY.
// Proof and display plans: every field of before and after equals the sealed identity row (absolute), every field
// whose sealed delta was zero has a zero delta (preservation), and a commit's title, highlight and screen equal
// the sealed row. The identity pass cannot reproduce itself; its validity rests on §4.2 relations alone.
export const STATE_FIELDS = [
  'slots', 'mirror71', 'sizeRecord', 'flag', 'target', 'halfTarget', 'owner', 'subject', 'poseWord', 'screen', 'edge',
  'readBank', 'frame',
];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function rowKey(planSha, sessionId, opId) {
  return planSha + ':' + sessionId + ':' + opId;
}

// Fields a captured state must carry. A missing field fails in every mode (review: an absent field fails).
export function shapeProblems(state, where) {
  const problems = [];
  if (!state || typeof state !== 'object') return [where + ' state missing'];
  for (const f of STATE_FIELDS) if (!(f in state)) problems.push(where + ' field ' + f + ' absent');
  if (Array.isArray(state.slots) && state.slots.length !== 63) problems.push(where + ' slots ' + state.slots.length);
  if (Array.isArray(state.mirror71) && state.mirror71.length !== 71) problems.push(where + ' mirror71 ' + state.mirror71.length);
  return problems;
}

export function reproduce(sealedRow, result) {
  const problems = [];
  const fields = {};
  if (!sealedRow) return { problems: ['no sealed row'], fields };
  for (const f of STATE_FIELDS) {
    const sb = sealedRow.before[f];
    const sa = sealedRow.after[f];
    const zero = same(sb, sa);
    fields[f] = zero ? 'sealed+preserve' : 'sealed';
    if (!same(result.before[f], sb)) problems.push('before.' + f + ' differs from the sealed identity row');
    if (!same(result.after[f], sa)) problems.push(f + ' differs from the sealed identity row');
    if (zero && !same(result.before[f], result.after[f])) problems.push(f + ' changed where the identity pass preserved it');
  }
  if (result.commit) {
    if (!sealedRow.ident) problems.push('sealed row has no identity');
    else {
      for (const k of ['title', 'highlight', 'screen']) {
        if (!same(result.ident && result.ident[k], sealedRow.ident[k])) problems.push('identity ' + k);
      }
      fields.identity = 'sealed';
    }
  }
  return { problems, fields };
}
