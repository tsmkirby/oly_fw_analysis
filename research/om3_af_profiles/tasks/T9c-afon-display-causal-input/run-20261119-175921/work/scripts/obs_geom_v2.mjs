// Version 2 of 6. Geometry. One emulator process, two stock sessions.
// Session field: who writes object+0x364 while the getter returns 412.
// Session zone: All against Small on the direct screen. Which inputs change,
// and whether the grey pixels change. EMULATOR-ONLY test-setup write in
// session field only. No display change.
// OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_geom_v2.mjs om-emu
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
  process.stderr.write('usage: node26 work/scripts/obs_geom_v2.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const XSTORE = 0x611852e9;
const YSTORE = 0x61185307;
const DIV = 0x611851e9;
const FIELD = 0x62c544bc;
const FIELD_U = 0xa2c544bc;
const OUT = resolve('work/out/obs-geom-v2.jsonl');
const lines = [];
const hex = (v) => '0x' + (v >>> 0).toString(16);
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};

function u16(sim, addr) {
  const b = sim.read(addr >>> 0, 2);
  return b[0] | (b[1] << 8);
}
function u32(sim, addr) {
  const b = sim.read(addr >>> 0, 4);
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}

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
  let pixels = 0;
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
      pixels += n;
      if (n >= 15 && n <= 400) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  if (!marks.length) return { marks, pixels, union: null };
  const x = Math.min(...marks.map((m) => m.x));
  const y = Math.min(...marks.map((m) => m.y));
  return {
    marks, pixels,
    union: { x, y, w: Math.max(...marks.map((m) => m.x + m.w)) - x, h: Math.max(...marks.map((m) => m.y + m.h)) - y, n: marks.length },
  };
}

const state = { on: false, m: null, sim: null, xs: [], ys: [], divs: [], stores: [] };

function sample(sp, d1) {
  const sim = state.sim;
  const obj = u32(sim, sp + 0x48);
  return {
    d1,
    pointX: u16(sim, sp + 0x9e),
    pointY: u16(sim, sp + 0x9c),
    sizeX: u32(sim, sp + 0xc0),
    sizeY: u32(sim, sp + 0xc4),
    c8: sim.read(sp + 0xc8, 1)[0],
    c9: sim.read(sp + 0xc9, 1)[0],
    cc: u16(sim, sp + 0xcc),
    ce: u16(sim, sp + 0xce),
    d0h: u16(sim, sp + 0xd0),
    d2h: u16(sim, sp + 0xd2),
    s78: u32(sim, sp + 0x78),
    s6c: u32(sim, sp + 0x6c),
    s34: u32(sim, sp + 0x34),
    obj: hex(obj),
    word: u32(sim, (obj + 0x364) >>> 0),
  };
}

function onProbe(pc) {
  if (!state.on || !state.m) return;
  const r = state.m.getRegs();
  const sp = r[8] >>> 0;
  if (pc === DIV && state.divs.length < 4) {
    state.divs.push({ d0: r[0] & 0xffff, d1: r[1] & 0xffff, d2: r[2] >>> 0 });
    return;
  }
  if ((pc === XSTORE || pc === YSTORE) && state.xs.length + state.ys.length < 8) {
    const row = sample(sp, r[1] & 0xffff);
    if (pc === XSTORE) state.xs.push(row);
    else state.ys.push(row);
  }
}

function onWatch(rec) {
  if (!state.on || state.stores.length >= 12) return;
  state.stores.push({ pc: hex(rec.pc >>> 0), addr: hex(rec.addr >>> 0), value: rec.value >>> 0, size: rec.size, insns: rec.insns });
}

function arm(ctx) {
  state.m = ctx.l.sim.m;
  state.sim = ctx.l.sim;
  state.on = true;
  state.xs = [];
  state.ys = [];
  state.divs = [];
  state.stores = [];
  setProbes([XSTORE, YSTORE, DIV], onProbe);
  setWatchpoints([
    { id: 'field', lo: FIELD, hi: FIELD + 4, kind: 2, stop: false },
    { id: 'fieldu', lo: FIELD_U, hi: FIELD_U + 4, kind: 2, stop: false },
  ], { stop() {}, log: onWatch });
}
function disarm() {
  state.on = false;
  setProbes([], null);
  setWatchpoints([], { stop() {}, log() {} });
}

