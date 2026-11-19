// Q3 and Q4 after the frozen q234 run. That run passed Q2 and the linked
// landscape bank, then the pose producer rewrote 0x84d1 and 0x1dd1. This
// script publishes the pose, then re-applies the All poke as test setup,
// and asserts the bank target. Do not edit after it runs.
// Usage: node26 work/scripts/exp_q34_t6.mjs om-emu
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/exp_q34_t6.mjs om-emu\n');
  process.exit(2);
}
let API_SET = 0;
async function bindApi() {
  const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
  API_SET = A(0x50ac4afe);
}
const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const MIRROR = 0xa031eeb0;
const MIRROR_C = 0x6031eeb0;
const ZONE = 0xa031e920;
const POSE = 0xa32c568c;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
const ALL = [0x0e, 0x02, 0x02, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const SMALL = [0x11, 0x02, 0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const SINGLE_532 = [0x14, 0x02, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
const CROSS_535 = [0x17, 0x02, 0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00];
const STOCK = [0x0e, 0x02, 0x02, 0x00, 0x1b, 0x00, 0x27, 0x00, 0x00, 0x00];
const HALF3 = [0x0e, 0x02, 0x03, 0x00, 0x03, 0x00, 0x03, 0x00, 0x00, 0x00];
const EDGES = [
  ['s1', 'down'], ['s1', 'up'],
  ['afon', 'down'], ['afon', 'up'],
  ['s1', 'down'], ['afon', 'down'], ['afon', 'up'], ['s1', 'up'],
  ['afon', 'down'], ['s1', 'down'], ['s1', 'up'], ['afon', 'up'],
];
const OWNERS = [1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0];
const AFON_EDGES = new Set([2, 5, 8, 9, 10]);
const HALF_CELLS = {
  k99a1: [0, 0, 2, 0, 2, 0, 5, 5], k9a41: 0, k84d1: 2, k88b2: 526,
  k5962: [526, 526, 526, 526, 526, 526],
  k1dd1: [1, 1, 3, 3, 3, 3, 3, 3, 3, 3],
  k1df1: [1, 1, 1, 1, 0, 0, 0, 0], k1e01: 0, kdfa1: 0,
  k99d2: [526, 526, 526], k90a1: [1, 1], k1db1: 0, k1dc1: 0,
};
const OUT = resolve('work/out/edges-q34-t6.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function readKey(ctx, key, index) {
  return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
}
function setKey(ctx, key, index, value) {
  ctx.l.call(ctx.native(SET), { d0: key, d1: index, a1: value }, null, null, 200000);
  const back = readKey(ctx, key, index);
  if (back !== (value & 0xffff)) throw new Error('setter readback ' + key.toString(16) + ' ' + back);
}
function setPublic(ctx, sid, value) {
  const grouped = sid === 289 || sid === 66 || sid === 67;
  const argument = grouped
    ? (ctx.l.call(ctx.native(CONVERTER), { d0: sid, d1: value }, null, null, 200000).d0 >>> 0)
    : value;
  ctx.l.call(API_SET, { d0: sid, d1: argument }, null, null, 200000);
  ctx.idle(400);
}
function half(ctx) {
  return {
    k99a1: Array.from({ length: 8 }, (_, i) => readKey(ctx, 0x99a1, i)),
    k9a41: readKey(ctx, 0x9a41, 0), k84d1: readKey(ctx, 0x84d1, 0), k88b2: readKey(ctx, 0x88b2, 0),
    k5962: Array.from({ length: 6 }, (_, i) => readKey(ctx, 0x5962, i)),
    k1dd1: Array.from({ length: 10 }, (_, i) => readKey(ctx, 0x1dd1, i)),
    k1df1: Array.from({ length: 8 }, (_, i) => readKey(ctx, 0x1df1, i)),
    k1e01: readKey(ctx, 0x1e01, 0), kdfa1: readKey(ctx, 0xdfa1, 0),
    k99d2: [0, 1, 2].map((i) => readKey(ctx, 0x99d2, i)),
    k90a1: [readKey(ctx, 0x90a1, 0), readKey(ctx, 0x90a1, 1)],
    k1db1: readKey(ctx, 0x1db1, 0), k1dc1: readKey(ctx, 0x1dc1, 0),
  };
}
function mirrorBytes(ctx) { return Array.from(ctx.l.sim.read(MIRROR, 55)); }
function q3Mirror() {
  const m = new Uint8Array(55);
  m[1] = 2; m[5] = 1; m[3] = 3;
  for (const [off, value] of [[0x0c, 529], [0x14, 532], [0x10, 535], [0x22, 529]]) {
    m[off] = value & 0xff; m[off + 1] = (value >> 8) & 0xff;
  }
  return Array.from(m);
}
function q4Mirror() {
  const m = new Uint8Array(55);
  m[1] = 2; m[0x0c] = 529 & 0xff; m[0x0d] = (529 >> 8) & 0xff;
  m[0x22] = 529 & 0xff; m[0x23] = (529 >> 8) & 0xff;
  return Array.from(m);
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
  const refresh = () => {
    link.area = readKey(ctx, 0x1db1, 0);
    link.pos = readKey(ctx, 0x1dc1, 0);
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
    if (back === RET_PLUS9) { counts.plus9 += 1; h.finish(r, { d0: 0 }); return; }
    if (inConv && key === 0x1dd1) {
      counts.dim += 1;
      let v = u8(MIRROR + 0x16 + (index & 0xff));
      if (v === 0xff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    ctx.l.passthrough(r);
  }, 'EMULATOR-ONLY profile read from the mirror. Role: behaviour.');
  return { refresh, counts };
}
function seed(ctx, bytes) {
  const buf = Buffer.from(bytes);
  ctx.l.sim.write(MIRROR, buf);
  ctx.l.sim.write(MIRROR_C, buf);
}
function pokeAll(ctx) {
  setKey(ctx, 0x84d1, 0, 2);
  setKey(ctx, 0x1dd1, 0, 1);
  setKey(ctx, 0x1dd1, 1, 1);
  setKey(ctx, 0x99a1, 0, 0);
}
function cellsWith(link) { return { ...HALF_CELLS, k1db1: link, k1dc1: link }; }

async function openSession(name, role, drive) {
  const profile = role === 'candidate';
  const z5 = role !== 'k1';
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-' + name + '-' + role + '-t6.jsonl',
    tag: name + '-' + role + '-t6',
    candidate: z5, help: true, rowLabel: true, fatalShots: true,
    overlayCsv: profile
      ? 'work/out/overlay-changed-bytes.csv'
      : (z5 ? 'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes-c1.csv' : null),
    explanation: profile
      ? name + ' candidate. Combined profile read. EMULATOR-ONLY. Role: behaviour.'
      : (z5 ? name + ' K2. Z5, no mirror seed.' : name + ' K1. Stock, no overlay.'),
    change: profile ? 'combined: zone, size, position, custom dimensions, +9' : 'none',
    drive,
  });
  emit({ id: name + '-' + role + '-session', step: 'session', pass: result.ok, failed: result.failed });
  if (!result.ok) throw new Error(name + ' ' + role + ' session failed');
}

async function edges(ctx, idBase, opt) {
  const list = opt.list || EDGES;
  const owners = opt.owners || OWNERS;
  for (let i = 0; i < list.length; i++) {
    if (opt.hook) opt.hook.refresh();
    ctx.key(list[i][0], list[i][1]);
    ctx.idle(200);
    const shot = ctx.shot(opt.shot + '-' + i);
    const own = ctx.readOwn();
    const target = ctx.readTarget();
    const problems = [];
    const afon = opt.afonEdges ? opt.afonEdges.has(i) : AFON_EDGES.has(i);
    const wantTarget = opt.stock ? STOCK : (afon ? opt.afonTarget : (opt.halfTarget || ALL));
    if (!same(target, wantTarget)) problems.push('target');
    if (!opt.stock && own[6] !== 1) problems.push('enabled');
    if (!opt.stock && own[5] !== 0) problems.push('status');
    if (!opt.stock && own[4] !== owners[i]) problems.push('owner');
    if (readKey(ctx, 0x1e71, 0) !== 0) problems.push('subject');
    const nowHalf = opt.wantHalf ? half(ctx) : null;
    if (opt.wantHalf && !same(nowHalf, opt.wantHalf)) problems.push('half');
    const nowMirror = (opt.wantMirror || opt.mirrorBlank) ? mirrorBytes(ctx) : null;
    if (opt.wantMirror && !same(nowMirror, opt.wantMirror)) problems.push('mirror');
    if (opt.mirrorBlank && nowMirror.some((b) => b !== 0xff)) problems.push('mirror-seeded');
    if (opt.focus != null && (ctx.s.get(289) !== opt.focus || ctx.s.get(25) !== opt.focus)) problems.push('focus');
    const id = idBase + '-e' + i;
    emit({
      id, step: 'edge', pass: problems.length === 0, problems,
      key: list[i][0], dir: list[i][1], target, wantTarget,
      owner: own[4], half: nowHalf, pose: ctx.l.sim.u32(POSE) >>> 0, file: shot.file,
    });
    if (problems.length) throw new Error(id + ' ' + problems.join(',') + ' target ' + target.join(','));
  }
}

async function boot(ctx, focus) {
  await bindApi();
  ctx.bringUp();
  ctx.s.switch_input('lever', 1);
  ctx.s.camapp.pump();
  ctx.idle(400);
  setPublic(ctx, 289, focus);
  if (ctx.s.get(289) !== focus || ctx.s.get(25) !== focus) throw new Error('focus ' + focus);
}

async function publish(ctx, pose, name, id, poke) {
  pose.setPose(name);
  const delivered = pose.deliver();
  ctx.idle(700);
  const got = pose.read();
  const want = { landscape: { index: 1, exif: 1, raw: 0 }, exif6: { index: 2, exif: 6, raw: 1 }, exif8: { index: 4, exif: 8, raw: 3 } }[name];
  const problems = [];
  if (got.index !== want.index || got.exif !== want.exif || got.raw !== want.raw) problems.push('pose');
  emit({ id, step: 'pose', pass: problems.length === 0, problems, name, got, delivered });
  if (problems.length) throw new Error(id + ' pose');
  if (poke) pokeAll(ctx);
}

async function q3() {
  const mirror = q3Mirror();
  const linked = cellsWith(1);
  const unlinked = cellsWith(0);
  const poses = [['landscape', SMALL], ['exif6', SINGLE_532], ['exif8', CROSS_535]];
  await openSession('q34', 'candidate', async (ctx) => {
    const hook = installProfileRead(ctx);
    await boot(ctx, 0);
    if (readKey(ctx, 0x1e71, 0) !== 0) throw new Error('subject');
    seed(ctx, mirror);
    setKey(ctx, 0x1db1, 0, 1);
    setKey(ctx, 0x1dc1, 0, 1);
    const pose = attachPose(ctx.l);
    for (const [name, target] of poses) {
      await publish(ctx, pose, name, 'q34-on-' + name, true);
      hook.refresh();
      await edges(ctx, 'q34-on-' + name, { hook, shot: 'on-' + name, afonTarget: target, wantHalf: linked, wantMirror: mirror, focus: 0 });
    }
    setKey(ctx, 0x1db1, 0, 0);
    setKey(ctx, 0x1dc1, 0, 0);
    for (const [name] of poses) {
      await publish(ctx, pose, name, 'q34-off-' + name, true);
      hook.refresh();
      await edges(ctx, 'q34-off-' + name, { hook, shot: 'off-' + name, afonTarget: SMALL, wantHalf: unlinked, wantMirror: mirror, focus: 0 });
    }
    emit({ id: 'q34-hook', step: 'hook', pass: true, counts: hook.counts });
  });
  await openSession('q34', 'k2', async (ctx) => {
    await boot(ctx, 0);
    setKey(ctx, 0x1db1, 0, 1);
    setKey(ctx, 0x1dc1, 0, 1);
    const pose = attachPose(ctx.l);
    for (const name of ['landscape', 'exif6', 'exif8']) {
      await publish(ctx, pose, name, 'q34-k2-' + name, true);
      await edges(ctx, 'q34-k2-' + name, {
        shot: 'k2-' + name, list: [['afon', 'down'], ['afon', 'up']], owners: [2, 0],
        afonEdges: new Set([0]), afonTarget: ALL, wantHalf: linked, mirrorBlank: true, focus: 0,
      });
    }
  });
  await openSession('q34', 'k1', async (ctx) => {
    await boot(ctx, 0);
    const pose = attachPose(ctx.l);
    await publish(ctx, pose, 'landscape', 'q34-k1-pose', false);
    await edges(ctx, 'q34-k1', { shot: 'k1', stock: true, focus: 0, list: [['afon', 'down'], ['afon', 'up']], owners: [0, 0] });
  });
}

async function q4() {
  const mirror = q4Mirror();
  for (const role of ['candidate', 'k2', 'k1']) {
    await openSession('q4b', role, async (ctx) => {
      const hook = role === 'candidate' ? installProfileRead(ctx) : null;
      await boot(ctx, 1);
      if (role !== 'k1') pokeAll(ctx);
      if (role === 'candidate') { seed(ctx, mirror); hook.refresh(); }
      const problems = [];
      if (ctx.s.get(289) !== 1 || ctx.s.get(25) !== 1) problems.push('focus');
      if (readKey(ctx, 0x1e71, 0) !== 0) problems.push('subject');
      if (role !== 'k1' && !same(half(ctx), HALF_CELLS)) problems.push('half');
      emit({ id: 'q4b-' + role + '-setup', step: 'setup', pass: problems.length === 0, problems, focus: [ctx.s.get(289), ctx.s.get(25)], half: half(ctx) });
      if (problems.length) throw new Error('q4 ' + role + ' ' + problems.join(','));
      await edges(ctx, 'q4b-' + role, {
        hook, shot: 'q4', stock: role === 'k1',
        afonTarget: role === 'candidate' ? SMALL : ALL,
        wantHalf: role === 'k1' ? null : HALF_CELLS,
        wantMirror: role === 'candidate' ? mirror : null,
        mirrorBlank: role === 'k2', focus: 1,
      });
    });
  }
}

try {
  emit({ id: 'q34-plan', step: 'plan', pass: true, half3: HALF3, note: 'Pose publish can rewrite the half-press. The All poke is re-applied afterwards as test setup.' });
  await q3();
  await q4();
  emit({ id: 'q34-done', step: 'done', pass: true, ok: true });
} catch (e) {
  emit({ id: 'q34-done', step: 'done', pass: false, ok: false, error: String(e && e.stack ? e.stack : e) });
  process.exit(1);
}
