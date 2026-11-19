// Insert the return to shooting before the EXIF 6 AF-ON press.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const table = JSON.parse(readFileSync(resolve('work/out/proof-table.json'), 'utf8'));
const step = {
  id: 'back-shoot', action: 'key', key: 'menu', who: ['candidate'], pose: 2, bank: 4,
  fields: {
    subject: { source: 'literal', value: 0, provenance: 'T8c brief: 0x1e71[0] is 0 after every key' },
    bank: { source: 'literal', value: 4, provenance: 'T8c Q1: saved index, linked pose 2' },
  },
};
const at = table.steps.findIndex((s) => s.id === 'p-af-down');
if (at < 0) throw new Error('anchor');
table.steps.splice(at, 0, step);
writeFileSync(resolve('work/out/proof-table2.json'), JSON.stringify(table, null, 2) + '\n');
process.stdout.write(JSON.stringify({ steps: table.steps.length }) + '\n');
