# Hash the task inputs and print the tool versions this process can see.
import hashlib
import pathlib
import platform
import sys

files = [
    'inputs/00_0100_50000020.decoded.bin',
    'inputs/02_0106_458c0020.decoded.bin',
    'brief.md',
    'TASK.md',
    'templates/result.md',
]
for rel in files:
    data = pathlib.Path(rel).read_bytes()
    print(f'{hashlib.sha256(data).hexdigest()}  {len(data)}  {rel}')
print('python', sys.version.replace('\n', ' '))
print('platform', platform.platform())
