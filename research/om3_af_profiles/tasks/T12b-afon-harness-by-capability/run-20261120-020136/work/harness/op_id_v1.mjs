// Operation id spelling shared with the T12 expectation modules. EMULATOR-ONLY.
export function opId(role, step, phase) {
  if (step.action === 'key') return role + '-' + step.id + '-' + phase;
  return role + '-' + step.id;
}
