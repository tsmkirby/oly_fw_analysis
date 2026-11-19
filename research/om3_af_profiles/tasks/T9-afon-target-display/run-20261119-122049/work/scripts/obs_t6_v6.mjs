// T9 version 6. One EMULATOR-ONLY change: while the home builder publishes a
// record, the shooting positioner 0x609eec84 reads that record's position and
// kind instead of half-press 0x88b2 and 0x84d1, and the builder return runs
// the positioner so the frame is redrawn. The seeded mirror and half-press All
// are test setup. K2 reuses the T6 comparison with no seed and without this
// change. K1 is stock. A failed assertion ends ok:false. Do not edit after it has run.
// Usage: node26 work/scripts/obs_t6_v6.mjs om-emu
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_t6_v6.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET = 0x60063431;
const SET_API = 0x50ac4afe;
const CONVERTER = 0x604050e5;
const MIRROR = 0xa031eeb0;
const MIRROR_C = 0x6031eeb0;
const ZONE = 0xa031e920;
const POSE = 0xa32c568c;
const CONSUMER = 0xa33ca384;
const OWN = 0xa031ed00;
const POS_ENTRY = 0x609eec84;
const POS_LO = 0x609eec84;
const POS_HI = 0x609f0900;
const BUILDER_RET = 0x60a8f7d2;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
const ALL = [0x0e, 0x02, 0x02, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const SMALL = [0x11, 0x02, 0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const STOCK = [0x0e, 0x02, 0x02, 0x00, 0x1b, 0x00, 0x27, 0x00, 0x00, 0x00];
const T6_CSV = 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv';
const K2_CSV = 'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes-c1.csv';
const EDGES = [
  ['s1', 'down'], ['s1', 'up'],
  ['afon', 'down'], ['afon', 'up'],
  ['s1', 'down'], ['afon', 'down'], ['afon', 'up'], ['s1', 'up'],
  ['afon', 'down'], ['s1', 'down'], ['s1', 'up'], ['afon', 'up'],
];
const OWNERS = [1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0];
const AFON_EDGES = new Set([2, 5, 8, 9, 10]);
const HALF_CELLS = {
  k99a1: [0, 0, 2, 0, 2, 0, 5, 5],
  k9a41: 0, k84d1: 2, k88b2: 526,
  k5962: [526, 526, 526, 526, 526, 526],
  k1dd1: [1, 1, 3, 3, 3, 3, 3, 3, 3, 3],
  k1df1: [1, 1, 1, 1, 0, 0, 0, 0],
  k1e01: 0, kdfa1: 0, k99d2: [526, 526, 526],
  k90a1: [1, 1], k1db1: 0, k1dc1: 0,
};
const OUT = resolve('work/out/obs-t6-v6.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const u16 = (b) => b[0] | (b[1] << 8);

function q1Mirror() {
  const m = new Uint8Array(55);
  m[1] = 2;
  m[0x0c] = 529 & 0xff;
  m[0x0d] = (529 >> 8) & 0xff;
  m[0x22] = 529 & 0xff;
  m[0x23] = (529 >> 8) & 0xff;
  return Array.from(m);
}

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
      if (n >= 15 && n <= 4000) out.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

function hashWindow(rgb, w, box) {
  const hash = createHash('sha256');
  for (let y = box.y; y < box.y + box.h; y++) hash.update(rgb.subarray((y * w + box.x) * 3, (y * w + box.x + box.w) * 3));
  return hash.digest('hex');
}

function unionOf(marks) {
  if (!marks.length) return null;
  const x = Math.min(...marks.map((m) => m.x));
  const y = Math.min(...marks.map((m) => m.y));
  return {
    x, y,
    w: Math.max(...marks.map((m) => m.x + m.w)) - x,
    h: Math.max(...marks.map((m) => m.y + m.h)) - y,
  };
}

try {
  const { packRegs } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/sim.mjs')).href);
  emit({
    id: 'v6-plan', step: 'plan', pass: true, problems: [],
    note: 'One EMULATOR-ONLY change. The positioner reads the builder record while that record is published, then the builder return runs the positioner. Half-press All and the mirror seed are test setup.',
    expectAfon: { x: 356, y: 265, tolerance: 30, marks: 4 },
    small: SMALL, all: ALL, stock: STOCK,
  });
  for (const role of ['candidate', 'k2', 'k1']) {
    const profile = role === 'candidate';
    const z5 = role !== 'k1';
    let hook = null;
    const result = await runZone({
      checkout,
      outPath: 'work/out/session-obs-t6-v6-' + role + '.jsonl',
      tag: 'obs-t6-v6-' + role,
      candidate: z5,
      help: true,
      rowLabel: true,
      overlayCsv: profile ? T6_CSV : (z5 ? K2_CSV : null),
      fatalShots: true,
      explanation: profile
        ? 'v6 candidate. EMULATOR-ONLY display change: the positioner reads the AF-ON ten-byte and the builder return redraws it. Seed and half-press All are test setup. Role: behaviour.'
        : (z5
          ? 'v6 K2. T6 comparison overlay, no seed, no profile read, no display change. Half-press All is test setup.'
          : 'v6 K1. Stock image. No overlay and no display change.'),
      change: profile ? 'display positioner reads the builder record; builder return redraws' : 'none',
      async drive(ctx) {
        const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
        const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
        const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
        const API_SET = A(SET_API);
        const state = { stash: null, useStash: false, captured: null, busy: false, display: 0, redraws: 0, redrawErrors: [] };

        function readKey(key, index) {
          return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
        }
        function setKey(key, index, value) {
          ctx.l.call(ctx.native(SET), { d0: key, d1: index, a1: value }, null, null, 200000);
          const back = readKey(key, index);
          if (back !== (value & 0xffff)) throw new Error('setter readback ' + key.toString(16) + ' ' + back);
        }
        function half() {
          return {
            k99a1: Array.from({ length: 8 }, (_, i) => readKey(0x99a1, i)),
            k9a41: readKey(0x9a41, 0), k84d1: readKey(0x84d1, 0), k88b2: readKey(0x88b2, 0),
            k5962: Array.from({ length: 6 }, (_, i) => readKey(0x5962, i)),
            k1dd1: Array.from({ length: 10 }, (_, i) => readKey(0x1dd1, i)),
            k1df1: Array.from({ length: 8 }, (_, i) => readKey(0x1df1, i)),
            k1e01: readKey(0x1e01, 0), kdfa1: readKey(0xdfa1, 0),
            k99d2: [0, 1, 2].map((i) => readKey(0x99d2, i)),
            k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
            k1db1: readKey(0x1db1, 0), k1dc1: readKey(0x1dc1, 0),
          };
        }
        if (profile) {
          const link = { area: 0, pos: 0 };
          let inConv = false;
          const counts = { zone: 0, size: 0, pos: 0, plus9: 0, dim: 0 };
          const b8 = (a) => ctx.l.sim.read(a, 1)[0];
          const b16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
          const bank = () => {
            if (!(link.area === 1 && link.pos === 1)) return 1;
            const pose = ctx.l.sim.u32(POSE) >>> 0;
            if (pose === 2) return 5;
            if (pose === 4) return 3;
            return 1;
          };
          ctx.l.observe(ctx.native(POS_ENTRY), (lab, r) => {
            state.captured = { a0: r.a0 >>> 0, a1: r.a1 >>> 0, d0: r.d0 >>> 0, d1: r.d1 >>> 0 };
          }, 'obs-t9-frame-entry-v6');
          ctx.l.observe(ctx.native(CALL_CONV), () => { inConv = true; }, 'obs-builder-converter');
          ctx.l.observe(ctx.native(BACK_CONV), () => { inConv = false; }, 'obs-builder-converter-back');
          ctx.l.hook(ctx.native(GET), (h, r) => {
            const back = r.mdr >>> 0;
            const key = r.d0 & 0xffff;
            const index = r.d1 & 0xffff;
            const display = back >= POS_LO && back < POS_HI && (key === 0x88b2 || key === 0x84d1) && (state.useStash || (ctx.l.sim.read(OWN + 4, 1)[0] === 2));
            if (display) {
              const src = state.useStash && state.stash ? state.stash : Array.from(ctx.l.sim.read(CONSUMER, 10));
              const kind = src[2];
              const pos = u16(src);
              state.display += 1;
              h.finish(r, { d0: key === 0x84d1 ? kind : (kind === 2 ? 526 : pos) });
              return;
            }
            const b = bank();
            if (back === RET_ZONE) {
              counts.zone += 1;
              let v = b8(MIRROR + b);
              if (v === 0xff) v = b8(ZONE);
              h.finish(r, { d0: v });
              return;
            }
            if (back === RET_SIZE) {
              counts.size += 1;
              let v = b8(MIRROR + 0x08);
              if (v === 0xff) v = 0;
              h.finish(r, { d0: v });
              return;
            }
            if (back === RET_POS) {
              counts.pos += 1;
              let v = b16(MIRROR + 0x0a + b * 2);
              if (v === 0xffff) v = 0;
              h.finish(r, { d0: v });
              return;
            }
            if (back === RET_PLUS9) { counts.plus9 += 1; h.finish(r, { d0: 0 }); return; }
            if (inConv && key === 0x1dd1) {
              counts.dim += 1;
              let v = b8(MIRROR + 0x16 + (index & 0xff));
              if (v === 0xff) v = 0;
              h.finish(r, { d0: v });
              return;
            }
            ctx.l.passthrough(r);
          }, 'EMULATOR-ONLY T6 profile read reused, plus the display read of the AF-ON record. Role: behaviour.');
          ctx.l.hook(ctx.native(BUILDER_RET), (h, r) => {
            if (!state.busy) {
              state.busy = true;
              try {
                state.stash = Array.from(h.sim.read(r.a3, 10));
                if (state.captured) {
                  state.useStash = true;
                  state.redraws += 1;
                  h.call(ctx.native(POS_ENTRY), state.captured, null, null, 200000);
                  state.useStash = false;
                }
              } catch (e) {
                state.useStash = false;
                if (state.redrawErrors.length < 4) state.redrawErrors.push(String(e && e.message || e));
              } finally {
                state.busy = false;
              }
              if (h.sim.packet('G' + packRegs({ ...r, fault: 0 })) !== 'OK') throw new Error('restore builder registers');
            }
            h.passthrough(r);
          }, 'EMULATOR-ONLY builder return redraws the shooting frame from its record. Role: behaviour.', true);
          hook = {
            counts, state,
            refresh() {
              link.area = readKey(0x1db1, 0);
              link.pos = readKey(0x1dc1, 0);
            },
          };
        }

        function shot(id, expect) {
          ctx.idle(200);
          const fr = ctx.s.frame('boundary');
          if (!fr || !fr[2]) throw new Error(id + ' screenshot missing');
          const rgb = words_to_rgb(fr[2]);
          const file = resolve('work/out/obs-t6-v6-' + id + '.png');
          write_png(file, fr[0], fr[1], rgb);
          const png = readFileSync(file);
          const sha = createHash('sha256').update(png).digest('hex');
          const marks = greyMarks(rgb, fr[0]);
          const union = unionOf(marks);
          const own = z5 ? ctx.readOwn() : null;
          const target = Array.from(ctx.l.sim.read(CONSUMER, 10));
          const now = z5 ? half() : null;
          const problems = [];
          if (ctx.s.screen() !== 'shooting') problems.push('screen');
          if (readKey(0x1e71, 0) !== 0) problems.push('subject');
          if (expect.target && !same(target, expect.target)) problems.push('target');
          if (expect.owner !== undefined && own && own[4] !== expect.owner) problems.push('owner');
          if (expect.owner !== undefined && own && own[6] !== 1) problems.push('enabled');
          if (z5 && now && !same(now, HALF_CELLS)) problems.push('half');
          if (z5 && now && now.k88b2 !== 526) problems.push('frame-cell');
          if (expect.marks === 0 && marks.length !== 0) problems.push('marks');
          if (expect.marks > 0 && marks.length < expect.marks) problems.push('marks');
          if (expect.box && union) {
            if (Math.abs(union.x - expect.box.x) > expect.box.tolerance) problems.push('x');
            if (Math.abs(union.y - expect.box.y) > expect.box.tolerance) problems.push('y');
          }
          if (expect.box && !union) problems.push('union');
          const row = {
            id: 'v6-' + id, step: id, pass: problems.length === 0, problems, expect, role,
            actual: {
              screen: ctx.s.screen(), subject: readKey(0x1e71, 0), target, owner: own ? own[4] : null,
              frame: now ? now.k88b2 : readKey(0x88b2, 0), marks: marks.length, union,
            },
            file: 'work/out/obs-t6-v6-' + id + '.png',
            png: { sha256: sha, bytes: png.length },
            marks, union,
            centreSha256: hashWindow(rgb, fr[0], { x: 417, y: 265, w: 66, h: 70 }),
          };
          emit(row);
          if (problems.length) throw new Error(id + ' expected ' + JSON.stringify(expect) + ' actual ' + JSON.stringify(row.actual) + ' ' + problems.join(','));
          return row;
        }

        ctx.bringUp();
        ctx.s.switch_input('lever', 1);
        ctx.s.camapp.pump();
        ctx.idle(300);
        const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
        ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
        ctx.idle(200);
        if (ctx.s.get(289) !== 0 || ctx.s.get(25) !== 0) throw new Error(role + ' focus not S-AF');
        ctx.press('menu');
        for (let i = 0; i < 20; i++) ctx.press('left');
        const menuShot = ctx.shot('subject');
        const subjectProblems = [];
        if (menuShot.highlight !== 'Subject Detection') subjectProblems.push('highlight');
        if (!menuShot.texts.includes('Off')) subjectProblems.push('off-text');
        if (readKey(0x1e71, 0) !== 0) subjectProblems.push('subject');
        emit({
          id: 'v6-' + role + '-subject', step: 'subject', pass: subjectProblems.length === 0, problems: subjectProblems,
          highlight: menuShot.highlight, texts: menuShot.texts, subject: readKey(0x1e71, 0),
        });
        if (subjectProblems.length) throw new Error(role + ' subject');
        for (let i = 0; i < 8 && ctx.s.screen() !== 'shooting'; i++) ctx.press('menu');
        if (ctx.s.screen() !== 'shooting') throw new Error(role + ' did not return');
        if (z5) {
          setKey(0x84d1, 0, 2);
          setKey(0x1dd1, 0, 1);
          setKey(0x1dd1, 1, 1);
          setKey(0x99a1, 0, 0);
        }
        if (profile) {
          const buf = Buffer.from(q1Mirror());
          ctx.l.sim.write(MIRROR, buf);
          ctx.l.sim.write(MIRROR_C, buf);
          hook.refresh();
        }
        if (role === 'k1') {
          shot(role + '-rest', { target: STOCK, marks: 4, box: { x: 417, y: 265, tolerance: 8 } });
          ctx.key('afon', 'down');
          shot(role + '-afon-down', { target: STOCK, marks: 4, box: { x: 417, y: 265, tolerance: 8 } });
          ctx.key('afon', 'up');
          shot(role + '-afon-up', { target: STOCK, marks: 4, box: { x: 417, y: 265, tolerance: 8 } });
        } else if (!profile) {
          shot(role + '-rest', { target: STOCK, marks: 0 });
          ctx.key('afon', 'down');
          shot(role + '-afon-down', { target: ALL, owner: 2, marks: 0 });
          ctx.key('afon', 'up');
          shot(role + '-afon-up', { target: ALL, owner: 0, marks: 0 });
        } else {
          shot(role + '-rest', { marks: 0 });
          for (let i = 0; i < EDGES.length; i++) {
            if (hook) hook.refresh();
            ctx.key(EDGES[i][0], EDGES[i][1]);
            const afon = AFON_EDGES.has(i);
            shot(role + '-e' + i, {
              target: afon ? SMALL : ALL,
              owner: OWNERS[i],
              marks: afon ? 4 : 0,
              box: afon ? { x: 356, y: 265, tolerance: 30 } : undefined,
              key: EDGES[i][0], dir: EDGES[i][1],
            });
          }
          emit({
            id: 'v6-candidate-hook', step: 'hook', pass: state.redrawErrors.length === 0, problems: state.redrawErrors,
            counts: hook.counts, displayReads: state.display, redraws: state.redraws,
            captured: state.captured !== null, errors: state.redrawErrors,
          });
          if (state.redrawErrors.length) throw new Error('redraw ' + state.redrawErrors.join(';'));
        }
      },
    });
    emit({ id: 'v6-' + role + '-session', step: 'session', pass: result.ok, problems: result.ok ? [] : ['session'], failed: result.failed });
    if (!result.ok) throw new Error(role + ' session failed');
  }
  emit({ id: 'v6-done', step: 'done', pass: true, ok: true, problems: [] });
} catch (e) {
  emit({ id: 'v6-done', step: 'done', pass: false, ok: false, problems: ['exception'], error: String(e && e.stack ? e.stack : e) });
  process.exit(1);
}
