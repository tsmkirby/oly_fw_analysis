// role: observe. English strings for the zone-help search. No firmware writes.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const checkout = process.argv[2] || 'om-emu';
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const sha = (p) => {
  const b = readFileSync(p);
  return { path: p.replaceAll('\\', '/'), sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
};
const helpers = [
  'emu/checks/lib/env.mjs', 'emu/src/lab/resources.mjs', 'work/scripts/strings_i1.mjs',
].map((p) => sha(p.startsWith('work/') ? p : resolve(checkout, p)));
const { loadBlock } = await use('checks/lib/env.mjs');
const { layout, record, StringTable } = await use('src/lab/resources.mjs');
const block = loadBlock();
const lay = layout(block);
let table = null;
for (let e = lay.strings[0]; e <= lay.strings[1]; e++) {
  const t = new StringTable(e, record(e, block));
  if (t.lang === 'en') { table = t; break; }
}
if (!table) throw new Error('no english table');
const ids = [
  0x0dd2, 0x0dd3, 0x0dd4, 0x0dcf, 0x1279, 0x127a, 0x127b, 0x127c, 0x127d, 0x124f,
  0x11c4, 0x0b90, 0x10d5, 0x10d6, 0x10c3, 0x10c4, 0x10c5, 0x10c6, 0x108b,
];
const lines = [];
const add = (s) => lines.push(s);
add('helpers ' + JSON.stringify(helpers));
add('english count ' + table.count);
add('named ids');
for (const id of ids) {
  let text = null;
  try { text = table.text(id); } catch (e) { text = 'ERR ' + String(e.message || e); }
  add(`  ${id.toString(16)} ${JSON.stringify(text)}`);
}
const needles = ['af target', 'target mode', 'target area', 'af area', 'focus area', 'target point'];
add('keyword hits');
let shown = 0;
for (let id = 0; id < table.count && shown < 80; id++) {
  let text;
  try { text = table.text(id); } catch { continue; }
  const low = text.toLowerCase();
  if (!needles.some((n) => low.includes(n))) continue;
  add(`  ${id.toString(16)} ${JSON.stringify(text)}`);
  shown += 1;
}
add('keyword hits shown ' + shown);
const text = lines.join('\n') + '\n';
writeFileSync('work/out/strings-i1.txt', text);
process.stdout.write(text);
