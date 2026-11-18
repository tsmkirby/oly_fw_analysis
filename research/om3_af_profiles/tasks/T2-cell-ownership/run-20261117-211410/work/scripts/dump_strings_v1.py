import hashlib
import pathlib

main = pathlib.Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
assert hashlib.sha256(main).hexdigest() == "5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59"
BASE = 0x60021020

def off(va):
    return va - BASE

start = off(0x60095100)
blob = main[start:start + 0x280]
i = 0
while i < len(blob):
    if 32 <= blob[i] < 127:
        j = i
        while j < len(blob) and 32 <= blob[j] < 127:
            j += 1
        if j - i >= 2:
            print("0x%08x %s" % (0x60095100 + i, blob[i:j].decode("ascii")))
        i = j + 1
    else:
        i += 1
