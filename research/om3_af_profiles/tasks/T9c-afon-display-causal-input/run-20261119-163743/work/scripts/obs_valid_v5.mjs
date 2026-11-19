// Version 5 of 6. Unseeded T6 control with the display change installed.
// The mirror is not seeded, so 0x6041935b passes through. EMULATOR-ONLY.
// Half-press All is the reused T6 test setup. Expected frame is the cleared
// All frame measured on the owner-0 edges of version 4. OM_EMU_MODEL=E147
// before model.mjs.
// Usage: node26 work/scripts/obs_valid_v5.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const [checkout] = process.argv.slice(2);
if (!checkout) { process.stderr.write('usage: node26 work/scripts/obs_valid_v5.mjs om-emu\n'); process.exit(2); }

const SET = 0x60063431, GET = 0x60063380, CONVERTER = 0x604050e5, SET_API = 0x50ac4afe, CALL = 0x6041935b;
const MIRROR = 0xa031eeb0, OWN = 0xa031ed04;
const EDGES = [['s1','down'],['s1','up'],['afon','down'],['afon','up'],['s1','down'],['afon','down'],['afon','up'],['s1','up'],['afon','down'],['s1','down'],['s1','up'],['afon','up']];
const OWNERS = [1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0];
const ALL = [0x0e, 0x02, 0x02, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const OUT = resolve('work/out/obs-valid-v5.jsonl');
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
  emit({ id: 'v5-plan', step: 'plan', pass: true, problems: [], expect: { model: 'E147', marks: [] }, actual: { modelEnv: 'E147' }, note: 'Version 5 of 6. K2. Display hook installed, mirror unseeded.' });
  const counts = { pos: 0, zone: 0, pass: 0 };
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-valid-v5.jsonl',
    tag: 'valid-v5',
    candidate: true,
    fatalShots: true,
    overlayCsv: 'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes-c1.csv',
    explanation: 'v5 K2. Z5 overlay, half-press All, no mirror seed. The display hook is installed and passes through an unseeded mirror. EMULATOR-ONLY.',
    change: 'EMULATOR-ONLY display change at 0x6041935b. Unseeded mirror, so the call passes through.',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v5-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(A(SET_API), { d0: 289, d1: argument }, null, null, 200000);
      ctx.l.call(A(SET_API), { d0: 1712, d1: 0 }, null, null, 200000);
      ctx.idle(150);
      const readKey = (key, index) => ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      const setKey = (key, index, value) => ctx.l.call(ctx.native(SET), { d0: key, d1: index, a1: value }, null, null, 200000);
      if (readKey(0x1e71, 0) !== 0) throw new Error('subject');
      setKey(0x84d1, 0, 2); setKey(0x1dd1, 0, 1); setKey(0x1dd1, 1, 1); setKey(0x99a1, 0, 0);
      const head = Array.from(ctx.l.sim.read(MIRROR, 16));
      const u8 = (a) => ctx.l.sim.read(a, 1)[0];
      const u16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
      ctx.l.hook(ctx.native(CALL), (h, r) => {
        if (u8(OWN) !== 2) { counts.pass += 1; ctx.l.passthrough(r); return; }
        const key = r.d0 & 0xffff;
        if (key === 0x88b2) {
          const v = u16(MIRROR + 0x0c);
          if (v === 0xffff) { ctx.l.passthrough(r); return; }
          counts.pos += 1; r.d0 = v; h.skip_call(r); return;
        }
        if (key === 0x99a1 && (r.d1 & 0xffff) === 0) {
          const v = u8(MIRROR + 1);
          if (v === 0xff) { ctx.l.passthrough(r); return; }
          counts.zone += 1; r.d0 = v; h.skip_call(r); return;
        }
        ctx.l.passthrough(r);
      }, 'EMULATOR-ONLY display change: owner 2, call 0x6041935b. Unseeded values pass through.');
      let failed = 0;
      for (let i = 0; i < EDGES.length; i++) {
        ctx.key(EDGES[i][0], EDGES[i][1]);
        ctx.idle(600);
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed at edge ' + i);
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/valid-v5-e' + i + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const g = greyMarks(rgb, fr[0]);
        const owner = ctx.readOwn()[4];
        const target = Array.from(ctx.l.sim.read(0xa33ca384, 10));
        const subject = readKey(0x1e71, 0);
        const cell = readKey(0x88b2, 0);
        const problems = [];
        if (owner !== OWNERS[i]) problems.push('owner');
        if (!same(target, ALL)) problems.push('target');
        if (subject !== 0) problems.push('subject');
        if (cell !== 526) problems.push('cell');
        if (g.marks.length !== 0 || g.pixels !== 0) problems.push('marks');
        if (problems.length) failed += 1;
        emit({
          id: 'v5-e' + i, step: 'edge', pass: problems.length === 0, problems,
          expect: { owner: OWNERS[i], target: ALL, subject: 0, cell: 526, marks: [], pixels: 0 },
          actual: { key: EDGES[i][0], dir: EDGES[i][1], owner, target, subject, cell, marks: g.marks, pixels: g.pixels, n31: g.n31, sha256: createHash('sha256').update(readFileSync(file)).digest('hex'), mirrorHead: head },
        });
      }
      emit({ id: 'v5-done', step: 'done', pass: failed === 0, problems: failed ? ['edges'] : [], expect: { failed: 0 }, actual: { failed, counts, mirrorHead: head } });
      if (failed) throw new Error('edges ' + failed);
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v5-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
