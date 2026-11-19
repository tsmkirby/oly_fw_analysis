# Build work/evidence-manifest.json from the files on disk, then seal this command
# in work/evidence-supplement.json. Do not edit after it has run.
# Usage: python -I work/scripts/manifest_final.py 14
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path('.')
OUT = ROOT / 'work' / 'evidence-manifest.json'
SUP = ROOT / 'work' / 'evidence-supplement.json'
THIS = int(sys.argv[1]) if len(sys.argv) > 1 else 0
POSE = Path('ref/tasks/T7-orientation-producer/run-20261119-063452/work/scripts/pose.mjs')
OVERLAY_SRC = Path('ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes.csv')


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def rec(path):
    p = path.resolve()
    return {'path': str(path).replace('\\', '/'), 'sha256': sha(p), 'bytes': p.stat().st_size}


inputs = []
for path in [ROOT / 'brief.md', ROOT / 'TASK.md', OVERLAY_SRC]:
    if path.exists():
        inputs.append(rec(path))
for path in sorted((ROOT / 'inputs').glob('*')):
    if path.is_file():
        inputs.append(rec(path))

sources = []
seen = set()
for path in sorted((ROOT / 'work' / 'scripts').glob('*')):
    if path.is_file():
        item = rec(path)
        sources.append(item)
        seen.add(item['path'])
for inv in sorted((ROOT / 'work' / 'out').glob('import-inventory-*.json')):
    doc = json.loads(inv.read_text(encoding='utf-8'))
    for mod in doc.get('modules') or []:
        raw = mod.get('path')
        if not raw or raw in seen:
            continue
        path = Path(raw)
        if not path.is_file():
            continue
        item = rec(path)
        item['hashed'] = 'execution'
        sources.append(item)
        seen.add(item['path'])
if POSE.is_file():
    item = rec(POSE)
    item['note'] = 'not imported; orientations did not run'
    sources.append(item)

outputs = [rec(ROOT / 'work' / 'result.md')]
for path in sorted((ROOT / 'work' / 'out').rglob('*')):
    if path.is_file():
        outputs.append(rec(path))

commands = []
cmd_dir = ROOT / 'work' / 'out' / 'cmd'
for cmd in sorted(cmd_dir.glob('*.cmd.txt')):
    number = int(cmd.name.split('.')[0])
    if number == THIS:
        continue
    text = cmd.read_text(encoding='utf-8', errors='replace')
    fields = {}
    for line in text.splitlines():
        if line.startswith('start '):
            fields['start'] = line[6:]
        elif line.startswith('requested: '):
            fields['requested'] = line[len('requested: '):]
        elif line.startswith('script_sha256: '):
            fields['script_sha256'] = line[len('script_sha256: '):]
        elif line.startswith('wrapper_sha256: '):
            fields['wrapper_sha256'] = line[len('wrapper_sha256: '):]
    files = {'cmd': rec(cmd)}
    for suffix in ('out', 'err', 'exit'):
        side = Path(str(cmd).replace('.cmd.txt', '.' + suffix))
        if side.exists():
            files[suffix] = rec(side)
    commands.append({'n': number, **fields, 'files': files})

node_path = ''
for row in commands:
    requested = row.get('requested') or ''
    if requested.startswith('node26 '):
        node_path = 'node26'
        break

manifest = {
    'task': 'T3l',
    'brief_sha256': sha(ROOT / 'brief.md'),
    'inputs': inputs,
    'sources': sources,
    'outputs': outputs,
    'commands': commands,
    'tool_versions': {
        'python': sys.version,
        'node': node_path or 'node26',
        'wrapper_sha256': commands[0]['wrapper_sha256'] if commands and commands[0].get('wrapper_sha256') else None,
    },
}
OUT.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
SUP.write_text(json.dumps({
    'sealed': 'after the manifest hash',
    'note': 'Command %d is this manifest build. The wrapper writes its .out, .err, and .exit after this process exits, so those three files are not in evidence-manifest.json.' % THIS,
    'command': {
        'n': THIS,
        'requested': 'python -I work/scripts/manifest_final.py %d' % THIS,
        'script': 'work/scripts/manifest_final.py',
        'script_sha256': sha(ROOT / 'work' / 'scripts' / 'manifest_final.py'),
    },
    'manifest': 'work/evidence-manifest.json',
    'manifest_sha256': sha(OUT),
    'manifest_bytes': OUT.stat().st_size,
}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'inputs': len(inputs), 'sources': len(sources), 'outputs': len(outputs), 'commands': len(commands)}))
