// T9 version 3. Stock K1. Same Small move as version 2, while recording
// settings-getter callers for the position keys and every small GUI draw,
// including ones whose coordinates are not already on the screen centre.
// Draw and getter hooks only record. Do not edit after it has run.
// Usage: node26 work/scripts/obs_k1_v3.mjs om-emu
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_k1_v3.mjs om-emu\n');
  process.exit(2);
}
const GET = 0x60063380;
const SET_API = 0x50ac4afe;
const CONVERTER = 0x604050e5;
const CONSUMER = 0xa33ca384;
const WATCH = new Set([0x88b2, 0x5962, 0x84d1, 0x99a1, 0x1dd1, 0x9a41]);
const OUT = resolve('work/out/obs-k1-v3.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const s16 = (v) => { const n = v & 0xffff; return n & 0x8000 ? n - 0x10000 : n; };

function corners(rgb, w) {
  const x0 = 250, y0 = 120, x1 = 700, y1 = 500;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => { const i = (y * w + x) * 3; return rgb[i] >= 20 || rgb[i + 1] >= 20 || rgb[i + 2] >= 20; };
  const out = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const si = (x - x0) + (y - y0) * (x1 - x0);
      if (seen[si] || !on(x, y)) continue;
      let minX = x, minY = y, maxX = x, maxY = y, n = 0;
      const stack = [[x, y]];
      seen[si] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        n += 1;
        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < x0 || ny < y0 || nx >= x1 || ny >= y1) continue;
          const ni = (nx - x0) + (ny - y0) * (x1 - x0);
          if (seen[ni] || !on(nx, ny)) continue;
          seen[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      if (n >= 20 && n <= 400) out.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

try {
  emit({
    id: 'v3-plan', step: 'plan', pass: true, problems: [],
    note: 'Stock K1. Repeat the version-2 move and record getter callers and small draws around OK.',
  });
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-k1-v3.jsonl',
    tag: 'obs-k1-v3',
    candidate: false,
    fatalShots: true,
    explanation: 'v3 stock K1. No overlay and no firmware write. Getter and draw wrappers only record.',
    change: 'none',
    async drive(ctx) {
      const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
      const text = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/text.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const API_SET = A(SET_API);
      const gets = [];
      const draws = [];
      let trace = false;
      const noteGet = (r) => {
        if (!trace || gets.length > 400) return;
        const key = r.d0 & 0xffff;
        if (!WATCH.has(key)) return;
        gets.push({ caller: hex(r.mdr), key: hex(key), index: r.d1 & 0xffff });
      };
      const noteDraw = (op, r, hit) => {
        if (!trace || draws.length > 250) return;
        if (hit.w < 4 || hit.w > 64 || hit.h < 4 || hit.h > 64) return;
        let off = null;
        try { const b = ctx.l.sim.read(text.DRAW_OFFSET, 4); off = [b[0] | (b[1] << 8), b[2] | (b[3] << 8)]; } catch { /* offset unreadable */ }
        draws.push({ op, caller: hex(r.mdr), ...hit, offset: off });
      };
      try {
        ctx.l.wrap(ctx.native(GET), (prev) => (hle, r) => { noteGet(r); prev(hle, r); }, 'obs-t9-get-v3');
      } catch {
        ctx.l.observe(ctx.native(GET), (lab, r) => noteGet(r), 'obs-t9-get-v3');
      }
      const onRect = (prev) => (hle, r) => {
        if (trace) {
          try {
            const [h, colour, layer] = ctx.l.stack_args(r, 3);
            noteDraw('rect', r, { x: menu.s16(r.d0), y: menu.s16(r.d1), w: menu.s16(r.a1), h: s16(h), colour: colour >>> 0, layer: layer & 0xffff });
          } catch (e) { draws.push({ op: 'rect', caller: hex(r.mdr), error: String(e.message || e) }); }
        }
        prev(hle, r);
      };
      const onBitmap = (prev) => (hle, r) => {
        if (trace) {
          try {
            const [w, h, , , layer] = ctx.l.stack_args(r, 5);
            noteDraw('bitmap', r, { x: menu.s16(r.d0), y: menu.s16(r.d1), w: s16(w), h: s16(h), data: hex(r.a1), layer: layer & 0xffff });
          } catch (e) { draws.push({ op: 'bitmap', caller: hex(r.mdr), error: String(e.message || e) }); }
        }
        prev(hle, r);
      };
      ctx.l.wrap(menu.GPI_DRAW_RECT, onRect, 'obs-t9-rect-v3');
      ctx.l.wrap(menu.GPI_DRAW_BITMAP, onBitmap, 'obs-t9-bitmap-v3');

      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }
      function cells() {
        return {
          k99a1: [readKey(0x99a1, 0), readKey(0x99a1, 1)],
          k84d1: readKey(0x84d1, 0),
          k88b2: readKey(0x88b2, 0),
          k5962: [readKey(0x5962, 0), readKey(0x5962, 1)],
          size: [readKey(0x1dd1, 0), readKey(0x1dd1, 1)],
          k1e71: readKey(0x1e71, 0),
        };
      }
      function shot(id) {
        const fr = ctx.s.frame('boundary');
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/obs-k1-v3-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const png = readFileSync(file);
        return {
          file: 'work/out/obs-k1-v3-' + id + '.png',
          sha256: createHash('sha256').update(png).digest('hex'),
          marks: corners(rgb, fr[0]),
        };
      }
      function callers(rows, field) {
        const map = new Map();
        for (const row of rows) {
          const key = field === 'get' ? row.caller + ' ' + row.key + ':' + row.index : row.caller + ' ' + row.op + ' ' + row.w + 'x' + row.h;
          map.set(key, (map.get(key) || 0) + 1);
        }
        return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([name, n]) => ({ name, n }));
      }

      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(300);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
      ctx.idle(200);
      if (ctx.s.get(289) !== 0 || ctx.s.get(25) !== 0) throw new Error('focus');
      const subject = readKey(0x1e71, 0);
      emit({
        id: 'v3-subject', step: 'subject', pass: subject === 0, problems: subject === 0 ? [] : ['subject'],
        expect: { subject: 0 }, actual: { subject },
        note: '0x1e71[0] read back. The menu text was recorded in version 1 and version 2.',
      });
      if (subject !== 0) throw new Error('subject');

      trace = true;
      ctx.idle(200);
      const restShot = shot('rest');
      const restGets = gets.splice(0, gets.length);
      const restDraws = draws.splice(0, draws.length);
      trace = false;
      const restCells = cells();
      emit({
        id: 'v3-rest', step: 'rest', pass: restShot.marks.length === 4, problems: restShot.marks.length === 4 ? [] : ['marks'],
        expect: { marks: 4, position: 526 }, actual: { marks: restShot.marks, frame: restCells.k88b2, cells: restCells },
        png: restShot, gets: callers(restGets, 'get'), draws: callers(restDraws, 'draw'), drawSamples: restDraws.slice(0, 20),
      });

      ctx.press('up');
      if (ctx.s.screen() !== 'direct') throw new Error('direct');
      let sawSingle = false;
      const dials = [];
      for (let i = 0; i < 8; i++) {
        ctx.s.dial_input('main', 1);
        ctx.s.camapp.pump();
        ctx.idle(300);
        const c = cells();
        dials.push({ detent: i + 1, zone0: c.k99a1[0], kind: c.k84d1, size: c.size, frame: c.k88b2, pos0: c.k5962[0] });
        if (c.size[0] === 1 && c.size[1] === 1) sawSingle = true;
        if (sawSingle && c.size[0] === 3 && c.size[1] === 3) break;
      }
      if (!sawSingle || cells().size[0] !== 3) throw new Error('small ' + JSON.stringify(dials));
      const before = cells();
      ctx.press('right');
      const after = cells();
      if (after.k88b2 === before.k88b2) throw new Error('right did not move ' + before.k88b2);
      emit({
        id: 'v3-move', step: 'move', pass: true, problems: [],
        expect: { size: [3, 3], moved: true },
        actual: { before, after }, dials,
      });

      gets.splice(0, gets.length);
      draws.splice(0, draws.length);
      trace = true;
      ctx.press('ok');
      ctx.idle(400);
      const movedShot = shot('moved');
      trace = false;
      const back = cells();
      emit({
        id: 'v3-moved', step: 'moved', pass: ctx.s.screen() === 'shooting' && movedShot.marks.length === 4, problems: [],
        expect: { screen: 'shooting', marks: 4 },
        actual: { screen: ctx.s.screen(), marks: movedShot.marks, cells: back, target: Array.from(ctx.l.sim.read(CONSUMER, 10)) },
        png: movedShot,
        gets: callers(gets, 'get'),
        draws: callers(draws, 'draw'),
        drawSamples: draws.slice(0, 30),
      });
    },
  });
  emit({ id: 'v3-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'], ok: result.ok, failed: result.failed });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v3-done', step: 'done', pass: false, problems: ['exception'], ok: false, error: String(e && e.stack ? e.stack : e) });
  process.exit(1);
}
