// T9b experiment version 5. Stock K1. Observation only.
// Version 4: with gate 0x8050 clear, setter 0x60063431 calls 0x600634ee and
// stores the halfword at 0x629526c0, then the dirty byte at 0x6006355e.
// The paint reload at 0x610eedee runs later, in the idle. This run watches
// reads of that cell through the idle and keeps every draw-call coordinate.
// Probes are image addresses. OM_EMU_MODEL=E147 is set before model.mjs.
// EMULATOR-ONLY test-setup write of 0x88b2 only. Do not edit after it has run.
// Usage: node26 work/scripts/obs_trace_v5.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_trace_v5.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const OUT = resolve('work/out/obs-trace-v5.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);

const SITES = [
  0x60063431, 0x600634e6, 0x600634ee, 0x60063534, 0x6006355e,
  0x610eee11, 0x610eedcb, 0x610eedee, 0x610ef459, 0x610ef4d6, 0x610f7172, 0x610f70c5,
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
  if (!marks.length) return null;
  const x = Math.min(...marks.map((m) => m.x));
  const y = Math.min(...marks.map((m) => m.y));
  return { x, y, w: Math.max(...marks.map((m) => m.x + m.w)) - x, h: Math.max(...marks.map((m) => m.y + m.h)) - y, n: marks.length };
}

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'v5-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 5. Watch reads of the cell the setter stored. EMULATOR-ONLY test-setup write only.',
  });
  if (!envPass) process.exit(1);

  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-trace-v5.jsonl',
    tag: 'obs-trace-v5',
    candidate: false,
    fatalShots: true,
    explanation: 'v5 stock K1. After the 0x88b2 store, watch reads of that cell during the idle. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL, IMAGE_BASE, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const modelPass = MODEL === 'E147';
      emit({
        id: 'v5-model', step: 'model', pass: modelPass, problems: modelPass ? [] : ['model'],
        expect: { model: 'E147' }, actual: { model: MODEL, imageBase: hex(IMAGE_BASE) },
        note: 'Read before bring-up and before any key.',
      });
      if (!modelPass) throw new Error('model');
      const API_SET = A(SET_API);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);

      const counts = new Map();
      const draws = [];
      const callers = [];
      const reads = new Map();
      let cell = null;
      let capture = false;
      let phase = '';
      let readSeen = 0;

      ctx.l.sim.m.setProbes(SITES, (pc) => {
        if (!capture) return;
        const img = pc >>> 0;
        const key = phase + ' ' + hex(img);
        counts.set(key, (counts.get(key) || 0) + 1);
        try {
          const r = ctx.l.sim.m.getRegs();
          const d0 = r[0] & 0xffff;
          const d1 = r[1] & 0xffff;
          const a0 = r[4] >>> 0;
          const a2 = r[6] >>> 0;
          const mdr = r[11] >>> 0;
          if (img === 0x60063534 && phase === 'call') cell = { cached: a2, uncached: a0, value: d1 };
          if ((img === 0x610eee11 || img === 0x610eedcb) && draws.length < 24) {
            draws.push({ phase, pc: hex(img), d0, d1, a0: hex(a0), a1: hex(r[5] >>> 0), caller: hex(mdr) });
          }
          if (img === 0x610ef4d6 && callers.length < 12) {
            callers.push({ phase, d0, d1, a0: hex(a0), a3: hex(r[7] >>> 0), caller: hex(mdr) });
          }
        } catch { /* keep the count */ }
      });

      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }
      function shot(id) {
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed at ' + id);
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/obs-trace-v5-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        return { sha256: createHash('sha256').update(readFileSync(file)).digest('hex'), union: greyMarks(rgb, fr[0]) };
      }
      function flags() {
        const b = (a) => ctx.l.sim.read(a, 1)[0];
        return { faad: b(0x6036faad), faac: b(0x6036faac), dirty: b(0xa32bfb32), gate: ctx.l.sim.u32(0x8050) >>> 0 };
      }

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
      const ready = subject === 0 && before.k88b2 === 526 && before.k5962 === 526 && rest.union && rest.union.n === 4;
      emit({
        id: 'v5-rest', step: 'rest', pass: ready, problems: ready ? [] : ['rest'],
        expect: { subject: 0, k88b2: 526, k5962: 526, marks: 4 },
        actual: { cells: before, union: rest.union, png: rest.sha256 },
      });
      if (!ready) throw new Error('rest');

      phase = 'call';
      capture = true;
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      capture = false;
      const ranges = [{ lo: 0xa32bfb32, hi: 0xa32bfb33 }];
      if (cell) {
        ranges.push({ lo: cell.cached, hi: (cell.cached + 2) >>> 0 });
        ranges.push({ lo: cell.uncached, hi: (cell.uncached + 2) >>> 0 });
      }
      ctx.l.sim.m.setWatchpoints(ranges.map((range, n) => ({
        id: n + 1, lo: range.lo >>> 0, hi: range.hi >>> 0, kind: 1, stop: false,
      })), {
        onLog(rec) {
          if (!capture) return;
          readSeen += 1;
          const pc = rec.pc >>> 0;
          const prev = reads.get(pc);
          if (prev) { prev.n += 1; return; }
          if (reads.size >= 40) return;
          reads.set(pc, { pc: hex(pc), addr: hex(rec.addr >>> 0), size: rec.size, value: rec.value >>> 0, n: 1, phase });
        },
      });
      phase = 'idle';
      capture = true;
      ctx.idle(500);
      capture = false;
      try { ctx.l.sim.m.setWatchpoints([]); } catch { /* clear */ }
      try { ctx.l.sim.m.setProbes([], null); } catch { /* clear */ }
      const after = { k88b2: readKey(0x88b2, 0), k5962: readKey(0x5962, 0), subject: readKey(0x1e71, 0), flags: flags() };
      const moved = shot('after');
      const readPass = after.k88b2 === 412 && after.k5962 === 526 && after.subject === 0;
      emit({
        id: 'v5-after', step: 'after', pass: readPass, problems: readPass ? [] : ['readback'],
        expect: { k88b2: 412, k5962: 526, subject: 0 },
        actual: {
          cells: after, union: moved.union, restUnion: rest.union, png: moved.sha256,
          marksMoved: JSON.stringify(moved.union) !== JSON.stringify(rest.union),
          cell: cell ? { cached: hex(cell.cached), uncached: hex(cell.uncached), value: cell.value } : null,
          counts: Object.fromEntries(counts),
          draws, callers,
          readers: [...reads.values()], readSeen,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. Readers are reads of the stored cell and of dirty 0xa32bfb32 during the idle.',
      });
      if (!readPass) throw new Error('readback');
    },
  });
  emit({
    id: 'v5-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: result.ok, failed: result.failed },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v5-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
