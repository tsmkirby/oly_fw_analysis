// T9b experiment version 4. Stock K1. Observation only.
// Versions 1 and 2 stopped before the write. Version 3 wrote 0x88b2 and the
// cell read back, but the probes used the flash view. Code runs at the image
// base, so this run probes those image addresses, through the setter call and
// the following idle. OM_EMU_MODEL=E147 is set before model.mjs is imported.
// EMULATOR-ONLY test-setup write of 0x88b2 only. Do not edit after it has run.
// Usage: node26 work/scripts/obs_trace_v4.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_trace_v4.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const OUT = resolve('work/out/obs-trace-v4.jsonl');
const EVENTS = resolve('work/out/obs-trace-v4-events.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const s16 = (v) => { const n = v & 0xffff; return n & 0x8000 ? n - 0x10000 : n; };

const SITES = [
  0x60063431, 0x600634d9, 0x600634e6, 0x600634ee, 0x60063534, 0x6006355e,
  0x60063116, 0x60057501, 0x6005753c, 0x60057541, 0x600575fc, 0x6005760a, 0x60057667,
  0x60056ede, 0x600630a3, 0x600630de, 0x610ee1f8, 0x610ee27c, 0x610ee2a8,
  0x610f5713, 0x610eedc5, 0x610eedcb, 0x610eedee, 0x610eee11, 0x610f66df,
  0x610f70c5, 0x610f7106, 0x610f7172, 0x610f6124, 0x610f32c0,
];

function greyMarks(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => {
    const i = (y * w + x) * 3;
    const hi = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]);
    const lo = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]);
    return lo >= 18 && hi <= 60 && hi - lo <= 12;
  };
  const marks = [];
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
      if (n >= 15 && n <= 400) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return marks;
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
    id: 'v4-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 4. Probes are image addresses. EMULATOR-ONLY test-setup write only.',
  });
  if (!envPass) process.exit(1);

  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-trace-v4.jsonl',
    tag: 'obs-trace-v4',
    candidate: false,
    fatalShots: true,
    explanation: 'v4 stock K1. Trace the 0x88b2 setter at image addresses, including the idle after the call. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL, IMAGE_BASE, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const modelPass = MODEL === 'E147';
      emit({
        id: 'v4-model', step: 'model', pass: modelPass, problems: modelPass ? [] : ['model'],
        expect: { model: 'E147' }, actual: { model: MODEL, imageBase: hex(IMAGE_BASE) },
        note: 'Read before bring-up and before any key.',
      });
      if (!modelPass) throw new Error('model');
      const API_SET = A(SET_API);
      const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);

      const counts = new Map();
      const samples = [];
      const stores = [];
      const rects = [];
      const objects = [];
      let capture = false;
      let phase = '';
      let storeSeen = 0;

      function snap() {
        const r = ctx.l.sim.m.getRegs();
        return {
          d0: r[0] >>> 0, d1: r[1] >>> 0, a0: r[4] >>> 0, a1: r[5] >>> 0, a2: r[6] >>> 0,
          sp: r[8] >>> 0, mdr: r[11] >>> 0,
        };
      }
      ctx.l.sim.m.setProbes(SITES, (pc) => {
        if (!capture) return;
        const img = pc >>> 0;
        const key = phase + ' ' + hex(img);
        counts.set(key, (counts.get(key) || 0) + 1);
        const seen = counts.get(key);
        if (seen > 4 || samples.length >= 240) return;
        try {
          const g = snap();
          const row = {
            phase, pc: hex(img), d0: g.d0 & 0xffff, d1: g.d1 & 0xffff,
            a0: hex(g.a0), a1: hex(g.a1), a2: hex(g.a2), sp: hex(g.sp), caller: hex(g.mdr),
          };
          if (img === 0x610ee1f8 && objects.length < 8) {
            let fields = null;
            try {
              const raw = ctx.l.sim.read((g.a0 + 0x20c) >>> 0, 8);
              fields = [raw[0] | (raw[1] << 8), raw[2] | (raw[3] << 8), raw[4] | (raw[5] << 8), raw[6] | (raw[7] << 8)];
            } catch (e) { fields = String(e.message || e); }
            objects.push({ phase, a0: g.a0, fields, caller: hex(g.mdr) });
          }
          if (img === 0x610eedcb && objects.length < 16) {
            objects.push({ phase, pc: hex(img), d0: g.d0 & 0xffff, d1: g.d1 & 0xffff, a1: g.a1 & 0xffff, slot: hex((g.sp + 0x26) >>> 0), caller: hex(g.mdr) });
          }
          samples.push(row);
        } catch (e) {
          samples.push({ phase, pc: hex(img), error: String(e.message || e) });
        }
      });

      function armWatch(ranges) {
        storeSeen = 0;
        ctx.l.sim.m.setWatchpoints(ranges.map((range, n) => ({
          id: n + 1, lo: range.lo >>> 0, hi: range.hi >>> 0, kind: 2, stop: false,
        })), {
          onLog(rec) {
            if (!capture) return;
            storeSeen += 1;
            if (stores.length >= 500) return;
            stores.push({
              phase, pc: hex(rec.pc >>> 0), addr: hex(rec.addr >>> 0), size: rec.size, value: rec.value >>> 0,
            });
          },
        });
      }
      const flagRanges = [
        { lo: 0x6036faa0, hi: 0x6036fac0 },
        { lo: 0xa036faa0, hi: 0xa036fac0 },
        { lo: 0xa32bf900, hi: 0xa32bfc00 },
        { lo: 0x632bf900, hi: 0x632bfc00 },
      ];

      ctx.l.wrap(menu.GPI_DRAW_RECT, (prev) => (hle, r) => {
        if (capture && rects.length < 16) {
          try {
            const [h, colour, layer] = ctx.l.stack_args(r, 3);
            const hit = {
              phase, x: menu.s16(r.d0), y: menu.s16(r.d1), w: menu.s16(r.a1), h: s16(h),
              colour: colour >>> 0, layer: layer & 0xffff, caller: hex(r.mdr >>> 0),
            };
            const frameLike = hit.colour === 22 && ((hit.w <= 8 && hit.h >= 20) || (hit.h <= 8 && hit.w >= 20));
            if (frameLike && hit.x >= 250 && hit.x <= 750) rects.push(hit);
          } catch (e) { rects.push({ phase, error: String(e.message || e) }); }
        }
        prev(hle, r);
      }, 'obs-t9b-rect-v4');

      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }
      function shot(id) {
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed at ' + id);
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/obs-trace-v4-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const marks = greyMarks(rgb, fr[0]);
        return { sha256: createHash('sha256').update(readFileSync(file)).digest('hex'), marks, union: unionOf(marks) };
      }
      function flags() {
        const b = (a) => ctx.l.sim.read(a, 1)[0];
        return { faad: b(0x6036faad), faac: b(0x6036faac), dirty: b(0xa32bfb32), gate: ctx.l.sim.u32(0x8050) >>> 0 };
      }
      const countObj = () => Object.fromEntries(counts);

      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
      ctx.idle(150);
      const subject = readKey(0x1e71, 0);
      const before = { k88b2: readKey(0x88b2, 0), k5962: readKey(0x5962, 0), subject, flags: flags() };
      const rest = shot('rest');
      const ready = subject === 0 && before.k88b2 === 526 && before.k5962 === 526 && rest.marks.length === 4;
      emit({
        id: 'v4-rest', step: 'rest', pass: ready, problems: ready ? [] : ['rest'],
        expect: { subject: 0, k88b2: 526, k5962: 526, marks: 4 },
        actual: { cells: before, union: rest.union, png: rest.sha256 },
      });
      if (!ready) throw new Error('rest');

      armWatch(flagRanges);
      phase = 'call';
      capture = true;
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      capture = false;
      const mid = { k88b2: readKey(0x88b2, 0), flags: flags() };
      phase = 'idle';
      capture = true;
      ctx.idle(500);
      capture = false;
      const afterCells = { k88b2: readKey(0x88b2, 0), k5962: readKey(0x5962, 0), subject: readKey(0x1e71, 0), flags: flags() };
      phase = 'shot';
      capture = true;
      const moved = shot('after');
      capture = false;
      try { ctx.l.sim.m.setWatchpoints([]); } catch { /* clear */ }
      const after = { ...afterCells, mid };
      const readPass = after.k88b2 === 412 && after.k5962 === 526 && after.subject === 0;
      const paint = objects.filter((o) => o.a0);
      emit({
        id: 'v4-after', step: 'after', pass: readPass, problems: readPass ? [] : ['readback'],
        expect: { k88b2: 412, k5962: 526, subject: 0 },
        actual: {
          cells: after, union: moved.union, restUnion: rest.union, png: moved.sha256,
          marksMoved: JSON.stringify(moved.union) !== JSON.stringify(rest.union),
          counts: countObj(), samples, objects, rects, stores, storeSeen,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. marksMoved is the measurement. The pass bit is the readback.',
      });
      if (!readPass) throw new Error('readback');

      const target = paint.length ? paint[0].a0 : 0;
      if (target) {
        capture = false;
        ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 526 }, null, null, 200000);
        ctx.idle(200);
        const back = readKey(0x88b2, 0);
        stores.length = 0;
        const lo = (target + 0x1e0) >>> 0;
        const hi = (target + 0x230) >>> 0;
        const watch = flagRanges.slice();
        watch.push({ lo, hi });
        if (target < 0x80000000) watch.push({ lo: (lo + 0x40000000) >>> 0, hi: (hi + 0x40000000) >>> 0 });
        armWatch(watch);
        phase = 'rewrite';
        capture = true;
        ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
        phase = 'rewrite-idle';
        ctx.idle(500);
        capture = false;
        try { ctx.l.sim.m.setWatchpoints([]); } catch { /* clear */ }
        try { ctx.l.sim.m.setProbes([], null); } catch { /* clear */ }
        const again = shot('rewrite');
        emit({
          id: 'v4-rewrite', step: 'rewrite', pass: readKey(0x88b2, 0) === 412 && back === 526, problems: [],
          expect: { restored: 526, rewritten: 412 },
          actual: {
            restored: back, rewritten: readKey(0x88b2, 0), watched: hex(target),
            union: again.union, counts: countObj(),
            rewriteStores: stores.filter((s) => s.phase === 'rewrite' || s.phase === 'rewrite-idle').slice(0, 80),
            storeSeen,
          },
          note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. Second write, watched at the object named by the first.',
        });
      } else {
        try { ctx.l.sim.m.setProbes([], null); } catch { /* clear */ }
        emit({
          id: 'v4-rewrite', step: 'rewrite', pass: true, problems: [],
          expect: { object: 'named by 0x610ee1f8' }, actual: { object: null },
          note: 'The paint entry was not entered during the call or the idle. No object watch was installed.',
        });
      }
      writeFileSync(EVENTS, samples.map((e) => JSON.stringify(e)).join('\n') + (samples.length ? '\n' : ''));
    },
  });
  emit({
    id: 'v4-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: result.ok, failed: result.failed },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v4-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
