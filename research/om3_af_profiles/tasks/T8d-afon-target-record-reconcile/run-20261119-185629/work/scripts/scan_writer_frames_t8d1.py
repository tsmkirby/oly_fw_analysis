# One-shot. Not an experiment version. Call frames of the stock writer.
import csv
img = bytearray(open('inputs/00_0100_50000020.decoded.bin', 'rb').read())
base = 0x60021020
with open('ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv', newline='') as f:
    for row in csv.reader(f):
        if not row or row[0] == 'component_offset':
            continue
        img[int(row[0], 16)] = int(row[3], 16)
target = 0x609b3c79
hits = []
for i in range(len(img) - 7):
    addr = (base + i) & 0xffffffff
    if img[i] == 0xdd:
        disp = int.from_bytes(img[i + 1:i + 5], 'little')
        if ((addr + disp) & 0xffffffff) == target:
            hits.append((hex(addr), img[i + 5], img[i + 6]))
print('calls', len(hits))
for h in hits:
    print(h)
