# Append listing ranges. Does not modify earlier scripts.
from pathlib import Path
p = Path('work/out/disasm-ranges-full.txt')
extra = (
    'binding-next 0x6124f55e 70\n'
    'binding-third 0x6124f620 50\n'
    'scratch-ptr 0x6136b9c0 24\n'
)
p.write_text(p.read_text(encoding='utf-8') + extra, encoding='utf-8')
print(p.read_text(encoding='utf-8'))
