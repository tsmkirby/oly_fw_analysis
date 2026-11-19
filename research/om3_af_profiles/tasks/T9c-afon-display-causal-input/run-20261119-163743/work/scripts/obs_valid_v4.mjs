// Version 4 of 6. Seeded T6 configuration plus the one display change.
// EMULATOR-ONLY. While owner is 2, call 0x6041935b returns the mirror
// position and size for the current bank, as the T6 reader does.
// 0xFFFF and 0xFF pass through, so an unseeded mirror is not rewritten.
// The refresh is the idle dispatch already measured at 0x610c8b66.
// OM_EMU_MODEL=E147 before model.mjs.
// Usage: node26 work/scripts/obs_valid_v4.mjs om-emu

function marksFor(word) {
  const pointX = word % 39;
  const pointY = Math.floor(word / 39);
  const left = (pointX - 1) * 20 + 56 + (Math.floor(pointX / 3) - 5);
  const top = (pointY - 1) * 22 + (Math.floor(pointY / 3) - 3);
  const pitchX = 46 + (pointX - 16) / 3;
  const pitchY = 50 - (Math.floor(pointY / 3) - 3);
  if (!Number.isInteger(pitchX) || !Number.isInteger(pitchY)) throw new Error('pitch ' + word);
  return [0, 1, 2, 3].map((i) => ({
    x: left + (i & 1 ? pitchX : 0),
    y: top + (i > 1 ? pitchY : 0),
    w: 19, h: 21,
  }));
}
const CENTRE = marksFor(526);
const AFON = marksFor(529);
if (JSON.stringify(CENTRE) !== JSON.stringify([
  { x: 417, y: 265, w: 19, h: 21 }, { x: 464, y: 265, w: 19, h: 21 },
  { x: 417, y: 314, w: 19, h: 21 }, { x: 464, y: 314, w: 19, h: 21 },
])) throw new Error('centre formula');
if (JSON.stringify(marksFor(406)) !== JSON.stringify([
  { x: 356, y: 198, w: 19, h: 21 }, { x: 402, y: 198, w: 19, h: 21 },
  { x: 356, y: 248, w: 19, h: 21 }, { x: 402, y: 248, w: 19, h: 21 },
])) throw new Error('412 formula');
if (JSON.stringify(marksFor(409)) !== JSON.stringify([
  { x: 417, y: 198, w: 19, h: 21 }, { x: 464, y: 198, w: 19, h: 21 },
  { x: 417, y: 248, w: 19, h: 21 }, { x: 464, y: 248, w: 19, h: 21 },
])) throw new Error('409 formula');

