import hashlib
import pathlib

res = pathlib.Path("inputs/02_0106_458c0020.decoded.bin").read_bytes()
assert hashlib.sha256(res).hexdigest() == "3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059"
needles = [
    b"Initializes the settings",
    b"Save Settings",
    b"Custom Mode",
    b"Basic Settings/Image Quality",
]
for n in needles:
    at = []
    start = 0
    while len(at) < 8:
        i = res.find(n, start)
        if i < 0:
            break
        at.append(i)
        start = i + 1
    print(n.decode(), len(at), ["0x%x" % i for i in at])
