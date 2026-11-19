// Correction experiment 2 of 6. Observation only.
// The thunk caller is 0x6041935b inside getter 0x6041931e, which returns the cell
// and does not store the frame. Follow that return into its caller and record the
// stores made there, including coordinate values from any stack, until the frame
// geometry appears. Stock image. One test-setup write of 0x88b2 to 412.
// OM_EMU_MODEL=E147 is set before model.mjs. EMULATOR-ONLY. Do not edit after it has run.
// Usage: node26 work/scripts/obs_caller_c2.mjs om-emu
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
  process.stderr.write('usage: node26 work/scripts/obs_caller_c2.mjs om-emu\n');
  process.exit(2);
}

const THUNK = 0x6041a1f9;
const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const OWN = 0xa031ed00;
const CONSUMER = 0xa33ca384;
const PAINT = [0x610eee11, 0x610f66df];
const DRAM = 0x18000000;
const WATCH = [
  { id: 1, lo: 0x60000000, hi: (0x60000000 + DRAM) >>> 0, kind: 2, stop: false },
  { id: 2, lo: 0xa0000000, hi: (0xa0000000 + DRAM) >>> 0, kind: 2, stop: false },
];
const HOOKS = { stop() {}, log(rec) { onStore(rec); } };
const COORD = new Set([356, 198, 420, 268, 417, 265, 482, 334]);
const OUT = resolve('work/out/obs-caller-c2.jsonl');
const WINDOWS = resolve('work/out/obs-caller-c2-windows.json');
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
  capture: false,
  phase: '',
  m: null,
  thunkHits: 0,
  keyHits: 0,
  index0: 0,
  pending: 0,
  follow: 0,
  recording: false,
  closeSoon: false,
  windowsLeft: 2,
  window: null,
  windows: [],
  parents: [],
  errors: [],
};

function bytesOf(m, addr, n) {
  try {
    const b = m.dbgRead(addr >>> 0, n);
    let s = '';
    for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
    return s;
  } catch (e) {
    return 'unreadable:' + String(e && e.message ? e.message : e);
  }
}

function u32(m, addr) {
  const b = m.dbgRead(addr >>> 0, 4);
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}

function regsOf(m) {
  const r = m.getRegs();
  return {
    d0: r[0] >>> 0, d1: r[1] >>> 0, d2: r[2] >>> 0, d3: r[3] >>> 0,
    a0: r[4] >>> 0, a1: r[5] >>> 0, a2: r[6] >>> 0, a3: r[7] >>> 0,
    sp: r[8] >>> 0, mdr: r[11] >>> 0,
  };
}

function retInfo(m, pc) {
  try {
    const b = m.dbgRead(pc >>> 0, 3);
    if (b[0] !== 0xde && b[0] !== 0xdf) return null;
    return { op: b[0], mask: b[1], size: b[2] };
  } catch {
    return null;
  }
}

function partsOf(size, value) {
  const v = value >>> 0;
  if (size === 4) return [v & 0xffff, (v >>> 16) & 0xffff];
  if (size === 2) return [v & 0xffff];
  return [v & 0xff];
}

function isCoord(size, value) {
  if (size < 2) return false;
  return partsOf(size, value).some((p) => COORD.has(p));
}

function finishWindow() {
  const w = state.window;
  if (!w) return;
  if (w.elapsed == null) {
    w.elapsed = S.insns - w.startInsns;
    w.stopped = 'idle-end';
  }
  const byPc = new Map();
  for (const s of w.objects) {
    const g = byPc.get(s.pc) || { pc: s.pc, n: 0 };
    g.n += 1;
    byPc.set(s.pc, g);
  }
  w.objectWriters = [...byPc.values()].sort((a, b) => b.n - a.n).slice(0, 20);
  state.windows.push(w);
  state.window = null;
  writeFileSync(WINDOWS, JSON.stringify(state.windows));
}

function armList() {
  const list = [THUNK];
  if (state.pending) list.push(state.pending);
  if (state.follow) list.push(state.follow);
  if (state.recording) list.push(...PAINT);
  setProbes(list, onProbe);
}

