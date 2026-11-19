// T9 correction experiment version 7. Stock K1, observation only.
// OM_EMU_MODEL=E147 is assigned before any import of emu/src/fw/model.mjs.
// Watches the corner-pixel writes and the draw calls behind them, and records
// whether 0x609eece3 (the function after the return at 0x609eece0) runs.
// No firmware write and no overlay. Do not edit after it has run.
// Usage: node26 work/scripts/obs_path_v7.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_path_v7.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET_API = 0x50ac4afe;
const CONVERTER = 0x604050e5;
const CONSUMER = 0xa33ca384;
const DIRTY = 0xa33f2cea;
const POS = 0x609eece3;
const POS_OLD = 0x609eec84;
const WATCH_KEYS = new Set([0x88b2, 0x5962, 0x84d1, 0x99a1, 0x1dd1]);
const OUT = resolve('work/out/obs-path-v7.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const s16 = (v) => { const n = v & 0xffff; return n & 0x8000 ? n - 0x10000 : n; };
const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

function greyMarks(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => {
    const i = (y * w + x) * 3;
    const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
    const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
    return lo >= 18 && hi <= 60 && hi - lo <= 12;
  };
  const out = [];
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
      if (n >= 15 && n <= 400) out.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

function unionOf(marks) {
  if (!marks.length) return null;
  const x = Math.min(...marks.map((m) => m.x));
  const y = Math.min(...marks.map((m) => m.y));
  return { x, y, w: Math.max(...marks.map((m) => m.x + m.w)) - x, h: Math.max(...marks.map((m) => m.y + m.h)) - y };
}

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'v7-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147', role: 'stock-k1' },
    actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 7. Observation. The env is set before the model module is imported. No overlay.',
  });
  if (!envPass) process.exit(1);
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-path-v7.jsonl',
    tag: 'obs-path-v7',
    candidate: false,
    fatalShots: true,
    explanation: 'v7 stock K1. No overlay and no firmware write. Draw, getter and position observers only record. The framebuffer watch only logs.',
    change: 'none',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const modelPass = MODEL === 'E147';
      emit({
        id: 'v7-model', step: 'model', pass: modelPass, problems: modelPass ? [] : ['model'],
        expect: { model: 'E147' }, actual: { model: MODEL },
        note: 'Read before bring-up and before any key.',
      });
      if (!modelPass) throw new Error('model ' + MODEL);

      const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
      const osd = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/osd.mjs')).href);
      const text = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/text.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const API_SET = A(SET_API);

      let phase = 'boot';
      let armed = false;
      let seq = 0;
      const posCount = {};
      const oldCount = {};
      const posSamples = [];
      const gets = [];
      const draws = [];
      const updates = [];
      const watch = { count: 0, pcs: {}, samples: [], error: null };
      const bump = (map) => { map[phase] = (map[phase] || 0) + 1; };

      function chain(r) {
        const frames = [];
        try {
          let sp = r.sp >>> 0;
          let ra = r.mdr >>> 0;
          for (let depth = 0; depth < 6; depth++) {
            const raw = ctx.l.sim.read(sp, 48);
            const words = [];
            for (let k = 0; k < 12; k++) words.push(u32(raw, k * 4));
            frames.push({ ra: hex(ra), sp: hex(sp), top: hex(words[0]), words: words.map(hex) });
            let next = null;
            let idx = -1;
            for (let i = 1; i < words.length; i++) {
              if (words[i] >= 0x60021020 && words[i] < 0x62021020) { next = words[i]; idx = i; break; }
            }
            if (next === null) break;
            sp = (sp + idx * 4) >>> 0;
            ra = next;
          }
        } catch (e) {
          frames.push({ error: String(e.message || e) });
        }
        return frames;
      }

      function noteGet(r) {
        if (!armed || gets.length >= 160) return;
        const key = r.d0 & 0xffff;
        if (!WATCH_KEYS.has(key)) return;
        gets.push({ seq: ++seq, phase, caller: hex(r.mdr), key: hex(key), index: r.d1 & 0xffff });
      }
      try {
        ctx.l.wrap(ctx.native(GET), (prev) => (hle, r) => { noteGet(r); prev(hle, r); }, 'obs-t9-get-v7');
      } catch {
        ctx.l.observe(ctx.native(GET), (lab, r) => noteGet(r), 'obs-t9-get-v7');
      }
      ctx.l.observe(ctx.native(POS), (lab, r) => {
        bump(posCount);
        if (!armed || posSamples.length >= 24) return;
        posSamples.push({
          seq: ++seq, phase, caller: hex(r.mdr),
          d0: r.d0 >>> 0, d1: r.d1 >>> 0, a0: hex(r.a0), a1: hex(r.a1), chain: chain(r),
        });
      }, 'obs-pos-609eece3');
      ctx.l.observe(ctx.native(POS_OLD), () => { bump(oldCount); }, 'obs-pos-609eec84');

      const onRect = (prev) => (hle, r) => {
        let hit = null;
        try {
          const [h, colour, layer] = ctx.l.stack_args(r, 3);
          hit = {
            x: menu.s16(r.d0), y: menu.s16(r.d1), w: menu.s16(r.a1), h: s16(h),
            colour: colour >>> 0, layer: layer & 0xffff, a0: hex(r.a0),
          };
        } catch (e) {
          hit = { error: String(e.message || e), caller: hex(r.mdr) };
        }
        const frameLike = hit && !hit.error && ((hit.w >= 2 && hit.w <= 8 && hit.h >= 20 && hit.h <= 140) || (hit.h >= 2 && hit.h <= 8 && hit.w >= 20 && hit.w <= 140));
        const inBand = hit && !hit.error && hit.x >= 250 && hit.x <= 750 && hit.y >= 80 && hit.y <= 520;
        if (armed && frameLike && inBand && draws.length < 40) {
          draws.push({ seq: ++seq, phase, caller: hex(r.mdr), ...hit, chain: chain(r) });
        } else if (armed && frameLike && draws.length < 40) {
          draws.push({ seq: ++seq, phase, caller: hex(r.mdr), ...hit, chain: chain(r) });
        }
        prev(hle, r);
      };
      ctx.l.wrap(menu.GPI_DRAW_RECT, onRect, 'obs-t9-rect-v7');
      ctx.l.wrap(menu.GPI_UPDATE, (prev) => (hle, r) => {
        if (armed && updates.length < 30) updates.push({ seq: ++seq, phase, caller: hex(r.mdr), d0: r.d0 >>> 0 });
        prev(hle, r);
      }, 'obs-t9-update-v7');

      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }
      function cells() {
        return {
          k99a1: [readKey(0x99a1, 0), readKey(0x99a1, 1)],
          k84d1: readKey(0x84d1, 0),
          k88b2: readKey(0x88b2, 0),
          k5962: [readKey(0x5962, 0), readKey(0x5962, 1)],
          size: [readKey(0x1dd1, 0), readKey(0x1dd1, 1)],
          k1e71: readKey(0x1e71, 0),
        };
      }
      function target() { return Array.from(ctx.l.sim.read(CONSUMER, 10)); }
      function shot(id) {
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed at ' + id);
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/obs-path-v7-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const png = readFileSync(file);
        const marks = greyMarks(rgb, fr[0]);
        return {
          file: 'work/out/obs-path-v7-' + id + '.png',
          sha256: createHash('sha256').update(png).digest('hex'),
          marks, union: unionOf(marks),
        };
      }
      function records() {
        const out = [];
        for (let i = 0; i <= osd.NRECORDS; i++) {
          let address = 0;
          try {
            address = i < osd.NRECORDS ? ctx.l.sim.u32(osd.REGISTRY + 8 * i) >>> 0 : osd.KIND3_RECORD >>> 0;
            const raw = ctx.l.sim.read(address, 16);
            out.push({
              slot: i, address: hex(address), base: hex(u32(raw, 0)), kind: u32(raw, 4),
              stride: u16(raw, 8), height: u16(raw, 10), x: u16(raw, 12), y: u16(raw, 14),
            });
          } catch (e) {
            out.push({ slot: i, address: hex(address), error: String(e.message || e) });
          }
        }
        return out;
      }
      function findColour(list, colour) {
        const found = [];
        for (const rec of list) {
          if (rec.error || !rec.stride || !rec.height) continue;
          const base = parseInt(rec.base, 16);
          const bytes = rec.stride * rec.height;
          if (bytes <= 0 || bytes > 4000000) continue;
          for (let off = 0; off < bytes && found.length < 8; off += 0x800) {
            let chunk;
            try { chunk = ctx.l.sim.read((base + off) >>> 0, Math.min(0x800, bytes - off)); }
            catch { break; }
            for (let i = 0; i + 4 <= chunk.length && found.length < 8; i++) {
              if (chunk[i] === colour && chunk[i + 1] === colour && chunk[i + 2] === colour && chunk[i + 3] === colour) {
                found.push({ slot: rec.slot, addr: hex((base + off + i) >>> 0), colour });
                i += 16;
              }
            }
          }
        }
        return found;
      }
      function setWatch(ranges) {
        watch.count = 0;
        watch.pcs = {};
        watch.samples = [];
        watch.error = null;
        try {
          ctx.l.sim.m.setWatchpoints(ranges.map((range, n) => ({
            id: n + 1, lo: range.lo >>> 0, hi: range.hi >>> 0, kind: 2, stop: false,
          })), {
            onLog(rec) {
              watch.count += 1;
              const pc = rec.pc >>> 0;
              const key = hex(pc);
              watch.pcs[key] = (watch.pcs[key] || 0) + 1;
              if (watch.samples.length < 30) {
                watch.samples.push({ pc: key, addr: hex(rec.addr), size: rec.size, value: rec.value >>> 0, insns: rec.insns });
              }
            },
          });
        } catch (e) {
          watch.error = String(e.message || e);
        }
      }
      function clearWatch() {
        try { ctx.l.sim.m.setWatchpoints([]); } catch (e) { watch.error = String(e.message || e); }
      }
      function take(bucket) {
        const row = {
          gets: gets.splice(0, gets.length),
          draws: draws.splice(0, draws.length),
          updates: updates.splice(0, updates.length),
          posSamples: posSamples.splice(0, posSamples.length),
          watch: { count: watch.count, pcs: watch.pcs, samples: watch.samples, error: watch.error },
        };
        watch.count = 0;
        watch.pcs = {};
        watch.samples = [];
        bucket.push(row);
        return row;
      }

      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(300);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
      ctx.idle(200);
      if (ctx.s.get(289) !== 0 || ctx.s.get(25) !== 0) throw new Error('focus');
      ctx.press('menu');
      for (let i = 0; i < 20; i++) ctx.press('left');
      const menuShot = ctx.shot('subject');
      const subject = readKey(0x1e71, 0);
      const subjectProblems = [];
      if (menuShot.highlight !== 'Subject Detection') subjectProblems.push('highlight');
      if (!menuShot.texts.includes('Off')) subjectProblems.push('off-text');
      if (subject !== 0) subjectProblems.push('subject');
      emit({
        id: 'v7-subject', step: 'subject', pass: subjectProblems.length === 0, problems: subjectProblems,
        expect: { highlight: 'Subject Detection', off: true, subject: 0 },
        actual: { highlight: menuShot.highlight, off: menuShot.texts.includes('Off'), subject },
      });
      if (subjectProblems.length) throw new Error('subject');
      for (let i = 0; i < 8 && ctx.s.screen() !== 'shooting'; i++) ctx.press('menu');

      const restCells = cells();
      const restShot = shot('rest');
      const restPass = restShot.marks.length === 4 && restCells.k1e71 === 0 && restCells.k88b2 === 526;
      emit({
        id: 'v7-rest', step: 'rest', pass: restPass, problems: restPass ? [] : ['rest'],
        expect: { marks: 4, subject: 0, position: 526 },
        actual: { marks: restShot.marks, union: restShot.union, png: restShot.sha256, cells: restCells, target: target(), dirty: ctx.l.sim.read(DIRTY, 1)[0] },
      });
      if (!restPass) throw new Error('rest');

      const recs = records();
      let colourHits = findColour(recs, 22);
      if (!colourHits.length) colourHits = findColour(recs, 31);
      emit({
        id: 'v7-buffers', step: 'buffers', pass: recs.some((r) => r.base), problems: recs.some((r) => r.base) ? [] : ['records'],
        expect: { recordReadable: true },
        actual: { records: recs, colourHits },
      });
      const ranges = colourHits.slice(0, 2).map((hit) => ({ lo: parseInt(hit.addr, 16), hi: parseInt(hit.addr, 16) + 8 }));

      phase = 'idle';
      armed = true;
      if (ranges.length) setWatch(ranges);
      ctx.idle(200);
      armed = false;
      clearWatch();
      const idleRow = take([]);
      const idlePass = idleRow.watch.error === null;
      emit({
        id: 'v7-idle', step: 'idle', pass: idlePass, problems: idlePass ? [] : ['watch'],
        expect: { watchError: null },
        actual: {
          watchCount: idleRow.watch.count, watchPcs: idleRow.watch.pcs, watchError: idleRow.watch.error,
          frameDraws: idleRow.draws.length, posEntries: posCount.idle || 0, oldEntries: oldCount.idle || 0,
          updates: idleRow.updates.length,
        },
        draws: idleRow.draws.slice(0, 8),
        note: 'Armed rest idle. Writes here are a periodic refresh. No writes means the corner is not repainted until something invalidates it.',
      });

      phase = 'direct';
      ctx.press('up');
      if (ctx.s.screen() !== 'direct') throw new Error('direct ' + ctx.s.screen());
      let sawSingle = false;
      for (let i = 0; i < 8; i++) {
        ctx.s.dial_input('main', 1);
        ctx.s.camapp.pump();
        ctx.idle(300);
        const size = [readKey(0x1dd1, 0), readKey(0x1dd1, 1)];
        if (size[0] === 1 && size[1] === 1) sawSingle = true;
        if (sawSingle && size[0] === 3 && size[1] === 3) break;
      }
      const before = cells();
      ctx.press('right');
      const after = cells();
      const movedCell = after.k88b2 !== before.k88b2 || after.k5962[0] !== before.k5962[0];
      emit({
        id: 'v7-direct', step: 'direct', pass: sawSingle && movedCell && after.size[0] === 3,
        problems: [sawSingle ? null : 'single', movedCell ? null : 'position', after.size[0] === 3 ? null : 'size'].filter(Boolean),
        expect: { sawSingle: true, size: [3, 3], moved: true },
        actual: { sawSingle, before, after, posCount: { ...posCount }, oldCount: { ...oldCount } },
      });
      if (!sawSingle || !movedCell) throw new Error('direct');

      phase = 'ok';
      armed = true;
      if (ranges.length) setWatch(ranges);
      ctx.press('ok');
      ctx.idle(200);
      const okShot = shot('ok');
      armed = false;
      clearWatch();
      const okRow = take([]);
      const okMoved = JSON.stringify(okShot.union) !== JSON.stringify(restShot.union);
      const okCells = cells();
      emit({
        id: 'v7-ok', step: 'ok', pass: okMoved && okShot.marks.length === 4 && okCells.k1e71 === 0,
        problems: [okMoved ? null : 'union', okShot.marks.length === 4 ? null : 'marks', okCells.k1e71 === 0 ? null : 'subject'].filter(Boolean),
        expect: { marks: 4, subject: 0, unionDiffersFromRest: true },
        actual: {
          marks: okShot.marks, union: okShot.union, restUnion: restShot.union, png: okShot.sha256,
          cells: okCells, target: target(), dirty: ctx.l.sim.read(DIRTY, 1)[0],
          watchCount: okRow.watch.count, watchPcs: okRow.watch.pcs, watchSamples: okRow.watch.samples, watchError: okRow.watch.error,
          draws: okRow.draws, updates: okRow.updates, gets: okRow.gets, posSamples: okRow.posSamples,
          posCount: { ...posCount }, oldCount: { ...oldCount },
        },
      });

      phase = 'afon';
      armed = true;
      if (ranges.length) setWatch(ranges);
      ctx.key('afon', 'down');
      ctx.idle(250);
      const afonShot = shot('afon');
      ctx.key('afon', 'up');
      ctx.idle(250);
      const afonUp = shot('afon-up');
      armed = false;
      clearWatch();
      const afonRow = take([]);
      const afonCells = cells();
      const afonSame = JSON.stringify(afonShot.union) === JSON.stringify(okShot.union);
      emit({
        id: 'v7-afon', step: 'afon', pass: afonCells.k1e71 === 0 && ctx.s.screen() === 'shooting',
        problems: [afonCells.k1e71 === 0 ? null : 'subject', ctx.s.screen() === 'shooting' ? null : 'screen'].filter(Boolean),
        expect: { subject: 0, screen: 'shooting' },
        actual: {
          unionSameAsOk: afonSame, union: afonShot.union, upUnion: afonUp.union,
          png: afonShot.sha256, upPng: afonUp.sha256, marks: afonShot.marks,
          cells: afonCells, target: target(),
          watchCount: afonRow.watch.count, watchPcs: afonRow.watch.pcs, watchSamples: afonRow.watch.samples, watchError: afonRow.watch.error,
          draws: afonRow.draws, updates: afonRow.updates, gets: afonRow.gets, posSamples: afonRow.posSamples,
          posCount: { ...posCount }, oldCount: { ...oldCount },
        },
        note: 'Stock AF-ON. Counts say whether the press repaints the corner. unionSameAsOk is measured, not assumed.',
      });
    },
  });
  emit({
    id: 'v7-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: result.ok, failed: result.failed },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v7-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
