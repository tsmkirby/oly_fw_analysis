# Hash the brief and the two decoded images.
import hashlib, pathlib
paths = [
    'brief.md',
    'TASK.md',
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
]
for p in paths:
    h = hashlib.sha256()
    n = 0
    with open(p, 'rb') as f:
        while True:
            b = f.read(1 << 20)
            if not b:
                break
            h.update(b)
            n += len(b)
    print(f'{h.hexdigest()}  {n}  {p}')
