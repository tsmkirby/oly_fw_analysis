# Refresh work/evidence-manifest.json. Hashes every file under work except the manifest.
import hashlib
import json
from pathlib import Path

root = Path('.')
work = root / 'work'

def sha(path):
    h = hashlib.sha256()
    data = path.read_bytes()
    h.update(data)
    return h.hexdigest(), len(data)

def last_line(rel):
    p = root / rel
    if not p.exists():
        return None
    text = p.read_text(encoding='utf-8', errors='replace').strip()
    if not text:
        return ''
    return text.splitlines()[-1]

commands = [
    ('python -I work/scripts/static_afon_v1.py', None, None),
    ('python -I work/scripts/static_afon_v2.py', None, None),
    ('python -I work/scripts/build_overlay_v2.py', None, None),
    ('node26 work/scripts/afon_zone_probe_v1.mjs om-emu discover work/out/discover-v1.jsonl', None, 'work/out/discover-v1.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v2.mjs om-emu discover work/out/discover-v2.jsonl', None, 'work/out/discover-v2.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v3.mjs om-emu discover work/out/discover-v3.jsonl', None, 'work/out/discover-v3.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v4.mjs om-emu discover work/out/discover-v4.jsonl', None, 'work/out/discover-v4.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v5.mjs om-emu discover work/out/discover-v5.jsonl', None, 'work/out/discover-v5.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v6.mjs om-emu discover work/out/discover-v6.jsonl', None, 'work/out/discover-v6.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v7.mjs om-emu discover work/out/discover-v7.jsonl', None, 'work/out/discover-v7.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v8.mjs om-emu discover work/out/discover-v8.jsonl', None, 'work/out/discover-v8.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v9.mjs om-emu discover work/out/discover-v9.jsonl', None, 'work/out/discover-v9.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v10.mjs om-emu discover work/out/discover-v10.jsonl', None, 'work/out/discover-v10.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v10.mjs om-emu control work/out/siblings-v10.jsonl', None, 'work/out/siblings-v10.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v10.mjs om-emu control work/out/siblings-up-v10.jsonl', None, 'work/out/siblings-up-v10.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v10.mjs om-emu discover work/out/discover-v10b.jsonl', None, 'work/out/discover-v10b.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v10.mjs om-emu discover work/out/discover-v10c.jsonl', None, 'work/out/discover-v10c.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v10.mjs om-emu discover work/out/discover-kind1.jsonl', None, 'work/out/discover-kind1.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v11.mjs om-emu discover work/out/discover-v11.jsonl', None, 'work/out/discover-v11.jsonl'),
    ('python -I work/scripts/static_page28_v12.py', 0, None),
    ('python -I work/scripts/static_page28_v12b.py', 0, None),
    ('python -I work/scripts/static_page28_v12c.py', 0, None),
    ('python -I work/scripts/static_page28_v12d.py', 0, None),
    ('node26 work/scripts/afon_zone_probe_v12.mjs om-emu stock work/out/stock-page28-v12.jsonl', 0, 'work/out/stock-page28-v12.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v12b.mjs om-emu stock work/out/stock-page28-v12b.jsonl', 1, 'work/out/stock-page28-v12b.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v12c.mjs om-emu stock work/out/stock-page28-v12c.jsonl', 0, 'work/out/stock-page28-v12c.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v12d.mjs om-emu stock work/out/stock-page28-v12d.jsonl', 0, 'work/out/stock-page28-v12d.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v12e.mjs om-emu stock work/out/stock-page28-v12e.jsonl', 0, 'work/out/stock-page28-v12e.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v12f.mjs om-emu stock work/out/stock-zone-v12f.jsonl', 1, 'work/out/stock-zone-v12f.jsonl'),
    ('python -I work/scripts/make_probe_v12g.py', 0, None),
    ('node26 work/scripts/afon_zone_probe_v12g.mjs om-emu stock work/out/stock-zone-v12g.jsonl', 0, 'work/out/stock-zone-v12g.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v13.mjs om-emu discover work/out/discover-v13.jsonl', 0, 'work/out/discover-v13.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v14.mjs om-emu discover work/out/discover-v14.jsonl', 0, 'work/out/discover-v14.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v15.mjs om-emu discover work/out/discover-v15.jsonl', 0, 'work/out/discover-v15.jsonl'),
    ('node26 work/scripts/afon_zone_probe_v16.mjs om-emu discover work/out/discover-v16.jsonl', 0, 'work/out/discover-v16.jsonl'),
    ('python -I work/scripts/build_manifest_v12.py', 0, None),
]

cmd_rows = []
for cmd, exit_code, log in commands:
    row = {'cmd': cmd, 'exit': exit_code, 'final': last_line(log) if log else None}
    if exit_code is None:
        row['exit_note'] = 'shell exit not retained from the earlier session'
    if log is None and exit_code == 0 and cmd.startswith('python'):
        row['final_note'] = 'console only; stdout was not retained' if 'static_page28' in cmd else 'no log file'
    cmd_rows.append(row)

# Measured this round: node26 --version -> v26.12.1; python -I -> 3.12.7.
node_version = 'v26.12.1'
py_version = '3.12.7'

outputs = []
for path in sorted(work.rglob('*')):
    if not path.is_file():
        continue
    rel = path.as_posix()
    if rel == 'work/evidence-manifest.json':
        continue
    digest, size = sha(path)
    outputs.append({'path': rel, 'sha256': digest, 'bytes': size})

def src(rel):
    digest, _ = sha(root / rel)
    return {'path': rel, 'sha256': digest}

manifest = {
    'task': 'T3a-afon-zone-row',
    'brief_sha256': src('brief.md')['sha256'],
    'inputs': [src('inputs/00_0100_50000020.decoded.bin'), src('inputs/02_0106_458c0020.decoded.bin')],
    'sources': [
        src('brief.md'),
        src('TASK.md'),
        src('ref/PROJECT-STATE.md'),
        src('ref/analysis/button-af/AFON-MENU-RESEARCH.md'),
        src('ref/HARDWARE-STAGE0-RECORD.md'),
    ],
    'outputs': outputs,
    'commands': cmd_rows,
    'tool_versions': {
        'node26': node_version,
        'python': py_version,
    },
    'notes': [
        'Item 2 is BLOCKED. Brief section 4 was not run. A terminal done line is not acceptance.',
        'work/out/overlay-changed-bytes.csv and work/out/design.md were not rewritten. work/out/design-v12.md is the correction.',
        'Shell exits are recorded for the correction-round commands. Earlier-round shell exits were not retained; final JSONL lines are quoted from the logs.',
    ],
}
(work / 'evidence-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print('outputs', len(outputs))
print('node', node_version)
print('python', py_version)
