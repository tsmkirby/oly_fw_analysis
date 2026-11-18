// T3c Phase A. The indirect call at 0x611f708f is the per-row action.
// Logs the object and the method for C-AF Area, 2154, 2155 and 0x3D6F.
// Usage: node26 work/scripts/route_slot_a4.mjs om-emu work/out/trace-slot-a4.jsonl
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
const lines = [];
const emit = (x) => { const row = { hook: 'observe', ...x }; lines.push(JSON.stringify(row)); console.log(JSON.stringify(row)); };
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
const state = { phase: 'off', calls: [], opened: 0 };

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const u16 = (addr) => { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); };
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: l.sim.read(PROFILE, 1)[0] }); }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => { if (!own(r)) { l.passthrough(r); return; } writeByte(PROFILE, r.d1); writeByte(PROFILE_CACHED, r.d1); h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon setter');
  l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
  l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
  l.observe(native(0x611f708f), (lab, r) => {
    if (state.phase !== 'ok' || state.calls.length >= 8) return;
    const a0 = r.a0 >>> 0;
    const bytes = a0 > 0x1000 ? [...lab.sim.read(a0, 48)] : [];
    state.calls.push({ a0: hex(a0), method: hex(r.a2 >>> 0), d0: r.d0 >>> 0, d1: r.d1 >>> 0, head: bytes });
  }, 'obs-action');
  l.observe(native(0x610cdf05), () => { if (state.phase === 'ok') state.opened += 1; }, 'obs-open');
  l.observe(native(0x61203e81), () => { if (state.phase === 'ok') state.calls.push({ ev: 'multi-open' }); }, 'obs-multi');
  const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(70); key(k, 'up'); idle(400); };
  idle(1200);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const shot = (file) => { const frame = walk.read().frame; write_png(file, frame[0], frame[1], words_to_rgb(frame[2])); };
  const findTab = (needle) => {
    const seen = new Set();
    for (let n = 0; n < 24; n++) {
      const texts = textsOf();
      if (texts.some((t) => t.includes(needle))) return texts;
      const sig = texts.join('\n');
      if (seen.has(sig)) return null;
      seen.add(sig);
      press('left');
    }
    return null;
  };
  const moveTo = (needle) => {
    for (let n = 0; n < 8; n++) {
      const texts = textsOf();
      if (texts.some((t) => t.includes(needle))) return texts.find((t) => t.includes(needle));
      press('down');
    }
    return null;
  };
  const traced = (label) => {
    state.calls = [];
    state.opened = 0;
    state.phase = 'ok';
    press('ok');
    state.phase = 'off';
    shot(resolve('work/out/trace-a4-' + label + '.png'));
    emit({ step: 'ok', label, texts: textsOf(), opened: state.opened, calls: state.calls, profile: l.sim.read(PROFILE, 1)[0] });
  };
  const caf = findTab('C-AF Setting');
  if (caf) {
    walk.to([{ row: [caf.find((t) => t.includes('C-AF Setting'))] }]);
    idle(150);
    const area = moveTo('C-AF Area');
    if (area) traced('caf');
    else emit({ step: 'caf-miss', texts: textsOf() });
    press('menu');
    idle(200);
  } else emit({ step: 'caf-tab-miss', texts: textsOf() });
  const af = findTab('AF Button');
  assert.ok(af, 'AF Button missing');
  walk.to([{ row: [af.find((t) => t.endsWith('AF Button'))] }]);
  idle(150);
  emit({ step: 'page', texts: textsOf(), rowKind: u16(0x6031e978 + 4), stockKind2154: u16(0x6158dc44 + 4) });
  traced('2154');
  press('menu'); idle(120); press('down');
  traced('2155');
  press('menu'); idle(120); press('down');
  traced('3d6f');
  emit({ step: 'done', ok: false, measured: true });
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
