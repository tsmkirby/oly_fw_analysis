// Version 1 of 6. Stock K1e size sweep, landscape.
// One process. For each zone the stock dial reaches, then one custom size,
// at position 529. Records the frame and every settings-getter call from the
// entry of 0x61184dd6 through that pass, plus object+0x364 and +0x374.
// Setter writes are test setup. No overlay and no display hook.
// OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_sweep_t9d.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_sweep_t9d.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const ENTRY = 0x61184dd6;
const WRITER = 0x61184e51;
const POSE = 0xa32c568c;
const OWN = 0xa031ed04;
const OBJ = 0x62c54158;
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

const OUT = resolve('work/out/obs-sweep.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};

function u32(sim, addr) {
  const a = addr >>> 0;
  if (a < 0x60000000 || a > 0xe0000000) return null;
  const b = sim.read(a, 4);
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
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3;
      if (rgb[i] === 31 && rgb[i + 1] === 31 && rgb[i + 2] === 31) n31 += 1;
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
      if (n >= 15 && n <= 8000) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return { marks, pixels, n31, boxes: marks.map(({ x, y, w: mw, h }) => ({ x, y, w: mw, h })) };
}

function bandSig(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  let n31 = 0, xsum = 0, ysum = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3;
      if (rgb[i] !== 31 || rgb[i + 1] !== 31 || rgb[i + 2] !== 31) continue;
      n31 += 1;
      xsum = (xsum + x) >>> 0;
      ysum = (ysum + y) >>> 0;
    }
  }
  return n31 + ':' + xsum + ':' + ysum;
}

function summarise(calls) {
  const rows = [];
  const index = new Map();
  for (const c of calls) {
    const k = c.site.toString(16) + ':' + c.key.toString(16) + ':' + c.index + ':' + c.ret;
    let row = index.get(k);
    if (!row) {
      row = { site: c.site, key: c.key, index: c.index, ret: c.ret, n: 0 };
      index.set(k, row);
      rows.push(row);
    }
    row.n += 1;
  }
  return rows;
}

