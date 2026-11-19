// Correction experiment 6 of 6. Observation only.
// Name the caller of the origin routine 0x61184e51 during the idle that moves
// the marks, and read dirty byte 0xa32bfb32 at that entry. No display change.
// The AF-ON press does not enter this routine (experiment 5). This run does not
// install a display hook.
// OM_EMU_MODEL=E147 is set before model.mjs. EMULATOR-ONLY.
// Usage: node26 work/scripts/obs_sched_c6.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const { setProbes } = await import(pathToFileURL(resolve('om-emu/emu/src/core/interp.mjs')).href);
const { dbgRead } = await import(pathToFileURL(resolve('om-emu/emu/src/core/mem.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_sched_c6.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const ENTRY = 0x61184e51;
const DIRTY = 0xa32bfb32;
const OUT = resolve('work/out/obs-sched-c6.jsonl');
const lines = [];
const hex = (v) => '0x' + (v >>> 0).toString(16);
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};

function u32(addr) {
  const b = dbgRead(addr >>> 0, 4);
  if (!b) return null;
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}

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

const state = { on: false, m: null, n: 0, hits: [] };

function onProbe(pc) {
  if (!state.on || pc !== ENTRY || state.hits.length >= 4) {
    if (state.on && pc === ENTRY) state.n += 1;
    return;
  }
  state.n += 1;
  const r = state.m.getRegs();
  const sp = r[8] >>> 0;
  const dirty = dbgRead(DIRTY, 1);
  state.hits.push({
    mdr: hex(r[11] >>> 0),
    a0: hex(r[4] >>> 0),
    sp: hex(sp),
    ret10: u32(sp + 0x10) === null ? null : hex(u32(sp + 0x10)),
    dirty: dirty ? dirty[0] : null,
  });
}

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'c6-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Correction experiment 6 of 6. Caller of the origin routine and the dirty byte. No display change.',
  });
  if (!envPass) process.exit(1);
  const stock = await runZone({
    checkout,
    outPath: 'work/out/session-obs-sched-c6.jsonl',
    tag: 'obs-sched-c6',
    candidate: false,
    fatalShots: true,
    explanation: 'c6 stock. Record who calls 0x61184e51 on the idle after the 0x88b2 write, and the dirty byte at that entry. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'c6-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
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
        const file = resolve('work/out/obs-sched-c6-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        return {
          sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
          union: greyUnion(rgb, fr[0]),
          subject: readKey(0x1e71, 0),
          k88b2: readKey(0x88b2, 0),
        };
      };
      state.m = ctx.l.sim.m;
      const rest = shot('rest');
      if (rest.subject !== 0 || rest.k88b2 !== 526) throw new Error('rest');
      const before = dbgRead(DIRTY, 1);
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      const afterSet = dbgRead(DIRTY, 1);
      setProbes([ENTRY], onProbe);
      state.on = true;
      ctx.idle(500);
      state.on = false;
      setProbes([], null);
      const after = shot('after');
      const moved = !!(after.union && rest.union && after.union.x !== rest.union.x);
      emit({
        id: 'c6-idle', step: 'idle', pass: after.subject === 0 && after.k88b2 === 412 && moved && state.n > 0,
        problems: [],
        expect: { subject: 0, k88b2: 412, moved: true },
        actual: {
          subject: after.subject, k88b2: after.k88b2, union: after.union, restUnion: rest.union,
          sha256: after.sha256, moved, entries: state.n, hits: state.hits,
          dirtyBefore: before ? before[0] : null, dirtyAfterSet: afterSet ? afterSet[0] : null,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. hits are entries of 0x61184e51. No display change.',
      });
    },
  });
  emit({
    id: 'c6-done', step: 'done', pass: stock.ok, problems: stock.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: stock.ok, failed: stock.failed, entries: state.n },
  });
  if (!stock.ok) process.exit(1);
} catch (e) {
  emit({ id: 'c6-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
