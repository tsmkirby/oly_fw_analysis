// Correction experiment 4 of 6. Observation only.
// The experiment-3 cap filled with stores of the resting coordinates 417 and 265.
// This run keeps only stores whose entire value is 356 or 198, and every store
// into the object that received 417,265 at 0x62bd71ec. Stock image. One test-setup
// write of 0x88b2 to 412. OM_EMU_MODEL=E147 before model.mjs. EMULATOR-ONLY.
// Usage: node26 work/scripts/obs_geom_c4.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const { setProbes } = await import(pathToFileURL(resolve('om-emu/emu/src/core/interp.mjs')).href);
const { setWatchpoints } = await import(pathToFileURL(resolve('om-emu/emu/src/core/mem.mjs')).href);
const { S } = await import(pathToFileURL(resolve('om-emu/emu/src/core/cpu.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_geom_c4.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const WRITER = 0x610deb9d;
const PROBES = [WRITER];
const DRAM = 0x18000000;
const WATCH = [
  { id: 1, lo: 0x60000000, hi: (0x60000000 + DRAM) >>> 0, kind: 2, stop: false },
  { id: 2, lo: 0xa0000000, hi: (0xa0000000 + DRAM) >>> 0, kind: 2, stop: false },
];
const OBJ_LO = 0x62bd71c0;
const OBJ_HI = 0x62bd7300;
const OUT = resolve('work/out/obs-geom-c4.jsonl');
const HITS = resolve('work/out/obs-geom-c4-hits.json');
const lines = [];
const hex = (v) => '0x' + (v >>> 0).toString(16);
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};

function greyUnion(rgb, w) {
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
      if (n >= 15 && n <= 400) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
    }
  }
  if (!marks.length) return null;
  const x = Math.min(...marks.map((m) => m.x));
  const y = Math.min(...marks.map((m) => m.y));
  return { x, y, w: Math.max(...marks.map((m) => m.x + m.w)) - x, h: Math.max(...marks.map((m) => m.y + m.h)) - y, n: marks.length };
}

const state = {
  on: false,
  m: null,
  seen: 0,
  n356: 0,
  n198: 0,
  hits: [],
  obj: [],
  writer: [],
  writerN: 0,
};

const HOOKS = { stop() {}, log(rec) { onStore(rec); } };

function onStore(rec) {
  if (!state.on) return;
  state.seen += 1;
  const addr = rec.addr >>> 0;
  const v = rec.value >>> 0;
  if (v === 356) state.n356 += 1;
  if (v === 198) state.n198 += 1;
  if ((v === 356 || v === 198) && state.hits.length < 40) {
    state.hits.push({ pc: hex(rec.pc), addr: hex(addr), n: rec.size, v, insns: S.insns });
  }
  if (addr >= OBJ_LO && addr < OBJ_HI && state.obj.length < 40) {
    state.obj.push({ pc: hex(rec.pc), addr: hex(addr), n: rec.size, v, insns: S.insns });
  }
  if ((state.n356 + state.n198 + state.obj.length) % 8 === 0) {
    writeFileSync(HITS, JSON.stringify({ seen: state.seen, n356: state.n356, n198: state.n198, hits: state.hits, obj: state.obj }));
  }
}

function onProbe(pc) {
  if (!state.on || pc !== WRITER) return;
  state.writerN += 1;
  if (state.writer.length >= 8) return;
  const r = state.m.getRegs();
  state.writer.push({
    pc: hex(pc), d0: r[0] >>> 0, d1: r[1] >>> 0, d2: r[2] >>> 0, d3: r[3] >>> 0,
    a0: hex(r[4] >>> 0), a1: hex(r[5] >>> 0), a2: hex(r[6] >>> 0), sp: hex(r[8] >>> 0),
    mdr: hex(r[11] >>> 0), insns: S.insns,
  });
}

async function boot(ctx, words_to_rgb, write_png) {
  const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
  ctx.bringUp();
  ctx.s.switch_input('lever', 1);
  ctx.s.camapp.pump();
  ctx.idle(250);
  const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
  ctx.l.call(A(SET_API), { d0: 289, d1: argument }, null, null, 200000);
  ctx.idle(150);
  const readKey = (key, index) => ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
  const shot = (id) => {
    const fr = ctx.s.frame('boundary');
    if (!fr) throw new Error('screenshot failed at ' + id);
    const rgb = words_to_rgb(fr[2]);
    const file = resolve('work/out/obs-geom-c4-' + id + '.png');
    write_png(file, fr[0], fr[1], rgb);
    return {
      sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
      union: greyUnion(rgb, fr[0]),
      subject: readKey(0x1e71, 0),
      k88b2: readKey(0x88b2, 0),
    };
  };
  return { readKey, shot };
}

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'c4-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Correction experiment 4 of 6. Stores of the exact values 356 and 198, plus the object at 0x62bd71ec. No display change.',
  });
  if (!envPass) process.exit(1);
  const stock = await runZone({
    checkout,
    outPath: 'work/out/session-obs-geom-c4.jsonl',
    tag: 'obs-geom-c4',
    candidate: false,
    fatalShots: true,
    explanation: 'c4 stock. Find who stores 356 and 198 after the 0x88b2 write, and what is written at 0x62bd71ec. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'c4-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      state.m = ctx.l.sim.m;
      const { readKey, shot } = await boot(ctx, words_to_rgb, write_png);
      const rest = shot('rest');
      if (rest.subject !== 0 || rest.k88b2 !== 526) throw new Error('rest');
      emit({
        id: 'c4-rest', step: 'rest', pass: true, problems: [],
        expect: { subject: 0, k88b2: 526, union: { x: 417, y: 265, w: 66, h: 70 } },
        actual: { subject: rest.subject, k88b2: rest.k88b2, union: rest.union, sha256: rest.sha256 },
      });
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      if (readKey(0x88b2, 0) !== 412) throw new Error('setter');
      setProbes(PROBES, onProbe);
      setWatchpoints(WATCH, HOOKS);
      state.on = true;
      const t0 = Date.now();
      ctx.idle(500);
      state.on = false;
      setWatchpoints([], HOOKS);
      setProbes([], null);
      const after = shot('after');
      const moved = !!(after.union && rest.union && (after.union.x !== rest.union.x || after.union.y !== rest.union.y));
      emit({
        id: 'c4-idle', step: 'idle', pass: after.subject === 0 && after.k88b2 === 412 && moved,
        problems: [],
        expect: { k88b2: 412, subject: 0, moved: true, union: { x: 356, y: 198, w: 65, h: 71 } },
        actual: {
          k88b2: after.k88b2, subject: after.subject, union: after.union, sha256: after.sha256, moved,
          stores: state.seen, n356: state.n356, n198: state.n198,
          hits: state.hits, obj: state.obj, writer: state.writer, writerN: state.writerN,
          wallMs: Date.now() - t0,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. hits are stores whose whole value is 356 or 198. obj is every store into 0x62bd71c0-0x62bd7300.',
      });
    },
  });
  emit({
    id: 'c4-done', step: 'done', pass: stock.ok, problems: stock.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: stock.ok, failed: stock.failed, n356: state.n356, n198: state.n198, writerN: state.writerN },
  });
  if (!stock.ok) process.exit(1);
} catch (e) {
  emit({ id: 'c4-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
