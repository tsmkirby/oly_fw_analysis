// Correction version 2. One emulator process. Stock landscape. No display hook.
// The CPU store watch on object 0x62c54158 + 0x374 is armed in PlayLab.preinit,
// before the first guest instruction. This run also wraps the lab's memcpy and
// memset hooks, which write through the debugger and do not hit that watch.
// The shared validation library is hashed before the emulator is imported.
// Do not edit after it has run.
// Usage: node26 work/scripts/obs_mode_r3_t9d.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_mode_r3_t9d.mjs om-emu\n');
  process.exit(2);
}

function shaFile(p) {
  const b = readFileSync(p);
  return { path: p.replaceAll('\\', '/'), sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}

const IMAGE_BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
function imageBytes(addr, n) {
  const off = addr - IMAGE_BASE;
  return [...image.subarray(off, off + n)];
}
function hexBytes(list) {
  return list.map((b) => b.toString(16).padStart(2, '0')).join('');
}
const LISTED = [
  { addr: 0x61184e04, hex: '8029', text: 'mov 0x29,D0' },
  { addr: 0x61184e06, hex: '244c03', text: 'mov 0x34c,A0' },
  { addr: 0x61184e09, hex: 'f17c', text: 'add A3,A0' },
  { addr: 0x61184e0b, hex: '8538', text: 'mov 0x38,D1' },
  { addr: 0x61184e0d, hex: 'dd9f87f4ff0004', text: 'call 0x610cd5ac' },
  { addr: 0x610cd5ac, hex: '91', text: 'mov A0,A1' },
  { addr: 0x610cd5bb, hex: 'cd0201f014', text: 'call 0x610cd6bd' },
  { addr: 0x610cd6bd, hex: '87', text: 'mov D1,D3' },
  { addr: 0x610cd718, hex: 'f82408', text: 'mov (0x8,A0),A1' },
  { addr: 0x610cd71b, hex: '9c', text: 'mov A3,A0' },
  { addr: 0x610cd71c, hex: 'dded51f3eef01c', text: 'call 0x50002909' },
  { addr: 0x61185231, hex: 'a002', text: 'cmp 0x2,D0' },
  { addr: 0x61185235, hex: 'a003', text: 'cmp 0x3,D0' },
  { addr: 0x61185251, hex: 'ca4a', text: 'bra 0x6118529b' },
  { addr: 0x61185253, hex: '8003', text: 'mov 0x3,D0' },
  { addr: 0x61185257, hex: '8001', text: 'mov 0x1,D0' },
];
const listingCheck = LISTED.map((row) => {
  const got = hexBytes(imageBytes(row.addr, row.hex.length / 2));
  return { ...row, got, match: got === row.hex };
});

mkdirSync(resolve('work/out'), { recursive: true });
const lib = shaFile(resolve('work/scripts/lib_valid_t9d.mjs'));
const pre = {
  step: 'before-emulator',
  note: 'SHA-256 of the shared validation library, taken before the emulator is imported. The listing bytes were compared with the stock image in this same step. This run does not install the display hook.',
  libValid: lib,
  image: shaFile(resolve('inputs/00_0100_50000020.decoded.bin')),
  listingCheck,
  listingMismatches: listingCheck.filter((r) => !r.match).length,
};
writeFileSync(resolve('work/out/pre-mode-r3.json'), JSON.stringify(pre, null, 2) + '\n');
console.log(JSON.stringify({ step: 'lib-digest', sha256: lib.sha256, bytes: lib.bytes, listingMismatches: pre.listingMismatches }));
if (pre.listingMismatches) process.exit(2);

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const { PlayLab } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/play.mjs')).href);
const { S, R } = await import(pathToFileURL(resolve(checkout, 'emu/src/core/cpu.mjs')).href);
const mem = await import(pathToFileURL(resolve(checkout, 'emu/src/core/mem.mjs')).href);

const OBJ = 0x62c54158;
const MODE = (OBJ + 0x374) >>> 0;
const MODE_U = (MODE + 0x40000000) >>> 0;
const PAGE = MODE >>> 16;
const GET = 0x60063380;
const SET = 0x60063431;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const ENTRY = 0x61184dd6;
const WRITER = 0x61184e51;
const COPY_FN = 0x610cd5ac;
const COPY_CALL = 0x610cd71c;
const CALLS_SITE = 0x610cd6fc;
const TABLE = 0x6036f6e4;
const POS = 529;
const DIAL = [
  { id: 'all', zone: 0, kind: 2, dims: { 0: 1, 1: 1 } },
  { id: 'single', zone: 1, kind: 0, dims: { 0: 1, 1: 1 } },
  { id: 'small', zone: 2, kind: 3, dims: { 0: 3, 1: 3 } },
  { id: 'cross', zone: 3, kind: 3, dims: { 0: 1, 1: 1 } },
];

const live = { phase: 'boot', machine: null, armed: null, source: null };
const stores = [];
const copies = [];
const frames = [];
const getterRing = [];
let storeSeq = 0;
let copySeq = 0;
let memcpyN = 0;
let memsetN = 0;
let copyHits = 0;

const STORE_PATH = resolve('work/out/mode-stores-r3.jsonl');
const COPY_PATH = resolve('work/out/mode-copies-r3.jsonl');
writeFileSync(STORE_PATH, '');
writeFileSync(COPY_PATH, '');

function u32bytes(b, o) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}
function firmware(addr) {
  return addr >= 0x60021020 && addr < 0x62000000;
}
function chainOf(mdr, stack) {
  const seen = new Set();
  const chain = [];
  for (const v of [mdr, ...stack]) {
    const a = v >>> 0;
    if (!firmware(a) || seen.has(a)) continue;
    seen.add(a);
    chain.push(a);
    if (chain.length >= 12) break;
  }
  return chain;
}
function readStack(machine, sp) {
  try {
    const raw = machine.dbgRead(sp >>> 0, 80);
    const stack = [];
    for (let i = 0; i < 20; i++) stack.push(u32bytes(raw, i * 4));
    return stack;
  } catch { return []; }
}
function readU32(sim, addr) {
  try { return u32bytes(sim.read(addr >>> 0, 4), 0); } catch { return null; }
}
function overlaps(lo, hi, a, b) {
  return lo < b && hi > a;
}

