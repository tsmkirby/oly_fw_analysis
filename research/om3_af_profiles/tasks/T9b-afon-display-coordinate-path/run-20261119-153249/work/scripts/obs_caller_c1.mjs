// Correction experiment 1 of 6. Observation only.
// Probe thunk 0x6041a1f9 during the idle refresh. When d0 is 0x88b2 and d1 is 0,
// record the caller's return address (mdr and the stack), then the stores that
// caller and its callees make after the thunk returns, until frame-sized values
// appear or the window ends. Stock image. One test-setup write of 0x88b2 to 412.
// OM_EMU_MODEL=E147 is set before model.mjs. EMULATOR-ONLY. Do not edit after it has run.
// Usage: node26 work/scripts/obs_caller_c1.mjs om-emu
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
  process.stderr.write('usage: node26 work/scripts/obs_caller_c1.mjs om-emu\n');
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
const OUT = resolve('work/out/obs-caller-c1.jsonl');
const WINDOWS = resolve('work/out/obs-caller-c1-windows.json');
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
  return { x, y, w: Math.max(...marks.map((m) => m.x + m.w)) - x, h: Math.max(...marks.map((m) => m.y + m.h)) - y, n: marks.length, marks };
}

const state = {
  capture: false,
  phase: '',
  thunkHits: 0,
  keyHits: 0,
  index0: 0,
  callers: [],
  mdrCount: new Map(),
  pending: 0,
  recording: false,
  closeSoon: false,
  windowsLeft: 3,
  window: null,
  windows: [],
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

function regsOf(m) {
  const r = m.getRegs();
  return {
    d0: r[0] >>> 0, d1: r[1] >>> 0, d2: r[2] >>> 0, d3: r[3] >>> 0,
    a0: r[4] >>> 0, a1: r[5] >>> 0, a2: r[6] >>> 0, a3: r[7] >>> 0,
    sp: r[8] >>> 0, pc: r[9] >>> 0, mdr: r[11] >>> 0,
  };
}

function partsOf(size, value) {
  const v = value >>> 0;
  if (size === 4) return [v & 0xffff, (v >>> 16) & 0xffff];
  if (size === 2) return [v & 0xffff];
  return [v & 0xff];
}

function interesting(size, value) {
  if (size < 2) return false;
  return partsOf(size, value).some((p) => COORD.has(p));
}

function finishWindow() {
  const w = state.window;
  if (!w) return;
  const geom = [];
  const byPc = new Map();
  for (const s of w.stores) {
    const key = s.pc;
    const g = byPc.get(key) || { pc: key, n: 0, frame: 0, geom: 0 };
    g.n += 1;
    if (s.frame) g.frame += 1;
    if (s.geom) g.geom += 1;
    byPc.set(key, g);
    if (s.geom && geom.length < 80) geom.push(s);
  }
  w.geom = geom;
  w.writers = [...byPc.values()].sort((a, b) => b.frame - a.frame || b.geom - a.geom).slice(0, 30);
  state.windows.push(w);
  state.window = null;
  writeFileSync(WINDOWS, JSON.stringify(state.windows));
}

function armList() {
  const list = [THUNK];
  if (state.pending) list.push(state.pending);
  if (state.recording) list.push(...PAINT);
  setProbes(list, onProbe);
}

function onStore(rec) {
  const w = state.window;
  if (!state.recording || !w) return;
  w.seen += 1;
  const sp = state.m.getRegs()[8] >>> 0;
  const frame = sp <= w.callerSp && (w.callerSp - sp) < 0x8000;
  const geom = interesting(rec.size, rec.value);
  if (frame) w.frameSeen += 1;
  const keep = (frame && w.frameKept < 400) || (geom && w.geomKept < 200) || (!frame && w.outKept < 12);
  if (keep) {
    if (frame) w.frameKept += 1;
    if (geom) w.geomKept += 1;
    if (!frame) w.outKept += 1;
    w.stores.push({
      pc: hex(rec.pc), addr: hex(rec.addr), n: rec.size, v: rec.value >>> 0,
      sp: hex(sp), frame: frame ? 1 : 0, geom: geom ? 1 : 0,
    });
  }
  const elapsed = S.insns - w.startInsns;
  if (geom && frame) w.geomHit = true;
  if ((w.geomHit && elapsed > 4000) || elapsed > 25000 || (Date.now() - w.t0) > 15000) {
    state.recording = false;
    state.closeSoon = true;
    w.elapsed = elapsed;
    w.stopped = w.geomHit ? 'geom' : (elapsed > 25000 ? 'insns' : 'wall');
  }
}

function onProbe(pc) {
  try {
    onProbeBody(pc >>> 0);
  } catch (e) {
    state.errors.push(String(e && e.stack ? e.stack : e));
    state.recording = false;
    state.closeSoon = true;
    state.pending = 0;
  }
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
    armList();
  }
  if (PAINT.includes(pc)) {
    const w = state.window;
    if (state.recording && w && w.paints.length < 24) {
      const r = regsOf(m);
      w.paints.push({ pc: hex(pc), d0: r.d0, d1: r.d1, d2: r.d2, d3: r.d3, a0: hex(r.a0), a1: hex(r.a1), a2: hex(r.a2), sp: hex(r.sp) });
    }
    return;
  }
  if (pc === state.pending) {
    if (state.recording || state.windowsLeft <= 0) return;
    const r = regsOf(m);
    state.windowsLeft -= 1;
    state.pending = 0;
    state.recording = true;
    state.window = {
      phase: state.phase,
      ret: hex(pc),
      returned: r.d0 & 0xffff,
      regs: { d0: r.d0, d1: r.d1, a0: hex(r.a0), a1: hex(r.a1), a2: hex(r.a2), a3: hex(r.a3), sp: hex(r.sp), mdr: hex(r.mdr) },
      callerSp: r.sp,
      stack: bytesOf(m, r.sp, 24),
      startInsns: S.insns,
      t0: Date.now(),
      stores: [],
      paints: [],
      seen: 0,
      frameSeen: 0,
      frameKept: 0,
      geomKept: 0,
      outKept: 0,
      geomHit: false,
    };
    setWatchpoints(WATCH, HOOKS);
    armList();
    return;
  }
  if (pc !== THUNK) return;
  state.thunkHits += 1;
  const r = regsOf(m);
  const key = r.d0 & 0xffff;
  const index = r.d1 & 0xffff;
  if (key !== 0x88b2) return;
  state.keyHits += 1;
  if (index !== 0) return;
  state.index0 += 1;
  const id = state.phase + ' ' + hex(r.mdr);
  state.mdrCount.set(id, (state.mdrCount.get(id) || 0) + 1);
  if (state.callers.length < 24) {
    state.callers.push({
      phase: state.phase, mdr: hex(r.mdr), sp: hex(r.sp), d1: index,
      a0: hex(r.a0), a1: hex(r.a1), a2: hex(r.a2), a3: hex(r.a3),
      stack: bytesOf(m, r.sp, 16),
      before: bytesOf(m, (r.mdr - 8) >>> 0, 16),
    });
  }
  if (state.recording || state.pending || state.windowsLeft <= 0 || state.closeSoon) return;
  state.pending = r.mdr >>> 0;
  armList();
}

