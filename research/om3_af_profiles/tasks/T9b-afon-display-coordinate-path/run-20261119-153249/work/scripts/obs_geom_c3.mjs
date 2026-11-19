// Correction experiment 3 of 6. Observation only.
// During the idle that moves the marks, record every CPU store whose value is a
// frame coordinate. Also record the order of the getter call at 0x603f15d8 and
// the refresh-flag writes. Stock image. One test-setup write of 0x88b2 to 412.
// OM_EMU_MODEL=E147 is set before model.mjs. EMULATOR-ONLY. Do not edit after it has run.
// Usage: node26 work/scripts/obs_geom_c3.mjs om-emu
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
  process.stderr.write('usage: node26 work/scripts/obs_geom_c3.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const GETTER_CALL = 0x603f15d8;
const FLAG_CLEAR = 0x610f70eb;
const FLAG_SET = 0x610f7172;
const DIRTY = 0x6006355e;
const PROBES = [GETTER_CALL, FLAG_CLEAR, FLAG_SET, DIRTY];
const DRAM = 0x18000000;
const WATCH = [
  { id: 1, lo: 0x60000000, hi: (0x60000000 + DRAM) >>> 0, kind: 2, stop: false },
  { id: 2, lo: 0xa0000000, hi: (0xa0000000 + DRAM) >>> 0, kind: 2, stop: false },
];
const PRIMARY = new Set([356, 198, 417, 265, 402, 464]);
const OUT = resolve('work/out/obs-geom-c3.jsonl');
const HITS = resolve('work/out/obs-geom-c3-hits.json');
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
  hits: [],
  events: [],
  getter: 0,
  flagSet: 0,
  flagClear: 0,
  dirty: 0,
};

const HOOKS = { stop() {}, log(rec) { onStore(rec); } };

function onStore(rec) {
  if (!state.on) return;
  state.seen += 1;
  if (rec.size < 2 || state.hits.length >= 80) return;
  const v = rec.value >>> 0;
  const lo = v & 0xffff;
  const hi = rec.size === 4 ? (v >>> 16) & 0xffff : 0;
  if (!PRIMARY.has(lo) && !PRIMARY.has(hi)) return;
  state.hits.push({
    pc: hex(rec.pc), addr: hex(rec.addr), n: rec.size, v,
    lo, hi, insns: S.insns,
  });
  writeFileSync(HITS, JSON.stringify({ seen: state.seen, hits: state.hits }));
}

function onProbe(pc) {
  if (!state.on || state.events.length >= 60) {
    if (pc === GETTER_CALL) state.getter += 1;
    else if (pc === FLAG_SET) state.flagSet += 1;
    else if (pc === FLAG_CLEAR) state.flagClear += 1;
    else if (pc === DIRTY) state.dirty += 1;
    return;
  }
  const r = state.m.getRegs();
  const row = { pc: hex(pc), d0: r[0] >>> 0, d1: r[1] >>> 0, mdr: hex(r[11] >>> 0), insns: S.insns };
  if (pc === GETTER_CALL) { state.getter += 1; row.kind = 'getter'; }
  else if (pc === FLAG_SET) { state.flagSet += 1; row.kind = 'flag-set'; }
  else if (pc === FLAG_CLEAR) { state.flagClear += 1; row.kind = 'flag-clear'; }
  else if (pc === DIRTY) { state.dirty += 1; row.kind = 'dirty'; }
  state.events.push(row);
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
    const file = resolve('work/out/obs-geom-c3-' + id + '.png');
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
    id: 'c3-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Correction experiment 3 of 6. Full-idle search for frame-coordinate stores. No display change.',
  });
  if (!envPass) process.exit(1);
  const stock = await runZone({
    checkout,
    outPath: 'work/out/session-obs-geom-c3.jsonl',
    tag: 'obs-geom-c3',
    candidate: false,
    fatalShots: true,
    explanation: 'c3 stock. Search the idle after the 0x88b2 write for stores of the frame coordinates. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'c3-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      state.m = ctx.l.sim.m;
      const { readKey, shot } = await boot(ctx, words_to_rgb, write_png);
      const rest = shot('rest');
      if (rest.subject !== 0 || rest.k88b2 !== 526) throw new Error('rest');
      emit({
        id: 'c3-rest', step: 'rest', pass: true, problems: [],
        expect: { subject: 0, k88b2: 526, union: { x: 417, y: 265, w: 66, h: 70 } },
        actual: { subject: rest.subject, k88b2: rest.k88b2, union: rest.union, sha256: rest.sha256 },
      });
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      if (readKey(0x88b2, 0) !== 412) throw new Error('setter');
      setProbes(PROBES, onProbe);
      setWatchpoints(WATCH, HOOKS);
      state.on = true;
      const t0 = Date.now();
      const i0 = S.insns;
      ctx.idle(500);
      state.on = false;
      setWatchpoints([], HOOKS);
      setProbes([], null);
      const after = shot('after');
      const moved = !!(after.union && (after.union.x !== rest.union.x || after.union.y !== rest.union.y));
      emit({
        id: 'c3-idle', step: 'idle', pass: after.subject === 0 && after.k88b2 === 412,
        problems: [],
        expect: { k88b2: 412, subject: 0 },
        actual: {
          k88b2: after.k88b2, subject: after.subject, union: after.union, sha256: after.sha256, moved,
          stores: state.seen, hits: state.hits, events: state.events,
          getter: state.getter, flagSet: state.flagSet, flagClear: state.flagClear, dirty: state.dirty,
          wallMs: Date.now() - t0, insns: S.insns - i0,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. hits are stores of 356, 198, 417, 265, 402 or 464.',
      });
    },
  });
  emit({
    id: 'c3-done', step: 'done', pass: stock.ok, problems: stock.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: stock.ok, failed: stock.failed, hits: state.hits.length, stores: state.seen },
  });
  if (!stock.ok) process.exit(1);
} catch (e) {
  emit({ id: 'c3-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
