// Static menu map, second pass. Not an emulator process. Do not edit after this runs.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.OM_EMU_MODEL = 'E147';
const checkout = process.argv[2] || 'om-emu';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadImage, loadBlock } = await use('checks/lib/env.mjs');
const M = await use('src/lab/menudata.mjs');
const image = loadImage();
const img = new M.Image(image);
const strings = new M.Strings(['en'], image, loadBlock());
const groups = M.groups(img);
const out = [];
for (const tab of M.tabs(img)) {
  tab.pages.forEach((pageId, i) => {
    const g = groups.get(pageId);
    let title = null;
    let rows = [];
    let err = null;
    try {
      title = g ? M.render(g.title, strings, 'en') : null;
      rows = g && g.labels ? g.labels.map((lab) => M.render(lab, strings, 'en')) : [];
    } catch (e) { err = String(e && e.message || e); }
    const blob = [title, ...rows].join('\n');
    out.push({ tab: tab.index, tabId: tab.id, page: i + 1, pageId, title, rows, err, hit: blob.includes('Reset/Initialize') || blob.includes('Initialize All') });
  });
}
writeFileSync(resolve('work/out/menu-pages.json'), JSON.stringify(out, null, 2) + '\n');
const hits = out.filter((r) => r.hit).map((r) => ({ tab: r.tab, page: r.page, title: r.title, rows: r.rows }));
process.stdout.write(JSON.stringify({ pages: out.length, hits }, null, 2) + '\n');
