from pathlib import Path
src = Path('work/scripts/check_proof_t8c.mjs').read_text(encoding='utf-8')
old = "step.who.some((r) => r === 'candidate' || r === 'c')"
new = "step.who.some((r) => !['k1e', 'k2', 'candidate'].includes(r))"
if old not in src:
    raise SystemExit('pattern missing')
Path('work/scripts/check_proof_t8c2.mjs').write_text(src.replace(old, new, 1), encoding='utf-8')
print('ok')