function snapshotCounts() {
  return {
    thunkHits: state.thunkHits,
    keyHits: state.keyHits,
    index0: state.index0,
    mdr: Object.fromEntries(state.mdrCount),
    callers: state.callers.filter((c) => c.phase === state.phase),
    windows: state.windows.filter((w) => w.phase === state.phase).map(publicWindow),
    errors: state.errors.slice(),
  };
}

function publicWindow(w) {
  return {
    phase: w.phase, ret: w.ret, returned: w.returned, regs: w.regs, stack: w.stack,
    seen: w.seen, frameSeen: w.frameSeen, kept: w.stores.length, geomHit: w.geomHit,
    stopped: w.stopped || null, elapsed: w.elapsed || null, paints: w.paints,
    geom: w.geom || [], writers: w.writers || [],
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
    const file = resolve('work/out/obs-caller-c1-' + id + '.png');
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
    id: 'c1-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Correction experiment 1 of 6. Observation of thunk 0x6041a1f9. No display change.',
  });
  if (!envPass) process.exit(1);

  const stock = await runZone({
    checkout,
    outPath: 'work/out/session-obs-caller-c1.jsonl',
    tag: 'obs-caller-c1',
    candidate: false,
    fatalShots: true,
    explanation: 'c1 stock. Record the caller of thunk 0x6041a1f9 when d0 is 0x88b2 during the idle refresh, then the stores after it returns. EMULATOR-ONLY test-setup write of 0x88b2 only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'c1-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      state.m = ctx.l.sim.m;
      const { readKey, shot } = await boot(ctx, words_to_rgb, write_png);
      const subject = readKey(0x1e71, 0);
      const rest = shot('rest');
      if (subject !== 0 || rest.subject !== 0) throw new Error('subject ' + subject + ' ' + rest.subject);
      if (rest.k88b2 !== 526) throw new Error('rest cell ' + rest.k88b2);
      emit({
        id: 'c1-rest', step: 'rest', pass: true, problems: [],
        expect: { subject: 0, k88b2: 526, union: { x: 417, y: 265, w: 66, h: 70 } },
        actual: { subject: rest.subject, k88b2: rest.k88b2, union: rest.union, sha256: rest.sha256, owner: rest.owner, target: rest.target },
      });

      const runIdle = (phase) => {
        state.phase = phase;
        state.windowsLeft = 3;
        state.pending = 0;
        state.recording = false;
        state.closeSoon = false;
        armList();
        state.capture = true;
        ctx.idle(500);
        state.capture = false;
        if (state.recording || state.window) finishWindow();
        state.recording = false;
        state.pending = 0;
        state.closeSoon = false;
        setWatchpoints([], HOOKS);
        setProbes([], null);
        emit({
          id: 'c1-' + phase, step: phase, pass: state.errors.length === 0, problems: state.errors.length ? ['probe'] : [],
          expect: { errors: 0 }, actual: snapshotCounts(),
          note: 'EMULATOR-ONLY observation. Windows are the first index-0 returns of thunk 0x6041a1f9 in this idle.',
        });
      };

      runIdle('cell526');
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      const midCell = readKey(0x88b2, 0);
      if (midCell !== 412) throw new Error('setter readback ' + midCell);
      runIdle('cell412');
      const after = shot('after');
      const moved = after.union && rest.union && (after.union.x !== rest.union.x || after.union.y !== rest.union.y);
      const pass = after.k88b2 === 412 && after.subject === 0 && moved === true;
      emit({
        id: 'c1-after', step: 'after', pass, problems: pass ? [] : ['frame'],
        expect: { k88b2: 412, subject: 0, moved: true, union: { x: 356, y: 198, w: 65, h: 71 } },
        actual: { k88b2: after.k88b2, subject: after.subject, union: after.union, sha256: after.sha256, owner: after.owner, target: after.target, moved },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. No display change.',
      });
      if (!pass) throw new Error('after frame');
    },
  });

  const ok = stock.ok && state.errors.length === 0;
  emit({
    id: 'c1-done', step: 'done', pass: ok, problems: ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: stock.ok, failed: stock.failed, errors: state.errors, windows: state.windows.length, index0: state.index0 },
  });
  if (!ok) process.exit(1);
} catch (e) {
  emit({ id: 'c1-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
