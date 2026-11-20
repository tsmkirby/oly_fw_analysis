// Static check of the mode-table bytes against the stock image.
// No emulator. Do not edit after it has run.
// Usage: node26 work/scripts/check_producer_r4.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
function bytes(addr, n) {
  const off = addr - BASE;
  return [...image.subarray(off, off + n)];
}
function hex(list) {
  return list.map((b) => b.toString(16).padStart(2, '0')).join('');
}
const expect = [
  { addr: 0x611c7741, hex: '5c0c', text: 'mov (0xc,sp),A0' },
  { addr: 0x611c7743, hex: 'f80104', text: 'mov (0x4,A1),D0' },
  { addr: 0x611c7746, hex: '60', text: 'mov D0,(A0)' },
  { addr: 0x61238e9a, hex: 'fcdc14a45b61', text: 'mov 0x615ba414,A0' },
  { addr: 0x61238eb4, hex: 'fa00fc1a', text: 'mov (0x1afc,A0),D0' },
  { addr: 0x61238eb8, hex: 'dd03900500a010', text: 'call 0x61291ebb' },
  { addr: 0x61238ebf, hex: '4214', text: 'mov D0,(0x14,sp)' },
  { addr: 0x61238ff8, hex: '5814', text: 'mov (0x14,sp),D0' },
  { addr: 0x61238ffa, hex: '4248', text: 'mov D0,(0x48,sp)' },
  { addr: 0x612390f9, hex: 'fcdd14a45b61', text: 'mov 0x615ba414,A1' },
  { addr: 0x612390ff, hex: '850a', text: 'mov 0xa,D1' },
  { addr: 0x61239101, hex: 'dd37e6f8ffc008', text: 'call 0x611c7738' },
  { addr: 0x610cd71c, hex: 'dded51f3eef01c', text: 'call 0x50002909' },
  { addr: 0x610cd7b1, hex: 'dd5851f3eef01c', text: 'call 0x50002909' },
  { addr: 0x61184e04, hex: '8029', text: 'mov 0x29,D0' },
  { addr: 0x61184e0b, hex: '8538', text: 'mov 0x38,D1' },
  { addr: 0x61185251, hex: 'ca4a', text: 'bra 0x6118529b' },
];
const checks = expect.map((row) => {
  const got = hex(bytes(row.addr, row.hex.length / 2));
  return { ...row, got, match: got === row.hex };
});
const tableOff = 0x615ba414 - BASE;
const table = [];
for (let i = 0; i < 10; i++) {
  table.push({
    index: i,
    key: image.readUInt32LE(tableOff + i * 8),
    value: image.readUInt32LE(tableOff + i * 8 + 4),
  });
}
const out = {
  note: 'Bytes read from inputs/00_0100_50000020.decoded.bin at address - 0x60021020. The table at 0x615ba414 is ten pairs. The key is the zone number and the value is the mode written to the template word.',
  mismatches: checks.filter((c) => !c.match).length,
  checks,
  table,
};
writeFileSync(resolve('work/out/mode-table-r4.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ mismatches: out.mismatches, pairs: table.length }));
if (out.mismatches) process.exit(1);
