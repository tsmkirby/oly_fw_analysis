// role: observe. Find stock text ids whose English string names a zone.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve('om-emu', 'emu', p)).href);
const { loadBlock } = await use('checks/lib/env.mjs');
const { layout, record, StringTable } = await use('src/lab/resources.mjs');

const block = loadBlock();
const lay = layout(block);
const lines = [];
const needles = ['Single', 'Cross', 'Large', 'Mid', 'All', 'Small', 'C1', 'C2'];
for (let e = lay.strings[0]; e <= lay.strings[1]; e++) {
  const table = new StringTable(e, record(e, block));
  if (table.lang !== 'en') continue;
  lines.push('english entry ' + e + ' count ' + table.count);
  for (let id = 0; id < table.count; id++) {
    let text;
    try { text = table.text(id); } catch { continue; }
    if (needles.some((n) => text.includes(n))) {
      lines.push(id.toString(16).padStart(4, '0') + ' ' + JSON.stringify(text).slice(0, 180));
    }
  }
}
writeFileSync(resolve('work/out/zone-text-f1.txt'), lines.join('\n') + '\n');
console.log('lines ' + lines.length);
