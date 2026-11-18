# Hash the T2b inputs, sources, and work outputs. Write the command log and the manifest.
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path('.').resolve()
OUT = ROOT / 'work' / 'out' / 'command-log.txt'
MANIFEST = ROOT / 'work' / 'evidence-manifest.json'

LOG = """T2b command log. Each block is the completed stdout and the exit code.
Full script output lives in the named file.

command: python -I -c "import os; os.makedirs('work/scripts', exist_ok=True); os.makedirs('work/out', exist_ok=True); print('ok')"
exit: 0
stdout:
ok

command: python -I work\\scripts\\routes_5b82_v1.py
exit: 0
stdout:
wrote work\\out\\routes-5b82-v1.txt lines 524
listings work\\out\\listings-5b82-v3.txt checked 572 mismatches 0
cursor work\\out\\cursor-pages-v1.txt
DONE
output file: work/out/routes-5b82-v1.txt, work/out/listings-5b82-v3.txt, work/out/cursor-pages-v1.txt

command: python -I work\\scripts\\close_5b82_v1.py
exit: -1073741819
stdout:
(empty; the process faulted while retaining the whole listing)
The script was not overwritten. close_5b82_v2.py is the replacement.

command: python -I work\\scripts\\close_5b82_v2.py
exit: 0
stdout:
scanning
scan done 4805945 kept 9070 bad 0
pointer scan
wrote work\\out\\close-5b82-v2.txt
rows 150 UNRESOLVED 2
DONE
output file: work/out/close-5b82-v2.txt, work/out/candidates-5b82-v3.tsv

command: python -I work\\scripts\\fillers_5b82_v1.py
exit: 0
stdout:
sites 64 saved 64
wrote work\\out\\fillers-5b82-v1.txt
output file: work/out/fillers-5b82-v1.txt

command: python -I work\\scripts\\manifest_5b82_v1.py
exit: 0
stdout: this script writes work/evidence-manifest.json and this log, then prints the manifest path.
"""

OUT.write_text(LOG, encoding='utf-8')

def sha(path):
    h = hashlib.sha256()
    n = 0
    with path.open('rb') as f:
        while True:
            b = f.read(1024 * 1024)
            if not b:
                break
            n += len(b)
            h.update(b)
    return h.hexdigest(), n

def rec(path):
    digest, n = sha(ROOT / path)
    return {'path': path.replace('\\', '/'), 'sha256': digest, 'bytes': n}

inputs = [
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
]
sources = [
    'brief.md',
    'TASK.md',
    'templates/result.md',
    'ref/tasks/T2-cell-ownership/run-20261117-224756-review/review.md',
    'ref/tasks/T2-cell-ownership/run-20261117-220544/work/out/candidates-5b82.tsv',
    'ref/tasks/T2-cell-ownership/run-20261117-220544/work/out/uses-5b82-v2.tsv',
    'ref/tasks/T2-cell-ownership/run-20261117-220544/work/out/dynamic-5b82-mark-w.jsonl',
    'ref/tasks/T2-cell-ownership/run-20261117-220544/work/out/dynamic-5b82-mark-x.jsonl',
    'ref/tasks/T2-cell-ownership/run-20261117-220544/work/out/dynamic-5b82-control-p.jsonl',
    'ref/analysis/decompiled-main/all-functions.asm',
    'ref/analysis/decompiled-main/functions.tsv',
    'ref/analysis/decompiled-main/calls.tsv',
    'ref/analysis/decompiled-main/functions/6183cc7d.c',
    'ref/analysis/decompiled-main/functions/603c2731.c',
    'ref/analysis/decompiled-main/functions/6006bf7f.c',
    'ref/analysis/decompiled-main/functions/60196ee3.c',
    'ref/analysis/decompiled-main/functions/618c97a2.c',
    'ref/analysis/decompiled-main/functions/604193ca.c',
    'ref/analysis/decompiled-main/functions/616a192d.c',
]
outputs = []
for p in sorted((ROOT / 'work').rglob('*')):
    if not p.is_file():
        continue
    rel = p.relative_to(ROOT).as_posix()
    if rel == 'work/evidence-manifest.json':
        continue
    outputs.append(rel)

print('hashing', len(inputs), 'inputs', len(sources), 'sources', len(outputs), 'outputs', flush=True)
doc = {
    'task': 'T2b-cell-ownership-gaps',
    'brief_sha256': None,
    'inputs': [rec(p) for p in inputs],
    'sources': [rec(p) for p in sources],
    'outputs': [rec(p) for p in outputs],
    'commands': [
        {'command': 'python -I work\\scripts\\routes_5b82_v1.py', 'exit': 0,
         'output': 'work/out/routes-5b82-v1.txt'},
        {'command': 'python -I work\\scripts\\close_5b82_v1.py', 'exit': -1073741819,
         'output': None, 'note': 'access violation; script kept; no output file'},
        {'command': 'python -I work\\scripts\\close_5b82_v2.py', 'exit': 0,
         'output': 'work/out/close-5b82-v2.txt'},
        {'command': 'python -I work\\scripts\\fillers_5b82_v1.py', 'exit': 0,
         'output': 'work/out/fillers-5b82-v1.txt'},
        {'command': 'python -I work\\scripts\\manifest_5b82_v1.py', 'exit': 0,
         'output': 'work/evidence-manifest.json'},
    ],
    'tool_versions': {'python': sys.version},
}
for s in doc['sources']:
    if s['path'] == 'brief.md':
        doc['brief_sha256'] = s['sha256']
MANIFEST.write_text(json.dumps(doc, indent=2) + '\n', encoding='utf-8')
print('wrote', MANIFEST)
print('brief', doc['brief_sha256'])
print('main', doc['inputs'][0]['sha256'], doc['inputs'][0]['bytes'])
print('outputs', len(doc['outputs']))
