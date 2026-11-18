// T3c Phase A. Decision trace for OK on 2154, 2155, C-AF Area and 0x3D6F.
// Reuses T3a's overlay, section-7 redirects and EMULATOR-ONLY value hooks.
// Usage: node26 work/scripts/route_trace_a1.mjs om-emu work/out/trace-a1.jsonl
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
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
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const PAGE27 = 0x6158f0f8;
const SOURCE = 0x61529ce8;
const ROW_ARRAY = 0x6031e930;
const ID_LIST = 0x6031e928;
const lines = [];
const emit = (x) => {
  const row = { hook: 'EMULATOR-ONLY', ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);

const ranges = [];
for (const line of readFileSync(resolve('ref/analysis/decompiled-main/functions.tsv'), 'utf8').split(/\r?\n/).slice(1)) {
  if (!line) continue;
  const [a, name] = line.split('\t');
  ranges.push([parseInt(a, 16), name]);
}
const fnOf = (addr) => {
  let lo = 0, hi = ranges.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ranges[mid][0] <= addr) { best = ranges[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best ? best[1] : null;
};

const diff = resolve('ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv');
const patches = [];
for (const row of readFileSync(diff, 'utf8').trim().split(/\r?\n/).slice(1)) {
  const [o, , old, next] = row.split(',');
  const off = parseInt(o, 16);
  const last = patches.at(-1);
  if (last && off === last.offset + last.old.length) { last.old.push(parseInt(old, 16)); last.new.push(parseInt(next, 16)); }
  else patches.push({ offset: off, old: [parseInt(old, 16)], new: [parseInt(next, 16)] });
}
const fw = patchedFirmware(patches.map((x, n) => ({ block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.new), source: diff, n })));
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

const state = { phase: 'off', hits: [], events: [] };
const editors = [];
for (const [addr] of ranges) {
  if (addr >= 0x610e0000 && addr < 0x610f0000) editors.push(addr);
}

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const readByte = (addr) => l.sim.read(addr, 1)[0];
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: readByte(PROFILE) }); }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => {
    if (!own(r)) { l.passthrough(r); return; }
    writeByte(PROFILE, r.d1 & 0xff); writeByte(PROFILE_CACHED, r.d1 & 0xff);
    state.events.push({ ev: 'setter', value: r.d1 & 0xff });
    h.finish(r, { d0: 0 });
  }, 'EMULATOR-ONLY afon setter');
  l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
  l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
  const builds = [];
  l.observe(native(0x61203696), (lab, r) => {
    if (builds.length >= 40) return;
    const a0 = r.a0 >>> 0, a1 = r.a1 >>> 0;
    const word = (p, n) => {
      if (!(p > 0x40000000 && p < 0xc0000000)) return null;
      const b = lab.sim.read(p + n, 2);
      return b[0] | (b[1] << 8);
    };
    builds.push({
      d0: r.d0 >>> 0, d1: r.d1 >>> 0, a0: hex(a0), a1: hex(a1), mdr: hex(r.mdr >>> 0), caller: fnOf(r.mdr >>> 0),
      a0w4: word(a0, 4), a1w4: word(a1, 4), a0d0: word(a0, 0), a1d0: word(a1, 0),
    });
  }, 'obs-ctor');
  const watch = (addr, name) => {
    l.observe(native(addr), (lab, r) => {
      if (state.phase !== 'ok' || state.events.length >= 80) return;
      state.events.push({ ev: name, d0: r.d0 >>> 0, d1: r.d1 >>> 0, a0: hex(r.a0 >>> 0), mdr: hex(r.mdr >>> 0), caller: fnOf(r.mdr >>> 0) });
    }, 'obs-' + name);
  };
  watch(0x61203e81, 'open');
  watch(0x61203ede, 'type1-side');
  watch(0x61203f2a, 'type2');
  watch(0x61203f50, 'match');
  watch(0x61204050, 'widget');
  l.observe(native(0x61203470), (lab, r) => {
    if (state.phase !== 'ok' || state.events.length >= 80) return;
    const a0 = r.a0 >>> 0;
    const p58 = a0 > 0x1000 ? lab.sim.u32(a0 + 0x58) >>> 0 : 0;
    const rec = { ev: 'list-type', a0: hex(a0), p58: hex(p58), kind: p58 > 0x1000 ? lab.sim.u32(p58 + 0x5c) >>> 0 : null, mdr: hex(r.mdr >>> 0), caller: fnOf(r.mdr >>> 0) };
    state.events.push(rec);
    const ra = r.mdr >>> 0;
    if (ra > 0x1000 && !lab.hooks.has(ra)) {
      lab.hook_rt(ra, (h, rr) => { rec.ret = rr.d0 & 0xffff; lab.hooks.delete(ra); lab.passthrough(rr); }, 'obs-ret-list-type', true);
    }
  }, 'obs-list-type');
  const page = Buffer.alloc(8); page.writeUInt32LE(ROW_ARRAY, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(ID_LIST, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  const desc = 0x6031e9a0, node = 0x6031e9b8, bucket = 0x62a84970 + (UI & 0x7f) * 4;
  const head = l.sim.u32(bucket);
  const nodeBytes = Buffer.alloc(8); nodeBytes.writeUInt32LE(desc, 0); nodeBytes.writeUInt32LE(head, 4); l.sim.write(node, nodeBytes);
  const headBytes = Buffer.alloc(4); headBytes.writeUInt32LE(node, 0); l.sim.write(bucket, headBytes);
  const looked = l.call(native(0x604058bc), { d0: UI }, null, null, 200000);
  emit({
    step: 'wired', label: 'EMULATOR-ONLY',
    rows: hex(l.sim.u32(PAGE27 + 4)), count: l.sim.u32(PAGE27 + 8) & 0xffff,
    idPointer: hex(l.sim.u32(SOURCE + 4)), idCount: l.sim.u32(SOURCE + 8) & 0xffff,
    lookup: hex(looked.a0 >>> 0), profile: readByte(PROFILE),
    src27: Array.from(l.sim.read(0x61529812, 4)),
    src28: Array.from(l.sim.read(0x61529816, 6)),
    src29: Array.from(l.sim.read(0x6152981c, 6)),
  });
  let armed = false;
  const arm = () => {
    if (armed) return;
    for (const addr of editors) {
      l.observe(native(addr), (lab, r) => {
        if (state.phase !== 'ok' || state.hits.length >= 24) return;
        const mdr = r.mdr >>> 0;
        const hit = { fn: hex(addr), name: fnOf(addr), mdr: hex(mdr), caller: fnOf(mdr), d0: r.d0 >>> 0, a0: hex(r.a0 >>> 0), a1: hex(r.a1 >>> 0) };
        if (state.hits.length < 3) {
          const before = lab.sim.read((mdr - 8) >>> 0, 8);
          hit.before = Array.from(before);
          hit.sp0 = hex(lab.sim.u32(r.sp >>> 0));
        }
        state.hits.push(hit);
      }, 'obs-ed-' + addr.toString(16));
    }
    armed = true;
    emit({ step: 'armed', editors: editors.length });
  };
  const disarm = () => {
    if (!armed) return;
    for (const addr of editors) l.hooks.delete(addr);
    armed = false;
  };
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const shot = (file, frame) => { if (!frame) return; write_png(file, frame[0], frame[1], words_to_rgb(frame[2])); emit({ step: 'screenshot', file }); };
  idle(1500);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 40 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return ['read-error ' + e.message]; } };
  const frameOf = () => { try { return walk.read().frame; } catch (e) { return null; } };
  const findTab = (fragment) => {
    const seen = new Set();
    for (let n = 0; n < 24; n++) {
      const texts = textsOf();
      if (texts.some((t) => t.includes(fragment))) return texts;
      const sig = texts.join('\n');
      if (seen.has(sig)) return null;
      seen.add(sig);
      press('left');
    }
    return null;
  };
  const moveTo = (fragment) => {
    for (let n = 0; n < 12; n++) {
      const scr = walk.read();
      const hits = scr.texts.filter((t) => t.text.includes(fragment));
      if (!hits.length) return null;
      const hit = hits.reduce((a, b) => (a.text.length >= b.text.length ? a : b));
      const listed = walk.list(scr, hit);
      const want = listed.rows.indexOf(hit);
      if (listed.cursor === want) return hit.text;
      if (listed.cursor === null) press('right');
      else press(listed.cursor < want ? 'down' : 'up');
    }
    return null;
  };
  const tracedOk = (label, file) => {
    state.hits = [];
    state.events = [];
    state.phase = 'ok';
    press('ok');
    state.phase = 'off';
    const texts = textsOf();
    shot(file, frameOf());
    const first = state.hits[0] ?? null;
    emit({
      step: 'ok', label, texts, profile: readByte(PROFILE),
      ui2154: s.get(2154), ui2155: s.get(2155), ui238: s.get(238), ui165: s.get(165),
      events: state.events, first, hits: state.hits.length,
      callers: state.hits.slice(0, 8),
    });
  };
  const af = findTab('AF Button');
  emit({ step: 'tabs', found: !!af, builds });
  if (!af) {
    emit({ step: 'done', ok: false, reason: 'AF Button missing' });
  } else {
    walk.to([{ row: [af.find((t) => t.endsWith('AF Button'))] }]);
    idle(300);
    const pageTexts = textsOf();
    shot(resolve('work/out/trace-a1-page.png'), frameOf());
    emit({ step: 'page27', texts: pageTexts, builds, profile: readByte(PROFILE) });
    arm();
    tracedOk('2154', resolve('work/out/trace-a1-2154.png'));
    press('menu');
    idle(200);
    press('down');
    emit({ step: 'moved', label: '2155', texts: textsOf() });
    tracedOk('2155', resolve('work/out/trace-a1-2155.png'));
    press('menu');
    idle(200);
    press('down');
    emit({ step: 'moved', label: '3d6f', texts: textsOf() });
    tracedOk('3d6f', resolve('work/out/trace-a1-3d6f.png'));
    disarm();
    press('menu');
    idle(200);
    press('menu');
    idle(300);
    const caf = findTab('C-AF Setting');
    emit({ step: 'caf-tab', found: !!caf, texts: textsOf() });
    if (caf) {
      walk.to([{ row: [caf.find((t) => t.includes('C-AF Setting'))] }]);
      idle(300);
      const area = moveTo('C-AF Area');
      emit({ step: 'caf-page', area, texts: textsOf() });
      if (area) {
        arm();
        tracedOk('caf-area', resolve('work/out/trace-a1-caf.png'));
        disarm();
      }
    }
    emit({ step: 'done', ok: false, measured: true, note: 'decision trace; ok is not acceptance' });
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
