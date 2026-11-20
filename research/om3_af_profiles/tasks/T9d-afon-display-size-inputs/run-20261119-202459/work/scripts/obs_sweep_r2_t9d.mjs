// Correction version 1. Stock K1e size sweep, landscape, position 529.
// One emulator process. No overlay and no display hook.
// A store watch on object 0x62c54158 + 0x374 is armed in PlayLab.preinit,
// after the machine exists and before OsdLab.mm_ctors, so it is armed
// before the first guest instruction and before the first translation of
// the code that writes that word.
// Every refresh of 0x61184dd6 is kept, with a timestamped id, its getter
// calls, and the frame signature of the sample that followed it.
// The shared validation library is hashed before this process imports the
// emulator. Do not edit after it has run.
// Usage: node26 work/scripts/obs_sweep_r2_t9d.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_sweep_r2_t9d.mjs om-emu\n');
  process.exit(2);
}

function shaFile(p) {
  const b = readFileSync(p);
  return { path: p.replaceAll('\\', '/'), sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}

mkdirSync(resolve('work/out'), { recursive: true });
const lib = shaFile(resolve('work/scripts/lib_valid_t9d.mjs'));
const refs = [
  'work/out/sweep-small.png',
  'work/out/sweep-single.png',
  'work/out/ref-k1e-a.json',
  'work/out/ref-k1e-b.json',
  'work/out/ref-k2.json',
].map((p) => shaFile(resolve(p)));
const pre = {
  step: 'before-emulator',
  note: 'SHA-256 of the shared validation library and the already-made references, written before the emulator is imported. This run is stock. It does not install the display hook.',
  libValid: lib,
  references: refs,
};
writeFileSync(resolve('work/out/pre-r2.json'), JSON.stringify(pre, null, 2) + '\n');
console.log(JSON.stringify({ step: 'lib-digest', sha256: lib.sha256, bytes: lib.bytes }));

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const { PlayLab } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/play.mjs')).href);
const { S, R } = await import(pathToFileURL(resolve(checkout, 'emu/src/core/cpu.mjs')).href);
const mem = await import(pathToFileURL(resolve(checkout, 'emu/src/core/mem.mjs')).href);

const OBJ = 0x62c54158;
const MODE = (OBJ + 0x374) >>> 0;
const MODE_U = (MODE + 0x40000000) >>> 0;
const PAGE = MODE >>> 16;
const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const ENTRY = 0x61184dd6;
const WRITER = 0x61184e51;
const POSE = 0xa32c568c;
const OWN = 0xa031ed04;
const POS = 529;
const DIAL = [
  { id: 'all', zone: 0, kind: 2, dims: { 0: 1, 1: 1 } },
  { id: 'single', zone: 1, kind: 0, dims: { 0: 1, 1: 1 } },
  { id: 'small', zone: 2, kind: 3, dims: { 0: 3, 1: 3 } },
  { id: 'cross', zone: 3, kind: 3, dims: { 0: 1, 1: 1 } },
  { id: 'mid', zone: 5, kind: 3, dims: { 0: 1, 1: 1 } },
  { id: 'large', zone: 10, kind: 3, dims: { 0: 1, 1: 1 } },
  { id: 'c1', zone: 6, kind: 7, dims: { 0: 5, 1: 7, 2: 5, 3: 7 } },
  { id: 'c2', zone: 7, kind: 7, dims: { 4: 5, 5: 7 } },
  { id: 'c3', zone: 8, kind: 7, dims: { 6: 5, 7: 7 } },
  { id: 'c4', zone: 9, kind: 7, dims: { 8: 5, 9: 7 } },
  { id: 'custom', zone: 6, kind: 7, dims: { 0: 9, 1: 11, 2: 9, 3: 11 }, custom: true },
];

const live = { phase: 'boot', refresh: null, machine: null, armed: null };
const stores = [];
const storeCounts = new Map();
const lastValue = new Map();
const getterRing = [];
let storeSeq = 0;
let keptStores = 0;
let skippedStores = 0;

const STORE_PATH = resolve('work/out/mode-stores-r2.jsonl');
const WIN_PATH = resolve('work/out/refresh-r2.jsonl');
writeFileSync(STORE_PATH, '');
writeFileSync(WIN_PATH, '');

function u32bytes(b, o) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

function onStore(rec) {
  try {
    storeSeq += 1;
    const pc = rec.pc >>> 0;
    const addr = rec.addr >>> 0;
    const value = rec.value >>> 0;
    const prev = lastValue.has(addr) ? lastValue.get(addr) : null;
    const changed = prev !== value;
    lastValue.set(addr, value);
    const nPc = (storeCounts.get(pc) || 0) + 1;
    storeCounts.set(pc, nPc);
    const keep = live.phase !== 'boot' || changed || nPc <= 12;
    if (!keep) { skippedStores += 1; return; }
    const machine = live.machine;
    const sp = R[8] >>> 0;
    const mdr = R[11] >>> 0;
    let stack = [];
    let codePtrs = [];
    let bytes = null;
    if (machine) {
      try {
        const raw = machine.dbgRead(sp, 80);
        for (let i = 0; i < 20; i++) stack.push(u32bytes(raw, i * 4));
      } catch { stack = []; }
      try { bytes = [...machine.dbgRead(pc, 8)]; } catch { bytes = null; }
    }
    const seen = new Set();
    const chain = [];
    for (const v of [mdr, ...stack]) {
      if (v < 0x60021020 || v >= 0x62000000 || seen.has(v)) continue;
      seen.add(v);
      chain.push(v);
      if (chain.length >= 12) break;
    }
    codePtrs = chain;
    const row = {
      n: storeSeq,
      phase: live.phase,
      refresh: live.refresh,
      t: machine && machine.devices && machine.devices.clock ? machine.devices.clock.t : null,
      insns: rec.insns,
      pc, addr, size: rec.size, value, prev, changed,
      regs: {
        d0: R[0] >>> 0, d1: R[1] >>> 0, d2: R[2] >>> 0, d3: R[3] >>> 0,
        a0: R[4] >>> 0, a1: R[5] >>> 0, a2: R[6] >>> 0, a3: R[7] >>> 0,
        sp, mdr,
      },
      chain: codePtrs,
      stack,
      bytes,
      getters: getterRing.slice(-8).map((g) => ({ t: g.t, site: g.site, key: g.key, index: g.index, ret: g.ret, refresh: g.refresh })),
    };
    stores.push(row);
    keptStores += 1;
    appendFileSync(STORE_PATH, JSON.stringify(row) + '\n');
  } catch { /* a watch must not change the run */ }
}

function arm(lab) {
  const machine = lab.sim.m;
  live.machine = machine;
  machine.setWatchpoints([
    { id: 'mode', lo: MODE, hi: MODE + 4, kind: 2, stop: false },
    { id: 'mode-uncached', lo: MODE_U, hi: MODE_U + 4, kind: 2, stop: false },
  ], { onLog: onStore });
  live.armed = {
    where: 'PlayLab.preinit, after the machine exists and before OsdLab.mm_ctors',
    insns: S.insns,
    pc: R[9] >>> 0,
    mode: MODE,
    modeUncached: MODE_U,
    page: PAGE,
    wp: mem.WP[PAGE],
    rp: mem.RP[PAGE],
  };
}

const origPreinit = PlayLab.prototype.preinit;
PlayLab.prototype.preinit = function preinitR2(opts) {
  const ret = origPreinit.call(this, opts);
  arm(this);
  return ret;
};

const OUT = resolve('work/out/obs-sweep-r2.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, step: row.step }));
  writeFileSync(OUT, lines.join('\n') + '\n');
};

function is31(rgb, i) {
  return rgb[i] === 31 && rgb[i + 1] === 31 && rgb[i + 2] === 31;
}

function sigOf(rgb, w, h, x0, y0, x1, y1) {
  let n = 0;
  let xs = 0;
  let ys = 0;
  const buf = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3;
      if (!is31(rgb, i)) continue;
      n += 1;
      xs = (xs + x) >>> 0;
      ys = (ys + y) >>> 0;
      buf.push(x & 0xff, x >>> 8, y & 0xff, y >>> 8);
    }
  }
  return {
    n31: n,
    xsum: xs,
    ysum: ys,
    sha256: createHash('sha256').update(Buffer.from(buf)).digest('hex'),
  };
}

