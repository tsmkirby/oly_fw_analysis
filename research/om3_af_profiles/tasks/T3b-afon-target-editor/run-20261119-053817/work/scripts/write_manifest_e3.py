# Hash the task inputs, sources, and outputs. Do not edit after it has run.
import hashlib
import json
from pathlib import Path

ROOT = Path('.')
OUT = ROOT / 'work/evidence-manifest.json'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        while True:
            block = f.read(1024 * 1024)
            if not block:
                break
            h.update(block)
    return h.hexdigest(), path.stat().st_size


def entry(path, extra=None):
    digest, size = sha(path)
    row = {'path': str(path).replace('\\', '/'), 'sha256': digest, 'bytes': size}
    if extra:
        row.update(extra)
    return row


inputs = []
for rel in [
    'brief.md',
    'TASK.md',
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
    'om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk00000000.OE.0100.bin',
    'om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin',
    'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes.csv',
    'ref/tasks/T3i-afon-zone-acceptance/brief.md',
    'ref/tasks/T3j-afon-acceptance-assertions/brief.md',
    'ref/tasks/T5-afon-button-handoff/brief.md',
]:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit('missing input ' + rel)
    inputs.append(entry(path, {'hashed': 'later'}))

inv = json.loads((ROOT / 'work/out/import-inventory-e3.json').read_text(encoding='utf-8'))
sources = []
for row in inv['modules']:
    sources.append({'path': row['path'], 'sha256': row['sha256'], 'bytes': row['bytes'], 'hashed': 'execution'})
for path in sorted((ROOT / 'work/scripts').glob('*')):
    if path.is_file():
        sources.append(entry(path, {'hashed': 'later'}))

outputs = []
for path in [ROOT / 'work/result.md']:
    outputs.append(entry(path, {'hashed': 'later'}))
for path in sorted((ROOT / 'work/out').rglob('*')):
    if path.is_file() and path.name != 'evidence-manifest.json':
        outputs.append(entry(path, {'hashed': 'later'}))

commands = []
for path in sorted((ROOT / 'work/out/cmd').glob('*.exit'), key=lambda p: int(p.name.split('.')[0])):
    doc = json.loads(path.read_text(encoding='utf-8'))
    commands.append({
        'n': path.name.split('.')[0],
        'status': doc.get('status'),
        'spawn': doc.get('spawn'),
        'scripts': doc.get('scripts'),
        'wrapper_sha256': doc.get('wrapper_sha256'),
    })

manifest = {
    'task': 'T3b',
    'brief_sha256': next(r['sha256'] for r in inputs if r['path'] == 'brief.md'),
    'inputs': inputs,
    'sources': sources,
    'outputs': outputs,
    'commands': commands,
    'tool_versions': {
        'node': 'node26, recorded as the wrapper spawn in each command',
        'python': 'python -I, recorded as the wrapper spawn in each command',
        'ghidra': 'tools/bin/run-ghidra.cmd, command 05, log work/out/ghidra-m2.log',
    },
    'note': 'Imported emulator modules are the execution-time hashes in sources from work/out/import-inventory-e3.json. Inputs and outputs were hashed by this script after those sessions. This file is not listed in outputs.',
}
OUT.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'inputs': len(inputs), 'sources': len(sources), 'outputs': len(outputs), 'commands': len(commands)}))
