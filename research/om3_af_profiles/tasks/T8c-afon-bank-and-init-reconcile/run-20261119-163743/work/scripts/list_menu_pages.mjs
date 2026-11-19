// Static menu map. Not an emulator process. Do not edit after this runs.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const checkout = process.argv[2] || 'om-emu';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadImage, loadBlock } = await use('checks/lib/env.mjs');
const M = await use('src/lab/menudata.mjs');
const img = new M.Image(loadImage());
const strings = new M.Strings(['en'], loadImage(), loadBlock());
const groups = M.groups(img);
const out = [];
for (const tab of M.tabs(img)) {
  tab.pages.forEach((pageId, i) => {
    const g = groups.get(pageId);
    const title = g ? M.render(g.title, strings, 'en') : null;
    const rows = g ? g.labels.map((lab) => M.render(lab, strings, 'en')) : [];
    const hit = [title, ...rows].some((t) => String(t).includes('Reset/Initialize') || String(t).includes('Initialize All'));
    out.push({ tab: tab.index, tabId: tab.id, page: i + 1, pageId, title, rows, hit });
  });
}
writeFileSync(resolve('work/out/menu-pages.json'), JSON.stringify(out, null, 2) + '\n');
const hits = out.filter((r) => r.hit);
process.stdout.write(JSON.stringify({ pages: out.length, hits }, null, 2) + '\n');
