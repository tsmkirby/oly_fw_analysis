# Add command records that the manifest writer could not see, including its own.
# Do not edit after it has run.
import hashlib
import json
from pathlib import Path

ROOT = Path('.')
OUT = ROOT / 'work/evidence-manifest.json'
CMD = ROOT / 'work/out/cmd'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        while True:
            block = f.read(1024 * 1024)
            if not block:
                break
            h.update(block)
    return h.hexdigest(), path.stat().st_size


def entry(path):
    digest, size = sha(path)
    return {'path': str(path).replace('\\', '/'), 'sha256': digest, 'bytes': size}


manifest = json.loads(OUT.read_text(encoding='utf-8'))
known_out = {row['path'] for row in manifest['outputs']}
added_out = []
for path in sorted((ROOT / 'work/out').rglob('*')):
    if not path.is_file():
        continue
    rel = str(path).replace('\\', '/')
    if rel not in known_out:
        row = entry(path)
        row['hashed'] = 'later'
        manifest['outputs'].append(row)
        added_out.append(rel)

known_cmd = {row['n'] for row in manifest['commands']}
added_cmd = []
for path in sorted(CMD.glob('*.exit'), key=lambda p: int(p.name.split('.')[0])):
    n = path.name.split('.')[0]
    if n in known_cmd:
        continue
    doc = json.loads(path.read_text(encoding='utf-8'))
    files = {}
    for suffix in ('cmd.txt', 'out', 'err', 'exit'):
        fp = CMD / f'{n}.{suffix}'
        if fp.exists():
            files[suffix] = entry(fp)
    manifest['commands'].append({
        'n': n,
        'status': doc.get('status'),
        'spawn': doc.get('spawn'),
        'scripts': doc.get('scripts'),
        'wrapper_sha256': doc.get('wrapper_sha256'),
        'files': files,
    })
    added_cmd.append(n)

known_src = {row['path'] for row in manifest['sources']}
for path in sorted((ROOT / 'work/scripts').glob('*')):
    rel = str(path).replace('\\', '/')
    if path.is_file() and rel not in known_src:
        row = entry(path)
        row['hashed'] = 'later'
        row['role'] = 'script'
        manifest['sources'].append(row)
manifest['commands'].sort(key=lambda row: int(row['n']))
manifest['note'] = (
    manifest.get('note', '')
    + ' append_manifest_f3.py added the manifest writer\'s command files after the wrapper closed them.'
    + ' This append command\'s stdout and exit are written by the wrapper after this script returns.'
)
OUT.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'added_commands': added_cmd, 'added_outputs': len(added_out), 'commands': len(manifest['commands'])}))
