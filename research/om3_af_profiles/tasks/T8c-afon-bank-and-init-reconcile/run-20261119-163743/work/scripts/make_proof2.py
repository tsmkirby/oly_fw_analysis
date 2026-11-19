from pathlib import Path
src = Path('work/scripts/proof_t8c.mjs').read_text(encoding='utf-8')
old = """  if (step.expect && step.expect.halfFrom) {
    const from = recorded.k2[step.expect.halfFrom.slice(3)];
    if (!same(actual.halfTarget, from.halfTarget)) problems.push('halfTarget ' + JSON.stringify(actual.halfTarget) + ' k2 ' + JSON.stringify(from.halfTarget));
  }"""
new = """  if (role === 'candidate' && step.expect && step.expect.halfFrom) {
    const from = recorded.k2[step.expect.halfFrom.slice(3)];
    if (!from) problems.push('missing K2 ' + step.expect.halfFrom);
    else if (!same(actual.halfTarget, from.halfTarget)) problems.push('halfTarget ' + JSON.stringify(actual.halfTarget) + ' k2 ' + JSON.stringify(from.halfTarget));
  }"""
if old not in src:
    raise SystemExit('block missing')
src = src.replace(old, new, 1)
src = src.replace('proof_t8c.mjs', 'proof_t8c2.mjs')
Path('work/scripts/proof_t8c2.mjs').write_text(src, encoding='utf-8')
print('bytes', Path('work/scripts/proof_t8c2.mjs').stat().st_size)
