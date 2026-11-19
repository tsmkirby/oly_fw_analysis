# Write work/evidence-manifest.json. Does not hash that file.
# The wrapper writes this command's cmd.txt before the process starts.
# It writes stdout, stderr, and the exit record after the process exits.
import hashlib
import json
import pathlib

def sha256(path):
    h = hashlib.sha256()
    n = 0
    with open(path, 'rb') as f:
        while True:
            b = f.read(1 << 20)
            if not b:
                break
            h.update(b)
            n += len(b)
    return h.hexdigest(), n

sources = [
    'brief.md',
    'TASK.md',
    'templates/result.md',
    'review-brief.md',
    'ref/HARDWARE-STAGE0-RECORD.md',
    'ref/analysis/button-af/AFON-MENU-RESEARCH.md',
    'ref/analysis/button-af/readiness/t4-afon-packaging/README.md',
    'ref/analysis/button-af/readiness/t4-afon-packaging/out/packaging-c1.md',
    'ref/tasks/T4-afon-packaging/decision.md',
]
inventory = json.loads(pathlib.Path('work/out/import-inventory-b1.json').read_text(encoding='utf-8'))
for row in inventory['inventory']:
    sources.append(row['path'])

inputs = [
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
]
missing = [p for p in sources + inputs if not pathlib.Path(p).is_file()]
if missing:
    raise SystemExit('missing ' + ', '.join(missing[:12]) + (' ...' if len(missing) > 12 else ''))

log = pathlib.Path('work/out/ghidra-b2.log').read_text(encoding='utf-8', errors='replace')
if 'ghidra_12.2_PUBLIC' not in log:
    raise SystemExit('ghidra version string not in log')

brief_sha, _ = sha256('brief.md')
outputs = []
for path in sorted(pathlib.Path('work').rglob('*')):
    if not path.is_file():
        continue
    if path.name == 'evidence-manifest.json':
        continue
    digest, n = sha256(path)
    outputs.append({'path': path.as_posix(), 'sha256': digest, 'bytes': n})

commands = []
for exit_path in sorted(pathlib.Path('work/out/cmd').glob('*.exit')):
    rec = json.loads(exit_path.read_text(encoding='utf-8'))
    rec['id'] = exit_path.stem
    commands.append(rec)

python_line = ''
for line in pathlib.Path('work/out/cmd/01.out').read_text(encoding='utf-8').splitlines():
    if line.startswith('python '):
        python_line = line[len('python '):].strip()
if not python_line:
    raise SystemExit('python version missing')

doc = {
    'task': 'T4b-afon-boot-order',
    'brief_sha256': brief_sha,
    'inputs': [{'path': p, 'sha256': sha256(p)[0]} for p in inputs],
    'sources': [{'path': p, 'sha256': sha256(p)[0]} for p in sources],
    'outputs': outputs,
    'commands': commands,
    'tool_versions': {
        'node': pathlib.Path('work/out/cmd/09.out').read_text(encoding='utf-8').strip(),
        'python': python_line,
        'java': pathlib.Path('work/out/cmd/10.err').read_text(encoding='utf-8').splitlines()[0].strip(),
        'ghidra': 'ghidra_12.2_PUBLIC',
    },
}
pathlib.Path('work/evidence-manifest.json').write_text(
    json.dumps(doc, indent=2) + '\n', encoding='utf-8')
print(f'outputs {len(outputs)} commands {len(commands)} sources {len(sources)} brief {brief_sha}')
