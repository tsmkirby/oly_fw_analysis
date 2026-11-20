// Correction version 3. One emulator process. Stock landscape. No display hook.
// The CPU store watch is armed in PlayLab.preinit, before the first guest
// instruction, on the mode word and on the two words the version-2 trace
// copied that word from. memcpy and memset stay wrapped.
// The shared validation library is hashed before the emulator is imported.
// Do not edit after it has run.
// Usage: node26 work/scripts/obs_mode_r4_t9d.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_mode_r4_t9d.mjs om-emu\n');
  process.exit(2);
}

function shaFile(p) {
  const b = readFileSync(p);
  return { path: p.replaceAll('\\', '/'), sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}

mkdirSync(resolve('work/out'), { recursive: true });
const lib = shaFile(resolve('work/scripts/lib_valid_t9d.mjs'));
writeFileSync(resolve('work/out/pre-mode-r4.json'), JSON.stringify({
  step: 'before-emulator',
  note: 'SHA-256 of the shared validation library, taken before the emulator is imported. This run does not install the display hook.',
  libValid: lib,
}, null, 2) + '\n');
console.log(JSON.stringify({ step: 'lib-digest', sha256: lib.sha256, bytes: lib.bytes }));

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const { PlayLab } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/play.mjs')).href);
const { S, R } = await import(pathToFileURL(resolve(checkout, 'emu/src/core/cpu.mjs')).href);
const mem = await import(pathToFileURL(resolve(checkout, 'emu/src/core/mem.mjs')).href);

const OBJ = 0x62c54158;
const MODE = (OBJ + 0x374) >>> 0;
const SLOT_MODE = 0x62b92720;
const TEMPLATE_MODE = 0x6247daa8;
const FILL_FN = 0x610cd5c4;
const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const WATCH = [
  ['mode', MODE],
  ['slot-mode', SLOT_MODE],
  ['template-mode', TEMPLATE_MODE],
];

const live = { phase: 'boot', machine: null, armed: null };
const stores = [];
const copies = [];
const fills = [];
let storeSeq = 0;
let memcpyN = 0;
let memsetN = 0;

function u32bytes(b, o) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}
function readU32(sim, addr) {
  try { return u32bytes(sim.read(addr >>> 0, 4), 0); } catch { return null; }
}
function firmware(addr) {
  return addr >= 0x60021020 && addr < 0x62000000;
}
function readStack(sp) {
  try {
    const raw = live.machine.dbgRead(sp >>> 0, 64);
    const stack = [];
    for (let i = 0; i < 16; i++) stack.push(u32bytes(raw, i * 4));
    return stack;
  } catch { return []; }
}
function overlaps(lo, hi, a, b) { return lo < b && hi > a; }

function onStore(rec) {
  try {
    storeSeq += 1;
    if (stores.length >= 40 && live.phase === 'boot') return;
    const pc = rec.pc >>> 0;
    const mdr = R[11] >>> 0;
    const stack = readStack(R[8]);
    const row = {
      n: storeSeq,
      id: rec.id,
      phase: live.phase,
      insns: rec.insns,
      pc, addr: rec.addr >>> 0, size: rec.size, value: rec.value >>> 0,
      mdr,
      d0: R[0] >>> 0, d1: R[1] >>> 0, a0: R[4] >>> 0, a1: R[5] >>> 0,
      bytes: live.machine ? [...live.machine.dbgRead(pc, 8)] : null,
      stack: stack.filter(firmware).slice(0, 8),
    };
    stores.push(row);
    appendFileSync(resolve('work/out/mode-stores-r4.jsonl'), JSON.stringify(row) + '\n');
  } catch { /* a watch must not change the run */ }
}

function watchList() {
  const list = [];
  for (const [id, lo] of WATCH) {
    list.push({ id, lo, hi: (lo + 4) >>> 0, kind: 2, stop: false });
    list.push({ id: id + '-uncached', lo: (lo + 0x40000000) >>> 0, hi: (lo + 0x40000000 + 4) >>> 0, kind: 2, stop: false });
  }
  return list;
}

