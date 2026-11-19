// T9 correction experiment version 9. One causal trial.
// EMULATOR-ONLY test-setup write of 0x88b2 alone. 0x5962 is not written.
// OM_EMU_MODEL=E147 is assigned before any import of emu/src/fw/model.mjs.
// Do not edit after it has run.
// Usage: node26 work/scripts/obs_cell_v9.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_cell_v9.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const OUT = resolve('work/out/obs-cell-v9.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const s16 = (v) => { const n = v & 0xffff; return n & 0x8000 ? n - 0x10000 : n; };

function greyMarks(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => {
    const i = (y * w + x) * 3;
    const hi = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]);
    const lo = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]);
    return lo >= 18 && hi <= 60 && hi - lo <= 12;
  };
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
      if (n >= 15 && n <= 400) out.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}
function unionOf(marks) {
  if (!marks.length) return null;
  const x = Math.min(...marks.map((m) => m.x));
  const y = Math.min(...marks.map((m) => m.y));
  return { x, y, w: Math.max(...marks.map((m) => m.x + m.w)) - x, h: Math.max(...marks.map((m) => m.y + m.h)) - y };
}

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'v9-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147', cell: '0x88b2', value: 412, other: '0x5962 unchanged' },
    actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 9. One EMULATOR-ONLY test-setup write of 0x88b2. 0x5962 is not written.',
  });
  if (!envPass) process.exit(1);
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-cell-v9.jsonl',
    tag: 'obs-cell-v9',
    candidate: false,
    fatalShots: true,
    explanation: 'v9 stock K1. One EMULATOR-ONLY test-setup write: setter of 0x88b2 index 0 to 412. No other cell is written. Role: test setup.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const modelPass = MODEL === 'E147';
      emit({
        id: 'v9-model', step: 'model', pass: modelPass, problems: modelPass ? [] : ['model'],
        expect: { model: 'E147' }, actual: { model: MODEL },
        note: 'Read before bring-up and before any key.',
      });
      if (!modelPass) throw new Error('model ' + MODEL);
      const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const API_SET = A(SET_API);
      const rects = [];
      let armed = false;
      ctx.l.wrap(menu.GPI_DRAW_RECT, (prev) => (hle, r) => {
        if (armed && rects.length < 12) {
          try {
            const [h, colour, layer] = ctx.l.stack_args(r, 3);
            const hit = { x: menu.s16(r.d0), y: menu.s16(r.d1), w: menu.s16(r.a1), h: s16(h), colour: colour >>> 0, layer: layer & 0xffff, caller: hex(r.mdr) };
            const frameLike = hit.colour === 22 && ((hit.w <= 8 && hit.h >= 20) || (hit.h <= 8 && hit.w >= 20));
            if (frameLike && hit.x >= 250 && hit.x <= 750) rects.push(hit);
          } catch (e) { rects.push({ error: String(e.message || e) }); }
        }
        prev(hle, r);
      }, 'obs-t9-rect-v9');
      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }
      function cells() {
        return {
          k88b2: readKey(0x88b2, 0),
          k5962: [readKey(0x5962, 0), readKey(0x5962, 1)],
          k84d1: readKey(0x84d1, 0),
          k1e71: readKey(0x1e71, 0),
        };
      }
      function shot(id) {
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed at ' + id);
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/obs-cell-v9-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const marks = greyMarks(rgb, fr[0]);
        return { sha256: createHash('sha256').update(readFileSync(file)).digest('hex'), marks, union: unionOf(marks) };
      }

      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
      ctx.idle(150);
      const subject = readKey(0x1e71, 0);
      emit({
        id: 'v9-subject', step: 'subject', pass: subject === 0, problems: subject === 0 ? [] : ['subject'],
        expect: { subject: 0 }, actual: { subject },
      });
      if (subject !== 0) throw new Error('subject');
      const rest = shot('rest');
      const before = cells();
      const restPass = rest.marks.length === 4 && before.k88b2 === 526 && before.k5962[0] === 526 && before.k5962[1] === 526 && before.k1e71 === 0;
      emit({
        id: 'v9-rest', step: 'rest', pass: restPass, problems: restPass ? [] : ['rest'],
        expect: { marks: 4, k88b2: 526, k5962: [526, 526], subject: 0 },
        actual: { marks: rest.marks.length, union: rest.union, png: rest.sha256, cells: before },
      });
      if (!restPass) throw new Error('rest');

      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      const after = cells();
      const writePass = after.k88b2 === 412 && after.k5962[0] === 526 && after.k5962[1] === 526 && after.k84d1 === before.k84d1 && after.k1e71 === 0;
      emit({
        id: 'v9-write', step: 'write', pass: writePass, problems: writePass ? [] : ['readback'],
        expect: { k88b2: 412, k5962: [526, 526], k84d1: before.k84d1, subject: 0 },
        actual: after,
        note: 'EMULATOR-ONLY test-setup write. Only 0x88b2 index 0 was passed to the setter.',
      });
      if (!writePass) throw new Error('readback ' + JSON.stringify(after));

      armed = true;
      ctx.idle(500);
      const moved = shot('after');
      armed = false;
      const finalCells = cells();
      const sameUnion = JSON.stringify(moved.union) === JSON.stringify(rest.union);
      const samePng = moved.sha256 === rest.sha256;
      emit({
        id: 'v9-marks', step: 'marks', pass: finalCells.k88b2 === 412 && finalCells.k5962[0] === 526 && finalCells.k1e71 === 0,
        problems: [finalCells.k88b2 === 412 ? null : 'k88b2', finalCells.k5962[0] === 526 ? null : 'k5962', finalCells.k1e71 === 0 ? null : 'subject'].filter(Boolean),
        expect: { k88b2: 412, k5962: [526, 526], subject: 0 },
        actual: {
          cells: finalCells, union: moved.union, restUnion: rest.union, png: moved.sha256, restPng: rest.sha256,
          unionUnchanged: sameUnion, pngUnchanged: samePng, frameRects: rects, marks: moved.marks,
        },
        note: 'unionUnchanged is the measurement. The pass bit is the cell readback, not a prediction that the marks move.',
      });
    },
  });
  emit({
    id: 'v9-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: result.ok, failed: result.failed },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v9-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
