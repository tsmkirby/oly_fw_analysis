from pathlib import Path
src = Path('work/scripts/hook_t8c.mjs').read_text(encoding='utf-8')
live = """const LIVE = { k5962: { addr: 0x62920bf0, n: 6, w: 2 } };
"""
needle = 'const FACTORY = factorySlots();'
if needle not in src:
    raise SystemExit('anchor missing')
src = src.replace(needle, needle + '\n' + live, 1)
src = src.replace('hook_t8c.mjs', 'hook_t8c2.mjs')
Path('work/scripts/hook_t8c2.mjs').write_text(src, encoding='utf-8')
print('hook2', Path('work/scripts/hook_t8c2.mjs').stat().st_size)