process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_valid_v4.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const CALL = 0x6041935b;
const MIRROR = 0xa031eeb0;
const MIRROR_C = 0x6031eeb0;
const OWN = 0xa031ed04;
const POSE = 0xa32c568c;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
const EDGES = [
  ['s1', 'down'], ['s1', 'up'], ['afon', 'down'], ['afon', 'up'],
  ['s1', 'down'], ['afon', 'down'], ['afon', 'up'], ['s1', 'up'],
  ['afon', 'down'], ['s1', 'down'], ['s1', 'up'], ['afon', 'up'],
];
const OWNERS = [1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0];
const ALL = [0x0e, 0x02, 0x02, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const SMALL = [0x11, 0x02, 0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const AFON_EDGES = new Set([2, 5, 8, 9, 10]);
const OUT = resolve('work/out/obs-valid-v4.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mirrorA() {
  const m = new Uint8Array(55);
  m[1] = 2;
  m[0x0c] = 529 & 0xff;
  m[0x0d] = (529 >> 8) & 0xff;
  m[0x22] = 529 & 0xff;
  m[0x23] = (529 >> 8) & 0xff;
  return m;
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
      if (n >= 15 && n <= 400) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return { marks, pixels, n31 };
}

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  emit({
    id: 'v4-plan', step: 'plan', pass: true, problems: [],
    expect: { model: 'E147', centre: CENTRE, afon: AFON, word: 529 },
    actual: { modelEnv: 'E147' },
    note: 'Version 4 of 6. Seeded T6 plus the display change. AF-ON frame is marksFor(529). Half-press frame is marksFor(526).',
  });
  const counts = { pos: 0, zone: 0, size: 0, kind: 0, pass: 0 };
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-valid-v4.jsonl',
    tag: 'valid-v4',
    candidate: true,
    fatalShots: true,
    overlayCsv: 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv',
    explanation: 'v4 seeded T6 plus the display change. EMULATOR-ONLY. The T6 overlay, profile read, All poke and mirror seed are the reused configuration. The new change is the call at 0x6041935b.',
    change: 'EMULATOR-ONLY display change at 0x6041935b while owner is 2. Reused T6 configuration is test setup.',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v4-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
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
      };
      if (readKey(0x1e71, 0) !== 0) throw new Error('subject');
      setKey(0x84d1, 0, 2);
      setKey(0x1dd1, 0, 1);
      setKey(0x1dd1, 1, 1);
      setKey(0x99a1, 0, 0);
      setKey(0x1db1, 0, 1);
      setKey(0x1dc1, 0, 1);
      const seed = Buffer.from(mirrorA());
      ctx.l.sim.write(MIRROR, seed);
      ctx.l.sim.write(MIRROR_C, seed);
      let bankId = 1;
      const refreshBank = () => {
        const area = readKey(0x1db1, 0);
        const pos = readKey(0x1dc1, 0);
        if (!(area === 1 && pos === 1)) { bankId = 1; return; }
        const pose = ctx.l.sim.u32(POSE) >>> 0;
        bankId = pose === 2 ? 5 : pose === 4 ? 3 : 1;
      };
      refreshBank();
      const u8 = (a) => ctx.l.sim.read(a, 1)[0];
      const u16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
      let inConv = false;
      ctx.l.observe(ctx.native(CALL_CONV), () => { inConv = true; }, 'obs-builder-converter');
      ctx.l.observe(ctx.native(BACK_CONV), () => { inConv = false; }, 'obs-builder-converter-back');
      ctx.l.hook(ctx.native(GET), (h, r) => {
        const back = r.mdr >>> 0;
        const index = r.d1 & 0xffff;
        const b = bankId;
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
        if (inConv && (r.d0 & 0xffff) === 0x1dd1) {
          let v = u8(MIRROR + 0x16 + (index & 0xff));
          if (v === 0xff) v = 0;
          h.finish(r, { d0: v });
          return;
        }
        ctx.l.passthrough(r);
      }, 'EMULATOR-ONLY reused T6 profile read. Role: test setup.');
      ctx.l.hook(ctx.native(CALL), (h, r) => {
        if (u8(OWN) !== 2) { counts.pass += 1; ctx.l.passthrough(r); return; }
        const key = r.d0 & 0xffff;
        const index = r.d1 & 0xffff;
        const b = bankId;
        if (key === 0x88b2) {
          const v = u16(MIRROR + 0x0a + b * 2);
          if (v === 0xffff) { ctx.l.passthrough(r); return; }
          counts.pos += 1;
          r.d0 = v;
          h.skip_call(r);
          return;
        }
        if (key === 0x99a1 && index === 0) {
          const v = u8(MIRROR + b);
          if (v === 0xff) { ctx.l.passthrough(r); return; }
          counts.zone += 1;
          r.d0 = v;
          h.skip_call(r);
          return;
        }
        if (key === 0x1dd1) {
          const v = u8(MIRROR + 0x16 + (index & 0xff));
          if (v === 0xff || v === 0) { ctx.l.passthrough(r); return; }
          counts.size += 1;
          r.d0 = v;
          h.skip_call(r);
          return;
        }
        if (key === 0x84d1) {
          const z = u8(MIRROR + b);
          const kind = z === 2 ? 3 : z === 0 ? 2 : z === 1 ? 0 : null;
          if (z === 0xff || kind === null) { ctx.l.passthrough(r); return; }
          counts.kind += 1;
          r.d0 = kind;
          h.skip_call(r);
          return;
        }
        ctx.l.passthrough(r);
      }, 'EMULATOR-ONLY display change: owner 2, call 0x6041935b returns the mirror position and size.');
      let failed = 0;
      for (let i = 0; i < EDGES.length; i++) {
        refreshBank();
        ctx.key(EDGES[i][0], EDGES[i][1]);
        ctx.idle(600);
        const fr = ctx.s.frame('boundary');
        if (!fr) throw new Error('screenshot failed at edge ' + i);
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/valid-v4-e' + i + '.png');
        const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
        write_png(file, fr[0], fr[1], rgb);
        const g = greyMarks(rgb, fr[0]);
        const boxes = g.marks.map(({ x, y, w, h }) => ({ x, y, w, h }));
        const owner = ctx.readOwn()[4];
        const target = Array.from(ctx.l.sim.read(0xa33ca384, 10));
        const subject = readKey(0x1e71, 0);
        const cell = readKey(0x88b2, 0);
        const wantMarks = OWNERS[i] === 2 ? AFON : CENTRE;
        const wantTarget = AFON_EDGES.has(i) ? SMALL : ALL;
        const problems = [];
        if (owner !== OWNERS[i]) problems.push('owner');
        if (!same(target, wantTarget)) problems.push('target');
        if (subject !== 0) problems.push('subject');
        if (cell !== 526) problems.push('cell');
        if (!same(boxes, wantMarks)) problems.push('marks');
        if (g.pixels !== 444 || g.n31 !== 444) problems.push('colour');
        if (problems.length) failed += 1;
        emit({
          id: 'v4-e' + i, step: 'edge', pass: problems.length === 0, problems,
          expect: { owner: OWNERS[i], target: wantTarget, subject: 0, cell: 526, marks: wantMarks, pixels: 444, n31: 444 },
          actual: { key: EDGES[i][0], dir: EDGES[i][1], owner, target, subject, cell, marks: g.marks, pixels: g.pixels, n31: g.n31, sha256: createHash('sha256').update(readFileSync(file)).digest('hex'), bankId },
        });
      }
      emit({
        id: 'v4-done', step: 'done', pass: failed === 0, problems: failed ? ['edges'] : [],
        expect: { failed: 0 }, actual: { failed, counts },
      });
      if (failed) throw new Error('edges ' + failed);
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v4-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
