# Write work/evidence-manifest.json. Does not hash that file.
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
    'ref/HARDWARE-STAGE0-RECORD.md',
    'ref/PROJECT-STATE.md',
    'ref/analysis/button-af/AFON-MENU-RESEARCH.md',
    'ref/analysis/button-af/readiness/t3-afon-zone-row/README.md',
    'ref/analysis/button-af/readiness/t3-afon-zone-row/design/T3f-binding.md',
    'ref/analysis/button-af/readiness/t3-afon-zone-row/design/T3g-descriptors.md',
    'ref/analysis/button-af/readiness/t3-afon-zone-row/design/T3h-faces.md',
    'ref/analysis/button-af/readiness/t3-afon-zone-row/design/T3i-design.md',
    'ref/analysis/button-af/readiness/t3-afon-zone-row/t3j/overlay-changed-bytes.csv',
    'ref/analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv',
    'ref/contribution/docs/format/CONTAINERS.md',
    'ref/contribution/docs/safety/CODE_SPACE.md',
    'ref/tooling/om-emu/docs/model-survey.md',
    'ref/tasks/T3j-afon-acceptance-assertions/run-20261118-132500/work/evidence-manifest.json',
]
inputs = [
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
]
missing = [p for p in sources + inputs if not pathlib.Path(p).is_file()]
if missing:
    raise SystemExit('missing ' + ', '.join(missing))

brief_sha, _ = sha256('brief.md')
out_root = pathlib.Path('work')
outputs = []
for path in sorted(out_root.rglob('*')):
    if not path.is_file():
        continue
    if path.name == 'evidence-manifest.json':
        continue
    digest, n = sha256(path)
    outputs.append({'path': path.as_posix(), 'sha256': digest, 'bytes': n})

commands = []
for n in range(1, 11):
    rec = json.loads(pathlib.Path(f'work/out/cmd/{n:02d}.exit').read_text(encoding='utf-8'))
    rec['id'] = f'{n:02d}'
    commands.append(rec)

node = pathlib.Path('work/out/cmd/06.out').read_text(encoding='utf-8').strip()
python = pathlib.Path('work/out/cmd/07.out').read_text(encoding='utf-8').strip()
java = pathlib.Path('work/out/cmd/08.err').read_text(encoding='utf-8').splitlines()[0].strip()
ghidra = 'ghidra_12.2_PUBLIC'
log = pathlib.Path('work/out/ghidra-t4.log').read_text(encoding='utf-8', errors='replace')
if 'ghidra_12.2_PUBLIC' not in log and '12.2' not in log:
    raise SystemExit('ghidra version string not in log')

doc = {
    'task': 'T4-afon-packaging',
    'brief_sha256': brief_sha,
    'inputs': [{'path': p, 'sha256': sha256(p)[0]} for p in inputs],
    'sources': [{'path': p, 'sha256': sha256(p)[0]} for p in sources],
    'outputs': outputs,
    'commands': commands,
    'tool_versions': {
        'node': node,
        'python': python,
        'java': java,
        'ghidra': ghidra,
    },
}
pathlib.Path('work/evidence-manifest.json').write_text(
    json.dumps(doc, indent=2) + '\n', encoding='utf-8')
print(f'outputs {len(outputs)} commands {len(commands)} brief {brief_sha}')