function onStore(rec) {
  const w = state.window;
  if (!state.recording || !w) return;
  w.seen += 1;
  const sp = state.m.getRegs()[8] >>> 0;
  const frame = sp <= w.parentSp && (w.parentSp - sp) < 0x5000;
  const coord = isCoord(rec.size, rec.value);
  const addr = rec.addr >>> 0;
  const stackish = addr + 16 > w.parentSp - 0x9000 && addr < w.parentSp + 0x100;
  if (coord) {
    w.coordHit = true;
    if (w.coords.length < 80) {
      w.coords.push({ pc: hex(rec.pc), addr: hex(addr), n: rec.size, v: rec.value >>> 0, sp: hex(sp), frame: frame ? 1 : 0 });
    }
    if (!w.objectBytes) w.objectBytes = { at: hex(addr), pc: hex(rec.pc), bytes: bytesOf(state.m, (addr - 16) >>> 0, 64) };
  }
  if (!stackish && frame && w.objects.length < 240) {
    w.objects.push({ pc: hex(rec.pc), addr: hex(addr), n: rec.size, v: rec.value >>> 0 });
  }
  if ((rec.value >>> 0) === w.returned || (rec.size >= 2 && (rec.value & 0xffff) === w.returned)) {
    if (w.cellStores.length < 24) w.cellStores.push({ pc: hex(rec.pc), addr: hex(addr), n: rec.size, v: rec.value >>> 0, frame: frame ? 1 : 0 });
  }
  const elapsed = S.insns - w.startInsns;
  if ((w.coordHit && elapsed > 3000) || elapsed > 80000 || (Date.now() - w.t0) > 20000) {
    state.recording = false;
    state.closeSoon = true;
    w.elapsed = elapsed;
    w.stopped = w.coordHit ? 'coord' : (elapsed > 80000 ? 'insns' : 'wall');
  }
}

function onProbe(pc) {
  try { onProbeBody(pc >>> 0); }
  catch (e) {
    state.errors.push(String(e && e.stack ? e.stack : e));
    state.recording = false;
    state.closeSoon = true;
    state.pending = 0;
    state.follow = 0;
  }
}

function startWindow(phaseRegs, parentRa, parentSp, via) {
  state.windowsLeft -= 1;
  state.pending = 0;
  state.follow = 0;
  state.recording = true;
  state.window = {
    phase: state.phase,
    via: hex(via),
    parent: hex(parentRa),
    parentSp,
    returned: phaseRegs.d0 & 0xffff,
    regs: {
      d0: phaseRegs.d0, d1: phaseRegs.d1, a0: hex(phaseRegs.a0), a1: hex(phaseRegs.a1),
      a2: hex(phaseRegs.a2), a3: hex(phaseRegs.a3), sp: hex(phaseRegs.sp), mdr: hex(phaseRegs.mdr),
    },
    startInsns: S.insns,
    t0: Date.now(),
    seen: 0,
    coords: [],
    objects: [],
    cellStores: [],
    paints: [],
    coordHit: false,
    objectBytes: null,
  };
  state.parents.push({ phase: state.phase, parent: hex(parentRa), returned: phaseRegs.d0 & 0xffff, via: hex(via) });
  setWatchpoints(WATCH, HOOKS);
  armList();
}

function onProbeBody(pc) {
  if (!state.capture) return;
  const m = state.m;
  if (state.closeSoon && pc === THUNK) {
    state.closeSoon = false;
    state.recording = false;
    finishWindow();
    setWatchpoints([], HOOKS);
    state.pending = 0;
    state.follow = 0;
    armList();
  }
  if (PAINT.includes(pc)) {
    const w = state.window;
    if (state.recording && w && w.paints.length < 16) {
      const r = regsOf(m);
      w.paints.push({ pc: hex(pc), d0: r.d0, d1: r.d1, a0: hex(r.a0), a1: hex(r.a1), a2: hex(r.a2) });
    }
    return;
  }
  if (pc === state.follow && !state.recording) {
    const r = regsOf(m);
    const info = retInfo(m, pc);
    if (info) {
      const parentRa = u32(m, (r.sp + info.size) >>> 0);
      const parentSp = (r.sp + info.size) >>> 0;
      startWindow(r, parentRa, parentSp, pc);
    } else {
      startWindow(r, pc, r.sp, pc);
    }
    return;
  }
  if (pc === state.pending && !state.recording) {
    const r = regsOf(m);
    const info = retInfo(m, pc);
    state.pending = 0;
    if (!info || state.windowsLeft <= 0) { armList(); return; }
    const target = u32(m, (r.sp + info.size) >>> 0);
    state.follow = target >>> 0;
    armList();
    return;
  }
  if (pc !== THUNK) return;
  state.thunkHits += 1;
  const r = regsOf(m);
  if ((r.d0 & 0xffff) !== 0x88b2) return;
  state.keyHits += 1;
  if ((r.d1 & 0xffff) !== 0) return;
  state.index0 += 1;
  if (state.recording || state.pending || state.follow || state.windowsLeft <= 0 || state.closeSoon) return;
  state.pending = r.mdr >>> 0;
  armList();
}

