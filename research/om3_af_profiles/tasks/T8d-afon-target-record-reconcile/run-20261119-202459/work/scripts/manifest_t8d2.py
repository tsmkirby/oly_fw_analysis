# Builds work/evidence-manifest.json and the external seal from the proof-t8d10 inventory.
# Not an experiment version.
import hashlib
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)

def sha_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        data = f.read()
    h.update(data)
    return h.hexdigest(), len(data)

def rel(path):
    return path.replace('\\', '/')

cmd = json.load(open('work/out/cmd/proof-t8d10.json', encoding='utf-8'))
sources = []
seen = set()
for row in cmd['imports']:
    sources.append({'path': rel(row['path']), 'sha256': row['sha256'], 'bytes': row['bytes'], 'when': 'proof-t8d10 before-session'})
    seen.add(rel(row['path']))
for row in cmd['baselines']:
    path = rel(row['path'])
    if path in seen:
        continue
    sources.append({'path': path, 'sha256': row['sha256'], 'bytes': row['bytes'], 'when': 'proof-t8d10 before-session'})
    seen.add(path)

helpers = None
for line in open('work/out/session-proof-t8d10-k1e.jsonl', encoding='utf-8'):
    o = json.loads(line)
    if o.get('step') == 'helper-hashes':
        helpers = o
        break
if helpers:
    for row in helpers.get('helpers', []) + helpers.get('resources', []):
        path = rel(row['path'])
        if path in seen:
            continue
        sources.append({'path': path, 'sha256': row['sha256'], 'bytes': row['bytes'], 'when': 'helper-hashes before session'})
        seen.add(path)

inputs = [
    'brief.md',
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
    'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
]
outputs = []
for dirpath, _, names in os.walk('work'):
    for name in names:
        path = rel(os.path.join(dirpath, name))
        if path in ('work/evidence-manifest.json', 'work/seal-t8d.json'):
            continue
        digest, size = sha_file(path)
        outputs.append({'path': path, 'sha256': digest, 'bytes': size})
outputs.sort(key=lambda r: r['path'])

brief_sha, _ = sha_file('brief.md')
manifest = {
    'task': 'T8d',
    'brief_sha256': brief_sha,
    'inputs': [{'path': p, 'sha256': sha_file(p)[0]} for p in inputs],
    'sources': sources,
    'outputs': outputs,
    'commands': [
        cmd['command'],
        'tools\\bin\\run-ghidra.cmd -postScript DisasmT8d2.java 609b3c79 140 work\\out\\disasm-writer-t8d2.txt 609b3ecd 160 work\\out\\disasm-converter-t8d2.txt -log work\\out\\ghidra-t8d2.log',
        'python -I work/scripts/check_listings_t8d2.py',
        'tools\\bin\\run-ghidra.cmd -postScript DisasmT8d2.java 604193b0 25 work\\out\\disasm-pose-caller-b-t8d2.txt -log work\\out\\ghidra-pose-b-t8d2.log',
        'node26 work/scripts/trace_t8d8.mjs',
        'node26 work/scripts/proof_t8d8.mjs om-emu work/out/proof-table-t8d3.json proof-t8d8',
        'node26 work/scripts/proof_t8d9.mjs om-emu work/out/proof-table-t8d3.json proof-t8d9',
        'python -I work/scripts/manifest_t8d2.py',
    ],
    'tool_versions': {
        'node26': 'v26.12.1',
        'python': '3.12.7',
        'java': 'openjdk 25.0.5',
        'ghidra': '12.2 PUBLIC',
        'OM_EMU_MODEL': cmd['OM_EMU_MODEL'],
        'OM_EMU_NVRAM': cmd['OM_EMU_NVRAM'],
    },
}
raw = json.dumps(manifest, indent=2).encode('utf-8') + b'\n'
open('work/evidence-manifest.json', 'wb').write(raw)
seal = {
    'task': 'T8d',
    'what': 'sha256 of work/evidence-manifest.json after it was written. The seal is not an entry in that manifest.',
    'manifest_sha256': hashlib.sha256(raw).hexdigest(),
    'manifest_bytes': len(raw),
}
open('work/seal-t8d.json', 'w', encoding='utf-8').write(json.dumps(seal, indent=2) + '\n')
print(json.dumps({'outputs': len(outputs), 'sources': len(sources), 'seal': seal['manifest_sha256']}))
