// T9b experiment version 6. The last emulator process.
// Stock: name who reads cell 0x629526c0 during the idle that moves the marks.
// Then seeded T6 and unseeded T6: whether an AF-ON press reaches that read
// or the refresh flag writer 0x610f7172. No display change is installed.
// Probes are image addresses. OM_EMU_MODEL=E147 is set before model.mjs.
// EMULATOR-ONLY. Do not edit after it has run.
// Usage: node26 work/scripts/obs_trace_v6.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_trace_v6.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const MIRROR = 0xa031eeb0;
const MIRROR_C = 0x6031eeb0;
const CONSUMER = 0xa33ca384;
const OWN = 0xa031ed00;
const CELL = 0x629526c0;
const CELL_U = 0xa29526c0;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
const T6_CSV = 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv';
const OUT = resolve('work/out/obs-trace-v6.jsonl');
const SITES = [0x60063380, 0x6006339a, 0x60063a5e, 0x60063912, 0x60063926, 0x610f7172, 0x610f70eb, 0x60063534];
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);

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
  const reads = [];
  const gate = { on: false };
  const u8 = (a) => ctx.l.sim.read(a, 1)[0];
  const u16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
  const bank = () => {
    if (!(link.area === 1 && link.pos === 1)) return 1;
    const pose = ctx.l.sim.u32(0xa32c568c) >>> 0;
    if (pose === 2) return 5;
    if (pose === 4) return 3;
    return 1;
  };
  ctx.l.observe(ctx.native(CALL_CONV), () => { inConv = true; }, 'obs-t9b-conv');
  ctx.l.observe(ctx.native(BACK_CONV), () => { inConv = false; }, 'obs-t9b-conv-back');
  ctx.l.hook(ctx.native(GET), (h, r) => {
    const back = r.mdr >>> 0;
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    if (gate.on && key === 0x88b2 && reads.length < 20) reads.push({ caller: hex(back), index });
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
      let v = u16(MIRROR + 0x0a + b * 2);
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
    reads,
    gate,
    refresh() {
      link.area = ctx.l.call(ctx.native(GET), { d0: 0x1db1, d1: 0, a0: 0 }, null, null, 200000).d0 & 0xffff;
      link.pos = ctx.l.call(ctx.native(GET), { d0: 0x1dc1, d1: 0, a0: 0 }, null, null, 200000).d0 & 0xffff;
    },
  };
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
    const file = resolve('work/out/obs-trace-v6-' + tag + '-' + id + '.png');
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

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'v6-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 6, the last emulator process. Observation only. No display change.',
  });
  if (!envPass) process.exit(1);

  const stock = await runZone({
    checkout,
    outPath: 'work/out/session-obs-trace-v6-stock.jsonl',
    tag: 'obs-trace-v6-stock',
    candidate: false,
    fatalShots: true,
    explanation: 'v6 stock. Record the caller that reads 0x88b2 while the marks move. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v6-stock-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const hits = [];
      const counts = new Map();
      let capture = false;
      let phase = '';
      ctx.l.sim.m.setProbes(SITES, (pc) => {
        if (!capture) return;
        const img = pc >>> 0;
        const key = phase + ' ' + hex(img);
        counts.set(key, (counts.get(key) || 0) + 1);
        if (hits.length >= 40) return;
        const r = ctx.l.sim.m.getRegs();
        const d0 = r[0] & 0xffff;
        const a0 = r[4] >>> 0;
        const mdr = r[11] >>> 0;
        const interesting = img === 0x60063a5e
          ? (a0 === CELL || a0 === CELL_U)
          : (img === 0x60063380 || img === 0x6006339a) ? d0 === 0x88b2 : true;
        if (!interesting) return;
        hits.push({ phase, pc: hex(img), d0, d1: r[1] & 0xffff, a0: hex(a0), caller: hex(mdr) });
      });
      const { readKey, shot } = await boot(ctx, words_to_rgb, write_png, 'stock');
      const subject = readKey(0x1e71, 0);
      const rest = shot('rest');
      if (subject !== 0 || rest.k88b2 !== 526) throw new Error('rest');
      phase = 'call';
      capture = true;
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      capture = false;
      phase = 'idle';
      capture = true;
      ctx.idle(500);
      capture = false;
      try { ctx.l.sim.m.setProbes([], null); } catch { /* clear */ }
      const after = shot('after');
      const pass = after.k88b2 === 412 && after.subject === 0;
      emit({
        id: 'v6-stock', step: 'stock', pass, problems: pass ? [] : ['readback'],
        expect: { k88b2: 412, subject: 0 },
        actual: {
          restUnion: rest.union, union: after.union,
          marksMoved: JSON.stringify(after.union) !== JSON.stringify(rest.union),
          counts: Object.fromEntries(counts), hits,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. hits are reads of that cell and getter calls for key 0x88b2.',
      });
      if (!pass) throw new Error('stock readback');
    },
  });

  async function afonSession(role, seed) {
    return runZone({
      checkout,
      outPath: 'work/out/session-obs-trace-v6-' + role + '.jsonl',
      tag: 'obs-trace-v6-' + role,
      candidate: true,
      help: true,
      rowLabel: true,
      overlayCsv: T6_CSV,
      fatalShots: true,
      explanation: 'v6 ' + role + '. T6 overlay and inherited profile-read hook. ' + (seed ? 'Mirror seed Small at 529 is test setup.' : 'No mirror seed.') + ' No display change.',
      change: 'EMULATOR-ONLY inherited T6 profile-read hook. Role: behaviour. ' + (seed ? 'Mirror seed is test setup.' : 'No mirror seed.'),
      async drive(ctx) {
        const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
        if (MODEL !== 'E147') throw new Error('model ' + MODEL);
        emit({ id: 'v6-' + role + '-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
        const profile = installProfile(ctx);
        const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
        const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
        const counts = new Map();
        const loads = [];
        let capture = false;
        ctx.l.sim.m.setProbes([0x60063a5e, 0x610f7172, 0x610f70eb, 0x60063534], (pc) => {
          if (!capture) return;
          const img = pc >>> 0;
          counts.set(hex(img), (counts.get(hex(img)) || 0) + 1);
          if (img !== 0x60063a5e || loads.length >= 12) return;
          const r = ctx.l.sim.m.getRegs();
          const a0 = r[4] >>> 0;
          if (a0 !== CELL && a0 !== CELL_U) return;
          loads.push({ caller: hex(r[11] >>> 0), a0: hex(a0) });
        });
        const { readKey, shot } = await boot(ctx, words_to_rgb, write_png, role);
        profile.refresh();
        if (seed) {
          const buf = q1Mirror();
          ctx.l.sim.write(MIRROR, buf);
          ctx.l.sim.write(MIRROR_C, buf);
        }
        const subject = readKey(0x1e71, 0);
        const rest = shot('rest');
        if (subject !== 0) throw new Error(role + ' subject');
        profile.gate.on = true;
        capture = true;
        ctx.key('afon', 'down');
        ctx.idle(400);
        capture = false;
        profile.gate.on = false;
        try { ctx.l.sim.m.setProbes([], null); } catch { /* clear */ }
        const pressed = shot('afon');
        const pass = pressed.subject === 0;
        emit({
          id: 'v6-' + role, step: role, pass, problems: pass ? [] : ['subject'],
          expect: { subject: 0 },
          actual: {
            seed, restUnion: rest.union, restOwner: rest.owner, restTarget: rest.target, restCell: rest.k88b2,
            union: pressed.union, owner: pressed.owner, target: pressed.target, cell: pressed.k88b2,
            marksMoved: JSON.stringify(pressed.union) !== JSON.stringify(rest.union),
            getterCalls: profile.reads, loads, counts: Object.fromEntries(counts),
          },
          note: 'EMULATOR-ONLY inherited T6 hook. Role: behaviour. No display change. getterCalls are key 0x88b2 during the whole session up to the press window reset; the array was cleared just before AF-ON.',
        });
        if (!pass) throw new Error(role + ' subject after');
      },
    });
  }

  const seeded = await afonSession('seeded', true);
  const unseeded = await afonSession('unseeded', false);
  const ok = stock.ok && seeded.ok && unseeded.ok;
  emit({
    id: 'v6-done', step: 'done', pass: ok, problems: ok ? [] : ['session'],
    expect: { ok: true }, actual: { stock: stock.ok, seeded: seeded.ok, unseeded: unseeded.ok, stockError: stock.failed, seededError: seeded.failed, unseededError: unseeded.failed },
  });
  if (!ok) process.exit(1);
} catch (e) {
  emit({ id: 'v6-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