function marks31(rgb, w, h) {
  const seen = new Uint8Array(w * h);
  const marks = [];
  let pixels = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (!is31(rgb, i)) continue;
      const si = x + y * w;
      if (seen[si]) continue;
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
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = nx + ny * w;
          if (seen[ni] || !is31(rgb, (ny * w + nx) * 3)) continue;
          seen[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      pixels += n;
      if (n >= 8) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return { marks, pixels };
}

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-sweep-r2.jsonl',
    tag: 'sweep-r2',
    candidate: false,
    fatalShots: true,
    nvramPath: 'work/out/nvram-sweep-r2.json',
    explanation: 'Correction sweep. Stock landscape. Store watch armed in PlayLab.preinit before the first guest instruction. Every refresh is recorded. No display hook. EMULATOR-ONLY observation only.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      const watchStill = mem.WP[PAGE] < 0;
      emit({
        id: 'r2-arm', step: 'arm', pass: live.armed !== null && live.armed.insns === 0 && watchStill,
        problems: live.armed === null ? ['not-armed'] : (watchStill ? [] : ['watch-page-fast']),
        expect: { insns: 0, wp: -1, before: 'first guest instruction' },
        actual: { armed: live.armed, wpNow: mem.WP[PAGE], libValid: lib },
        note: 'The watch was armed in preinit. insns 0 means no guest instruction had run, so the storing code had not been translated.',
      });
      emit({
        id: 'r2-model', step: 'model', pass: true, problems: [],
        expect: { model: 'E147' }, actual: { model: MODEL },
        note: 'Read before bring-up and before any key.',
      });
      live.phase = 'bring-up';
      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(A(SET_API), { d0: 289, d1: argument }, null, null, 200000);
      ctx.l.call(A(SET_API), { d0: 1712, d1: 0 }, null, null, 200000);
      ctx.idle(150);
      const readKey = (key, index) => ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      const setKey = (key, index, value) => {
        ctx.l.call(ctx.native(SET), { d0: key, d1: index, a1: value }, null, null, 200000);
        const got = readKey(key, index);
        if (got !== (value & 0xffff)) throw new Error('setter readback ' + key.toString(16) + '[' + index + '] ' + got);
      };
      if (readKey(0x1e71, 0) !== 0) throw new Error('subject');

      const trace = { cur: null, windows: [], seq: 0 };
      const samples = [];
      let sampleN = 0;
      const firmware = (addr) => addr >= 0x60021020 && addr < 0x62000000;
      const l = ctx.l;

      function writeWindow(win) {
        const row = {
          id: win.id,
          tEntry: win.tEntry,
          tEnd: win.tEnd ?? null,
          unclosed: !!win.unclosed,
          ret: win.ret,
          obj: win.obj,
          word: win.word,
          mode: win.mode,
          wordEnd: win.wordEnd ?? null,
          modeEnd: win.modeEnd ?? null,
          writer: win.writer,
          nCalls: win.calls.length,
          truncated: !!win.truncated,
          calls: win.calls.map((c) => ({ t: c.t, site: c.site, key: c.key, index: c.index, ret: c.ret })),
          phase: win.phase,
        };
        appendFileSync(WIN_PATH, JSON.stringify(row) + '\n');
      }

      function stamp(sample) {
        let n = 0;
        for (const w of trace.windows) {
          if (w.sampleId || w.tEnd == null) continue;
          w.sampleId = sample.id;
          w.sampleT = sample.t;
          w.sig = sample.full;
          w.sigOld = sample.old;
          n += 1;
        }
        sample.stamped = n;
      }

      const shoot = async (file) => {
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed');
        const rgb = words_to_rgb(fr[2]);
        if (file) write_png(file, fr[0], fr[1], rgb);
        const full = sigOf(rgb, fr[0], fr[1], 0, 0, fr[0], fr[1]);
        const old = sigOf(rgb, fr[0], fr[1], 280, 60, Math.min(780, fr[0]), Math.min(520, fr[1]));
        const sample = {
          id: 's' + sampleN,
          t: ctx.l.lab_time(),
          refresh: trace.cur ? trace.cur.id : (trace.windows.length ? trace.windows[trace.windows.length - 1].id : null),
          full, old,
          w: fr[0], h: fr[1],
        };
        sampleN += 1;
        stamp(sample);
        samples.push(sample);
        return { rgb, w: fr[0], h: fr[1], sample };
      };

      l.observe(ctx.native(ENTRY), (lab, r) => {
        if (trace.cur) {
          trace.cur.unclosed = true;
          trace.cur.tEnd = lab.lab_time();
          trace.windows.push(trace.cur);
          writeWindow(trace.cur);
          trace.cur = null;
        }
        const obj = r.a0 >>> 0;
        const win = {
          id: 'r' + trace.seq,
          tEntry: lab.lab_time(),
          ret: r.mdr >>> 0,
          obj,
          word: null,
          mode: null,
          calls: [],
          writer: null,
          phase: live.phase,
        };
        try {
          const b = lab.sim.read((obj + 0x364) >>> 0, 4);
          win.word = u32bytes(b, 0);
          const m = lab.sim.read((obj + 0x374) >>> 0, 4);
          win.mode = u32bytes(m, 0);
        } catch { /* unreadable object */ }
        trace.seq += 1;
        trace.cur = win;
        live.refresh = win.id;
        const ra = r.mdr >>> 0;
        if (!firmware(ra)) return;
        l.hook_rt(ra, (h, rr) => {
          if (trace.cur === win) {
            try {
              const b = lab.sim.read((obj + 0x364) >>> 0, 4);
              win.wordEnd = u32bytes(b, 0);
              const m = lab.sim.read((obj + 0x374) >>> 0, 4);
              win.modeEnd = u32bytes(m, 0);
            } catch { /* unreadable */ }
            win.tEnd = lab.lab_time();
            trace.windows.push(win);
            writeWindow(win);
            trace.cur = null;
            live.refresh = null;
          }
          l.hooks.delete(ra);
          l.passthrough(rr);
        }, 'obs-r2-frame-ret', true);
      }, 'obs-r2-frame-entry');

      l.observe(ctx.native(WRITER), (lab, r) => {
        const win = trace.cur;
        if (!win || win.writer) return;
        const obj = r.a0 >>> 0;
        let word = null;
        let mode = null;
        try {
          word = u32bytes(lab.sim.read((obj + 0x364) >>> 0, 4), 0);
          mode = u32bytes(lab.sim.read((obj + 0x374) >>> 0, 4), 0);
        } catch { /* unreadable */ }
        win.writer = { t: lab.lab_time(), obj, word, mode };
      }, 'obs-r2-writer');

      l.observe(ctx.native(GET), (lab, r) => {
        const site = r.mdr >>> 0;
        if (!firmware(site)) return;
        const rec = {
          t: lab.lab_time(),
          site,
          key: r.d0 & 0xffff,
          index: r.d1 & 0xffff,
          ret: null,
          refresh: trace.cur ? trace.cur.id : null,
        };
        getterRing.push(rec);
        if (getterRing.length > 64) getterRing.shift();
        const win = trace.cur;
        if (win) {
          if (win.calls.length >= 500) win.truncated = true;
          else win.calls.push(rec);
        }
        l.hook_rt(site, (h, rr) => {
          if (rec.ret === null) rec.ret = rr.d0 & 0xffff;
          l.hooks.delete(site);
          l.passthrough(rr);
        }, 'obs-r2-get-ret', true);
      }, 'obs-r2-getter');

      live.phase = 'idle';
      const beforeEntries = trace.seq;
      ctx.idle(1500);
      const idleWins = trace.windows.filter((w) => w.phase === 'idle' && w.tEnd != null);
      const gaps = [];
      for (let i = 1; i < idleWins.length; i++) gaps.push((idleWins[i].tEntry - idleWins[i - 1].tEntry) / 1e6);
      gaps.sort((a, b) => a - b);
      const idlePeriodMs = gaps.length ? gaps[(gaps.length - 1) >> 1] : null;
      const idleShot = await shoot(resolve('work/out/sweep-r2-rest.png'));
      emit({
        id: 'r2-idle', step: 'idle', pass: idlePeriodMs != null, problems: idlePeriodMs == null ? ['no-gap'] : [],
        expect: { entries: '>1' },
        actual: {
          newEntries: trace.seq - beforeEntries,
          closed: idleWins.length,
          gapsMs: gaps,
          idlePeriodMs,
          pose: ctx.l.sim.u32(POSE) >>> 0,
          sample: idleShot.sample.id,
        },
        note: 'Median gap between entries of 0x61184dd6 during 1500 ms of idle, before any setter.',
      });

      const trials = [];
      for (const spec of DIAL) {
        live.phase = spec.id;
        const from = trace.windows.length;
        setKey(0x84d1, 0, spec.kind);
        setKey(0x99a1, 0, spec.zone);
        for (let i = 0; i < 10; i++) setKey(0x1dd1, i, spec.dims[i] ?? 0);
        setKey(0x88b2, 0, POS);
        setKey(0x5962, 0, POS);
        setKey(0x5962, 1, POS);
        const cap = ctx.l.lab_time() + 800 * 1e6;
        let shot = null;
        while (ctx.l.lab_time() < cap) {
          ctx.idle(40);
          shot = await shoot(null);
        }
        const file = resolve('work/out/sweep-r2-' + spec.id + '.png');
        shot = await shoot(file);
        const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
        const boxes = marks31(shot.rgb, shot.w, shot.h);
        const mine = trace.windows.slice(from);
        const cells = {
          k88b2: readKey(0x88b2, 0),
          k84d1: readKey(0x84d1, 0),
          k99a1: readKey(0x99a1, 0),
          k1dd1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => readKey(0x1dd1, i)),
          subject: readKey(0x1e71, 0),
        };
        const row = {
          id: spec.id,
          zone: spec.zone,
          kind: spec.kind,
          custom: !!spec.custom,
          position: POS,
          sha256,
          file: 'work/out/sweep-r2-' + spec.id + '.png',
          marks: boxes.marks,
          pixels: boxes.pixels,
          n31: shot.sample.full.n31,
          sig: shot.sample.full,
          cells,
          target: Array.from(ctx.l.sim.read(0xa33ca384, 10)),
          owner: ctx.l.sim.read(OWN, 1)[0],
          pose: ctx.l.sim.u32(POSE) >>> 0,
          nWindows: mine.length,
          windowIds: mine.map((w) => w.id),
          windowsWithWriter: mine.filter((w) => w.writer).map((w) => ({
            id: w.id, tEntry: w.tEntry, mode: w.writer.mode, word: w.writer.word, nCalls: w.calls.length,
          })),
        };
        trials.push(row);
        emit({
          id: 'r2-' + spec.id, step: 'zone',
          pass: cells.subject === 0 && cells.k88b2 === POS,
          problems: cells.subject !== 0 ? ['subject'] : (cells.k88b2 === POS ? [] : ['position']),
          expect: { zone: spec.zone, kind: spec.kind, position: POS, subject: 0 },
          actual: {
            id: row.id, nWindows: row.nWindows, n31: row.n31, marks: row.marks,
            writerModes: row.windowsWithWriter.map((w) => w.mode),
            subject: cells.subject, position: cells.k88b2,
          },
          note: spec.custom ? 'Custom size, zone 6, dimensions 9 and 11. Full frame.' : 'Dial zone ' + spec.id + '.',
        });
      }
      live.phase = 'done';
      await shoot(null);
      const open = trace.cur;
      const finished = open ? trace.windows.concat([Object.assign(open, { unclosed: true })]) : trace.windows;
      const finalRows = finished.map((w) => ({
        id: w.id,
        tEntry: w.tEntry,
        tEnd: w.tEnd ?? null,
        unclosed: !!w.unclosed,
        ret: w.ret,
        obj: w.obj,
        word: w.word,
        mode: w.mode,
        wordEnd: w.wordEnd ?? null,
        modeEnd: w.modeEnd ?? null,
        writer: w.writer,
        phase: w.phase,
        nCalls: w.calls.length,
        truncated: !!w.truncated,
        calls: w.calls.map((c) => ({ t: c.t, site: c.site, key: c.key, index: c.index, ret: c.ret })),
        sampleId: w.sampleId ?? null,
        sampleT: w.sampleT ?? null,
        sig: w.sig ?? null,
        sigOld: w.sigOld ?? null,
      }));
      writeFileSync(WIN_PATH, finalRows.map((w) => JSON.stringify(w)).join('\n') + (finalRows.length ? '\n' : ''));
      const unsampled = trace.windows.filter((w) => w.tEnd != null && !w.sampleId).map((w) => w.id);
      const summary = {
        version: 'r2',
        position: POS,
        armed: live.armed,
        libValid: lib,
        idlePeriodMs,
        idleGapsMs: gaps,
        nWindows: trace.windows.length,
        nSamples: samples.length,
        openRefresh: open ? open.id : null,
        unsampled,
        storeSeq,
        keptStores,
        skippedStores,
        storePcs: [...storeCounts.entries()].map(([pc, n]) => ({ pc, n })),
        discardedFirstRun: 'The first sweep kept one writer window per trial in sweep-calls.json. The other windows from that process were not exported and cannot be reconstructed. This file is a new run.',
        trials: trials.map((t) => ({
          id: t.id, zone: t.zone, n31: t.n31, pixels: t.pixels, marks: t.marks, sha256: t.sha256,
          nWindows: t.nWindows, writerModes: t.windowsWithWriter.map((w) => w.mode),
        })),
      };
      writeFileSync(resolve('work/out/sweep-r2-summary.json'), JSON.stringify(summary, null, 2) + '\n');
      const sampleRows = samples.map((s) => ({
        id: s.id, t: s.t, refresh: s.refresh, stamped: s.stamped, full: s.full, old: s.old,
      }));
      writeFileSync(resolve('work/out/samples-r2.json'), JSON.stringify(sampleRows) + '\n');
      const linked = trace.windows.map((w) => ({
        id: w.id, tEntry: w.tEntry, tEnd: w.tEnd ?? null, sampleId: w.sampleId ?? null, sampleT: w.sampleT ?? null,
        sig: w.sig ?? null, phase: w.phase, nCalls: w.calls.length, writerMode: w.writer ? w.writer.mode : null,
      }));
      writeFileSync(resolve('work/out/refresh-index-r2.json'), JSON.stringify(linked) + '\n');
      emit({
        id: 'r2-done', step: 'done', pass: unsampled.length === 0 && keptStores > 0,
        problems: [...(unsampled.length ? ['unsampled'] : []), ...(keptStores > 0 ? [] : ['no-store'])],
        expect: { windows: '>0', stores: '>0', unsampled: 0 },
        actual: { windows: trace.windows.length, samples: samples.length, unsampled: unsampled.length, open: open ? open.id : null, keptStores, storeSeq },
        note: 'Every closed refresh has a later frame sample. Store records are mode-stores-r2.jsonl. Getter calls are on each refresh line.',
      });
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({
    id: 'r2-done', step: 'done', pass: false, problems: ['exception'],
    expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) },
  });
  process.exit(1);
}
