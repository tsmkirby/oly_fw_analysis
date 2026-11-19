// Correction experiment 5 of 6. Observation only.
// The origin routine 0x61184e51 stores the frame X at 0x611852e9 and Y at 0x61185307.
// Record the stack inputs at that store: the point, the size, and the object word
// at +0x364. Stock idle after writing cell 0x88b2 to 412, then seeded T6 and
// unseeded T6 AF-ON press. No display change.
// OM_EMU_MODEL=E147 is set before model.mjs. EMULATOR-ONLY.
// Usage: node26 work/scripts/obs_sched_c5.mjs om-emu
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
  process.stderr.write('usage: node26 work/scripts/obs_sched_c5.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const MIRROR = 0xa031eeb0;
const MIRROR_C = 0x6031eeb0;
const CONSUMER = 0xa33ca384;
const OWN = 0xa031ed00;
const XSTORE = 0x611852e9;
const YSTORE = 0x61185307;
const FLAG_SET = 0x610f7172;
const ENTRY = 0x61184e51;
const PROBES = [ENTRY, XSTORE, YSTORE, FLAG_SET];
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const T6_CSV = 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv';
const OUT = resolve('work/out/obs-sched-c5.jsonl');
const lines = [];
const hex = (v) => '0x' + (v >>> 0).toString(16);
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};

function u16(addr) {
  const b = dbgRead(addr >>> 0, 2);
  if (!b) return null;
  return b[0] | (b[1] << 8);
}
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

function q1Mirror() {
  const m = new Uint8Array(55);
  m[1] = 2;
  m[0x0c] = 529 & 0xff;
  m[0x0d] = (529 >> 8) & 0xff;
  m[0x22] = 529 & 0xff;
  m[0x23] = (529 >> 8) & 0xff;
  return m;
}

