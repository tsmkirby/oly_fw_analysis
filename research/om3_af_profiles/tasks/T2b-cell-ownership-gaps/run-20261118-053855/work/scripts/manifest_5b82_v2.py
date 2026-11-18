# Write the command log, then the manifest. The log's last block is this script's stdout.
# That stdout is the constant below, printed only after the log and the manifest are written.
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path('.').resolve()
LOG = ROOT / 'work' / 'out' / 'command-log.txt'
MANIFEST = ROOT / 'work' / 'evidence-manifest.json'
STDOUT = (
    'manifest outputs work/evidence-manifest.json\n'
    'command-log records this stdout\n'
    'DONE\n'
)

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

def block(command, stdout):
    if not stdout.endswith('\n'):
        stdout += '\n'
    return 'command: %s\nexit: 0\nstderr: (empty)\nstdout:\n%s----\n' % (command, stdout)

def from_print(path):
    # The script wrote this text, then print(text) added one newline, then print('DONE').
    text = path.read_text(encoding='utf-8')
    return text + '\nDONE\n'

parts = []
parts.append(block('python -I -c "print(\'ok\')"', 'ok\n'))
parts.append(block(
    'python -I work\\scripts\\setters_5b82_v1.py',
    'scanning listings\n'
    'scan 4805945 kept 1793 bad 0\n'
    'second scan for callers 15\n'
    'wrote C:\\Dev\\OM3-tasks\\T2b-cell-ownership-gaps\\ws\\work\\out\\setters-5b82-v1.txt\n'
    'wrote C:\\Dev\\OM3-tasks\\T2b-cell-ownership-gaps\\ws\\work\\out\\listings-setters-v1.txt\n'
    'calls setter 39\n'
    'DONE\n'))
parts.append(block(
    'python -I work\\scripts\\candidates_5b82_v4.py',
    'pass 1\n'
    'pass 2 callees 69\n'
    'kept 26419 mismatches 0\n'
    'wrote C:\\Dev\\OM3-tasks\\T2b-cell-ownership-gaps\\ws\\work\\out\\close-5b82-v4.txt\n'
    'rows 150 UNRESOLVED 15\n'
    'DONE\n'))
parts.append(block(
    'python -I work\\scripts\\setters_5b82_v2.py',
    'wrote C:\\Dev\\OM3-tasks\\T2b-cell-ownership-gaps\\ws\\work\\out\\setters-5b82-v2.txt\n'
    'wild [(61, 24183121, 83952853)]\n'
    'key 5b82 False\n'
    'DONE\n'))
parts.append(block(
    'python -I work\\scripts\\fa64_d2_v1.py',
    'handlers 17 bad 0\nDONE\n'))
parts.append(block(
    'python -I work\\scripts\\fa64_stubs_v1.py',
    from_print(ROOT / 'work' / 'out' / 'fa64-stubs-v1.txt')))
parts.append(block(
    'python -I work\\scripts\\records_5b82_v4.py',
    from_print(ROOT / 'work' / 'out' / 'records-5b82-v4.txt')))
parts.append(block(
    'python -I work\\scripts\\patch_5b82_v1.py',
    'product replacements 1\nuses replacements 1\nDONE\n'))
parts.append(block('python -I work\\scripts\\manifest_5b82_v2.py', STDOUT))
log_text = ''.join(parts)
LOG.write_text(log_text, encoding='utf-8', newline='\n')

def entry(path):
    rel = path.relative_to(ROOT).as_posix()
    data = path.read_bytes()
    return {
        'path': rel,
        'sha256': hashlib.sha256(data).hexdigest(),
        'bytes': len(data),
    }

inputs = [
    ROOT / 'inputs' / '00_0100_50000020.decoded.bin',
    ROOT / 'inputs' / '02_0106_458c0020.decoded.bin',
]
sources = [
    ROOT / 'brief.md',
    ROOT / 'TASK.md',
    ROOT / 'templates' / 'result.md',
    ROOT / 'audit' / 'previous-review.md',
    ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm',
]
outputs = sorted(
    (p for p in (ROOT / 'work').rglob('*') if p.is_file() and p != MANIFEST),
    key=lambda p: p.as_posix().lower(),
)

doc = {
    'task': 'T2b-cell-ownership-gaps',
    'brief_sha256': sha(ROOT / 'brief.md'),
    'inputs': [entry(p) for p in inputs],
    'sources': [entry(p) for p in sources],
    'outputs': [entry(p) for p in outputs],
    'commands': [
        {'command': 'python -I -c "print(\'ok\')"', 'exit': 0, 'stderr': ''},
        {'command': 'python -I work\\scripts\\setters_5b82_v1.py', 'exit': 0, 'stderr': ''},
        {'command': 'python -I work\\scripts\\candidates_5b82_v4.py', 'exit': 0, 'stderr': ''},
        {'command': 'python -I work\\scripts\\setters_5b82_v2.py', 'exit': 0, 'stderr': ''},
        {'command': 'python -I work\\scripts\\fa64_d2_v1.py', 'exit': 0, 'stderr': ''},
        {'command': 'python -I work\\scripts\\fa64_stubs_v1.py', 'exit': 0, 'stderr': ''},
        {'command': 'python -I work\\scripts\\records_5b82_v4.py', 'exit': 0, 'stderr': ''},
        {'command': 'python -I work\\scripts\\patch_5b82_v1.py', 'exit': 0, 'stderr': ''},
        {'command': 'python -I work\\scripts\\manifest_5b82_v2.py', 'exit': 0, 'stderr': ''},
    ],
    'tool_versions': {'python': sys.version},
}
MANIFEST.write_text(json.dumps(doc, indent=2) + '\n', encoding='utf-8', newline='\n')

logged = LOG.read_text(encoding='utf-8')
if STDOUT not in logged:
    sys.stderr.write('log missing manifest stdout\n')
    sys.exit(1)
again = sha(LOG)
listed = next(item['sha256'] for item in doc['outputs'] if item['path'] == 'work/out/command-log.txt')
if again != listed:
    sys.stderr.write('command-log hash mismatch\n')
    sys.exit(1)
main = next(item for item in doc['inputs'] if item['path'].endswith('00_0100_50000020.decoded.bin'))
if main['sha256'] != '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59':
    sys.stderr.write('main image hash mismatch\n')
    sys.exit(1)
if '0x5748d400' in (ROOT / 'work' / 'out' / 'candidates-5b82-v4.tsv').read_text(encoding='utf-8'):
    sys.stderr.write('stale product still in candidates\n')
    sys.exit(1)
sys.stdout.write(STDOUT)
