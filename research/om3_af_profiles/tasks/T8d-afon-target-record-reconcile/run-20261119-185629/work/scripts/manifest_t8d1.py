# Builds work/evidence-manifest.json and the external seal. Not an experiment version.
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

inputs = [
    'brief.md',
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
    'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
]
baselines = [
    'TASK.md',
    'ref/tasks/T8c-afon-bank-and-init-reconcile/decision.md',
    'ref/tasks/T8c-afon-bank-and-init-reconcile/run-20261119-174338-review/review.md',
    'ref/tasks/T8c-afon-bank-and-init-reconcile/run-20261119-184058-review/review.md',
    'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/design.md',
]
recorded = json.load(open('work/out/proof-t8d5-imports.json', encoding='utf-8'))['imports']
sources = []
seen = set()
for row in recorded:
    sources.append({'path': rel(row['path']), 'sha256': row['sha256'], 'when': 'proof-t8d5 walkImports'})
    seen.add(rel(row['path']))
for path in baselines:
    digest, _ = sha_file(path)
    if path not in seen:
        sources.append({'path': path, 'sha256': digest, 'when': 'manifest'})
        seen.add(path)

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
        'tools\\bin\\run-ghidra.cmd -postScript DisasmT8d1.java 609b3481 80 work\\out\\disasm-gate-t8d1.txt 609832f5 180 work\\out\\disasm-adjust-t8d1.txt 609b3c79 55 work\\out\\disasm-writer-t8d1.txt 609b3ecd 90 work\\out\\disasm-converter-t8d1.txt -log work\\out\\ghidra-t8d1.log',
        'python -I work/scripts/static_writer_t8d1.py',
        'python -I work/scripts/check_listings_t8d1.py',
        'node26 work/scripts/sweep_t8d2.mjs om-emu',
        'node26 work/scripts/proof_t8d5.mjs om-emu work/out/proof-table-t8d3.json proof-t8d5',
    ],
    'tool_versions': {
        'node26': 'v26.12.1',
        'python': '3.12.7',
        'java': 'openjdk 25.0.5',
        'ghidra': '12.2 PUBLIC',
        'OM_EMU_MODEL': 'E147',
        'OM_EMU_NVRAM': 'off',
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
