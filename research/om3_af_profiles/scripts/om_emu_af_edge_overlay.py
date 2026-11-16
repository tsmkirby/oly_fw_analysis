"""Build an emulator-only central-edge experiment from the archived profile overlay.

No firmware container is produced. The section-7 call-site edit is not a
deployable package. This retains the legacy AF Home profile provider.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import struct

BASE = 0x60021020
ENTRY = 0x6031EB80
STATE = 0xA031E920


class Asm:
    def __init__(self):
        self.b = bytearray()
        self.labels = {}
        self.fixups = []

    def x(self, *v):
        self.b.extend(v)

    def word(self, v):
        self.b.extend(struct.pack('<I', v & 0xFFFFFFFF))

    def jump(self, target):
        self.fixups.append((len(self.b), target))
        self.x(0xDC)
        self.word(0)

    def equal(self, target):
        self.x(0xC9, 7)
        self.jump(target)

    def unequal(self, target):
        self.x(0xC8, 7)
        self.jump(target)

    def call(self, target, mask, frame):
        at = ENTRY + len(self.b)
        self.x(0xDD)
        self.word(target - at)
        self.x(mask, frame)

    def imm(self, value):
        self.x(0xFC, 0xCC)
        self.word(value)

    def label(self, name):
        self.labels[name] = len(self.b)

    def finish(self):
        for at, label in self.fixups:
            struct.pack_into('<i', self.b, at + 1, self.labels[label] - at)
        return bytes(self.b)


def build():
    a = Asm()
    a.x(0xCF, 0xF0, 0xF8, 0xFE, 0xE0)  # save nonvolatile, 32-byte locals
    a.x(0x42, 4, 0x46, 8, 0x43, 12, 0x47, 16)
    # Original six-word event is at incoming sp+8, now sp+56.
    for event, label in ((0x01000002, 'half-down'), (0x01000003, 'half-up'),
                         (0x010000CC, 'afon-down'), (0x010000CD, 'afon-up')):
        a.x(0x58, 56, 0xFC, 0xC8)
        a.word(event)
        a.equal(label)
    a.jump('done')
    for event, label, original, control in (
        (0x01000002, 'half-down', 0x01000002, 0x01000002),
        (0x01000003, 'half-up', 0x01000003, 0x01000003),
        (0x010000CC, 'afon-down', 0x01000032, 0x01050007),
        (0x010000CD, 'afon-up', 0x01000033, 0x01050008),
    ):
        a.label(label)
        a.x(0x58, 60, 0xFC, 0xC8)
        a.word(original)
        a.unequal('done')
        a.imm(control)
        a.x(0x42, 20)
        a.jump('reconcile')
    a.label('reconcile')
    a.x(0xFC, 0xA8)
    a.word(STATE + 6)
    a.x(0xA0, 1)
    a.unequal('done')
    a.call(0x6031EAD0, 0xF0, 0x14)
    a.x(0xA0, 1)
    a.unequal('done')
    a.x(0xFC, 0xA4)
    a.word(STATE + 20)
    a.call(0x60032312, 0xF0, 0x14)
    a.x(0xA0, 0)
    a.unequal('done')
    a.x(0x58, 20)
    a.call(0x60A8F2AC, 0, 0)
    a.x(0xFC, 0xA4)
    a.word(STATE + 20)
    a.call(0x6003791B, 0xF0, 0x18)
    a.label('done')
    a.x(0x58, 4, 0x59, 8, 0x5C, 12, 0x5D, 16)
    a.x(0xF8, 0xFE, 0x20, 0xCE, 0xF0)
    # The stock classifier ends with RETF, using MDR rather than the saved
    # return address. Nested calls changed MDR. D2 is the classifier's scratch
    # register and is restored by its existing [d2],4 return convention.
    a.x(0x5A, 4, 0xF2, 0xFA)  # mov (4,sp),D2; mov D2,MDR
    # Tail-call the displaced classifier with its incoming ABI intact.
    at = ENTRY + len(a.b)
    a.x(0xDC)
    a.word(0x6109227A - at)
    return a.finish()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('base_overlay', type=Path)
    p.add_argument('out', type=Path)
    args = p.parse_args()
    root = Path(__file__).resolve().parent.parent
    stock = (root / 'analysis/decoded/00_0100_50000020.decoded.bin').read_bytes()
    assert hashlib.sha256(stock).hexdigest() == '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
    image = bytearray(stock)
    for row in csv.DictReader(args.base_overlay.open()):
        at = int(row['component_offset'], 16)
        assert image[at] == int(row['stock_byte'], 16)
        image[at] = int(row['proposed_byte'], 16)
    code = build()
    assert len(code) < 0x480
    lo, hi = ENTRY - BASE, 0x6031F000 - BASE
    assert all(b == 255 for b in stock[lo:hi])
    image[lo:hi] = stock[lo:hi]
    image[lo:lo + len(code)] = code
    # No legacy row redirection, even after a real interrupt.
    at = 0x6017A5FC - BASE
    assert stock[at:at + 5] == bytes.fromhex('cf20f8fef8')
    image[at:at + 5] = stock[at:at + 5]
    site = 0x610BF5E2
    at = site - BASE
    assert stock[at:at + 7] == bytes.fromhex('dd982cfdff8004')
    image[at:at + 7] = bytes([0xDD]) + struct.pack('<i', ENTRY - site) + bytes([0x80, 4])
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open('x', newline='') as f:
        w = csv.writer(f)
        w.writerow(('component_offset', 'runtime_address', 'stock_byte', 'proposed_byte', 'reason'))
        for at, (old, new) in enumerate(zip(stock, image, strict=True)):
            if old != new:
                w.writerow((f'{at:08x}', f'{BASE+at:08x}', f'{old:02x}', f'{new:02x}', 'emulator-only central edge experiment'))
    args.out.with_suffix('.json').write_text(json.dumps({
        'entry': hex(ENTRY), 'bytes': len(code), 'callsite': hex(site),
        'source_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'base_overlay_sha256': hashlib.sha256(args.base_overlay.read_bytes()).hexdigest(),
        'decoded_sha256': hashlib.sha256(image).hexdigest(),
        'limitations': ['legacy AF Home provider', 'no packaging or placement proof for section 7',
                        'lock spans reconciliation only; stock dispatcher runs after unlock',
                        'no retry or completion fabricated on admission failure'],
    }, indent=2) + '\n')


if __name__ == '__main__':
    main()
