// Acceptance. Two fresh candidate sessions, K2 and K1. Profile A then B,
// one pose change between AF-ON presses, native save, reopen on that store.
// The reopen AF-ON press and its release are both asserted. Do not edit after it runs.
// Usage: node26 work/scripts/accept_runner_t6b.mjs om-emu
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/accept_runner_t6.mjs om-emu\n');
  process.exit(2);
}
const table = JSON.parse(readFileSync(resolve('work/scripts/accept_table_t6.json'), 'utf8'));
const reopenTable = JSON.parse(readFileSync(resolve('work/scripts/accept_reopen_t6.json'), 'utf8'));
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
const C1 = [0x1c, 0x02, 0x07, 0x00, 0x05, 0x00, 0x07, 0x00, 0x00, 0x00];
const STOCK = [0x0e, 0x02, 0x02, 0x00, 0x1b, 0x00, 0x27, 0x00, 0x00, 0x00];
const HALF = {
  k99a1: [0, 0, 2, 0, 2, 0, 5, 5], k9a41: 0, k84d1: 2, k88b2: 526,
  k5962: [526, 526, 526, 526, 526, 526],
  k1dd1: [1, 1, 3, 3, 3, 3, 3, 3, 3, 3],
  k1df1: [1, 1, 1, 1, 0, 0, 0, 0], k1e01: 0, kdfa1: 0,
  k99d2: [526, 526, 526], k90a1: [1, 1], k1db1: 1, k1dc1: 1,
};
const OUT = resolve('work/out/accept-t6b.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, step: row.step, problems: row.problems }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function put(m, off, value) { m[off] = value & 0xff; m[off + 1] = (value >> 8) & 0xff; }
function mirrorA() {
  const m = new Uint8Array(55);
  m[1] = 2;
  put(m, 0x0c, 529);
  put(m, 0x22, 529);
  return Array.from(m);
}
function mirrorB() {
  const m = Uint8Array.from(mirrorA());
  m[5] = 6;
  put(m, 0x14, 540);
  m[0x18] = 5;
  m[0x19] = 7;
  return Array.from(m);
}
function readKey(ctx, key, index) {
  return ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
}
function setKey(ctx, key, index, value) {
  ctx.l.call(ctx.native(SET), { d0: key, d1: index, a1: value }, null, null, 200000);
  if ((readKey(ctx, key, index)) !== (value & 0xffff)) throw new Error('setter readback');
}
function setPublic(ctx, sid, value) {
  const argument = (sid === 289 || sid === 66 || sid === 67)
    ? (ctx.l.call(ctx.native(CONVERTER), { d0: sid, d1: value }, null, null, 200000).d0 >>> 0)
    : value;
  ctx.l.call(API_SET, { d0: sid, d1: argument }, null, null, 200000);
  ctx.idle(300);
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
function install(ctx) {
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
function banks(file) {
  const doc = JSON.parse(readFileSync(resolve(file), 'utf8'));
  return {
    M: Buffer.from(doc.M, 'base64'),
    E: Buffer.from(doc.E, 'base64'),
    saves: doc.M && doc.E ? ['M', 'E'] : [],
  };
}

async function boot(ctx) {
  await bindApi();
  ctx.bringUp();
  ctx.s.switch_input('lever', 1);
  ctx.s.camapp.pump();
  ctx.idle(300);
  setPublic(ctx, 289, 0);
  if (ctx.s.get(289) !== 0 || ctx.s.get(25) !== 0) throw new Error('focus');
  if (readKey(ctx, 0x1e71, 0) !== 0) throw new Error('subject');
}

function check(id, problems, extra) {
  emit({ id, step: extra.step, pass: problems.length === 0, problems, ...extra });
  if (problems.length) throw new Error(id + ' ' + problems.join(','));
}

async function session(name, role, nvram, reopen) {
  const profile = role === 'candidate';
  const z5 = role !== 'k1';
  let hook = null;
  let mirror = mirrorA();
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-accept-' + name + '-t6b.jsonl',
    tag: 'accept-' + name + '-t6b',
    candidate: z5,
    help: true,
    rowLabel: true,
    fatalShots: true,
    nvramPath: nvram,
    overlayCsv: profile
      ? 'work/out/overlay-changed-bytes.csv'
      : (z5 ? 'ref/analysis/button-af/readiness/t5-afon-button-handoff/out/overlay-changed-bytes-c1.csv' : null),
    explanation: profile
      ? name + ' acceptance. Profile A then B. EMULATOR-ONLY. Role: behaviour.'
      : (z5 ? name + ' K2 acceptance. Z5, no mirror seed, same pose and save.' : name + ' K1 acceptance. Stock.'),
    change: profile ? 'combined: zone, size, position, custom dimensions, +9' : 'none',
    async drive(ctx) {
      if (profile) hook = install(ctx);
      await boot(ctx);
      const pose = reopen ? null : attachPose(ctx.l);
      if (!reopen) {
        pose.setPose('landscape');
        pose.deliver();
        ctx.idle(600);
        const got = pose.read();
        check(name + '-pose-a', [
          got.index === 1 ? null : 'index',
          got.exif === 1 ? null : 'exif',
        ].filter(Boolean), { step: 'pose', got });
        if (z5) pokeAll(ctx);
        setKey(ctx, 0x1db1, 0, 1);
        setKey(ctx, 0x1dc1, 0, 1);
        if (profile) seed(ctx, mirror);
        if (hook) hook.refresh();
        const setup = [];
        if (z5 && !same(half(ctx), HALF)) setup.push('half');
        if (profile && !same(mirrorBytes(ctx), mirror)) setup.push('mirror');
        check(name + '-setup', setup, { step: 'setup', half: half(ctx) });
      }
      const steps = reopen ? reopenTable : table;
      for (const step of steps) {
        if (hook) hook.refresh();
        const id = name + '-' + step.id;
        if (step.action === 'profile-b') {
          if (profile) {
            mirror = mirrorB();
            seed(ctx, mirror);
          }
          pose.setPose('exif6');
          pose.deliver();
          ctx.idle(600);
          const got = pose.read();
          if (z5) pokeAll(ctx);
          if (hook) hook.refresh();
          const problems = [];
          if (got.index !== 2 || got.exif !== 6) problems.push('pose');
          if (z5 && !same(half(ctx), HALF)) problems.push('half');
          if (profile && !same(mirrorBytes(ctx), mirror)) problems.push('mirror');
          const shot = ctx.shot(step.id);
          check(id, problems, { step: 'profile-b', got, pose: ctx.l.sim.u32(POSE) >>> 0, file: shot.file });
          continue;
        }
        if (step.action === 'key') {
          ctx.press(step.key);
          const shot = ctx.shot(step.id);
          check(id, [], { step: 'key', key: step.key, screen: ctx.s.screen(), file: shot.file });
          continue;
        }
        if (step.action === 'leave') {
          for (let i = 0; i < 8 && ctx.s.screen() !== 'shooting'; i++) ctx.press('menu');
          ctx.idle(800);
          const shot = ctx.shot(step.id);
          check(id, ctx.s.screen() === 'shooting' ? [] : ['screen'], { step: 'leave', screen: ctx.s.screen(), file: shot.file });
          continue;
        }
        if (step.action === 'save') {
          const saves = (ctx.s.store_log && ctx.s.store_log.nvram && ctx.s.store_log.nvram.saves) || [];
          const names = saves.map((s) => s.store);
          const problems = [];
          if (ctx.s.screen() !== 'shooting') problems.push('screen');
          if (!names.includes('M') || !names.includes('E')) problems.push('completion');
          const shot = ctx.shot(step.id);
          check(id, problems, { step: 'save', screen: ctx.s.screen(), saves: names, file: shot.file });
          continue;
        }
        if (step.action === 'base') {
          const shot = ctx.shot(step.id);
          const now = mirrorBytes(ctx);
          const problems = [];
          if (ctx.s.screen() !== 'shooting') problems.push('screen');
          if (readKey(ctx, 0x1e71, 0) !== 0) problems.push('subject');
          if (ctx.readByte(ZONE) !== 0) problems.push('zone');
          if (now.some((b) => b !== 0xff)) problems.push('mirror');
          if (!same(ctx.readTarget(), STOCK)) problems.push('target');
          check(id, problems, { step: 'base', target: ctx.readTarget(), mirror0: now[0], file: shot.file });
          continue;
        }
        ctx.key(step.key, step.dir);
        ctx.idle(200);
        const shot = ctx.shot(step.id);
        const own = ctx.readOwn();
        const target = ctx.readTarget();
        const problems = [];
        let want = z5 ? ALL : STOCK;
        if (z5 && step.afon) want = !profile ? ALL : (step.phase === 'b' ? C1 : SMALL);
        if (reopen) want = (z5 && step.dir === 'down') ? ALL : STOCK;
        if (!same(target, want)) problems.push('target');
        if (readKey(ctx, 0x1e71, 0) !== 0) problems.push('subject');
        if (!reopen && z5 && !same(half(ctx), HALF)) problems.push('half');
        if (!reopen && profile && !same(mirrorBytes(ctx), mirror)) problems.push('mirror');
        if (!reopen && z5 && !profile && mirrorBytes(ctx).some((b) => b !== 0xff)) problems.push('mirror-seeded');
        if (reopen && mirrorBytes(ctx).some((b) => b !== 0xff)) problems.push('mirror');
        if (z5 && own[6] !== 1) problems.push('enabled');
        if (z5 && own[5] !== 0) problems.push('status');
        if (z5 && !reopen && own[4] !== step.owner) problems.push('owner');
        if (z5 && reopen && step.dir === 'down' && own[4] !== 2) problems.push('owner');
        if (z5 && reopen && step.dir === 'up' && own[4] !== 0) problems.push('owner');
        check(id, problems, {
          step: 'edge', key: step.key, dir: step.dir, target, want, owner: own[4], file: shot.file,
        });
      }
      if (hook && !reopen && hook.counts.dim === 0) throw new Error(name + ' custom dimensions were not read');
    },
  });
  emit({ id: name + '-session', step: 'session', pass: result.ok, failed: result.failed });
  if (!result.ok) throw new Error(name + ' session failed');
}

try {
  emit({
    id: 'accept-plan', step: 'plan', pass: true,
    fallback: 'mirror FF uses zone byte 0, size 0, position 0, and +9 0. Kind 2 then forces position 526. The record is the All target.',
    a: SMALL, b: C1, all: ALL, stock: STOCK,
  });
  const files = {
    c1: 'work/out/nvram-accept-t6-c1.json',
    c2: 'work/out/nvram-accept-t6-c2.json',
    k2: 'work/out/nvram-accept-t6-k2.json',
    k1: 'work/out/nvram-accept-t6-k1.json',
  };
  await session('c1', 'candidate', files.c1, false);
  await session('c2', 'candidate', files.c2, false);
  await session('k2', 'k2', files.k2, false);
  await session('k1', 'k1', files.k1, false);
  const k2store = banks(files.k2);
  for (const name of ['c1', 'c2']) {
    const store = banks(files[name]);
    const sameM = k2store.M.equals(store.M);
    const sameE = k2store.E.equals(store.E);
    const problems = [];
    if (store.M.length !== 262144 || store.E.length !== 196608) problems.push('length');
    if (!sameM || !sameE) problems.push('bytes');
    emit({
      id: name + '-store', step: 'store', pass: problems.length === 0, problems,
      sameM, sameE, mBytes: store.M.length, eBytes: store.E.length,
    });
    if (problems.length) throw new Error(name + ' store ' + problems.join(','));
  }
  await session('reopen-c1', 'candidate', files.c1, true);
  await session('reopen-c2', 'candidate', files.c2, true);
  await session('reopen-k2', 'k2', files.k2, true);
  await session('reopen-k1', 'k1', files.k1, true);
  emit({ id: 'accept-done', step: 'done', pass: true, ok: true });
} catch (e) {
  emit({ id: 'accept-done', step: 'done', pass: false, ok: false, error: String(e && e.stack ? e.stack : e) });
  process.exit(1);
}
