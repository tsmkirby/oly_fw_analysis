// Per-slot reset, ROM, and fresh table from the retained Q2 and ROM reads.
// Not an experiment version. Does not re-measure.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const summary = JSON.parse(readFileSync(resolve('work/out/q2b-summary.json'), 'utf8'));
const romDoc = JSON.parse(readFileSync(resolve('work/out/rom-and-writer-q1.json'), 'utf8'));
const order = ['k99a1', 'k9a41', 'k5962', 'k1dd1', 'k84d1', 'k88b2', 'k90d1', 'k5a11', 'k1de1', 'k1df1'];
const romByName = new Map(romDoc.rom.map((row) => [row.name, row]));
const slots = [];
for (const name of order) {
  const fresh = summary.fresh[name];
  const reset = summary.reset[name];
  const rom = romByName.get(name);
  if (!fresh || !reset || !rom) throw new Error('missing ' + name);
  const hit = rom.hits[0];
  const bytes = Buffer.from(hit.payload, 'hex');
  const width = hit.width;
  for (let i = 0; i < fresh.length; i++) {
    const covered = i < hit.count && bytes.length >= (i + 1) * width;
    const romValue = covered ? (width === 2 ? bytes[i * 2] | (bytes[i * 2 + 1] << 8) : bytes[i]) : 0;
    slots.push({
      key: rom.key,
      name,
      index: i,
      reset: reset[i],
      rom: romValue,
      fresh: fresh[i],
      romCovered: covered,
      romRecord: hit.record,
      romCount: hit.count,
      resetEqualsFresh: reset[i] === fresh[i],
      resetEqualsRom: reset[i] === romValue,
    });
  }
}
const disagreeRom = slots.filter((s) => !s.resetEqualsRom);
const disagreeFresh = slots.filter((s) => !s.resetEqualsFresh);
const doc = {
  slots: slots.length,
  resetEqualsFresh: disagreeFresh.length === 0,
  disagreeFresh,
  disagreeRom: disagreeRom.length,
  zeroInAllThree: slots.filter((s) => s.reset === 0 && s.rom === 0 && s.fresh === 0).map((s) => s.name + '[' + s.index + ']'),
  rows: slots,
};
writeFileSync(resolve('work/out/slots-q2.json'), JSON.stringify(doc, null, 2) + '\n');
const lines = ['| Key | Index | Reset | ROM | Fresh |', '| --- | --- | --- | --- | --- |'];
for (const row of slots) lines.push('| ' + [row.key, row.index, row.reset, row.rom, row.fresh].join(' | ') + ' |');
writeFileSync(resolve('work/out/slots-q2.md'), lines.join('\n') + '\n');
process.stdout.write(JSON.stringify({ slots: slots.length, disagreeFresh: disagreeFresh.length, disagreeRom: disagreeRom.length }) + '\n');
