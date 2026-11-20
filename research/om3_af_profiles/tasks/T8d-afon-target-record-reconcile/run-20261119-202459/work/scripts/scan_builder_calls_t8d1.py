# One-shot scan. Not an experiment version. Finds calls and jumps to the AF-ON builder.
import csv

img = bytearray(open('inputs/00_0100_50000020.decoded.bin', 'rb').read())
base = 0x60021020
with open('ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv', newline='') as f:
    for row in csv.reader(f):
        if not row or row[0] == 'component_offset':
            continue
        img[int(row[0], 16)] = int(row[3], 16)
target = 0x60a8f6bb
hits = []
for i in range(len(img) - 7):
    addr = (base + i) & 0xffffffff
    b = img[i]
    if b == 0xdd:
        disp = int.from_bytes(img[i + 1:i + 5], 'little')
        if ((addr + disp) & 0xffffffff) == target:
            hits.append(('call', hex(addr), img[i + 5], img[i + 6]))
    elif b == 0xfc and img[i + 1] == 0xff:
        disp = int.from_bytes(img[i + 2:i + 6], 'little')
        if ((addr + disp) & 0xffffffff) == target:
            hits.append(('calls', hex(addr)))
    elif b == 0xdc:
        disp = int.from_bytes(img[i + 1:i + 5], 'little')
        if ((addr + disp) & 0xffffffff) == target:
            hits.append(('jmp', hex(addr)))
print('hits', len(hits))
for h in hits:
    print(h)
