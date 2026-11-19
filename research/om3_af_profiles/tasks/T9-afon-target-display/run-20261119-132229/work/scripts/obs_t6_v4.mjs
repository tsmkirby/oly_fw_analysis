// T9 version 4. The T6 configuration, reused, not a new change. Seeded mirror
// is test setup. Half-press All is test setup. K2 is the T6 comparison with
// the same half-press and no seed. Records the shooting-screen frame at rest,
// AF-ON press, AF-ON release, S1 alone, and S1 held with AF-ON. Subject Detect
// stays 0x1e71[0]. A failed assertion ends ok:false. Do not edit after it has run.
// Usage: node26 work/scripts/obs_t6_v4.mjs om-emu
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_t6_v4.mjs om-emu\n');
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
const POS_SITE = 0x609eed46;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
const ALL = [0x0e, 0x02, 0x02, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const SMALL = [0x11, 0x02, 0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const T6_CSV = 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv';
const K2_CSV = 'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes-c1.csv';
const HALF_CELLS = {
  k99a1: [0, 0, 2, 0, 2, 0, 5, 5],
  k9a41: 0,
  k84d1: 2,
  k88b2: 526,
  k5962: [526, 526, 526, 526, 526, 526],
  k1dd1: [1, 1, 3, 3, 3, 3, 3, 3, 3, 3],
  k1df1: [1, 1, 1, 1, 0, 0, 0, 0],
  k1e01: 0,
  kdfa1: 0,
  k99d2: [526, 526, 526],
  k90a1: [1, 1],
  k1db1: 0,
  k1dc1: 0,
};
const OUT = resolve('work/out/obs-t6-v4.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hex = (v) => '0x' + (v >>> 0).toString(16);
const s16 = (v) => { const n = v & 0xffff; return n & 0x8000 ? n - 0x10000 : n; };

function q1Mirror() {
  const m = new Uint8Array(55);
  m[1] = 2;
  m[0x0c] = 529 & 0xff;
  m[0x0d] = (529 >> 8) & 0xff;
  m[0x22] = 529 & 0xff;
  m[0x23] = (529 >> 8) & 0xff;
  return Array.from(m);
}

function greyMarks(rgb, w, h) {
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

function installProfileRead(ctx) {
  const link = { area: 0, pos: 0 };
  let inConv = false;
  const counts = { zone: 0, size: 0, pos: 0, plus9: 0, dim: 0, other88b2: 0 };
  const u8 = (a) => ctx.l.sim.read(a, 1)[0];
  const u16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
  const bank = () => {
    if (!(link.area === 1 && link.pos === 1)) return 1;
    const pose = ctx.l.sim.u32(POSE) >>> 0;
    if (pose === 2) return 5;
    if (pose === 4) return 3;
    return 1;
  };
  const refresh = () => {
    link.area = ctx.l.call(ctx.native(GET), { d0: 0x1db1, d1: 0, a0: 0 }, null, null, 200000).d0 & 0xffff;
    link.pos = ctx.l.call(ctx.native(GET), { d0: 0x1dc1, d1: 0, a0: 0 }, null, null, 200000).d0 & 0xffff;
  };
  ctx.l.observe(ctx.native(CALL_CONV), () => { inConv = true; }, 'obs-builder-converter');
  ctx.l.observe(ctx.native(BACK_CONV), () => { inConv = false; }, 'obs-builder-converter-back');
  ctx.l.hook(ctx.native(GET), (h, r) => {
    const back = r.mdr >>> 0;
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    if (key === 0x88b2) counts.other88b2 += 1;
    const b = bank();
    if (back === RET_ZONE) {
      counts.zone += 1;
      let v = u8(MIRROR + b);
      if (v === 0xff) v = u8(ZONE);
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_SIZE) {
      counts.size += 1;
      let v = u8(MIRROR + 0x08);
      if (v === 0xff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_POS) {
      counts.pos += 1;
      let v = u16(MIRROR + 0x0a + b * 2);
      if (v === 0xffff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_PLUS9) {
      counts.plus9 += 1;
      h.finish(r, { d0: 0 });
      return;
    }
    if (inConv && key === 0x1dd1) {
      counts.dim += 1;
      let v = u8(MIRROR + 0x16 + (index & 0xff));
      if (v === 0xff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    ctx.l.passthrough(r);
  }, 'EMULATOR-ONLY T6 profile read, reused. Role: behaviour.');
  return { refresh, counts };
}

try {
  emit({
    id: 'v4-plan', step: 'plan', pass: true, problems: [],
    note: 'T6 configuration reused. Seed is test setup. Half-press All is test setup. No new behaviour change. The frame is recorded, not required to move.',
    all: ALL, small: SMALL, half: HALF_CELLS, mirror: q1Mirror(),
  });
  for (const role of ['candidate', 'k2']) {
    const profile = role === 'candidate';
    let hook = null;
    const posHits = [];
    const draws = [];
    const result = await runZone({
      checkout,
      outPath: 'work/out/session-obs-t6-v4-' + role + '.jsonl',
      tag: 'obs-t6-v4-' + role,
      candidate: true,
      help: true,
      rowLabel: true,
      overlayCsv: profile ? T6_CSV : K2_CSV,
      fatalShots: true,
      explanation: profile
        ? 'v4 candidate. Reused T6 profile read and overlay. Mirror seed and half-press All are test setup. EMULATOR-ONLY. No new change.'
        : 'v4 K2. T6 comparison overlay with no seed and no profile-read hook. Half-press All is test setup.',
      change: 'none',
      async drive(ctx) {
        const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
        const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
        const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
        const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
        const API_SET = A(SET_API);
        let armed = false;
        const record = (r) => {
          if (!armed || draws.length > 80) return;
          try {
            const [h, colour, layer] = ctx.l.stack_args(r, 3);
            const hit = { caller: hex(r.mdr), x: menu.s16(r.d0), y: menu.s16(r.d1), w: menu.s16(r.a1), h: s16(h), colour: colour >>> 0, layer: layer & 0xffff };
            const small = hit.w >= 2 && hit.w <= 200 && hit.h >= 2 && hit.h <= 200;
            const inside = hit.x > 250 && hit.x < 800 && hit.y > 40 && hit.y < 540;
            if (small && inside) draws.push(hit);
          } catch (e) {
            draws.push({ error: String(e && e.message || e) });
          }
        };
        ctx.l.wrap(menu.GPI_DRAW_RECT, (prev) => (hle, r) => { record(r); prev(hle, r); }, 'obs-t9-rect-v4');
        ctx.l.observe(POS_SITE, (lab, r) => {
          if (posHits.length < 30) posHits.push({ d0: r.d0 & 0xffff, d3: r.d3 & 0xff });
        }, 'obs-t9-pos-v4');
        if (profile) hook = installProfileRead(ctx);

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
            k9a41: readKey(0x9a41, 0),
            k84d1: readKey(0x84d1, 0),
            k88b2: readKey(0x88b2, 0),
            k5962: Array.from({ length: 6 }, (_, i) => readKey(0x5962, i)),
            k1dd1: Array.from({ length: 10 }, (_, i) => readKey(0x1dd1, i)),
            k1df1: Array.from({ length: 8 }, (_, i) => readKey(0x1df1, i)),
            k1e01: readKey(0x1e01, 0),
            kdfa1: readKey(0xdfa1, 0),
            k99d2: [0, 1, 2].map((i) => readKey(0x99d2, i)),
            k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
            k1db1: readKey(0x1db1, 0),
            k1dc1: readKey(0x1dc1, 0),
          };
        }
        function snapshot(id, expect) {
          ctx.idle(250);
          const fr = ctx.s.frame('boundary');
          if (!fr || !fr[2]) throw new Error(id + ' screenshot missing');
          const rgb = words_to_rgb(fr[2]);
          const file = resolve('work/out/obs-t6-v4-' + role + '-' + id + '.png');
          write_png(file, fr[0], fr[1], rgb);
          const png = readFileSync(file);
          const sha = createHash('sha256').update(png).digest('hex');
          const marks = greyMarks(rgb, fr[0], fr[1]);
          const union = marks.length ? {
            x: Math.min(...marks.map((m) => m.x)),
            y: Math.min(...marks.map((m) => m.y)),
            w: Math.max(...marks.map((m) => m.x + m.w)) - Math.min(...marks.map((m) => m.x)),
            h: Math.max(...marks.map((m) => m.y + m.h)) - Math.min(...marks.map((m) => m.y)),
          } : null;
          const own = ctx.readOwn();
          const target = Array.from(ctx.l.sim.read(CONSUMER, 10));
          const now = half();
          const problems = [];
          if (ctx.s.screen() !== 'shooting') problems.push('screen');
          if (readKey(0x1e71, 0) !== 0) problems.push('subject');
          if (!same(now, HALF_CELLS)) problems.push('half');
          if (expect.target && !same(target, expect.target)) problems.push('target');
          if (expect.owner !== undefined && own[4] !== expect.owner) problems.push('owner');
          if (expect.owner !== undefined && own[6] !== 1) problems.push('enabled');
          if (expect.owner !== undefined && own[5] !== 0) problems.push('status');
          if (now.k88b2 !== 526) problems.push('frame-cell');
          const row = {
            id: 'v4-' + role + '-' + id, step: id, pass: problems.length === 0, problems,
            expect, role,
            actual: { screen: ctx.s.screen(), subject: readKey(0x1e71, 0), target, owner: own[4], status: own[5], enabled: own[6], frame: now.k88b2 },
            half: now, target, owner: own[4],
            file: 'work/out/obs-t6-v4-' + role + '-' + id + '.png',
            png: { sha256: sha, bytes: png.length },
            marks, union, unionSha256: union ? hashWindow(rgb, fr[0], union) : null,
            centreSha256: hashWindow(rgb, fr[0], { x: 417, y: 265, w: 66, h: 70 }),
            posHits: posHits.slice(), draws: draws.slice(),
          };
          emit(row);
          posHits.length = 0;
          draws.length = 0;
          if (problems.length) throw new Error(role + ' ' + id + ' ' + problems.join(','));
          return row;
        }

        ctx.bringUp();
        ctx.s.switch_input('lever', 1);
        ctx.s.camapp.pump();
        ctx.idle(400);
        const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
        ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
        ctx.idle(300);
        if (ctx.s.get(289) !== 0 || ctx.s.get(25) !== 0) throw new Error(role + ' focus not S-AF');
        ctx.press('menu');
        for (let i = 0; i < 20; i++) ctx.press('left');
        const menuShot = ctx.shot('subject');
        const subjectProblems = [];
        if (menuShot.highlight !== 'Subject Detection') subjectProblems.push('highlight');
        if (!menuShot.texts.includes('Off')) subjectProblems.push('off-text');
        if (readKey(0x1e71, 0) !== 0) subjectProblems.push('subject');
        emit({
          id: 'v4-' + role + '-subject', step: 'subject', pass: subjectProblems.length === 0, problems: subjectProblems,
          highlight: menuShot.highlight, texts: menuShot.texts, subject: readKey(0x1e71, 0), file: menuShot.file,
        });
        if (subjectProblems.length) throw new Error(role + ' subject ' + subjectProblems.join(','));
        for (let i = 0; i < 8 && ctx.s.screen() !== 'shooting'; i++) ctx.press('menu');
        if (ctx.s.screen() !== 'shooting') throw new Error(role + ' did not return to shooting');
        setKey(0x84d1, 0, 2);
        setKey(0x1dd1, 0, 1);
        setKey(0x1dd1, 1, 1);
        setKey(0x99a1, 0, 0);
        const wantMirror = q1Mirror();
        if (profile) {
          const buf = Buffer.from(wantMirror);
          ctx.l.sim.write(MIRROR, buf);
          ctx.l.sim.write(MIRROR_C, buf);
          hook.refresh();
        }
        const gotMirror = Array.from(ctx.l.sim.read(MIRROR, 55));
        const setupProblems = [];
        if (!same(half(), HALF_CELLS)) setupProblems.push('half');
        if (profile && !same(gotMirror, wantMirror)) setupProblems.push('mirror');
        if (!profile && gotMirror.some((b) => b !== 0xff)) setupProblems.push('mirror-seeded');
        emit({ id: 'v4-' + role + '-setup', step: 'setup', pass: setupProblems.length === 0, problems: setupProblems, mirror: gotMirror });
        if (setupProblems.length) throw new Error(role + ' setup ' + setupProblems.join(','));
        armed = true;
        const rest = snapshot('rest', {});
        ctx.key('afon', 'down');
        const pressed = snapshot('afon-down', { target: profile ? SMALL : ALL, owner: 2 });
        ctx.key('afon', 'up');
        snapshot('afon-up', { target: ALL, owner: 0 });
        ctx.key('s1', 'down');
        snapshot('s1-down', { target: ALL, owner: 1 });
        ctx.key('s1', 'up');
        snapshot('s1-up', { target: ALL, owner: 0 });
        ctx.key('s1', 'down');
        ctx.key('afon', 'down');
        const both = snapshot('s1-held-afon', { target: profile ? SMALL : ALL, owner: 2 });
        ctx.key('afon', 'up');
        ctx.key('s1', 'up');
        const follows = profile && pressed.union && rest.union
          ? pressed.union.x !== rest.union.x || pressed.union.y !== rest.union.y || pressed.unionSha256 !== rest.unionSha256
          : false;
        emit({
          id: 'v4-' + role + '-compare', step: 'compare', pass: true, problems: [],
          restUnion: rest.union, afonUnion: pressed.union, bothUnion: both.union,
          restPng: rest.png.sha256, afonPng: pressed.png.sha256,
          followsAfonTarget: follows,
          note: 'followsAfonTarget is true only when the AF-ON press moves the grey-mark union off the rest union. The ten-byte on that edge is Small at 529 for the candidate.',
        });
        if (hook) emit({ id: 'v4-candidate-hook', step: 'hook', pass: true, problems: [], counts: hook.counts });
      },
    });
    emit({ id: 'v4-' + role + '-session', step: 'session', pass: result.ok, problems: result.ok ? [] : ['session'], failed: result.failed });
    if (!result.ok) throw new Error(role + ' session failed');
  }
  emit({ id: 'v4-done', step: 'done', pass: true, ok: true, problems: [] });
} catch (e) {
  emit({ id: 'v4-done', step: 'done', pass: false, ok: false, problems: ['exception'], error: String(e && e.stack ? e.stack : e) });
  process.exit(1);
}