function publicWindow(w) {
  return {
    phase: w.phase, via: w.via, parent: w.parent, returned: w.returned, regs: w.regs,
    seen: w.seen, coordHit: w.coordHit, stopped: w.stopped || null, elapsed: w.elapsed || null,
    coords: w.coords, objects: w.objects, cellStores: w.cellStores, paints: w.paints,
    objectBytes: w.objectBytes, objectWriters: w.objectWriters || [],
  };
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
    const file = resolve('work/out/obs-caller-c2-' + id + '.png');
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
    id: 'c2-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Correction experiment 2 of 6. Follow the getter return and record the caller stores. No display change.',
  });
  if (!envPass) process.exit(1);

  const stock = await runZone({
    checkout,
    outPath: 'work/out/session-obs-caller-c2.jsonl',
    tag: 'obs-caller-c2',
    candidate: false,
    fatalShots: true,
    explanation: 'c2 stock. The thunk returns into getter 0x6041931e. Follow that return and record the caller stores until frame coordinates appear. EMULATOR-ONLY test-setup write of 0x88b2 only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'c2-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      state.m = ctx.l.sim.m;
      const { readKey, shot } = await boot(ctx, words_to_rgb, write_png);
      const subject = readKey(0x1e71, 0);
      const rest = shot('rest');
      if (subject !== 0 || rest.subject !== 0) throw new Error('subject');
      if (rest.k88b2 !== 526) throw new Error('rest cell ' + rest.k88b2);
      emit({
        id: 'c2-rest', step: 'rest', pass: true, problems: [],
        expect: { subject: 0, k88b2: 526 },
        actual: { subject: rest.subject, k88b2: rest.k88b2, union: rest.union, sha256: rest.sha256 },
      });
      const runIdle = (phase) => {
        state.phase = phase;
        state.windowsLeft = 2;
        state.pending = 0;
        state.follow = 0;
        state.recording = false;
        state.closeSoon = false;
        armList();
        state.capture = true;
        ctx.idle(500);
        state.capture = false;
        if (state.window) finishWindow();
        state.recording = false;
        state.pending = 0;
        state.follow = 0;
        setWatchpoints([], HOOKS);
        setProbes([], null);
        emit({
          id: 'c2-' + phase, step: phase, pass: state.errors.length === 0, problems: state.errors.length ? ['probe'] : [],
          expect: { errors: 0 },
          actual: {
            thunkHits: state.thunkHits, keyHits: state.keyHits, index0: state.index0,
            parents: state.parents.filter((p) => p.phase === phase),
            windows: state.windows.filter((w) => w.phase === phase).map(publicWindow),
            errors: state.errors.slice(),
          },
          note: 'EMULATOR-ONLY observation. The window starts at the caller of getter 0x6041931e.',
        });
      };
      runIdle('cell526');
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      const midCell = readKey(0x88b2, 0);
      if (midCell !== 412) throw new Error('setter readback ' + midCell);
      runIdle('cell412');
      const after = shot('after');
      const moved = !!(after.union && rest.union && (after.union.x !== rest.union.x || after.union.y !== rest.union.y));
      emit({
        id: 'c2-after', step: 'after', pass: after.k88b2 === 412 && after.subject === 0 && moved,
        problems: [],
        expect: { k88b2: 412, subject: 0, moved: true },
        actual: { k88b2: after.k88b2, subject: after.subject, union: after.union, sha256: after.sha256, moved },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. No display change.',
      });
    },
  });
  const ok = stock.ok && state.errors.length === 0;
  emit({
    id: 'c2-done', step: 'done', pass: ok, problems: ok ? [] : ['session'],
    expect: { ok: true },
    actual: { ok: stock.ok, failed: stock.failed, errors: state.errors, windows: state.windows.length, parents: state.parents },
  });
  if (!ok) process.exit(1);
} catch (e) {
  emit({ id: 'c2-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
