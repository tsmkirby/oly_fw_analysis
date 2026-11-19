// T9 correction experiment version 11. Unseeded T6 control (K2).
// The T6 overlay and the T6 profile-read hook, with no mirror seed.
// OM_EMU_MODEL=E147 is assigned before any import of emu/src/fw/model.mjs.
// The hook is the inherited T6 behaviour, not a new T9 change.
// EMULATOR-ONLY. Role: behaviour. Do not edit after it has run.
// Usage: node26 work/scripts/obs_k2_v11.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_k2_v11.mjs om-emu\n');
  process.exit(2);
}

const GET = 0x60063380;
const SET_API = 0x50ac4afe;
const CONVERTER = 0x604050e5;
const MIRROR = 0xa031eeb0;
const ZONE = 0xa031e920;
const POSE = 0xa32c568c;
const CONSUMER = 0xa33ca384;
const OWN = 0xa031ed00;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
const T6_CSV = 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv';
const STOCK_UNION = { x: 417, y: 265, w: 66, h: 70 };
const OUT = resolve('work/out/obs-k2-v11.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function greyMarks(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => {
    const i = (y * w + x) * 3;
    const hi = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]);
    const lo = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]);
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

function installProfileRead(ctx) {
  const link = { area: 0, pos: 0 };
  let inConv = false;
  const counts = { zone: 0, size: 0, pos: 0, plus9: 0, dim: 0 };
  const u8 = (a) => ctx.l.sim.read(a, 1)[0];
  const u16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
  const bank = () => {
    if (!(link.area === 1 && link.pos === 1)) return 1;
    const pose = ctx.l.sim.u32(POSE) >>> 0;
    if (pose === 2) return 5;
    if (pose === 4) return 3;
    return 1;
  };
  ctx.l.observe(ctx.native(CALL_CONV), () => { inConv = true; }, 'obs-builder-converter');
  ctx.l.observe(ctx.native(BACK_CONV), () => { inConv = false; }, 'obs-builder-converter-back');
  ctx.l.hook(ctx.native(GET), (h, r) => {
    const back = r.mdr >>> 0;
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
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
  }, 'EMULATOR-ONLY inherited T6 profile read. Role: behaviour. No mirror seed. No new T9 change.');
  return counts;
}

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'v11-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147', seed: 'none', overlay: T6_CSV },
    actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Experiment version 11. K2 is the unseeded T6 configuration. The earlier v5 K2 used the Z5 overlay and no T6 hook.',
  });
  if (!envPass) process.exit(1);
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-obs-k2-v11.jsonl',
    tag: 'obs-k2-v11',
    candidate: true,
    help: true,
    rowLabel: true,
    overlayCsv: T6_CSV,
    fatalShots: true,
    explanation: 'v11 K2. T6 overlay and inherited T6 profile-read hook. No mirror seed. EMULATOR-ONLY. Role: behaviour. No new T9 change.',
    change: 'EMULATOR-ONLY inherited T6 profile-read hook. Role: behaviour. No mirror seed.',
    async drive(ctx) {
      const { MODEL, A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const modelPass = MODEL === 'E147';
      emit({
        id: 'v11-model', step: 'model', pass: modelPass, problems: modelPass ? [] : ['model'],
        expect: { model: 'E147' }, actual: { model: MODEL },
        note: 'Read before bring-up and before any key.',
      });
      if (!modelPass) throw new Error('model');
      const menu = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
      const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
      const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
      const counts = installProfileRead(ctx);
      const API_SET = A(SET_API);
      function readKey(key, index) {
        return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      }
      function shot(id, expect) {
        ctx.idle(250);
        const fr = ctx.s.frame('boundary');
        if (!fr || !fr[2]) throw new Error(id + ' screenshot missing');
        const rgb = words_to_rgb(fr[2]);
        const file = resolve('work/out/obs-k2-v11-' + id + '.png');
        write_png(file, fr[0], fr[1], rgb);
        const png = readFileSync(file);
        const sha = createHash('sha256').update(png).digest('hex');
        const marks = greyMarks(rgb, fr[0]);
        const union = unionOf(marks);
        const own = Array.from(ctx.l.sim.read(OWN, 8));
        const target = Array.from(ctx.l.sim.read(CONSUMER, 10));
        const actual = {
          screen: ctx.s.screen(),
          subject: readKey(0x1e71, 0),
          k88b2: readKey(0x88b2, 0),
          k5962: [readKey(0x5962, 0), readKey(0x5962, 1)],
          owner: own[4],
          target,
          union,
          marks: marks.length,
          counts: { ...counts },
          png: sha,
        };
        const problems = [];
        if (actual.screen !== expect.screen) problems.push('screen');
        if (actual.subject !== expect.subject) problems.push('subject');
        if (actual.k88b2 !== expect.k88b2) problems.push('k88b2');
        if (!same(actual.union, expect.union)) problems.push('union');
        if (actual.marks !== expect.marks) problems.push('marks');
        if (expect.owner !== undefined && actual.owner !== expect.owner) problems.push('owner');
        const row = {
          id: 'v11-' + id, step: id, pass: problems.length === 0, problems,
          expect, actual, file: 'work/out/obs-k2-v11-' + id + '.png', png: { sha256: sha, bytes: png.length },
        };
        emit(row);
        if (problems.length) throw new Error(id + ' ' + problems.join(','));
        return row;
      }

      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(300);
      const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);
      ctx.idle(200);
      const mirror = Array.from(ctx.l.sim.read(MIRROR, 8));
      const mirrorPass = mirror.every((b) => b === 0xff);
      emit({
        id: 'v11-mirror', step: 'mirror', pass: mirrorPass, problems: mirrorPass ? [] : ['seeded'],
        expect: { head: [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff] }, actual: { head: mirror },
        note: 'No test-setup seed was written.',
      });
      if (!mirrorPass) throw new Error('mirror');
      ctx.press('menu');
      for (let i = 0; i < 20; i++) ctx.press('left');
      const menuShot = ctx.shot('subject');
      const subjectProblems = [];
      if (menuShot.highlight !== 'Subject Detection') subjectProblems.push('highlight');
      if (!menuShot.texts.includes('Off')) subjectProblems.push('off-text');
      if (readKey(0x1e71, 0) !== 0) subjectProblems.push('subject');
      emit({
        id: 'v11-subject', step: 'subject', pass: subjectProblems.length === 0, problems: subjectProblems,
        expect: { highlight: 'Subject Detection', off: true, key: 0 },
        actual: { highlight: menuShot.highlight, texts: menuShot.texts, key: readKey(0x1e71, 0) },
      });
      if (subjectProblems.length) throw new Error('subject');
      ctx.press('menu');
      ctx.idle(200);
      const stock = { screen: 'shooting', subject: 0, k88b2: 526, union: STOCK_UNION, marks: 4 };
      shot('rest', stock);
      ctx.key('afon', 'down');
      ctx.idle(150);
      shot('afon-down', { ...stock, owner: 2 });
      ctx.key('afon', 'up');
      ctx.idle(150);
      shot('afon-up', { ...stock, owner: 0 });
      ctx.key('s1', 'down');
      ctx.idle(150);
      shot('s1-down', stock);
      ctx.key('afon', 'down');
      ctx.idle(150);
      shot('s1-afon', { ...stock, owner: 2 });
      ctx.key('afon', 'up');
      ctx.idle(100);
      ctx.key('s1', 'up');
      ctx.idle(150);
      shot('s1-up', { ...stock, owner: 0 });
    },
  });
  emit({
    id: 'v11-done', step: 'done', pass: result.ok, problems: result.ok ? [] : ['session'],
    expect: { ok: true }, actual: { ok: result.ok, failed: result.failed },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({ id: 'v11-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