function installProfile(ctx) {
  const link = { area: 0, pos: 0 };
  let inConv = false;
  const u8 = (a) => ctx.l.sim.read(a, 1)[0];
  const uu16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
  const bank = () => {
    if (!(link.area === 1 && link.pos === 1)) return 1;
    const pose = ctx.l.sim.u32(0xa32c568c) >>> 0;
    if (pose === 2) return 5;
    if (pose === 4) return 3;
    return 1;
  };
  ctx.l.observe(ctx.native(CALL_CONV), () => { inConv = true; }, 'obs-c5-conv');
  ctx.l.observe(ctx.native(BACK_CONV), () => { inConv = false; }, 'obs-c5-conv-back');
  ctx.l.hook(ctx.native(GET), (h, r) => {
    const back = r.mdr >>> 0;
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    const b = bank();
    if (back === RET_ZONE) {
      let v = u8(MIRROR + b);
      if (v === 0xff) v = u8(0xa031e920);
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_SIZE) {
      let v = u8(MIRROR + 0x08);
      if (v === 0xff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_POS) {
      let v = uu16(MIRROR + 0x0a + b * 2);
      if (v === 0xffff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_PLUS9) { h.finish(r, { d0: 0 }); return; }
    if (inConv && key === 0x1dd1) {
      let v = u8(MIRROR + 0x16 + (index & 0xff));
      if (v === 0xff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    ctx.l.passthrough(r);
  }, 'EMULATOR-ONLY inherited T6 profile read. Role: behaviour.');
  return {
    refresh() {
      link.area = ctx.l.call(ctx.native(GET), { d0: 0x1db1, d1: 0, a0: 0 }, null, null, 200000).d0 & 0xffff;
      link.pos = ctx.l.call(ctx.native(GET), { d0: 0x1dc1, d1: 0, a0: 0 }, null, null, 200000).d0 & 0xffff;
    },
  };
}

const state = {
  on: false,
  m: null,
  entry: 0,
  xN: 0,
  yN: 0,
  flag: 0,
  xs: [],
  ys: [],
};

function resetCounts() {
  state.entry = 0;
  state.xN = 0;
  state.yN = 0;
  state.flag = 0;
  state.xs = [];
  state.ys = [];
}

function sample(sp, d1) {
  const obj = u32(sp + 0x48);
  return {
    d1,
    pointX: u16(sp + 0x9e),
    pointY: u16(sp + 0x9c),
    sizeX: u32(sp + 0xc0),
    sizeY: u32(sp + 0xc4),
    obj: obj === null ? null : hex(obj),
    word: obj === null ? null : u32((obj + 0x364) >>> 0),
  };
}

function onProbe(pc) {
  if (!state.on) return;
  if (pc === ENTRY) { state.entry += 1; return; }
  if (pc === FLAG_SET) { state.flag += 1; return; }
  const r = state.m.getRegs();
  const d1 = r[1] & 0xffff;
  const sp = r[8] >>> 0;
  if (pc === XSTORE) {
    state.xN += 1;
    if (state.xs.length >= 8) return;
    if (d1 !== 356 && d1 !== 417 && d1 !== 402 && d1 !== 464) return;
    state.xs.push(sample(sp, d1));
    return;
  }
  if (pc === YSTORE) {
    state.yN += 1;
    if (state.ys.length >= 8) return;
    if (d1 !== 198 && d1 !== 265) return;
    state.ys.push(sample(sp, d1));
  }
}

async function boot(ctx, words_to_rgb, write_png, tag) {
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
    const file = resolve('work/out/obs-sched-c5-' + tag + '-' + id + '.png');
    write_png(file, fr[0], fr[1], rgb);
    return {
      sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
      union: greyUnion(rgb, fr[0]),
      subject: readKey(0x1e71, 0),
      k88b2: readKey(0x88b2, 0),
      owner: ctx.l.sim.read(OWN, 8)[4],
      target: Array.from(ctx.l.sim.read(CONSUMER, 10)),
    };
  };
  return { readKey, shot };
}

function arm(ctx) {
  state.m = ctx.l.sim.m;
  resetCounts();
  setProbes(PROBES, onProbe);
  state.on = true;
}
function disarm() {
  state.on = false;
  setProbes([], null);
}

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'c5-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Correction experiment 5 of 6. Origin-routine inputs on the stock idle and on AF-ON press. No display change.',
  });
  if (!envPass) process.exit(1);

  const stock = await runZone({
    checkout,
    outPath: 'work/out/session-obs-sched-c5-stock.jsonl',
    tag: 'obs-sched-c5-stock',
    candidate: false,
    fatalShots: true,
    explanation: 'c5 stock. Record the inputs of routine 0x61184e51 when it stores 356 and 198. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'c5-stock-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const { readKey, shot } = await boot(ctx, words_to_rgb, write_png, 'stock');
      const rest = shot('rest');
      if (rest.subject !== 0 || rest.k88b2 !== 526) throw new Error('stock rest');
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      arm(ctx);
      ctx.idle(500);
      disarm();
      const after = shot('after');
      emit({
        id: 'c5-stock', step: 'stock', pass: after.subject === 0 && after.k88b2 === 412,
        problems: [],
        expect: { subject: 0, k88b2: 412, union: { x: 356, y: 198, w: 65, h: 71 } },
        actual: {
          subject: after.subject, k88b2: after.k88b2, union: after.union, sha256: after.sha256,
          restUnion: rest.union, entry: state.entry, xN: state.xN, yN: state.yN, flag: state.flag,
          xs: state.xs, ys: state.ys,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. xs are stores of a frame X at 0x611852e9.',
      });
    },
  });

  async function afon(role, seed) {
    return runZone({
      checkout,
      outPath: 'work/out/session-obs-sched-c5-' + role + '.jsonl',
      tag: 'obs-sched-c5-' + role,
      candidate: true,
      help: true,
      rowLabel: true,
      overlayCsv: T6_CSV,
      fatalShots: true,
      explanation: 'c5 ' + role + '. T6 overlay and inherited profile-read hook. ' + (seed ? 'Mirror seed Small at 529 is test setup.' : 'No mirror seed.') + ' No display change.',
      change: 'EMULATOR-ONLY inherited T6 profile-read hook. Role: behaviour. ' + (seed ? 'Mirror seed is test setup.' : 'No mirror seed.'),
      async drive(ctx) {
        const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
        if (MODEL !== 'E147') throw new Error('model ' + MODEL);
        emit({ id: 'c5-' + role + '-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
        const profile = installProfile(ctx);
        const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
        const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
        const { readKey, shot } = await boot(ctx, words_to_rgb, write_png, role);
        profile.refresh();
        if (seed) {
          const buf = q1Mirror();
          ctx.l.sim.write(MIRROR, buf);
          ctx.l.sim.write(MIRROR_C, buf);
        }
        const rest = shot('rest');
        if (rest.subject !== 0) throw new Error(role + ' subject');
        arm(ctx);
        ctx.key('afon', 'down');
        ctx.idle(400);
        disarm();
        const pressed = shot('afon');
        emit({
          id: 'c5-' + role, step: role, pass: pressed.subject === 0 && pressed.owner === 2,
          problems: [],
          expect: { subject: 0, owner: 2 },
          actual: {
            seed, restUnion: rest.union, restOwner: rest.owner, restTarget: rest.target, restCell: rest.k88b2,
            union: pressed.union, owner: pressed.owner, target: pressed.target, cell: pressed.k88b2,
            subject: pressed.subject, sha256: pressed.sha256,
            marksMoved: JSON.stringify(pressed.union) !== JSON.stringify(rest.union),
            entry: state.entry, xN: state.xN, yN: state.yN, flag: state.flag, xs: state.xs, ys: state.ys,
          },
          note: 'EMULATOR-ONLY inherited T6 hook. Role: behaviour. No display change. Window is the AF-ON press and the following 400 ms.',
        });
      },
    });
  }

  const seeded = await afon('seeded', true);
  const unseeded = await afon('unseeded', false);
  const ok = stock.ok && seeded.ok && unseeded.ok;
  emit({
    id: 'c5-done', step: 'done', pass: ok, problems: ok ? [] : ['session'],
    expect: { ok: true },
    actual: { stock: stock.ok, seeded: seeded.ok, unseeded: unseeded.ok, stockError: stock.failed, seededError: seeded.failed, unseededError: unseeded.failed },
  });
  if (!ok) process.exit(1);
} catch (e) {
  emit({ id: 'c5-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
