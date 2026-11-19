# Find a 48-byte 0xFF window in the loaded tails that neither CSV changes.
import pathlib

BASE = 0x60021020
data = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
NEED = 48

def load(path):
    s = set()
    for line in pathlib.Path(path).read_text(encoding='utf-8').splitlines()[1:]:
        parts = line.split(',')
        if len(parts) < 2:
            continue
        s.add(int(parts[1], 16))
    return s

arch = load('ref/analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv')
ov = load('ref/analysis/button-af/readiness/t3-afon-zone-row/t3j/overlay-changed-bytes.csv')
busy = arch | ov

# Tails named by the earlier measurement: section-1 0x6031e910/1776, section-4 0x60a8f088/1912.
spans = [
    ('section-1 tail', 0x6031e910, 1776),
    ('section-4 tail', 0x60a8f088, 1912),
    ('section-2 tail near end', 0x60718700, 0x100),
]
out = []
for name, start, n in spans:
    run = 0
    run_at = None
    free = []
    for i in range(n):
        a = start + i
        b = data[a - BASE]
        if b == 0xFF and a not in busy:
            if run == 0:
                run_at = a
            run += 1
        else:
            if run >= NEED:
                free.append((run_at, run))
            run = 0
    if run >= NEED:
        free.append((run_at, run))
    out.append(f'{name} free windows >= {NEED}: {len(free)}')
    for a, ln in free[:8]:
        out.append(f'  {a:#x} len {ln}')
text = '\n'.join(out) + '\n'
pathlib.Path('work/out/gaps-c1.txt').write_text(text, encoding='utf-8')
print(text)
