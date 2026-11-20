// Value judge for every role. Control roles do not return after a shape check.
// The numbers come from the same declared T11 row the gate compares.
// EMULATOR-ONLY.
import { same } from './compare_v4.mjs';
import { DECLARED } from './declared_v2.mjs';
import { opId } from './identity_v3.mjs';

export function judgeObserved(role, step, actual, phase) {
  const problems = [];
  if (!actual) return ['no actual'];
  if (actual.subject !== 0) problems.push('subject ' + actual.subject);
  if (step && step.pose != null && actual.poseWord !== step.pose) problems.push('pose word ' + actual.poseWord);
  const id = opId(role, step, phase);
  const row = DECLARED.steps[id];
  if (!row) problems.push('undeclared ' + id);
  else {
    if (!same(actual.half, row.half)) problems.push('half');
    if (actual.owner !== row.owner) problems.push('owner');
    if (!same(actual.target, row.target)) problems.push('target');
    if (!same(actual.halfTarget, row.halfTarget)) problems.push('halfTarget');
    if (actual.flag !== row.flag) problems.push('flag');
  }
  return problems;
}

export function judgeDown(role, step, actual) {
  return judgeObserved(role, step, actual, 'down');
}

export function judge(role, step, actual, _recorded, _order, phase) {
  return judgeObserved(role, step, actual, phase || (step && step.action === 'key' ? 'up' : step && step.dir));
}