const origPreinit = PlayLab.prototype.preinit;
PlayLab.prototype.preinit = function preinitR4(opts) {
  const ret = origPreinit.call(this, opts);
  live.machine = this.sim.m;
  live.machine.setWatchpoints(watchList(), { onLog: onStore });
  live.armed = {
    where: 'PlayLab.preinit, after the machine exists and before OsdLab.mm_ctors',
    insns: S.insns,
    pc: R[9] >>> 0,
    watches: WATCH.map(([id, lo]) => ({ id, lo, page: lo >>> 16, wp: mem.WP[lo >>> 16] })),
  };
  return ret;
};

writeFileSync(resolve('work/out/mode-stores-r4.jsonl'), '');
writeFileSync(resolve('work/out/mode-copies-r4.jsonl'), '');
writeFileSync(resolve('work/out/mode-fills-r4.jsonl'), '');
const OUT = resolve('work/out/obs-mode-r4.jsonl');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, step: row.step }));
  writeFileSync(OUT, lines.join('\n') + '\n');
};

try {
  if (process.env.OM_EMU_MODEL !== 'E147') throw new Error('env');
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-mode-r4.jsonl',
    tag: 'mode-r4',
    candidate: false,
    fatalShots: true,
    nvramPath: 'work/out/nvram-mode-r4.json',
    explanation: 'Correction producer trace, second pass. Stock landscape. Store watches armed in PlayLab.preinit on the mode word, the slot word and the template word. No display hook. EMULATOR-ONLY observation only.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A, IMAGE_BASE: base } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { MEMCPY, MEMSET } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/hle.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      const wpNow = WATCH.map(([id, lo]) => ({ id, wp: mem.WP[lo >>> 16] }));
      emit({
        id: 'r4-arm', step: 'arm',
        pass: live.armed !== null && live.armed.insns === 0 && wpNow.every((w) => w.wp < 0),
        problems: [],
        expect: { insns: 0, wp: -1 },
        actual: { armed: live.armed, wpNow, libValid: lib },
        note: 'Watches armed before the first guest instruction. wpNow is the same pages at drive start, before any re-arm.',
      });
      const l = ctx.l;
      const runtimeOf = (addr) => (addr - 0x50000000 + base) >>> 0;
      if (!l.hooks.has(runtimeOf(MEMCPY)) || !l.hooks.has(runtimeOf(MEMSET))) throw new Error('hooks');
      function logCopy(kind, hle, r) {
        if (kind === 'memcpy') memcpyN += 1; else memsetN += 1;
        const dest = r.a0 >>> 0;
        const src = r.a1 >>> 0;
        const len = kind === 'memcpy' ? (r.d0 >>> 0) : (r.d1 >>> 0);
        if (len === 0 || len > 0x100000) return;
        const end = (dest + len) >>> 0;
        if (end < dest) return;
        let hit = null;
        for (const [id, lo] of WATCH) {
          if (overlaps(dest, end, lo, lo + 4) || overlaps(dest, end, (lo + 0x40000000) >>> 0, (lo + 0x40000004) >>> 0)) hit = id;
        }
        const zoneLen = live.phase !== 'boot' && live.phase !== 'bring-up' && len === 56;
        if (!hit && !zoneLen) return;
        if (!hit && copies.length >= 30) return;
        const off = hit ? (WATCH.find((w) => w[0] === hit)[1] - dest) >>> 0 : 0x28;
        const row = {
          n: copies.length + 1, kind, phase: live.phase, hit, dest, src, len, off,
          pc: r.pc >>> 0, mdr: r.mdr >>> 0,
          srcWord: kind === 'memcpy' && off + 4 <= len ? readU32(hle.sim, (src + off) >>> 0) : null,
          destBefore: off + 4 <= len ? readU32(hle.sim, (dest + off) >>> 0) : null,
          d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0,
          stack: readStack(r.sp).filter(firmware).slice(0, 8),
        };
        copies.push(row);
        appendFileSync(resolve('work/out/mode-copies-r4.jsonl'), JSON.stringify(row) + '\n');
      }
      l.wrap(MEMCPY, (prev) => (hle, r) => { logCopy('memcpy', hle, r); prev(hle, r); });
      l.wrap(MEMSET, (prev) => (hle, r) => { logCopy('memset', hle, r); prev(hle, r); });

      live.phase = 'bring-up';
      ctx.bringUp();
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(250);
      const argument = l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      l.call(A(SET_API), { d0: 289, d1: argument }, null, null, 200000);
      l.call(A(SET_API), { d0: 1712, d1: 0 }, null, null, 200000);
      ctx.idle(150);
      const readKey = (key, index) => l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      const setKey = (key, index, value) => {
        l.call(ctx.native(SET), { d0: key, d1: index, a1: value }, null, null, 200000);
        const got = readKey(key, index);
        if (got !== (value & 0xffff)) throw new Error('setter readback ' + key.toString(16));
      };
      if (readKey(0x1e71, 0) !== 0) throw new Error('subject');

      l.observe(ctx.native(FILL_FN), (lab, r) => {
        if (live.phase === 'boot' || live.phase === 'bring-up') return;
        if (fills.length >= 24) return;
        const row = {
          phase: live.phase, pc: r.pc >>> 0, mdr: r.mdr >>> 0,
          d0: r.d0 >>> 0, d1: r.d1 >>> 0,
          a0: r.a0 >>> 0, a1: r.a1 >>> 0, a2: r.a2 >>> 0, a3: r.a3 >>> 0,
          template: readU32(lab.sim, TEMPLATE_MODE),
          slot: readU32(lab.sim, SLOT_MODE),
          mode: readU32(lab.sim, MODE),
        };
        fills.push(row);
        appendFileSync(resolve('work/out/mode-fills-r4.jsonl'), JSON.stringify(row) + '\n');
      }, 'obs-r4-fill');

      const dial = [
        { id: 'all', zone: 0, kind: 2 },
        { id: 'cross', zone: 3, kind: 3 },
      ];
      const trials = [];
      for (const spec of dial) {
        live.phase = spec.id;
        const fromS = storeSeq;
        const fromC = copies.length;
        setKey(0x84d1, 0, spec.kind);
        setKey(0x99a1, 0, spec.zone);
        setKey(0x1dd1, 0, spec.id === 'cross' ? 1 : 1);
        setKey(0x1dd1, 1, 1);
        setKey(0x88b2, 0, 529);
        const cap = l.lab_time() + 500 * 1e6;
        while (l.lab_time() < cap) ctx.idle(40);
        const row = {
          id: spec.id,
          newStores: storeSeq - fromS,
          newCopies: copies.length - fromC,
          mode: readU32(l.sim, MODE),
          slot: readU32(l.sim, SLOT_MODE),
          template: readU32(l.sim, TEMPLATE_MODE),
          storeIds: stores.filter((s) => s.n > fromS).map((s) => ({ id: s.id, pc: s.pc, addr: s.addr, value: s.value, mdr: s.mdr })),
        };
        trials.push(row);
        emit({
          id: 'r4-' + spec.id, step: 'zone', pass: row.mode === row.slot,
          problems: [],
          expect: { mode: 'equals slot' },
          actual: row,
          note: 'Zone ' + spec.id + '.',
        });
      }
      const summary = {
        version: 'r4', libValid: lib, armed: live.armed, wpNow,
        memcpyN, memsetN, storeSeq,
        stores, copies, fills, trials,
      };
      writeFileSync(resolve('work/out/mode-r4-summary.json'), JSON.stringify(summary, null, 2) + '\n');
      const templateStores = stores.filter((s) => s.id && String(s.id).startsWith('template'));
      emit({
        id: 'r4-done', step: 'done', pass: true, problems: [],
        expect: { recorded: true },
        actual: {
          storeSeq, templateStores: templateStores.length,
          trials: trials.map((t) => ({ id: t.id, mode: t.mode, slot: t.slot, template: t.template, newStores: t.newStores })),
          fillMdr: [...new Set(fills.map((f) => f.mdr))],
        },
        note: 'CPU stores are mode-stores-r4.jsonl. Copies are mode-copies-r4.jsonl.',
      });
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({
    id: 'r4-done', step: 'done', pass: false, problems: ['exception'],
    expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) },
  });
  process.exit(1);
}
