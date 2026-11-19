// T9b experiment version 2. Stock K1.
// Version 1 opened a session and stopped before bring-up: the png module
// path omitted emu/. This run uses emu/checks/lib/png.mjs.
// One EMULATOR-ONLY test-setup write of 0x88b2, traced, then the same write
// again with a watch on the object the first write's paint call named.
// OM_EMU_MODEL=E147 is assigned before any import of emu/src/fw/model.mjs.
// Do not edit after it has run.
// Usage: node26 work/scripts/obs_trace_v2.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_trace_v2.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const OUT = resolve('work/out/obs-trace-v2.jsonl');
const EVENTS = resolve('work/out/obs-trace-v2-events.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const s16 = (v) => { const n = v & 0xffff; return n & 0x8000 ? n - 0x10000 : n; };

const PRIORITY = [
  0x60063431, 0x600634d9, 0x600634e6, 0x600634ee, 0x60063519, 0x60063534, 0x6006354e, 0x6006355e,
  0x60063116, 0x60063197, 0x600631d4, 0x60057501, 0x6005753c, 0x60057541, 0x600575fc, 0x6005760a,
  0x60057667, 0x60056ede, 0x60031521, 0x60031609, 0x600630a3, 0x600630de,
  0x610ee1f8, 0x610ee27c, 0x610ee2a8, 0x610f5713, 0x610eedc5, 0x610eedcb, 0x610eedee, 0x610eee11,
  0x610f66df, 0x610f70c5, 0x610f7106, 0x610f7172, 0x610f6124, 0x610f32c0,
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
    id: 'v2-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 2. EMULATOR-ONLY test-setup write of 0x88b2. Observation only.',
  });
  if (!envPass) process.exit(1);

  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-trace-v2.jsonl',
    tag: 'obs-trace-v2',
    candidate: false,
    fatalShots: true,
    explanation: 'v2 stock K1. Trace the 0x88b2 setter. EMULATOR-ONLY test-setup write only. No display change.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL, IMAGE_BASE } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const modelPass = MODEL === 'E147';
      emit({
        id: 'v2-model', step: 'model', pass: modelPass, problems: modelPass ? [] : ['model'],
        expect: { model: 'E147' }, actual: { model: MODEL, imageBase: hex(IMAGE_BASE) },
        note: 'Read before bring-up and before any key.',
      });
      if (!modelPass) throw new Error('model');
      const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const toImage = (rt) => (rt - 0x50000000 + IMAGE_BASE) >>> 0;
      const priority = new Set(PRIORITY);
      const runtimeProbes = PRIORITY.map((pc) => ctx.native(pc));

      const events = [];
      let capture = false;
      let phase = '';
      let seq = 0;
      let probeKept = 0;
      let probeDropped = 0;
      let storeKept = 0;
      let storeSeen = 0;
      const objects = [];
      const rects = [];
      const INTERESTING = new Set([356, 198, 412, 417, 265, 526, 65, 66, 70, 71, 0x164, 0xc6, 0x20e, 0x19c]);
      const pcsOf = (name) => [...new Set(events.filter((e) => e.phase === name && e.kind === 'pc').map((e) => e.pc))];

      function pushEvent(row) {
        if (events.length >= 4000) return;
        events.push(row);
      }
      function snapRegs() {
        const r = ctx.l.sim.m.getRegs();
        return {
          d0: r[0] >>> 0, d1: r[1] >>> 0, d2: r[2] >>> 0, d3: r[3] >>> 0,
          a0: r[4] >>> 0, a1: r[5] >>> 0, a2: r[6] >>> 0, sp: r[8] >>> 0, mdr: r[11] >>> 0,
        };
      }
      ctx.l.sim.m.setProbes(runtimeProbes, (pc) => {
        if (!capture) return;
        try {
          const img = toImage(pc >>> 0);
          const pri = priority.has(img);
          if (!pri && probeKept >= 500) { probeDropped += 1; return; }
          if (pri && probeKept >= 2500) return;
          probeKept += 1;
          const g = snapRegs();
          const row = {
            n: seq++, phase, kind: 'pc', pc: hex(img),
            d0: g.d0, d1: g.d1, a0: hex(g.a0), a1: hex(g.a1), a2: hex(g.a2),
            sp: hex(g.sp), caller: hex(toImage(g.mdr)),
          };
          if (img === 0x610ee1f8 || img === 0x610eedc5 || img === 0x610eedcb) {
            if (objects.length < 24) objects.push({ phase, pc: hex(img), a0: g.a0, d0: g.d0 & 0xffff, d1: g.d1 & 0xffff, a1: g.a1 & 0xffff, slot: hex((g.sp + 0x26) >>> 0) });
          }
          pushEvent(row);
        } catch (e) {
          pushEvent({ n: seq++, phase, kind: 'pc-error', error: String(e.message || e) });
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
            if (storeKept >= 1800) return;
            try {
              const img = toImage(rec.pc >>> 0);
              const priPc = (img >= 0x60063000 && img < 0x60064000)
                || (img >= 0x610ee000 && img < 0x610f0200)
                || (img >= 0x610f3000 && img < 0x610f8300)
                || (img >= 0x60057400 && img < 0x60057800);
              const v = rec.value >>> 0;
              const interesting = INTERESTING.has(v & 0xffff) || INTERESTING.has(v);
              if (!priPc && !interesting) return;
              storeKept += 1;
              const g = snapRegs();
              pushEvent({
                n: seq++, phase, kind: 'store', pc: hex(img), addr: hex(rec.addr >>> 0),
                size: rec.size, value: v, caller: hex(toImage(g.mdr)),
              });
            } catch (e) {
              pushEvent({ n: seq++, phase, kind: 'store-error', error: String(e.message || e) });
            }
          },
        });
      }
      function clearDebug() {
        capture = false;
        try { ctx.l.sim.m.setWatchpoints([]); } catch { /* already clear */ }
      }

      const rectWrap = ctx.l.wrap(menu.GPI_DRAW_RECT, (prev) => (hle, r) => {
        if (capture && rects.length < 24) {
          try {
            const [h, colour, layer] = ctx.l.stack_args(r, 3);
            const hit = {
              phase, x: menu.s16(r.d0), y: menu.s16(r.d1), w: menu.s16(r.a1), h: s16(h),
              colour: colour >>> 0, layer: layer & 0xffff, caller: hex(toImage(r.mdr >>> 0)),
            };
            const frameLike = hit.colour === 22 && ((hit.w <= 8 && hit.h >= 20) || (hit.h <= 8 && hit.w >= 20));
            if (frameLike && hit.x >= 250 && hit.x <= 750) rects.push(hit);
          } catch (e) { rects.push({ phase, error: String(e.message || e) }); }
        }
        prev(hle, r);
      }, 'obs-t9b-rect-v2');
      void rectWrap;

      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }
      function shot(id) {
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed at ' + id);
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/obs-trace-v2-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const marks = greyMarks(rgb, fr[0]);
        return { sha256: createHash('sha256').update(readFileSync(file)).digest('hex'), marks, union: unionOf(marks) };
      }
      function flags() {
        const b = (a) => ctx.l.sim.read(a, 1)[0];
        return { faad: b(0x6036faad), faac: b(0x6036faac), dirty: b(0xa32bfb32), gate: ctx.l.sim.u32(0x8050) >>> 0 };
      }
      function dumpObject(addr) {
        if (!addr) return null;
        try {
          const raw = Array.from(ctx.l.sim.read((addr + 0x1f0) >>> 0, 0x30));
          const half = (off) => raw[off] | (raw[off + 1] << 8);
          return {
            addr: hex(addr),
            at1fc: [half(0x0c), half(0x0e), half(0x10), half(0x12), half(0x14), half(0x16), half(0x18), half(0x1a), half(0x1c), half(0x1e)],
          };
        } catch (e) {
          return { addr: hex(addr), error: String(e.message || e) };
        }
      }

      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(ctx.native(SET_API), { d0: 289, d1: argument }, null, null, 200000);
      ctx.idle(150);
      const subject = readKey(0x1e71, 0);
      const before = { k88b2: readKey(0x88b2, 0), k5962: readKey(0x5962, 0), subject, flags: flags() };
      const rest = shot('rest');
      const ready = subject === 0 && before.k88b2 === 526 && before.k5962 === 526 && rest.marks.length === 4;
      emit({
        id: 'v2-rest', step: 'rest', pass: ready, problems: ready ? [] : ['rest'],
        expect: { subject: 0, k88b2: 526, k5962: 526, marks: 4 },
        actual: { cells: before, union: rest.union, marks: rest.marks, png: rest.sha256, probes: runtimeProbes.length },
      });
      if (!ready) throw new Error('rest');

      const flagRanges = [
        { lo: 0x6036faa0, hi: 0x6036fac0 },
        { lo: 0xa036faa0, hi: 0xa036fac0 },
        { lo: 0xa32bf900, hi: 0xa32bfc00 },
        { lo: 0x632bf900, hi: 0x632bfc00 },
        { lo: 0xa32a7b00, hi: 0xa32a8200 },
        { lo: 0x632a7b00, hi: 0x632a8200 },
      ];
      armWatch(flagRanges);
      phase = 'find';
      capture = true;
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      capture = false;
      clearDebug();
      const afterFind = { k88b2: readKey(0x88b2, 0), k5962: readKey(0x5962, 0), subject: readKey(0x1e71, 0), flags: flags() };
      const found = shot('find');
      const findPass = afterFind.k88b2 === 412 && afterFind.k5962 === 526 && afterFind.subject === 0;
      const objectAddrs = [...new Set(objects.filter((o) => o.phase === 'find' && o.pc === '0x610ee1f8').map((o) => o.a0))];
      const dumps = objectAddrs.slice(0, 4).map(dumpObject);
      emit({
        id: 'v2-find', step: 'find', pass: findPass, problems: findPass ? [] : ['readback'],
        expect: { k88b2: 412, k5962: 526, subject: 0 },
        actual: {
          cells: afterFind, union: found.union, restUnion: rest.union, png: found.sha256,
          marks: found.marks, objects: objects.filter((o) => o.phase === 'find'), dumps,
          rects: rects.filter((r) => r.phase === 'find'), pcs: pcsOf('find'),
          probeKept, probeDropped, storeKept, storeSeen,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. Discovery pass.',
      });
      if (!findPass) throw new Error('find readback');

      probeKept = 0;
      probeDropped = 0;
      storeKept = 0;
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 526 }, null, null, 200000);
      const back = readKey(0x88b2, 0);
      if (back !== 526) throw new Error('restore ' + back);

      const watch = flagRanges.slice();
      const target = objectAddrs[0] || 0;
      if (target) {
        const lo = (target + 0x1e0) >>> 0;
        const hi = (target + 0x230) >>> 0;
        watch.push({ lo, hi });
        if (target >= 0x60000000 && target < 0x80000000) watch.push({ lo: (lo + 0x40000000) >>> 0, hi: (hi + 0x40000000) >>> 0 });
        if (target >= 0xa0000000) watch.push({ lo: (lo - 0x40000000) >>> 0, hi: (hi - 0x40000000) >>> 0 });
      }
      armWatch(watch);
      phase = 'trace';
      capture = true;
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      capture = false;
      clearDebug();
      try { ctx.l.sim.m.setProbes([], null); } catch { /* clear */ }
      const after = { k88b2: readKey(0x88b2, 0), k5962: readKey(0x5962, 0), subject: readKey(0x1e71, 0), flags: flags() };
      const moved = shot('trace');
      const tracePass = after.k88b2 === 412 && after.k5962 === 526 && after.subject === 0;
      const traceObjects = objects.filter((o) => o.phase === 'trace');
      emit({
        id: 'v2-trace', step: 'trace', pass: tracePass, problems: tracePass ? [] : ['readback'],
        expect: { k88b2: 412, k5962: 526, subject: 0 },
        actual: {
          cells: after, union: moved.union, png: moved.sha256, marks: moved.marks,
          watched: target ? hex(target) : null, watchCount: watch.length,
          objects: traceObjects.slice(0, 16), objectCount: traceObjects.length,
          rects: rects.filter((r) => r.phase === 'trace'), pcs: pcsOf('trace'),
          probeKept, probeDropped, storeKept, storeSeen, eventCount: events.length,
          dumps: (traceObjects.find((o) => o.pc === '0x610ee1f8') ? [dumpObject(traceObjects.find((o) => o.pc === '0x610ee1f8').a0)] : dumps),
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. Chronological trace.',
      });
      writeFileSync(EVENTS, events.map((e) => JSON.stringify(e)).join('\n') + (events.length ? '\n' : ''));
      if (!tracePass) throw new Error('trace readback');
    },
  });
  emit({
    id: 'v2-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: result.ok, failed: result.failed },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v2-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