function onStore(rec) {
  try {
    storeSeq += 1;
    const pc = rec.pc >>> 0;
    const addr = rec.addr >>> 0;
    const value = rec.value >>> 0;
    const machine = live.machine;
    const sp = R[8] >>> 0;
    const mdr = R[11] >>> 0;
    const stack = machine ? readStack(machine, sp) : [];
    let bytes = null;
    if (machine) { try { bytes = [...machine.dbgRead(pc, 8)]; } catch { bytes = null; } }
    const row = {
      n: storeSeq,
      id: rec.id,
      phase: live.phase,
      t: machine && machine.devices && machine.devices.clock ? machine.devices.clock.t : null,
      insns: rec.insns,
      pc, addr, size: rec.size, value,
      regs: {
        d0: R[0] >>> 0, d1: R[1] >>> 0, d2: R[2] >>> 0, d3: R[3] >>> 0,
        a0: R[4] >>> 0, a1: R[5] >>> 0, a2: R[6] >>> 0, a3: R[7] >>> 0,
        sp, mdr,
      },
      chain: chainOf(mdr, stack),
      stack,
      bytes,
      getters: getterRing.slice(-6),
    };
    stores.push(row);
    appendFileSync(STORE_PATH, JSON.stringify(row) + '\n');
  } catch { /* a watch must not change the run */ }
}

function arm(lab, extra = []) {
  const machine = lab.sim.m;
  live.machine = machine;
  machine.setWatchpoints([
    { id: 'mode', lo: MODE, hi: MODE + 4, kind: 2, stop: false },
    { id: 'mode-uncached', lo: MODE_U, hi: MODE_U + 4, kind: 2, stop: false },
    ...extra,
  ], { onLog: onStore });
}

const origPreinit = PlayLab.prototype.preinit;
PlayLab.prototype.preinit = function preinitR3(opts) {
  const ret = origPreinit.call(this, opts);
  arm(this);
  live.armed = {
    where: 'PlayLab.preinit, after the machine exists and before OsdLab.mm_ctors',
    insns: S.insns,
    pc: R[9] >>> 0,
    mode: MODE,
    modeUncached: MODE_U,
    page: PAGE,
    wp: mem.WP[PAGE],
    rp: mem.RP[PAGE],
  };
  return ret;
};

