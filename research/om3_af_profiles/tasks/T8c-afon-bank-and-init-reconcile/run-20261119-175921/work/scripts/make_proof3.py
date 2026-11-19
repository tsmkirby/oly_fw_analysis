from pathlib import Path
src = Path('work/scripts/proof_t8c2.mjs').read_text(encoding='utf-8')
src = src.replace("from './hook_t8c.mjs'", "from './hook_t8c2.mjs'")
src = src.replace('proof_t8c2.mjs', 'proof_t8c3.mjs')
old = """    if (step.expect.small) {
      const size = [actual.target[4], actual.target[5], actual.target[6], actual.target[7]];
      if (!same(size, [1, 0, 1, 0])) problems.push('size ' + JSON.stringify(actual.target) + ' is not Small 1x1');
      if (actual.target[4] === 27 || actual.target[6] === 39) problems.push('stale All target');
    }"""
new = """    if (step.expect.small) {
      const lo = want & 255, hi = (want >> 8) & 255;
      const halfPress = [lo, hi, 3, 0, 3, 0, 3, 0, 0, 0];
      const converter = [lo, hi, 3, 0, 1, 0, 1, 0, 0, 0];
      if (!same(actual.target, halfPress) && !same(actual.target, converter)) problems.push('target ' + JSON.stringify(actual.target));
      if (actual.target[4] === 27 || actual.target[6] === 39) problems.push('stale All target');
    }"""
if old not in src:
    raise SystemExit('size block missing')
src = src.replace(old, new, 1)
Path('work/scripts/proof_t8c3.mjs').write_text(src, encoding='utf-8')
print('proof3', len(src))