function pickWindow(windows) {
  for (let i = windows.length - 1; i >= 0; i--) {
    if (windows[i].writer) return windows[i];
  }
  return windows.length ? windows[windows.length - 1] : null;
}

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  emit({
    id: 'sweep-plan', step: 'plan', pass: true, problems: [],
    expect: { model: 'E147', zones: DIAL.map((d) => d.id), position: POS },
    actual: { modelEnv: 'E147', version: 1 },
    note: 'K1e stock size sweep. Setter writes are test setup. No display hook.',
  });
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-sweep.jsonl',
    tag: 'sweep',
    candidate: false,
    fatalShots: true,
    explanation: 'sweep K1e. Stock landscape. Each dial zone and one custom size at position 529, set with the stock setter. EMULATOR-ONLY test setup. No display hook.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'sweep-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
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
      const shoot = async (file) => {
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed');
        const rgb = words_to_rgb(fr[2]);
        if (file) write_png(file, fr[0], fr[1], rgb);
        const g = greyMarks(rgb, fr[0]);
        return { ...g, sig: bandSig(rgb, fr[0]), w: fr[0], h: fr[1] };
      };
      const trace = { cur: null, windows: [], entries: [] };
      const l = ctx.l;
      const firmware = (addr) => addr >= 0x60021020 && addr < 0x62000000;
      l.observe(ctx.native(ENTRY), (lab, r) => {
        if (trace.cur) {
          trace.cur.unclosed = true;
          trace.windows.push(trace.cur);
          trace.cur = null;
        }
        const obj = r.a0 >>> 0;
        const win = {
          t: lab.lab_time(),
          ret: r.mdr >>> 0,
          obj,
          word: u32(lab.sim, (obj + 0x364) >>> 0),
          mode: u32(lab.sim, (obj + 0x374) >>> 0),
          fixedWord: u32(lab.sim, OBJ + 0x364),
          fixedMode: u32(lab.sim, OBJ + 0x374),
          calls: [],
          writer: null,
        };
        trace.cur = win;
        trace.entries.push(win.t);
        const ra = r.mdr >>> 0;
        if (!firmware(ra)) return;
        l.hook_rt(ra, (h, rr) => {
          if (trace.cur === win) {
            win.wordEnd = u32(lab.sim, obj + 0x364);
            win.modeEnd = u32(lab.sim, obj + 0x374);
            win.ended = lab.lab_time();
            trace.windows.push(win);
            trace.cur = null;
          }
          l.hooks.delete(ra);
          l.passthrough(rr);
        }, 'obs-frame-ret', true);
      }, 'obs-frame-entry');
      l.observe(ctx.native(WRITER), (lab, r) => {
        const win = trace.cur;
        if (!win || win.writer) return;
        const obj = r.a0 >>> 0;
        win.writer = {
          obj,
          word: u32(lab.sim, (obj + 0x364) >>> 0),
          mode: u32(lab.sim, (obj + 0x374) >>> 0),
        };
      }, 'obs-writer');
      l.observe(ctx.native(GET), (lab, r) => {
        const win = trace.cur;
        if (!win) return;
        if (win.calls.length >= 500) { win.truncated = true; return; }
        const site = r.mdr >>> 0;
        if (!firmware(site)) return;
        const rec = { site, key: r.d0 & 0xffff, index: r.d1 & 0xffff, ret: null };
        win.calls.push(rec);
        l.hook_rt(site, (h, rr) => {
          if (rec.ret === null) rec.ret = rr.d0 & 0xffff;
          l.hooks.delete(site);
          l.passthrough(rr);
        }, 'obs-get-ret', true);
      }, 'obs-getter');

      const beforeEntries = trace.entries.length;
      ctx.idle(1500);
      const idleTimes = trace.entries.slice(beforeEntries);
      const gaps = [];
      for (let i = 1; i < idleTimes.length; i++) gaps.push((idleTimes[i] - idleTimes[i - 1]) / 1e6);
      gaps.sort((a, b) => a - b);
      const idlePeriodMs = gaps.length ? gaps[(gaps.length - 1) >> 1] : null;
      emit({
        id: 'sweep-idle', step: 'idle', pass: idlePeriodMs != null, problems: idlePeriodMs == null ? ['no-gap'] : [],
        expect: { entries: '>1' },
        actual: { entries: idleTimes.length, gapsMs: gaps, idlePeriodMs, pose: ctx.l.sim.u32(POSE) >>> 0 },
        note: 'Median gap between completed entries of 0x61184dd6 during 1500 ms of idle, before any setter.',
      });

      const restFile = resolve('work/out/sweep-rest.png');
      const rest = await shoot(restFile);
      const restHash = createHash('sha256').update(readFileSync(restFile)).digest('hex');
      emit({
        id: 'sweep-rest', step: 'rest', pass: true, problems: [],
        expect: { frame: 'measured' },
        actual: {
          marks: rest.boxes, pixels: rest.pixels, n31: rest.n31, sha256: restHash,
          subject: readKey(0x1e71, 0), pose: ctx.l.sim.u32(POSE) >>> 0,
        },
        note: 'Stock rest before the sweep. Centre is the untouched half-press position.',
      });

      const callDump = {};
      const trials = [];
      let prev = rest;
      for (const spec of DIAL) {
        const from = trace.windows.length;
        const t0 = ctx.l.lab_time();
        setKey(0x84d1, 0, spec.kind);
        setKey(0x99a1, 0, spec.zone);
        for (let i = 0; i < 10; i++) setKey(0x1dd1, i, spec.dims[i] ?? 0);
        setKey(0x88b2, 0, POS);
        setKey(0x5962, 0, POS);
        setKey(0x5962, 1, POS);
        let latencyMs = null;
        let cursor = await shoot(null);
        if (cursor.sig !== prev.sig) latencyMs = (ctx.l.lab_time() - t0) / 1e6;
        const cap = t0 + 2500 * 1e6;
        while (ctx.l.lab_time() < cap && latencyMs == null) {
          ctx.idle(25);
          cursor = await shoot(null);
          if (cursor.sig !== prev.sig) latencyMs = (ctx.l.lab_time() - t0) / 1e6;
        }
        ctx.idle(400);
        const file = resolve('work/out/sweep-' + spec.id + '.png');
        const shot = await shoot(file);
        const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
        const mine = trace.windows.slice(from).filter((w) => w.ended != null || w.writer);
        const win = pickWindow(mine);
        const calls = win ? summarise(win.calls) : [];
        if (win) callDump[spec.id] = { calls: win.calls, summary: calls, writer: win.writer, word: win.word, mode: win.mode, wordEnd: win.wordEnd, modeEnd: win.modeEnd, obj: win.obj, truncated: !!win.truncated, nWindows: mine.length };
        let s1 = null;
        if (spec.id === 'small') {
          const pre = shot;
          const t1 = ctx.l.lab_time();
          ctx.key('s1', 'down');
          let s1Latency = null;
          let s1shot = await shoot(null);
          if (s1shot.sig !== pre.sig) s1Latency = (ctx.l.lab_time() - t1) / 1e6;
          const s1cap = t1 + 2000 * 1e6;
          while (ctx.l.lab_time() < s1cap && s1Latency == null) {
            ctx.idle(25);
            s1shot = await shoot(null);
            if (s1shot.sig !== pre.sig) s1Latency = (ctx.l.lab_time() - t1) / 1e6;
          }
          ctx.key('s1', 'up');
          ctx.idle(300);
          s1 = { latencyMs: s1Latency, changed: s1shot.sig !== pre.sig, marks: s1shot.boxes, n31: s1shot.n31 };
        }
        const cells = {
          k88b2: readKey(0x88b2, 0),
          k84d1: readKey(0x84d1, 0),
          k99a1: readKey(0x99a1, 0),
          k1dd1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => readKey(0x1dd1, i)),
          k5962_0: readKey(0x5962, 0),
          k5962_1: readKey(0x5962, 1),
          subject: readKey(0x1e71, 0),
        };
        const row = {
          id: spec.id, zone: spec.zone, kind: spec.kind, custom: !!spec.custom, position: POS,
          marks: shot.boxes, pixels: shot.pixels, n31: shot.n31, sha256, file: 'work/out/sweep-' + spec.id + '.png',
          visible: shot.boxes.length > 0,
          latencyMs, s1, cells,
          target: Array.from(ctx.l.sim.read(0xa33ca384, 10)),
          owner: ctx.l.sim.read(OWN, 1)[0],
          pose: ctx.l.sim.u32(POSE) >>> 0,
          window: win ? {
            obj: win.obj, word: win.word, mode: win.mode, wordEnd: win.wordEnd, modeEnd: win.modeEnd,
            writer: win.writer, nCalls: win.calls.length, truncated: !!win.truncated, summary: calls,
          } : null,
          nWindows: mine.length,
        };
        trials.push(row);
        emit({
          id: 'sweep-' + spec.id, step: 'zone', pass: cells.subject === 0 && cells.k88b2 === POS, problems: cells.subject !== 0 ? ['subject'] : (cells.k88b2 === POS ? [] : ['position']),
          expect: { zone: spec.zone, kind: spec.kind, position: POS, subject: 0 },
          actual: row,
          note: spec.custom ? 'One custom size, zone 6, dimensions 9 and 11.' : 'Dial zone ' + spec.id + '.',
        });
        prev = shot;
      }
      writeFileSync(resolve('work/out/sweep-calls.json'), JSON.stringify(callDump) + '\n');
      const latencies = trials.map((t) => t.latencyMs).filter((v) => v != null);
      const summary = {
        version: 1, position: POS, idlePeriodMs, idleGapsMs: gaps,
        rest: { marks: rest.boxes, pixels: rest.pixels, n31: rest.n31, sha256: restHash },
        latenciesMs: latencies,
        maxLatencyMs: latencies.length ? Math.max(...latencies) : null,
        trials: trials.map((t) => ({
          id: t.id, zone: t.zone, visible: t.visible, marks: t.marks, pixels: t.pixels, n31: t.n31,
          sha256: t.sha256, latencyMs: t.latencyMs, mode: t.window && t.window.writer ? t.window.writer.mode : (t.window ? t.window.mode : null),
          word: t.window && t.window.writer ? t.window.writer.word : (t.window ? t.window.word : null),
          nCalls: t.window ? t.window.nCalls : 0,
        })),
      };
      writeFileSync(resolve('work/out/sweep-summary.json'), JSON.stringify(summary, null, 2) + '\n');
      emit({
        id: 'sweep-done', step: 'done', pass: true, problems: [],
        expect: { trials: DIAL.length },
        actual: { trials: trials.length, visible: trials.filter((t) => t.visible).map((t) => t.id), idlePeriodMs, maxLatencyMs: summary.maxLatencyMs },
        note: 'Hashes of these frames are the K1e references. No candidate has run.',
      });
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'sweep-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