async function boot(ctx, tag) {
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
    const file = resolve('work/out/obs-geom-v2-' + tag + '-' + id + '.png');
    write_png(file, fr[0], fr[1], rgb);
    const g = greyMarks(rgb, fr[0]);
    return {
      sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
      union: g.union, marks: g.marks, pixels: g.pixels,
      subject: readKey(0x1e71, 0),
      k88b2: readKey(0x88b2, 0),
      k84d1: readKey(0x84d1, 0),
      k99a1: readKey(0x99a1, 0),
      k9a41: readKey(0x9a41, 0),
      k1dd1: [readKey(0x1dd1, 0), readKey(0x1dd1, 1)],
      k5962: readKey(0x5962, 0),
    };
  };
  return { readKey, shot };
}

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  emit({ id: 'v2-plan', step: 'plan', pass: true, problems: [], expect: { model: 'E147' }, actual: { modelEnv: 'E147' }, note: 'Version 2 of 6. Geometry word writer, then All against Small. No display change.' });

  const field = await runZone({
    checkout,
    outPath: 'work/out/session-geom-v2-field.jsonl',
    tag: 'geom-v2-field',
    candidate: false,
    fatalShots: true,
    explanation: 'v2 field. Stock. Watch stores of object+0x364 while 0x88b2 becomes 412. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v2-field-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { shot } = await boot(ctx, 'field');
      const rest = shot('rest');
      if (rest.subject !== 0 || rest.k88b2 !== 526) throw new Error('field rest');
      arm(ctx);
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      ctx.idle(500);
      const stores = state.stores.slice();
      const xs = state.xs.slice();
      const ys = state.ys.slice();
      const divs = state.divs.slice();
      disarm();
      const after = shot('after');
      const moved = !!(after.union && rest.union && after.union.x !== rest.union.x);
      emit({
        id: 'v2-field', step: 'field', pass: after.subject === 0 && after.k88b2 === 412 && moved && stores.length > 0,
        problems: [],
        expect: { k88b2: 412, subject: 0, moved: true, stores: '>0' },
        actual: { rest: { union: rest.union, pixels: rest.pixels, marks: rest.marks }, after, stores, xs, ys, divs },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. stores are writes of object 0x62c54158 + 0x364.',
      });
    },
  });

  const zone = await runZone({
    checkout,
    outPath: 'work/out/session-geom-v2-zone.jsonl',
    tag: 'geom-v2-zone',
    candidate: false,
    fatalShots: true,
    explanation: 'v2 zone. Stock direct screen. All, then Small, same centre, then one move. No test-setup cell write. No display change.',
    change: 'none',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v2-zone-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { readKey, shot } = await boot(ctx, 'zone');
      const all = shot('all');
      if (all.subject !== 0 || all.k88b2 !== 526) throw new Error('all');
      ctx.press('up');
      if (ctx.s.screen() !== 'direct') throw new Error('direct ' + ctx.s.screen());
      let sawSingle = false;
      const dials = [];
      for (let i = 0; i < 8; i++) {
        ctx.s.dial_input('main', 1);
        ctx.s.camapp.pump();
        ctx.idle(300);
        const row = {
          detent: i + 1,
          zone0: readKey(0x99a1, 0),
          kind: readKey(0x84d1, 0),
          size: [readKey(0x1dd1, 0), readKey(0x1dd1, 1)],
          frame: readKey(0x88b2, 0),
          pos0: readKey(0x5962, 0),
          k9a41: readKey(0x9a41, 0),
        };
        dials.push(row);
        if (row.size[0] === 1 && row.size[1] === 1) sawSingle = true;
        if (sawSingle && row.size[0] === 3 && row.size[1] === 3) break;
      }
      if (!sawSingle || readKey(0x1dd1, 0) !== 3) throw new Error('small ' + JSON.stringify(dials));
      ctx.press('ok');
      arm(ctx);
      ctx.idle(500);
      const centreStores = state.stores.slice();
      const centreXs = state.xs.slice();
      const centreDivs = state.divs.slice();
      disarm();
      const smallCentre = shot('small-centre');
      ctx.press('up');
      if (ctx.s.screen() !== 'direct') throw new Error('direct2');
      const before = readKey(0x88b2, 0);
      ctx.press('right');
      const movedCell = readKey(0x88b2, 0);
      ctx.press('ok');
      arm(ctx);
      ctx.idle(500);
      const moveStores = state.stores.slice();
      const moveXs = state.xs.slice();
      const moveYs = state.ys.slice();
      const moveDivs = state.divs.slice();
      disarm();
      const smallMove = shot('small-move');
      const pixelsDiffer = all.pixels !== smallCentre.pixels || JSON.stringify(all.marks) !== JSON.stringify(smallCentre.marks);
      emit({
        id: 'v2-zone', step: 'zone', pass: all.subject === 0 && smallCentre.subject === 0 && smallMove.subject === 0,
        problems: [],
        expect: { subject: 0, sawSmall: true },
        actual: {
          all, dials, smallCentre, centreStores, centreXs, centreDivs,
          before, movedCell, smallMove, moveStores, moveXs, moveYs, moveDivs, pixelsDiffer,
        },
        note: 'Native direct-screen keys only. All is the rest frame. Small centre is after the dial and OK, before any right. pixelsDiffer compares All with Small at the centre.',
      });
    },
  });
  emit({
    id: 'v2-done', step: 'done', pass: field.ok && zone.ok, problems: [],
    expect: { ok: true }, actual: { field: field.ok, zone: zone.ok },
  });
  if (!field.ok || !zone.ok) process.exit(1);
} catch (e) {
  try { disarm(); } catch { /* clear */ }
  emit({ id: 'v2-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
