// T9 correction experiment version 8. Stock K1, observation only.
// OM_EMU_MODEL=E147 is assigned before any import of emu/src/fw/model.mjs.
// Records the caller of the rectangle widget 0x610f6649 while the corner
// marks are redrawn. No firmware write and no overlay. Do not edit after it has run.
// Usage: node26 work/scripts/obs_path_v8.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_path_v8.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET_API = 0x50ac4afe;
const CONVERTER = 0x604050e5;
const WIDGET = 0x610f6649;
const OUT = resolve('work/out/obs-path-v8.jsonl');
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
    id: 'v8-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 8. Observation of the widget caller. No overlay.',
  });
  if (!envPass) process.exit(1);
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-path-v8.jsonl',
    tag: 'obs-path-v8',
    candidate: false,
    fatalShots: true,
    explanation: 'v8 stock K1. No overlay and no firmware write. The widget observer only records its caller.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const modelPass = MODEL === 'E147';
      emit({
        id: 'v8-model', step: 'model', pass: modelPass, problems: modelPass ? [] : ['model'],
        expect: { model: 'E147' }, actual: { model: MODEL },
        note: 'Read before bring-up and before any key.',
      });
      if (!modelPass) throw new Error('model ' + MODEL);
      const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const API_SET = A(SET_API);
      let phase = 'boot';
      let armed = false;
      const widgetCount = {};
      const widgetSamples = [];
      const rects = [];
      const bump = (map) => { map[phase] = (map[phase] || 0) + 1; };

      ctx.l.observe(ctx.native(WIDGET), (lab, r) => {
        bump(widgetCount);
        if (!armed || widgetSamples.length >= 24) return;
        let callBytes = null;
        try { callBytes = [...ctx.l.sim.read((r.mdr - 8) >>> 0, 8)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
        catch (e) { callBytes = String(e.message || e); }
        widgetSamples.push({
          phase, caller: hex(r.mdr), d0: r.d0 >>> 0, d1: r.d1 >>> 0,
          a0: hex(r.a0), a1: hex(r.a1), callBytes,
        });
      }, 'obs-widget-v8');
      ctx.l.wrap(menu.GPI_DRAW_RECT, (prev) => (hle, r) => {
        if (armed && rects.length < 16) {
          try {
            const [h, colour, layer] = ctx.l.stack_args(r, 3);
            const hit = { x: menu.s16(r.d0), y: menu.s16(r.d1), w: menu.s16(r.a1), h: s16(h), colour: colour >>> 0, layer: layer & 0xffff, caller: hex(r.mdr) };
            const frameLike = (hit.w >= 2 && hit.w <= 8 && hit.h >= 20) || (hit.h >= 2 && hit.h <= 8 && hit.w >= 20);
            if (frameLike) rects.push(hit);
          } catch (e) { rects.push({ error: String(e.message || e) }); }
        }
        prev(hle, r);
      }, 'obs-t9-rect-v8');

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
        const file = resolve('work/out/obs-path-v8-' + id + '.png');
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
      if (ctx.s.get(289) !== 0 || ctx.s.get(25) !== 0) throw new Error('focus');
      const subject = readKey(0x1e71, 0);
      emit({
        id: 'v8-subject', step: 'subject', pass: subject === 0, problems: subject === 0 ? [] : ['subject'],
        expect: { subject: 0 }, actual: { subject },
        note: '0x1e71[0] read back before any menu key. Version 7 already recorded the Off row text.',
      });
      if (subject !== 0) throw new Error('subject');

      const rest = shot('rest');
      const restCells = cells();
      const restPass = rest.marks.length === 4 && restCells.k88b2 === 526 && restCells.k1e71 === 0;
      emit({
        id: 'v8-rest', step: 'rest', pass: restPass, problems: restPass ? [] : ['rest'],
        expect: { marks: 4, position: 526, subject: 0 },
        actual: { marks: rest.marks.length, union: rest.union, png: rest.sha256, cells: restCells },
      });
      if (!restPass) throw new Error('rest');

      phase = 'direct';
      ctx.press('up');
      if (ctx.s.screen() !== 'direct') throw new Error('direct');
      let sawSingle = false;
      for (let i = 0; i < 8; i++) {
        ctx.s.dial_input('main', 1);
        ctx.s.camapp.pump();
        ctx.idle(280);
        const size = [readKey(0x1dd1, 0), readKey(0x1dd1, 1)];
        if (size[0] === 1 && size[1] === 1) sawSingle = true;
        if (sawSingle && size[0] === 3 && size[1] === 3) break;
      }
      ctx.press('right');
      const moved = cells();
      const directPass = sawSingle && moved.k88b2 !== 526 && moved.k1e71 === 0;
      emit({
        id: 'v8-direct', step: 'direct', pass: directPass, problems: directPass ? [] : ['direct'],
        expect: { sawSingle: true, positionDiffersFrom526: true, subject: 0 },
        actual: { sawSingle, cells: moved, widgetCount: { ...widgetCount } },
      });
      if (!directPass) throw new Error('direct');

      phase = 'ok';
      armed = true;
      ctx.press('ok');
      ctx.idle(200);
      const ok = shot('ok');
      armed = false;
      const okCells = cells();
      const callers = [...new Set(widgetSamples.map((s) => s.caller))];
      const okPass = ok.marks.length === 4 && JSON.stringify(ok.union) !== JSON.stringify(rest.union) && okCells.k1e71 === 0;
      emit({
        id: 'v8-ok', step: 'ok', pass: okPass, problems: okPass ? [] : ['ok'],
        expect: { marks: 4, subject: 0, unionDiffersFromRest: true },
        actual: {
          union: ok.union, restUnion: rest.union, png: ok.sha256, cells: okCells,
          widgetCallers: callers, widgetSamples, rects, widgetCount: { ...widgetCount },
        },
      });

      phase = 'afon';
      const before = widgetCount.afon || 0;
      armed = true;
      ctx.key('afon', 'down');
      ctx.idle(200);
      const afon = shot('afon');
      ctx.key('afon', 'up');
      ctx.idle(200);
      armed = false;
      const afonCells = cells();
      emit({
        id: 'v8-afon', step: 'afon', pass: afonCells.k1e71 === 0 && ctx.s.screen() === 'shooting',
        problems: [afonCells.k1e71 === 0 ? null : 'subject', ctx.s.screen() === 'shooting' ? null : 'screen'].filter(Boolean),
        expect: { subject: 0, screen: 'shooting' },
        actual: {
          unionSameAsOk: JSON.stringify(afon.union) === JSON.stringify(ok.union),
          union: afon.union, png: afon.sha256,
          widgetEntriesDuringAfon: (widgetCount.afon || 0) - before,
          widgetCount: { ...widgetCount },
        },
      });
    },
  });
  emit({
    id: 'v8-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: result.ok, failed: result.failed },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v8-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
