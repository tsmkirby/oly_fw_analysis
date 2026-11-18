// Match-key trace. Same baseline. E1 row shape (stock 2154 with id 0x3D6F), T3a overlay, section-7
// redirects. No T3a value hooks and no descriptor-bucket link.
// Observation hooks are role observe. The redirects are EMULATOR-ONLY behaviour.
// Usage: node26 work/scripts/trace_decision_d1.mjs om-emu work/out/trace-match-d1.jsonl
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, outPath] = process.argv.slice(2);
assert(checkout && outPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadNand, patchedFirmware, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { UIIN_ENTRIES, apply_uiin_layout, uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');

const UI = 0x3d6f;
const PAGE27 = 0x6158f0f8;
const SOURCE = 0x61529ce8;
const ROW = 0x6031e978;
const STOCK = 0x6158dc44;
const BASE = 0x60021020;
const lines = [];
const emit = (role, x) => {
  const row = { hook: role === 'behaviour' ? 'EMULATOR-ONLY' : 'observe', role, ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => (v === null || v === undefined) ? null : '0x' + (v >>> 0).toString(16);
const ranges = [];
for (const line of readFileSync(resolve('ref/analysis/decompiled-main/functions.tsv'), 'utf8').split(/\r?\n/).slice(1)) {
  if (!line) continue;
  const [a, name] = line.split('\t');
  ranges.push([parseInt(a, 16), name]);
}
const fnOf = (addr) => {
  if (!addr) return null;
  let lo = 0, hi = ranges.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ranges[mid][0] <= addr) { best = ranges[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best ? best[1] : null;
};

const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const diff = resolve('ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv');
const byOff = new Map();
for (const row of readFileSync(diff, 'utf8').trim().split(/\r?\n/).slice(1)) {
  const [o, , old, next] = row.split(',');
  const off = parseInt(o, 16);
  byOff.set(off, { old: parseInt(old, 16), neu: parseInt(next, 16) });
}
const stock = image.subarray(STOCK - BASE, STOCK - BASE + 36);
for (let i = 0; i < 36; i++) {
  const off = (ROW - BASE) + i;
  const neu = i < 4 ? [0x6f, 0x3d, 0x00, 0x00][i] : stock[i];
  const old = image[off];
  byOff.set(off, { old, neu });
}
const ordered = [...byOff.entries()].sort((a, b) => a[0] - b[0]);
const patches = [];
for (const [off, { old, neu }] of ordered) {
  if (image[off] !== old) throw new Error(`overlay old mismatch at 0x${(BASE + off).toString(16)}`);
  const last = patches.at(-1);
  if (last && off === last.offset + last.old.length) { last.old.push(old); last.neu.push(neu); }
  else patches.push({ offset: off, old: [old], neu: [neu] });
}
const changed = ordered.filter(([, v]) => v.old !== v.neu);
const fw = patchedFirmware(patches.map((x, n) => ({
  block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: diff, n,
})));
const layout = uiin_layout(fw.rom);
const keyEntry = (code) => {
  const entries = layout.groups.flatMap(({ entries }, group) => entries.filter(([, , candidate]) => candidate === code).map((entry) => [group, ...entry]));
  assert.equal(entries.length, 1);
  return entries[0];
};
apply_uiin_layout(fw.rom);
const parked = keyEntry(0x120b);
UIIN_ENTRIES.set(parked.slice(0, 3).join(','), parked);
const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} } }, patch: fw.summary, patchRanges: fw.changed, loaded: 'on' },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const bytes = (addr, n) => Buffer.from(l.sim.read(addr, n)).toString('hex');
  const word = (addr) => {
    const a = addr >>> 0;
    if (a < 0x40000000 || a >= 0xc0000000) return null;
    try { return l.sim.u32(a) >>> 0; } catch { return null; }
  };
  const words = (addr, n) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push(hex(word((addr + i * 4) >>> 0)));
    return out;
  };
  const half = (addr) => {
    const a = addr >>> 0;
    if (a < 0x40000000 || a >= 0xc0000000) return null;
    try {
      const b = l.sim.read(a, 2);
      return b[0] | (b[1] << 8);
    } catch { return null; }
  };
  const recordsOf = (base, count) => {
    const n = Math.min(count >>> 0, 64);
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = (base + i * 24) >>> 0;
      const fn = word(p + 8);
      out.push({
        i, w0: hex(word(p)), h4: half(p + 4), h6: half(p + 6),
        fn: hex(fn), fnName: fnOf(fn || 0),
        w12: hex(word(p + 12)), h16: half(p + 16), w20: hex(word(p + 20)),
      });
    }
    return out;
  };
  const readKey = (key, index) => {
    const saved = l.sim.registers();
    const value = l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
    l.sim.reset(saved);
    return value;
  };
  const cells = () => ({
    k5b82: Array.from({ length: 16 }, (_, i) => readKey(0x5b82, i)),
    k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
  });
  emit('observe', {
    step: 'overlay',
    label: 'in-memory overlay: T3a bytes with the third row replaced by stock 2154 and id 0x3D6F',
    changed: changed.length,
    row: Buffer.from(ordered.filter(([off]) => off >= ROW - BASE && off < ROW - BASE + 36).map(([, v]) => v.neu)).toString('hex'),
    valueHooks: false,
    descriptorLink: false,
  });
  const beforePage = bytes(PAGE27 + 4, 8);
  const beforeSrc = bytes(SOURCE + 4, 8);
  const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  emit('behaviour', {
    step: 'redirects',
    label: 'EMULATOR-ONLY section-7 pointer writes',
    page27: { at: hex(PAGE27 + 4), before: beforePage, after: bytes(PAGE27 + 4, 8) },
    source: { at: hex(SOURCE + 4), before: beforeSrc, after: bytes(SOURCE + 4, 8) },
  });
  const storeBefore = cells();
  emit('observe', { step: 'cells-before', ...storeBefore });
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const shot = (name) => {
    const frame = walk.read().frame;
    const file = resolve('work/out/trace-match-d1-' + name + '.png');
    write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
    return file;
  };
  const screen = () => {
    try {
      const scr = walk.read();
      const texts = scr.texts.map((t) => t.text);
      let highlight = null;
      for (const t of scr.texts) {
        try {
          const listed = walk.list(scr, t);
          if (listed && listed.cursor != null && listed.rows[listed.cursor]) {
            highlight = listed.rows[listed.cursor].text;
            break;
          }
        } catch { /* this draw is not a list row */ }
      }
      return { texts, highlight };
    } catch (e) {
      return { texts: [], highlight: null, error: String(e && e.message ? e.message : e) };
    }
  };
  const state = { phase: 'off', events: [], reads: [], decideReads: [], stack: [], decide: 0, hooked: new Set() };
  const push = (rec) => { if (state.phase === 'ok' && state.events.length < 200) state.events.push(rec); };
  const inDecision = () => state.stack.some((x) => x.track);
  const regs = (r) => ({
    d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0,
    a0: hex(r.a0 >>> 0), a1: hex(r.a1 >>> 0), a3: hex(r.a3 >>> 0),
    mdr: hex(r.mdr >>> 0), caller: fnOf(r.mdr >>> 0),
  });
  l.observe(native(0x6124f7be), (lab, r) => {
    const keyCode = r.d0 & 0xffff;
    const track = keyCode === 0x900c;
    state.stack.push({ key: keyCode, track });
    if (!track) return;
    const a0 = r.a0 >>> 0;
    const vt = word(a0);
    push({ part: 'dispatch', site: 'virtual-call', ...regs(r), vtable: hex(vt), slot0: hex(vt ? word(vt) : null), slot0Name: fnOf(vt ? word(vt) : 0), a0words: words(a0, 8) });
  }, 'obs-virtual-call');
  l.observe(native(0x61203082), (lab, r) => {
    if (!inDecision()) return;
    const a0 = r.a0 >>> 0;
    const next = word((a0 + 0x50) >>> 0);
    push({ part: 'chain', site: 'fn-61203082', ...regs(r), at50: hex(next), at50Name: fnOf(next) });
  }, 'obs-3082');
  l.observe(native(0x6120308d), (lab, r) => {
    if (!inDecision()) return;
    const a0 = r.a0 >>> 0;
    const obj = word((a0 + 0x58) >>> 0);
    const vt = obj ? word(obj) : null;
    const slot0 = vt ? word(vt) : null;
    push({
      part: 'chain', site: 'fn-6120308d', ...regs(r),
      obj: hex(obj), vtable: hex(vt), slot0: hex(slot0), slot0Name: fnOf(slot0),
      objWords: obj ? words(obj, 16) : null,
    });
  }, 'obs-308d');
  l.observe(native(0x6124f7c0), (lab, r) => {
    const frame = state.stack.pop();
    if (!frame || !frame.track) return;
    push({ part: 'dispatch', site: 'return-d0', key: frame.key, d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0 });
  }, 'obs-return');
  l.observe(native(0x6124f7d4), (lab, r) => {
    if (state.phase !== 'ok') return;
    push({ part: 'dispatch', site: 'cmp-1', d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0, a3: hex(r.a3 >>> 0) });
  }, 'obs-cmp');
  l.observe(native(0x611a0dc4), (lab, r) => {
    if (state.phase !== 'ok') return;
    const field = (r.a3 - 0x50) >>> 0;
    push({ part: 'callee', site: 'field-50', d0: r.d0 >>> 0, obj: hex(field), at4c: hex(word((field + 0x4c) >>> 0)) });
  }, 'obs-field50');
  l.observe(native(0x611a0ed6), (lab, r) => {
    if (state.phase !== 'ok') return;
    state.decide += 1;
    const target = r.a1 >>> 0;
    const a0 = r.a0 >>> 0;
    push({
      part: 'callee', site: 'decide-call', ...regs(r),
      targetName: fnOf(target), field50: hex(word((a0 + 0x50) >>> 0)), field4c: hex(word((a0 + 0x4c) >>> 0)),
      a0words: words(a0, 24),
    });
    if (target && !state.hooked.has(target)) {
      state.hooked.add(target);
      l.hook_rt(target, (h, rr) => {
        if (state.phase === 'ok' && state.events.length < 80) {
          state.events.push({ part: 'callee', site: 'decide-entry', ...regs(rr), name: fnOf(rr.pc >>> 0) });
        }
        l.passthrough(rr);
      }, 'obs-decide-entry', true);
    }
  }, 'obs-decide-call');
  l.observe(native(0x611a0ed8), (lab, r) => {
    if (state.decide > 0) state.decide -= 1;
    if (state.phase !== 'ok') return;
    push({ part: 'callee', site: 'decide-return', d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0 });
  }, 'obs-decide-return');
  const inDecide = () => state.phase === 'ok' && state.decide > 0;
  l.observe(native(0x611a12a5), (lab, r) => {
    if (!inDecide()) return;
    const table = r.a1 >>> 0;
    const count = r.d0 & 0xffff;
    const obj = r.a0 >>> 0;
    push({
      part: 'match', site: 'table-call', count, table: hex(table), obj: hex(obj),
      key1Half: half((obj + 0x54) >>> 0), records: recordsOf(table, count),
    });
  }, 'obs-table-call');
  l.observe(native(0x611a12aa), (lab, r) => {
    if (!inDecide()) return;
    push({ part: 'match', site: 'table-return', d0: r.d0 >>> 0 });
  }, 'obs-table-return');
  l.observe(native(0x611a265e), (lab, r) => {
    if (!inDecide()) return;
    push({ part: 'match', site: 'row-token', d0: r.d0 >>> 0 });
  }, 'obs-row-token');
  l.observe(native(0x611a269b), (lab, r) => {
    if (!inDecide()) return;
    push({ part: 'match', site: 'key2', d0: r.d0 >>> 0 });
  }, 'obs-key2');
  l.observe(native(0x611a26a1), (lab, r) => {
    if (!inDecide()) return;
    push({ part: 'match', site: 'key1', d0: r.d0 & 0xffff });
  }, 'obs-key1');
  l.observe(native(0x611a26bc), (lab, r) => {
    if (!inDecide()) return;
    push({ part: 'match', site: 'key3', d0: r.d0 >>> 0 });
  }, 'obs-key3');
  l.observe(native(0x611a26f2), (lab, r) => {
    if (!inDecide()) return;
    const rec = r.a2 >>> 0;
    const fn = word(rec + 8);
    push({
      part: 'match', site: 'record-hit', record: hex(rec),
      w0: hex(word(rec)), h4: half(rec + 4), h6: half(rec + 6),
      fn: hex(fn), fnName: fnOf(fn || 0), bytes: bytes(rec, 24),
    });
  }, 'obs-record-hit');
  l.observe(native(0x611a2707), (lab, r) => {
    if (!inDecide()) return;
    push({ part: 'match', site: 'handler-return', d0: r.d0 >>> 0 });
  }, 'obs-handler-return');
  const watchRead = (addr, name) => {
    l.observe(native(addr), (lab, r) => {
      const rec = { fn: name, ...regs(r) };
      if (state.decide > 0 && state.decideReads.length < 40) state.decideReads.push(rec);
      else if (inDecision() && state.reads.length < 40) state.reads.push(rec);
    }, 'obs-' + name);
  };
  watchRead(0x60419446, 'mapped-getter');
  watchRead(0x60419696, 'index-getter');
  watchRead(0x604058bc, 'descriptor');
  watchRead(0x600624d3, 'registry');
  watchRead(0x6041937f, 'setter');
  watchRead(0x60063431, 'store-63431');
  watchRead(0x60063380, 'store-63380');
  idle(1200);
  press('menu');
  const seen = new Set();
  let menuRow = null;
  for (let n = 0; n < 24 && !menuRow; n++) {
    const texts = screen().texts;
    menuRow = texts.find((t) => t.endsWith('AF Button'));
    if (menuRow) break;
    const sig = texts.join('\n');
    if (seen.has(sig)) break;
    seen.add(sig);
    press('left');
  }
  assert.ok(menuRow, 'AF Button missing');
  walk.to([{ row: [menuRow] }]);
  idle(200);
  const pageView = screen();
  let pageFile = null;
  try { pageFile = shot('page'); } catch (e) { pageFile = 'shot-error ' + e.message; }
  emit('observe', { step: 'page', ...pageView, file: pageFile });
  const traced = (label, picture) => {
    const before = screen();
    let beforeFile = null;
    try { beforeFile = shot(picture + '-before'); } catch (e) { beforeFile = 'shot-error ' + e.message; }
    state.events = [];
    state.reads = [];
    state.decideReads = [];
    state.stack = [];
    state.decide = 0;
    state.phase = 'ok';
    press('ok');
    state.phase = 'off';
    const after = screen();
    let afterFile = null;
    try { afterFile = shot(picture + '-after'); } catch (e) { afterFile = 'shot-error ' + e.message; }
    const cmp = state.events.filter((e) => e.site === 'cmp-1');
    const ret = state.events.filter((e) => e.site === 'return-d0');
    emit('observe', {
      step: 'ok', label, before: { ...before, file: beforeFile }, after: { ...after, file: afterFile },
      returnD0: ret.map((e) => e.d0),
      cmpD0: cmp.map((e) => e.d0),
      cmpD2: cmp.map((e) => e.d2),
      chain: state.events.filter((e) => e.part === 'callee' || e.site === 'return-d0' || e.site === 'cmp-1'),
      match: state.events.filter((e) => e.part === 'match'),
      decideReads: state.decideReads,
      reads: state.reads,
    });
    return after;
  };
  traced('2154', '2154');
  press('menu'); idle(150); press('down');
  traced('2155', '2155');
  press('menu'); idle(150); press('down');
  traced('3d6f', '3d6f');
  press('menu'); idle(400);
  const seen3 = new Set();
  let cafTab = null;
  for (let n = 0; n < 24 && !cafTab; n++) {
    const texts = screen().texts;
    cafTab = texts.find((t) => t.includes('C-AF Setting'));
    if (cafTab) break;
    const sig = texts.join('\n');
    if (seen3.has(sig)) break;
    seen3.add(sig);
    press('left');
  }
  if (!cafTab) emit('observe', { step: 'boundary', error: 'C-AF Setting tab missing', texts: screen().texts });
  else {
    walk.to([{ row: [cafTab] }]);
    idle(200);
    for (let n = 0; n < 12; n++) {
      const scr = walk.read();
      const hits = scr.texts.filter((t) => t.text.includes('C-AF Area'));
      if (!hits.length) break;
      const hit = hits.reduce((a, b) => (a.text.length >= b.text.length ? a : b));
      const listed = walk.list(scr, hit);
      const want = listed.rows.indexOf(hit);
      if (listed.cursor === want) break;
      press(listed.cursor === null || listed.cursor < want ? 'down' : 'up');
    }
    traced('caf-area', 'caf');
    press('menu');
  }
  emit('observe', { step: 'cells-after', ...cells(), measured: true, ok: false });
} catch (e) {
  emit('observe', { step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(outPath, lines.join('\n') + (lines.length ? '\n' : ''));
}
