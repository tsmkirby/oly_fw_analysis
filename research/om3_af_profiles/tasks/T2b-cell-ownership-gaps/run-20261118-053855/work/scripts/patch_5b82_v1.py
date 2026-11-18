# Correct two sentences written by records_5b82_v4.py.
# The product in the candidate row was hardcoded and did not match the printed product.
from pathlib import Path
ROOT = Path('.').resolve()
CAND = ROOT / 'work' / 'out' / 'candidates-5b82-v4.tsv'
USES = ROOT / 'work' / 'out' / 'uses-5b82-v4.tsv'

cand = CAND.read_text(encoding='utf-8')
old_p = 'Product 0x5b8*0xf4240 is 0x5748d400 (low halfword 0xd400).'
new_p = 'Product 0x5b8*0xf4240 is 0x5742de00 (low halfword 0xde00).'
n_p = cand.count(old_p)
if n_p != 1:
    raise SystemExit('product count %d' % n_p)
CAND.write_text(cand.replace(old_p, new_p), encoding='utf-8')

uses = USES.read_text(encoding='utf-8')
old_u = 'Sibling calls in this function reload the same pointer.'
new_u = (
    'Four later loads are movhu (A2),D0 at 0x6019719c and 0x601971ae after add 0x2,A2 from (0x10,sp), '
    'and movhu (A3),D0 at 0x601971d0 and 0x601971e2 after add 0x2,A3 from (0xc,sp). '
    'Both slots hold record+0x4c, so those keys are the halfword at +0x4e. '
    '(0xc,sp) becomes the sibling record+0x4c only when the dword at record+0x6c is not 0x3e. '
    'That link is 0x1a at table index 0x02 and 0x3c at table index 0x35.'
)
n_u = uses.count(old_u)
if n_u != 1:
    raise SystemExit('uses count %d' % n_u)
USES.write_text(uses.replace(old_u, new_u), encoding='utf-8')
print('product replacements %d' % n_p)
print('uses replacements %d' % n_u)
print('DONE')
