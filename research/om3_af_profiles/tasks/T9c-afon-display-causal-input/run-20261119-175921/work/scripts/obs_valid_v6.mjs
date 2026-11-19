// Version 6 of 6. Stock K1. No overlay, no display change, no cell write.
// The 12 edges keep the centre frame, the stock ten-byte and subject 0.
// OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_valid_v6.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout] = process.argv.slice(2);
if (!checkout) { process.stderr.write('usage: node26 work/scripts/obs_valid_v6.mjs om-emu\n'); process.exit(2); }

const GET = 0x60063380, CONVERTER = 0x604050e5, SET_API = 0x50ac4afe;
const EDGES = [['s1','down'],['s1','up'],['afon','down'],['afon','up'],['s1','down'],['afon','down'],['afon','up'],['s1','up'],['afon','down'],['s1','down'],['s1','up'],['afon','up']];
const STOCK = [0x0e, 0x02, 0x02, 0x00, 0x1b, 0x00, 0x27, 0x00, 0x00, 0x00];
const CENTRE = [
  { x: 417, y: 265, w: 19, h: 21 }, { x: 464, y: 265, w: 19, h: 21 },
  { x: 417, y: 314, w: 19, h: 21 }, { x: 464, y: 314, w: 19, h: 21 },
];
const OUT = resolve('work/out/obs-valid-v6.jsonl');
const lines = [];
const emit = (row) => { lines.push(JSON.stringify(row)); console.log(JSON.stringify({ id: row.id, pass: row.pass })); mkdirSync(resolve('work/out'), { recursive: true }); writeFileSync(OUT, lines.join('\n') + '\n'); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function greyMarks(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => { const i = (y * w + x) * 3; const hi = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]); const lo = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]); return lo >= 18 && hi <= 60 && hi - lo <= 12; };
  const marks = []; let pixels = 0, n31 = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * w + x) * 3;
    if (rgb[i] === 31 && rgb[i + 1] === 31 && rgb[i + 2] === 31) n31 += 1;
    const si = (x - x0) + (y - y0) * (x1 - x0);
    if (seen[si] || !on(x, y)) continue;
    let minX = x, minY = y, maxX = x, maxY = y, n = 0; const stack = [[x, y]]; seen[si] = 1;
    while (stack.length) {
      const [cx, cy] = stack.pop(); n += 1;
      if (cx < minX) minX = cx; if (cy < minY) minY = cy; if (cx > maxX) maxX = cx; if (cy > maxY) maxY = cy;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < x0 || ny < y0 || nx >= x1 || ny >= y1) continue;
        const ni = (nx - x0) + (ny - y0) * (x1 - x0);
        if (seen[ni] || !on(nx, ny)) continue;
        seen[ni] = 1; stack.push([nx, ny]);
      }
    }
    pixels += n;
    if (n >= 15 && n <= 400) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return { marks, pixels, n31 };
}

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  emit({ id: 'v6-plan', step: 'plan', pass: true, problems: [], expect: { model: 'E147', marks: CENTRE, target: STOCK }, actual: { modelEnv: 'E147' }, note: 'Version 6 of 6. Stock K1. No display change.' });
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-valid-v6.jsonl',
    tag: 'valid-v6',
    candidate: false,
    fatalShots: true,
    explanation: 'v6 K1. Stock. No overlay and no display change. The 12 edges stay on the centre frame.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v6-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(A(SET_API), { d0: 289, d1: argument }, null, null, 200000);
      ctx.l.call(A(SET_API), { d0: 1712, d1: 0 }, null, null, 200000);
      ctx.idle(150);
      const readKey = (key, index) => ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      if (readKey(0x1e71, 0) !== 0) throw new Error('subject');
      let failed = 0;
      for (let i = 0; i < EDGES.length; i++) {
        ctx.key(EDGES[i][0], EDGES[i][1]);
        ctx.idle(600);
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed at edge ' + i);
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/valid-v6-e' + i + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const g = greyMarks(rgb, fr[0]);
        const boxes = g.marks.map(({ x, y, w, h }) => ({ x, y, w, h }));
        const owner = ctx.readOwn()[4];
        const target = Array.from(ctx.l.sim.read(0xa33ca384, 10));
        const subject = readKey(0x1e71, 0);
        const cell = readKey(0x88b2, 0);
        const problems = [];
        if (owner !== 255) problems.push('owner');
        if (!same(target, STOCK)) problems.push('target');
        if (subject !== 0) problems.push('subject');
        if (cell !== 526) problems.push('cell');
        if (!same(boxes, CENTRE) || g.pixels !== 444 || g.n31 !== 444) problems.push('marks');
        if (problems.length) failed += 1;
        emit({
          id: 'v6-e' + i, step: 'edge', pass: problems.length === 0, problems,
          expect: { owner: 255, target: STOCK, subject: 0, cell: 526, marks: CENTRE, pixels: 444, n31: 444 },
          actual: { key: EDGES[i][0], dir: EDGES[i][1], owner, target, subject, cell, marks: g.marks, pixels: g.pixels, n31: g.n31, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') },
        });
      }
      emit({ id: 'v6-done', step: 'done', pass: failed === 0, problems: failed ? ['edges'] : [], expect: { failed: 0 }, actual: { failed } });
      if (failed) throw new Error('edges ' + failed);
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v6-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