const OUT = resolve('work/out/obs-mode-r3.jsonl');
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
    outPath: 'work/out/session-mode-r3.jsonl',
    tag: 'mode-r3',
    candidate: false,
    fatalShots: true,
    nvramPath: 'work/out/nvram-mode-r3.json',
    explanation: 'Correction producer trace. Stock landscape. Store watch armed in PlayLab.preinit. memcpy and memset hooks wrapped so a debugger write of the mode word is recorded. No display hook. EMULATOR-ONLY observation only.',
    change: 'none',
    async drive(ctx) {
      const { MODEL, A, IMAGE_BASE: base } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      const { MEMCPY, MEMSET } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/hle.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      const watchStill = mem.WP[PAGE] < 0;
      emit({
        id: 'r3-arm', step: 'arm', pass: live.armed !== null && live.armed.insns === 0 && watchStill,
        problems: live.armed === null ? ['not-armed'] : (watchStill ? [] : ['watch-page-fast']),
        expect: { insns: 0, wp: -1, before: 'first guest instruction' },
        actual: { armed: live.armed, wpNow: mem.WP[PAGE], libValid: lib, imageBase: base },
        note: 'Same arm point as the r2 sweep. wpNow is the page at drive start, before any re-arm, after boot.',
      });

      const l = ctx.l;
      const runtimeOf = (addr) => (addr - 0x50000000 + base) >>> 0;
      const copyPc = runtimeOf(MEMCPY);
      const setPc = runtimeOf(MEMSET);
      const hadCopy = l.hooks.has(copyPc);
      const hadSet = l.hooks.has(setPc);

      function logCopy(kind, hle, r) {
        if (kind === 'memcpy') memcpyN += 1; else memsetN += 1;
        const dest = r.a0 >>> 0;
        const src = r.a1 >>> 0;
        const len = kind === 'memcpy' ? (r.d0 >>> 0) : (r.d1 >>> 0);
        if (len === 0 || len > 0x100000) return;
        const end = (dest + len) >>> 0;
        if (end < dest) return;
        const hitMode = overlaps(dest, end, MODE, MODE + 4) || overlaps(dest, end, MODE_U, MODE_U + 4);
        const srcWord = live.source ? live.source.modeField : null;
        const hitSource = srcWord !== null && overlaps(dest, end, srcWord, srcWord + 4);
        if (!hitMode && !hitSource) return;
        copyHits += 1;
        if (copyHits > 80 && !hitMode) return;
        const sim = hle.sim;
        const off = hitMode
          ? ((overlaps(dest, end, MODE, MODE + 4) ? MODE : MODE_U) - dest) >>> 0
          : (srcWord - dest) >>> 0;
        let srcBytes = null;
        let destBefore = null;
        if (kind === 'memcpy' && off + 4 <= len) {
          srcBytes = readU32(sim, (src + off) >>> 0);
        }
        destBefore = readU32(sim, (dest + off) >>> 0);
        const sp = r.sp >>> 0;
        const mdr = r.mdr >>> 0;
        const stack = readStack(live.machine, sp);
        const row = {
          n: ++copySeq,
          kind,
          phase: live.phase,
          t: live.machine && live.machine.devices && live.machine.devices.clock ? live.machine.devices.clock.t : null,
          insns: S.insns,
          pc: r.pc >>> 0,
          mdr,
          dest, src, len, off,
          hitMode, hitSource,
          fill: kind === 'memset' ? (r.d0 & 0xff) : null,
          srcWord: srcBytes,
          destBefore,
          modeBefore: readU32(sim, MODE),
          d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0, d3: r.d3 >>> 0,
          a2: r.a2 >>> 0, a3: r.a3 >>> 0,
          chain: chainOf(mdr, stack),
          stack,
          getters: getterRing.slice(-8),
        };
        copies.push(row);
        appendFileSync(COPY_PATH, JSON.stringify(row) + '\n');
      }

      if (!hadCopy || !hadSet) throw new Error('memcpy ' + hadCopy + ' memset ' + hadSet + ' pc ' + copyPc.toString(16));
      l.wrap(MEMCPY, (prev) => (hle, r) => { logCopy('memcpy', hle, r); prev(hle, r); });
      l.wrap(MEMSET, (prev) => (hle, r) => { logCopy('memset', hle, r); prev(hle, r); });
      emit({
        id: 'r3-wrap', step: 'wrap', pass: true, problems: [],
        expect: { memcpy: true, memset: true },
        actual: { memcpy: MEMCPY, memset: MEMSET, copyPc, setPc },
        note: 'Wrapped the hooks already installed for memcpy and memset. The wrapper records a copy whose destination covers the mode word, then calls the original hook. The original hook writes with sim.write, which does not pass the CPU store watch.',
      });

      live.phase = 'bring-up';
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

      const sim = l.sim;
      const table = readU32(sim, TABLE);
      const basePtr = table ? readU32(sim, (table + 8) >>> 0) : null;
      const slot = basePtr ? (basePtr + 0x290) >>> 0 : null;
      const slotHead = slot ? readU32(sim, slot) : null;
      const srcPtr = slot ? readU32(sim, (slot + 8) >>> 0) : null;
      const modeField = srcPtr ? (srcPtr + 0x28) >>> 0 : null;
      const modeFieldValue = modeField ? readU32(sim, modeField) : null;
      live.source = { table, basePtr, slot, slotHead, srcPtr, modeField, modeFieldValue };
      const extra = [];
      if (modeField && modeField >= 0x60000000 && modeField < 0xa0000000 && modeField !== MODE) {
        extra.push({ id: 'source-mode', lo: modeField, hi: modeField + 4, kind: 2, stop: false });
        const page = modeField >>> 16;
        extra.push({ id: 'source-mode-uncached', lo: (modeField + 0x40000000) >>> 0, hi: (modeField + 0x40000000 + 4) >>> 0, kind: 2, stop: false });
        arm(l, extra);
        live.source.armed = true;
        live.source.wp = mem.WP[page];
        live.source.modeWp = mem.WP[PAGE];
      } else {
        live.source.armed = false;
      }
      emit({
        id: 'r3-source', step: 'source', pass: live.source.armed === true,
        problems: live.source.armed ? [] : ['source-not-armed'],
        expect: { table: 'nonzero', modeField: 'writable' },
        actual: live.source,
        note: 'Table at 0x6036f6e4, slot index 0x29, source pointer at slot+8, mode field at source+0x28. Armed after bring-up and before any zone setter. The mode-word watch stays in the same list.',
      });

      l.observe(ctx.native(GET), (lab, r) => {
        const site = r.mdr >>> 0;
        if (!firmware(site)) return;
        const rec = { t: lab.lab_time(), site, key: r.d0 & 0xffff, index: r.d1 & 0xffff, ret: null, phase: live.phase };
        getterRing.push(rec);
        if (getterRing.length > 80) getterRing.shift();
        l.hook_rt(site, (h, rr) => {
          if (rec.ret === null) rec.ret = rr.d0 & 0xffff;
          l.hooks.delete(site);
          l.passthrough(rr);
        }, 'obs-r3-get-ret', true);
      }, 'obs-r3-getter');

      const sites = [];
      function logSite(name, r) {
        const row = {
          name,
          phase: live.phase,
          t: l.lab_time(),
          pc: r.pc >>> 0,
          mdr: r.mdr >>> 0,
          d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0, d3: r.d3 >>> 0,
          a0: r.a0 >>> 0, a1: r.a1 >>> 0, a2: r.a2 >>> 0, a3: r.a3 >>> 0,
          mode: readU32(l.sim, MODE),
        };
        const near = (row.a0 >= OBJ && row.a0 < OBJ + 0x800) || (row.a1 >= OBJ && row.a1 < OBJ + 0x800)
          || (row.a3 >= OBJ && row.a3 < OBJ + 0x800);
        if (!near && sites.length > 40) return;
        sites.push(row);
        if (sites.length <= 60) appendFileSync(resolve('work/out/mode-sites-r3.jsonl'), JSON.stringify(row) + '\n');
      }
      writeFileSync(resolve('work/out/mode-sites-r3.jsonl'), '');
      l.observe(ctx.native(COPY_FN), (lab, r) => logSite('copy-fn', r), 'obs-r3-copy-fn');
      l.observe(ctx.native(COPY_CALL), (lab, r) => logSite('copy-call', r), 'obs-r3-copy-call');
      l.observe(ctx.native(CALLS_SITE), (lab, r) => logSite('calls', r), 'obs-r3-calls');
      l.observe(ctx.native(ENTRY), (lab, r) => {
        frames.push({
          kind: 'entry', phase: live.phase, t: lab.lab_time(),
          obj: r.a0 >>> 0, mode: readU32(lab.sim, (r.a0 + 0x374) >>> 0),
        });
      }, 'obs-r3-entry');
      l.observe(ctx.native(WRITER), (lab, r) => {
        frames.push({
          kind: 'writer', phase: live.phase, t: lab.lab_time(),
          obj: r.a0 >>> 0, mode: readU32(lab.sim, (r.a0 + 0x374) >>> 0),
          copies: copySeq,
        });
      }, 'obs-r3-writer');

      const trials = [];
      for (const spec of DIAL) {
        live.phase = spec.id;
        const fromCopies = copySeq;
        const fromStores = storeSeq;
        const fromFrames = frames.length;
        setKey(0x84d1, 0, spec.kind);
        setKey(0x99a1, 0, spec.zone);
        for (let i = 0; i < 10; i++) setKey(0x1dd1, i, spec.dims[i] ?? 0);
        setKey(0x88b2, 0, POS);
        const cap = ctx.l.lab_time() + 650 * 1e6;
        while (ctx.l.lab_time() < cap) ctx.idle(40);
        const mine = frames.slice(fromFrames).filter((f) => f.kind === 'writer');
        const row = {
          id: spec.id,
          zone: spec.zone,
          kind: spec.kind,
          writerModes: mine.map((f) => f.mode),
          entryModes: frames.slice(fromFrames).filter((f) => f.kind === 'entry').map((f) => f.mode),
          newCopies: copySeq - fromCopies,
          newStores: storeSeq - fromStores,
          modeNow: readU32(sim, MODE),
          sourceNow: modeField ? readU32(sim, modeField) : null,
          cells: {
            k99a1: readKey(0x99a1, 0),
            k84d1: readKey(0x84d1, 0),
            k1dd1: [readKey(0x1dd1, 0), readKey(0x1dd1, 1)],
            subject: readKey(0x1e71, 0),
          },
        };
        trials.push(row);
        emit({
          id: 'r3-' + spec.id, step: 'zone',
          pass: row.cells.subject === 0 && row.cells.k99a1 === spec.zone,
          problems: row.cells.subject !== 0 ? ['subject'] : [],
          expect: { zone: spec.zone },
          actual: { writerModes: row.writerModes, newCopies: row.newCopies, newStores: row.newStores, modeNow: row.modeNow, sourceNow: row.sourceNow },
          note: 'Zone ' + spec.id + '. Writer modes are the word at object+0x374 when 0x61184e51 is entered.',
        });
      }

      const modeCopies = copies.filter((c) => c.hitMode);
      const summary = {
        version: 'r3',
        libValid: lib,
        listingMismatches: pre.listingMismatches,
        armed: live.armed,
        source: live.source,
        memcpyN, memsetN, copyHits, copySeq, storeSeq,
        modeCopyCount: modeCopies.length,
        modeCopyPcs: [...new Set(modeCopies.map((c) => c.pc))],
        modeCopyMdr: [...new Set(modeCopies.map((c) => c.mdr))],
        modeCopyChains: modeCopies.slice(0, 8).map((c) => ({
          n: c.n, kind: c.kind, phase: c.phase, mdr: c.mdr, dest: c.dest, src: c.src, len: c.len,
          off: c.off, srcWord: c.srcWord, destBefore: c.destBefore, modeBefore: c.modeBefore, chain: c.chain,
          d0: c.d0, d1: c.d1, d2: c.d2, d3: c.d3,
        })),
        stores: stores.map((s) => ({ n: s.n, id: s.id, phase: s.phase, pc: s.pc, addr: s.addr, value: s.value, chain: s.chain })),
        trials,
        siteCount: sites.length,
        sitesNear: sites.filter((s) => s.a0 === (OBJ + 0x34c) >>> 0 || s.a3 === OBJ || (s.a0 >= OBJ && s.a0 < OBJ + 0x800)).slice(0, 24),
      };
      writeFileSync(resolve('work/out/mode-r3-summary.json'), JSON.stringify(summary, null, 2) + '\n');
      emit({
        id: 'r3-done', step: 'done', pass: modeCopies.length > 0 || storeSeq > 0,
        problems: modeCopies.length > 0 || storeSeq > 0 ? [] : ['no-writer'],
        expect: { writer: 'memcpy or cpu store' },
        actual: { memcpyN, memsetN, modeCopies: modeCopies.length, storeSeq, trials: trials.map((t) => ({ id: t.id, writerModes: t.writerModes, newCopies: t.newCopies, newStores: t.newStores })) },
        note: 'mode-copies-r3.jsonl holds every logged copy that covered the mode word or the source field. mode-stores-r3.jsonl holds CPU store-watch hits.',
      });
    },
  });
  if (!result.ok) process.exit(1);
} catch (e) {
  emit({
    id: 'r3-done', step: 'done', pass: false, problems: ['exception'],
    expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) },
  });
  process.exit(1);
}
