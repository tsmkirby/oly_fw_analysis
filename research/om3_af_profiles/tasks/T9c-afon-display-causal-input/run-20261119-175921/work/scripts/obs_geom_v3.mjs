// Version 3 of 6. Two stock sessions, one test setup each.
// Session word: cell stays 526. Call 0x6041935b returns 409 for d0=0x88b2.
//   Records whether object+0x364 tracks that return, and the resulting marks.
// Session zone: Small (stock rest) against All (the T6 half-press All cells).
//   Records which writer inputs change and whether the grey pixels change.
// No display change. OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_geom_v3.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const { setProbes } = await import(pathToFileURL(resolve('om-emu/emu/src/core/interp.mjs')).href);
const { setWatchpoints } = await import(pathToFileURL(resolve('om-emu/emu/src/core/mem.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_geom_v3.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const CALL = 0x6041935b;
const ENTRY = 0x61184dd6;
const DIV = 0x611851e9;
const XSTORE = 0x611852e9;
const FIELD = 0x62c544bc;
const OUT = resolve('work/out/obs-geom-v3.jsonl');
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
  let n31 = 0;
  let n11 = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3;
      if (rgb[i] === 31 && rgb[i + 1] === 31 && rgb[i + 2] === 31) n31 += 1;
      if (rgb[i] === 11 && rgb[i + 1] === 11 && rgb[i + 2] === 11) n11 += 1;
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
  const colour = { n31, n11 };
  if (!marks.length) return { marks, pixels, union: null, colour };
  const x = Math.min(...marks.map((m) => m.x));
  const y = Math.min(...marks.map((m) => m.y));
  return {
    marks, pixels, colour,
    union: { x, y, w: Math.max(...marks.map((m) => m.x + m.w)) - x, h: Math.max(...marks.map((m) => m.y + m.h)) - y, n: marks.length },
  };
}

const state = { on: false, m: null, sim: null, entries: [], xs: [], divs: [], stores: [] };

function onProbe(pc) {
  if (!state.on || !state.m) return;
  const r = state.m.getRegs();
  const sp = r[8] >>> 0;
  const sim = state.sim;
  if (pc === ENTRY && state.entries.length < 6) {
    const obj = r[4] >>> 0;
    state.entries.push({ obj: hex(obj), word: u32(sim, (obj + 0x364) >>> 0), mode: u32(sim, (obj + 0x374) >>> 0) });
    return;
  }
  if (pc === DIV && state.divs.length < 4) {
    state.divs.push({ d0: r[0] & 0xffff, d1: r[1] & 0xffff, d2: r[2] >>> 0 });
    return;
  }
  if (pc === XSTORE && state.xs.length < 4) {
    const obj = u32(sim, sp + 0x48);
    state.xs.push({
      d1: r[1] & 0xffff,
      pointX: u16(sim, sp + 0x9e),
      pointY: u16(sim, sp + 0x9c),
      sizeX: u32(sim, sp + 0xc0),
      sizeY: u32(sim, sp + 0xc4),
      mode: u32(sim, (obj + 0x374) >>> 0),
      word: u32(sim, (obj + 0x364) >>> 0),
      obj: hex(obj),
    });
  }
}

function onWatch(rec) {
  if (!state.on || state.stores.length >= 40) return;
  state.stores.push({ pc: hex(rec.pc >>> 0), addr: hex(rec.addr >>> 0), value: rec.value >>> 0, size: rec.size });
}

function arm(ctx) {
  state.m = ctx.l.sim.m;
  state.sim = ctx.l.sim;
  state.on = true;
  state.entries = [];
  state.xs = [];
  state.divs = [];
  state.stores = [];
  setProbes([ENTRY, DIV, XSTORE], onProbe);
  setWatchpoints([
    { id: 'field', lo: FIELD - 8, hi: FIELD + 24, kind: 2, stop: false },
    { id: 'fieldu', lo: (FIELD - 8 + 0x40000000) >>> 0, hi: (FIELD + 24 + 0x40000000) >>> 0, kind: 2, stop: false },
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
  const setKey = (key, index, value) => {
    ctx.l.call(ctx.native(SET), { d0: key, d1: index, a1: value }, null, null, 200000);
  };
  const shot = (id) => {
    const fr = ctx.s.frame('boundary');
    if (!fr) throw new Error('screenshot failed at ' + id);
    const rgb = words_to_rgb(fr[2]);
    const file = resolve('work/out/obs-geom-v3-' + tag + '-' + id + '.png');
    write_png(file, fr[0], fr[1], rgb);
    const g = greyMarks(rgb, fr[0]);
    return {
      sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
      union: g.union, marks: g.marks, pixels: g.pixels, colour: g.colour,
      subject: readKey(0x1e71, 0),
      k88b2: readKey(0x88b2, 0),
      k84d1: readKey(0x84d1, 0),
      k99a1: readKey(0x99a1, 0),
      k1dd1: [readKey(0x1dd1, 0), readKey(0x1dd1, 1)],
    };
  };
  return { readKey, setKey, shot };
}

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  emit({ id: 'v3-plan', step: 'plan', pass: true, problems: [], expect: { model: 'E147' }, actual: { modelEnv: 'E147' }, note: 'Version 3 of 6. Getter return 409, then Small against All. No display change.' });

  let subs = 0;
  const word = await runZone({
    checkout,
    outPath: 'work/out/session-geom-v3-word.jsonl',
    tag: 'geom-v3-word',
    candidate: false,
    fatalShots: true,
    explanation: 'v3 word. Stock. Cell stays 526. The call at 0x6041935b returns 409 only for d0=0x88b2. EMULATOR-ONLY test setup. Watches stores of object+0x364.',
    change: 'EMULATOR-ONLY test setup: call 0x6041935b returns 409 when d0 is 0x88b2. No cell write.',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v3-word-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { shot } = await boot(ctx, 'word');
      const rest = shot('rest');
      if (rest.subject !== 0 || rest.k88b2 !== 526) throw new Error('word rest');
      arm(ctx);
      ctx.idle(400);
      const before = { entries: state.entries.slice(), stores: state.stores.slice(), word: u32(ctx.l.sim, FIELD) };
      disarm();
      ctx.l.hook(ctx.native(CALL), (h, r) => {
        if ((r.d0 & 0xffff) === 0x88b2) {
          subs += 1;
          r.d0 = 409;
          h.skip_call(r);
          return;
        }
        ctx.l.passthrough(r);
      }, 'EMULATOR-ONLY test setup: 0x6041935b returns 409 for d0=0x88b2');
      arm(ctx);
      ctx.idle(500);
      const afterProbe = { entries: state.entries.slice(), xs: state.xs.slice(), divs: state.divs.slice(), stores: state.stores.slice(), word: u32(ctx.l.sim, FIELD) };
      disarm();
      const after = shot('after');
      const pass = after.subject === 0 && after.k88b2 === 526 && subs > 0;
      emit({
        id: 'v3-word', step: 'word', pass, problems: pass ? [] : ['outcome'],
        expect: { subject: 0, k88b2: 526, subs: '>0', returned: 409 },
        actual: { rest: { union: rest.union, pixels: rest.pixels, colour: rest.colour }, before, after, afterProbe, subs },
        note: 'EMULATOR-ONLY test setup. Cell is not written. before is the stock idle. after is the idle in which the call returns 409.',
      });
    },
  });

  const zone = await runZone({
    checkout,
    outPath: 'work/out/session-geom-v3-zone.jsonl',
    tag: 'geom-v3-zone',
    candidate: false,
    fatalShots: true,
    explanation: 'v3 zone. Stock Small rest, then the T6 half-press All cells. EMULATOR-ONLY test-setup writes of 0x84d1, 0x1dd1 and 0x99a1. No display change.',
    change: 'EMULATOR-ONLY test setup: half-press All cells. No display change.',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v3-zone-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { readKey, setKey, shot } = await boot(ctx, 'zone');
      const small = shot('small');
      if (small.subject !== 0) throw new Error('small subject');
      arm(ctx);
      ctx.idle(400);
      const smallProbe = { entries: state.entries.slice(), xs: state.xs.slice(), divs: state.divs.slice() };
      disarm();
      setKey(0x84d1, 0, 2);
      setKey(0x1dd1, 0, 1);
      setKey(0x1dd1, 1, 1);
      setKey(0x99a1, 0, 0);
      const poked = { k84d1: readKey(0x84d1, 0), k1dd1: [readKey(0x1dd1, 0), readKey(0x1dd1, 1)], k99a1: readKey(0x99a1, 0), k88b2: readKey(0x88b2, 0) };
      arm(ctx);
      ctx.idle(500);
      const allProbe = { entries: state.entries.slice(), xs: state.xs.slice(), divs: state.divs.slice(), stores: state.stores.slice() };
      disarm();
      const all = shot('all');
      const pixelsChanged = small.pixels !== all.pixels || small.colour.n31 !== all.colour.n31;
      const pass = small.subject === 0 && all.subject === 0 && poked.k84d1 === 2 && poked.k99a1 === 0 && poked.k1dd1[0] === 1 && poked.k1dd1[1] === 1;
      emit({
        id: 'v3-zone', step: 'zone', pass, problems: pass ? [] : ['outcome'],
        expect: { subject: 0, allKind: 2, allZone: 0, allSize: [1, 1] },
        actual: { small, smallProbe, poked, all, allProbe, pixelsChanged },
        note: 'EMULATOR-ONLY test setup of the T6 half-press All cells. Small is the stock rest. pixelsChanged compares the grey count and the rgb-31 count.',
      });
    },
  });
  emit({
    id: 'v3-done', step: 'done', pass: word.ok && zone.ok, problems: [],
    expect: { ok: true }, actual: { word: word.ok, zone: zone.ok },
  });
  if (!word.ok || !zone.ok) process.exit(1);
} catch (e) {
  try { disarm(); } catch { /* clear */ }
  emit({ id: 'v3-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
