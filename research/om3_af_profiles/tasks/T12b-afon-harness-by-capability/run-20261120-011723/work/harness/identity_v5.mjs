// Presence is checked before a commit is delivered. Approval runs after settle.
// Keys are taken from the operation definition passed in. This module has no id list.
// EMULATOR-ONLY.

export function rowKey(identityFrom) {
  if (!identityFrom) return null;
  const match = /^(?:ref:)?(k1e|k2|candidate|display|zcand|K1e|K2):([A-Za-z0-9-]+)$/.exec(identityFrom);
  if (!match) return null;
  const role = match[1] === 'K1e' ? 'k1e' : match[1] === 'K2' ? 'k2' : match[1];
  return role + ':' + match[2];
}

export function identityKey(step) {
  if (!step) return null;
  if (step.identity && step.identity.key) return step.identity.key;
  if (typeof step.key === 'string' && step.key.includes(':')) return step.key;
  return rowKey(step.identityFrom || null);
}

export function commitPresence(mode, sealed, step) {
  const key = identityKey(step);
  if (!key) return { ok: false, problems: ['refuse commit: no expectation key'], expected: null, actual: null, key: null };
  if (mode === 'identity') return { ok: true, problems: [], expected: null, actual: null, key };
  if (!sealed || sealed.sealed !== true || !sealed.sha256) {
    return { ok: false, problems: ['refuse commit: identity table is not sealed'], expected: null, actual: null, key };
  }
  const want = sealed.rows && sealed.rows[key];
  if (!want) return { ok: false, problems: ['refuse commit: sealed table has no ' + key], expected: null, actual: null, key };
  return { ok: true, problems: [], expected: want, actual: null, key };
}

export function approveCommit(mode, sealed, step, actual, rows) {
  const key = identityKey(step);
  if (!key) return { ok: false, problems: ['refuse commit: no expectation key'], expected: null, actual, key: null };
  const recordRole = step && (step.recordRole || (step.identity && step.identity.recordRole));
  const stepId = (step && (step.stepId || (step.identity && step.identity.stepId) || step.id)) || key;
  if (mode === 'identity') {
    if (rows) {
      rows[key] = actual;
      if (recordRole) rows[recordRole + ':' + stepId] = actual;
    }
    return { ok: true, problems: [], expected: actual, actual, key, recorded: true };
  }
  if (!sealed || sealed.sealed !== true || !sealed.sha256) {
    return { ok: false, problems: ['refuse commit: identity table is not sealed'], expected: null, actual, key };
  }
  const want = sealed.rows && sealed.rows[key];
  if (!want) return { ok: false, problems: ['refuse commit: sealed table has no ' + key], expected: null, actual, key };
  const problems = [];
  if (actual.title !== want.title) problems.push('title');
  if (JSON.stringify(actual.highlight) !== JSON.stringify(want.highlight)) problems.push('highlight');
  if (want.screen != null && actual.screen !== want.screen) problems.push('screen');
  return { ok: problems.length === 0, problems, expected: want, actual, key };
}
