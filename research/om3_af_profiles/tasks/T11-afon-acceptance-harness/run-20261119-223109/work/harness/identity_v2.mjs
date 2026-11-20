// Identity gate. Acceptance refuses a commit-class input unless the sealed table
// already contains that step, and every success keeps the expected and actual rows.
import { commitDecision, loadSealed, rowKey, writeSeal } from './identity_v1.mjs';

export { commitDecision, loadSealed, rowKey, writeSeal };

export const REQUIRED_KEYS = ['k1e:ke-s1-down', 'k1e:ke-s1-up', 'k1e:ke-p-s1-down', 'k1e:ke-p-s1-up'];

export function coverageProblems(table, rows) {
  const problems = [];
  const have = new Set(Object.keys(rows || {}));
  for (const step of table.steps) {
    if (step.identityFrom) {
      const key = rowKey(step.identityFrom);
      if (!key || !have.has(key)) problems.push('missing ' + (step.identityFrom || step.id));
    }
    if (step.commit) {
      const key = rowKey(step.identityFrom);
      if (!key || !have.has(key)) problems.push('commit ' + step.id);
    }
  }
  for (const key of REQUIRED_KEYS) if (!have.has(key)) problems.push('required ' + key);
  return problems;
}

export function approveCommit(mode, sealed, step, actual, rows) {
  if (!step || !step.commit) return { ok: true, skipped: true };
  if (mode === 'identity') {
    const key = rowKey(step.identityFrom);
    if (key && step.recordRole && key.startsWith(step.recordRole + ':')) rows[key] = actual;
    if (step.recordRole) rows[step.recordRole + ':' + step.id] = actual;
    return { ok: true, problems: [], expected: actual, actual, key: key || (step.recordRole + ':' + step.id), recorded: true };
  }
  const decision = commitDecision(sealed, step, actual);
  return decision;
}
