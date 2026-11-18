# Build write_manifest_k2.py from the failed k1. Do not edit after it runs.
from pathlib import Path
src = Path('work/scripts/write_manifest_k1.py').read_text(encoding='utf-8')
old = '    later, nbytes = sha_file(key)\n'
new = '''    if not Path(key).exists():
        inputs.append({
            'path': key,
            'sha256': rec['sha256'],
            'bytes': rec['bytes'],
            'hashed': 'execution',
            'execution_where': rec['where'],
            'later_matches': None,
            'note': 'wrapper recorded a path that is not a file in this folder',
        })
        seen.add(key)
        continue
    later, nbytes = sha_file(key)
'''
if src.count(old) != 1:
    raise SystemExit('anchor count ' + str(src.count(old)))
src = src.replace(old, new, 1)
src = src.replace("'id': '39'", "'id': '41'")
src = src.replace('work/out/cmd/39.', 'work/out/cmd/41.')
src = src.replace('write_manifest_k1.py', 'write_manifest_k2.py')
Path('work/scripts/write_manifest_k2.py').write_text(src, encoding='utf-8')
print('wrote write_manifest_k2.py', len(src))
