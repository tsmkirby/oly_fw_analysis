// T9 version 2. Stock K1 again. Version 1 showed four grey corners at
// (417,265), (464,265), (417,314) and (464,314), unchanged by S1, and the
// main dial changed size and kind without writing 0x99a1[1]. This run walks
// the dial until Single (1x1) and then Small (3x3), moves Right, and compares
// the corner pixels. Draw hooks only record. Do not edit after it has run.
// Usage: node26 work/scripts/obs_k1_v2.mjs om-emu
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_k1_v2.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET_API = 0x50ac4afe;
const CONVERTER = 0x604050e5;
const CONSUMER = 0xa33ca384;
const CAPTURE = 0xa33f2ce0;
const DIRTY = 0xa33f2cea;
const OUT = resolve('work/out/obs-k1-v2.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const s16 = (v) => { const n = v & 0xffff; return n & 0x8000 ? n - 0x10000 : n; };

function corners(rgb, w, h) {
  const x0 = 300, y0 = 180, x1 = 620, y1 = 460;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => {
    const i = (y * w + x) * 3;
    return rgb[i] >= 20 || rgb[i + 1] >= 20 || rgb[i + 2] >= 20;
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
      if (n >= 20 && n <= 400) out.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

function hashWindow(rgb, w, box) {
  if (!box) return null;
  const hash = createHash('sha256');
  const x1 = Math.min(w, box.x + box.w);
  const y1 = box.y + box.h;
  for (let y = box.y; y < y1; y++) hash.update(rgb.subarray((y * w + box.x) * 3, (y * w + x1) * 3));
  return hash.digest('hex');
}

try {
  emit({
    id: 'v2-plan', step: 'plan', pass: true, problems: [],
    note: 'Stock K1. Dial until size 1x1, then one more detent to size 3x3, then Right. Compare the four corner marks with the rest frame.',
    v1Corners: [{ x: 417, y: 265, w: 19, h: 21 }, { x: 464, y: 265, w: 19, h: 21 }, { x: 417, y: 314, w: 19, h: 21 }, { x: 464, y: 314, w: 19, h: 21 }],
  });
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-k1-v2.jsonl',
    tag: 'obs-k1-v2',
    candidate: false,
    fatalShots: true,
    explanation: 'v2 stock K1. No overlay and no firmware write. Draw wrappers only record.',
    change: 'none',
    async drive(ctx) {
      const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const API_SET = A(SET_API);
      let armed = false;
      const hits = [];
      const record = (op, r) => {
        if (!armed || hits.length > 600) return;
        try {
          let hit;
          if (op === 'rect') {
            const [h, colour, layer] = ctx.l.stack_args(r, 3);
            hit = { op, caller: hex(r.mdr), x: menu.s16(r.d0), y: menu.s16(r.d1), w: menu.s16(r.a1), h: s16(h), colour: colour >>> 0, layer: layer & 0xffff };
          } else if (op === 'bitmap') {
            const [w, h, , , layer] = ctx.l.stack_args(r, 5);
            hit = { op, caller: hex(r.mdr), x: menu.s16(r.d0), y: menu.s16(r.d1), w: s16(w), h: s16(h), data: hex(r.a1), record: hex(r.a0), layer: layer & 0xffff };
          } else {
            const args = ctx.l.stack_args(r, 5);
            hit = { op, caller: hex(r.mdr), x: menu.s16(r.d0), y: menu.s16(r.d1), w: s16(args[0]), h: s16(args[1]), src: hex(r.a0), dst: hex(r.a1) };
          }
          const near = hit.x < 560 && hit.x + hit.w > 360 && hit.y < 420 && hit.y + hit.h > 200;
          const sized = hit.w >= 6 && hit.w <= 80 && hit.h >= 6 && hit.h <= 80;
          if (near && sized) hits.push(hit);
        } catch (e) {
          hits.push({ op, caller: hex(r.mdr), error: String(e && e.message || e) });
        }
      };
      ctx.l.wrap(menu.GPI_DRAW_RECT, (prev) => (hle, r) => { record('rect', r); prev(hle, r); }, 'obs-t9-rect-v2');
      ctx.l.wrap(menu.GPI_DRAW_BITMAP, (prev) => (hle, r) => { record('bitmap', r); prev(hle, r); }, 'obs-t9-bitmap-v2');
      ctx.l.wrap(menu.GPI_DRAW_COPY, (prev) => (hle, r) => { record('copy', r); prev(hle, r); }, 'obs-t9-copy-v2');
      armed = true;

      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }
      function cells() {
        return {
          k99a1: Array.from({ length: 8 }, (_, i) => readKey(0x99a1, i)),
          k9a41: readKey(0x9a41, 0),
          k84d1: readKey(0x84d1, 0),
          k88b2: readKey(0x88b2, 0),
          k5962: Array.from({ length: 6 }, (_, i) => readKey(0x5962, i)),
          k1dd1: Array.from({ length: 10 }, (_, i) => readKey(0x1dd1, i)),
          k1e71: readKey(0x1e71, 0),
        };
      }
      function view() {
        const id = ctx.l.state();
        return { screen: ctx.s.screen(), device: ctx.s.device, state: hex(id), stateName: ctx.l.state_names.get(id) ?? null };
      }
      function historyNear() {
        const rows = [];
        for (const d of ctx.l.draw_log) {
          if (d.op !== 'rect' && d.op !== 'bitmap' && d.op !== 'copy') continue;
          const x = d.x, y = d.y, w = d.w || (d.scale && d.scale[0]) || 0, h = d.h || (d.scale && d.scale[1]) || 0;
          if (x > 340 && x < 560 && y > 200 && y < 420 && w >= 4 && w <= 90 && h >= 4 && h <= 90) {
            rows.push({ op: d.op, x, y, w, h, colour: d.colour, data: d.data, record: d.record, layer: d.layer });
          }
        }
        return rows.slice(-40);
      }
      function snapshot(id, expect) {
        ctx.idle(250);
        const fr = ctx.s.frame('boundary');
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/obs-k1-v2-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const png = readFileSync(file);
        const sha = createHash('sha256').update(png).digest('hex');
        const marks = corners(rgb, fr[0], fr[1]);
        const union = marks.length ? {
          x: Math.min(...marks.map((m) => m.x)),
          y: Math.min(...marks.map((m) => m.y)),
          x2: Math.max(...marks.map((m) => m.x + m.w)),
          y2: Math.max(...marks.map((m) => m.y + m.h)),
        } : null;
        if (union) { union.w = union.x2 - union.x; union.h = union.y2 - union.y; }
        const now = cells();
        const where = view();
        const problems = [];
        if (expect.screen !== undefined && where.screen !== expect.screen) problems.push('screen');
        if (expect.subject !== undefined && now.k1e71 !== expect.subject) problems.push('subject');
        if (expect.zone !== undefined && now.k99a1[1] !== expect.zone) problems.push('zone');
        if (expect.position !== undefined && now.k5962[1] !== expect.position) problems.push('position');
        if (expect.frame !== undefined && now.k88b2 !== expect.frame) problems.push('frame');
        if (expect.size !== undefined && (now.k1dd1[0] !== expect.size[0] || now.k1dd1[1] !== expect.size[1])) problems.push('size');
        const planes = ctx.s.last_planes;
        const row = {
          id: 'v2-' + id, step: id, pass: problems.length === 0, problems, expect,
          actual: { screen: where.screen, subject: now.k1e71, zone: now.k99a1[1], position: now.k5962[1], frame: now.k88b2, size: [now.k1dd1[0], now.k1dd1[1]] },
          where, cells: now,
          target: Array.from(ctx.l.sim.read(CONSUMER, 10)),
          capture: Array.from(ctx.l.sim.read(CAPTURE, 10)),
          dirty: ctx.l.sim.read(DIRTY, 1)[0],
          file: 'work/out/obs-k1-v2-' + id + '.png',
          png: { sha256: sha, bytes: png.length },
          marks, union, unionSha256: hashWindow(rgb, fr[0], union),
          draws: hits.slice(-30),
          planeNames: planes && planes.planes ? Object.keys(planes.planes) : null,
        };
        emit(row);
        if (problems.length) throw new Error(id + ' ' + problems.join(','));
        return row;
      }

      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(400);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
      ctx.idle(300);
      const focus = { s289: ctx.s.get(289), s25: ctx.s.get(25) };
      if (focus.s289 !== 0 || focus.s25 !== 0) throw new Error('focus ' + JSON.stringify(focus));
      ctx.press('menu');
      for (let i = 0; i < 20; i++) ctx.press('left');
      const menuShot = ctx.shot('subject');
      const subject = readKey(0x1e71, 0);
      const subjectProblems = [];
      if (menuShot.highlight !== 'Subject Detection') subjectProblems.push('highlight');
      if (!menuShot.texts.includes('Off')) subjectProblems.push('off-text');
      if (subject !== 0) subjectProblems.push('subject');
      emit({
        id: 'v2-subject', step: 'subject', pass: subjectProblems.length === 0, problems: subjectProblems,
        expect: { highlight: 'Subject Detection', subject: 0 },
        actual: { highlight: menuShot.highlight, subject, off: menuShot.texts.includes('Off') },
      });
      if (subjectProblems.length) throw new Error('subject');
      for (let i = 0; i < 8 && ctx.s.screen() !== 'shooting'; i++) ctx.press('menu');

      const rest = snapshot('rest', { screen: 'shooting', subject: 0, position: 526 });
      emit({
        id: 'v2-draw-history', step: 'draw-history', pass: true, problems: [],
        prior: historyNear(), hooked: hits.length,
        note: 'Entries already in draw_log whose box sits on the centre marks, plus hooked draws since the wrappers were installed.',
      });

      ctx.press('up');
      const opened = view();
      const openCells = cells();
      if (opened.screen !== 'direct') throw new Error('direct ' + opened.screen);
      emit({ id: 'v2-direct-open', step: 'direct-open', pass: true, problems: [], expect: { screen: 'direct' }, actual: opened, cells: openCells });

      const dials = [];
      let sawSingle = false;
      for (let i = 0; i < 8; i++) {
        const ret = ctx.s.dial_input('main', 1);
        ctx.s.camapp.pump();
        ctx.idle(350);
        const c = cells();
        const row = {
          detent: i + 1,
          zone: c.k99a1,
          kind: c.k84d1,
          size: [c.k1dd1[0], c.k1dd1[1]],
          pos: c.k5962,
          frame: c.k88b2,
          unread: ret && ret.dial_unread ? String(ret.dial_unread).slice(0, 180) : null,
        };
        dials.push(row);
        if (row.size[0] === 1 && row.size[1] === 1) sawSingle = true;
        if (sawSingle && row.size[0] === 3 && row.size[1] === 3) break;
      }
      const dialled = cells();
      const dialProblems = [];
      if (!sawSingle) dialProblems.push('single');
      if (dialled.k1dd1[0] !== 3 || dialled.k1dd1[1] !== 3) dialProblems.push('size');
      emit({
        id: 'v2-direct-small', step: 'direct-small', pass: dialProblems.length === 0, problems: dialProblems,
        expect: { sawSingle: true, size: [3, 3] },
        actual: { sawSingle, size: [dialled.k1dd1[0], dialled.k1dd1[1]], zone: dialled.k99a1, kind: dialled.k84d1, frame: dialled.k88b2, pos: dialled.k5962 },
        dials,
        note: 'Small on this screen is the 3 by 3 size after Single 1 by 1. 0x99a1 is recorded as it reads, not forced.',
      });
      if (dialProblems.length) throw new Error('direct-small ' + dialProblems.join(','));

      const before = cells();
      ctx.press('right');
      const after = cells();
      const moved = after.k88b2 !== before.k88b2 || after.k5962.some((v, i) => v !== before.k5962[i]);
      const moveProblems = [];
      if (!moved) moveProblems.push('position');
      if (after.k1dd1[0] !== 3 || after.k1dd1[1] !== 3) moveProblems.push('size');
      emit({
        id: 'v2-direct-move', step: 'direct-move', pass: moveProblems.length === 0, problems: moveProblems,
        expect: { moved: true, size: [3, 3] },
        actual: { before: { pos: before.k5962, frame: before.k88b2, zone: before.k99a1[1] }, after: { pos: after.k5962, frame: after.k88b2, zone: after.k99a1[1], size: [after.k1dd1[0], after.k1dd1[1]] } },
      });
      if (moveProblems.length) throw new Error('direct-move');

      ctx.press('ok');
      ctx.idle(400);
      const back = view();
      if (back.screen !== 'shooting') throw new Error('ok left ' + back.screen);
      const small = snapshot('small-rest', {
        screen: 'shooting', subject: 0, zone: after.k99a1[1], position: after.k5962[1], frame: after.k88b2, size: [3, 3],
      });
      ctx.key('s1', 'down');
      const held = snapshot('small-s1', { screen: 'shooting', subject: 0, zone: after.k99a1[1], position: after.k5962[1], frame: after.k88b2, size: [3, 3] });
      ctx.key('s1', 'up');
      snapshot('small-up', { screen: 'shooting', subject: 0, zone: after.k99a1[1], position: after.k5962[1], frame: after.k88b2, size: [3, 3] });

      const sameMarks = JSON.stringify(rest.marks) === JSON.stringify(small.marks);
      emit({
        id: 'v2-compare', step: 'compare', pass: true, problems: [],
        restMarks: rest.marks, smallMarks: small.marks, heldMarks: held.marks,
        marksMoved: !sameMarks,
        restUnion: rest.union, smallUnion: small.union,
        restPng: rest.png.sha256, smallPng: small.png.sha256,
        restTarget: rest.target, smallTarget: small.target,
        note: 'marksMoved is whether the centre corner components changed pixel box between All-at-rest and the Small off-centre shooting screen.',
      });
    },
  });
  emit({ id: 'v2-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'], ok: result.ok, failed: result.failed });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v2-done', step: 'done', pass: false, problems: ['exception'], ok: false, error: String(e && e.stack ? e.stack : e) });
  process.exit(1);
}
