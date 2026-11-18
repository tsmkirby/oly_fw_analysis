// T3c Phase A. Arguments of the priority-editor opener, plus C-AF Area.
// No s.get during navigation: that call resets the CPU and clears the text reader.
// Usage: node26 work/scripts/route_decision_a2.mjs om-emu work/out/trace-decision-a2.jsonl
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
const emit = (x) => { const row = { hook: 'EMULATOR-ONLY', ...x }; lines.push(JSON.stringify(row)); console.log(JSON.stringify(row)); };
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);
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
const state = { phase: 'off', events: [] };

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const readByte = (addr) => l.sim.read(addr, 1)[0];
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const u16 = (addr) => { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); };
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
  const note = (name) => {
    l.observe(native(name[0]), (lab, r) => {
      if (state.phase === 'off' || state.events.length >= 60) return;
      const rec = { ev: name[1], phase: state.phase, d0: r.d0 >>> 0, d1: r.d1 >>> 0, a0: hex(r.a0 >>> 0), a1: hex(r.a1 >>> 0), mdr: hex(r.mdr >>> 0) };
      state.events.push(rec);
      const ra = r.mdr >>> 0;
      if (ra > 0x1000 && !lab.hooks.has(ra)) {
        lab.hook_rt(ra, (h, rr) => { rec.ret = rr.d0 & 0xffff; lab.hooks.delete(ra); lab.passthrough(rr); }, 'obs-ret-' + name[1], true);
      }
    }, 'obs-' + name[1]);
  };
  note([0x6129744a, 'open-slot']);
  note([0x612973d7, 'bind-slot']);
  note([0x610cdf05, 'editor-open']);
  note([0x610e2536, 'editor-body']);
  note([0x61203e81, 'multi-open']);
  note([0x61203470, 'list-type']);
  const builds = [];
  l.observe(native(0x61203696), (lab, r) => {
    if (builds.length >= 30) return;
    const a1 = r.a1 >>> 0;
    builds.push({ phase: state.phase, page: u16(a1 + 4), a1: hex(a1) });
  }, 'obs-ctor');
  const page = Buffer.alloc(8); page.writeUInt32LE(ROW_ARRAY, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(ID_LIST, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  const desc = 0x6031e9a0, node = 0x6031e9b8, bucket = 0x62a84970 + (UI & 0x7f) * 4;
  const head = l.sim.u32(bucket);
  const nodeBytes = Buffer.alloc(8); nodeBytes.writeUInt32LE(desc, 0); nodeBytes.writeUInt32LE(head, 4); l.sim.write(node, nodeBytes);
  const headBytes = Buffer.alloc(4); headBytes.writeUInt32LE(node, 0); l.sim.write(bucket, headBytes);
  const slots = () => ({
    objs: [0, 1, 2, 3].map((i) => hex(l.sim.u32(0x6037e8d0 + i * 8))),
    ids: [0, 1, 2, 3].map((i) => u16(0x6037e8f0 + i * 2)),
    raw: Array.from(l.sim.read(0x6037e8d0, 32)),
  });
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const shot = (file) => { try { const frame = walk.read().frame; write_png(file, frame[0], frame[1], words_to_rgb(frame[2])); emit({ step: 'screenshot', file }); } catch (e) { emit({ step: 'screenshot-miss', file, error: String(e.message || e) }); } };
  idle(1200);
  state.phase = 'nav';
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 40 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return ['read-error']; } };
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
    state.events = [];
    const before = slots();
    state.phase = 'ok';
    press('ok');
    state.phase = 'nav';
    shot(file);
    emit({ step: 'ok', label, texts: textsOf(), profile: readByte(PROFILE), before, events: state.events });
  };
  const caf = findTab('C-AF Setting');
  emit({ step: 'caf-tab', found: !!caf, texts: textsOf(), builds });
  if (caf) {
    walk.to([{ row: [caf.find((t) => t.includes('C-AF Setting'))] }]);
    idle(250);
    const area = moveTo('C-AF Area');
    emit({ step: 'caf-page', area, texts: textsOf() });
    if (area) {
      tracedOk('caf-area', resolve('work/out/trace-a2-caf.png'));
      press('menu');
      idle(200);
    }
    press('menu');
    idle(250);
  }
  const af = findTab('AF Button');
  emit({ step: 'af-tab', found: !!af, texts: textsOf() });
  if (!af) {
    emit({ step: 'done', ok: false, reason: 'AF Button missing' });
  } else {
    walk.to([{ row: [af.find((t) => t.endsWith('AF Button'))] }]);
    idle(250);
    shot(resolve('work/out/trace-a2-page.png'));
    emit({ step: 'page27', texts: textsOf(), builds, profile: readByte(PROFILE) });
    tracedOk('2154', resolve('work/out/trace-a2-2154.png'));
    press('menu');
    idle(200);
    press('down');
    emit({ step: 'moved', label: '2155', texts: textsOf() });
    tracedOk('2155', resolve('work/out/trace-a2-2155.png'));
    press('menu');
    idle(200);
    press('down');
    emit({ step: 'moved', label: '3d6f', texts: textsOf() });
    tracedOk('3d6f', resolve('work/out/trace-a2-3d6f.png'));
    emit({ step: 'done', ok: false, measured: true, note: 'decision arguments; ok is not acceptance' });
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
