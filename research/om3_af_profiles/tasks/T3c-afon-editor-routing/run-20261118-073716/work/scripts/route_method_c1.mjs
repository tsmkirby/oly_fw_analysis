// Observation only. Names the pointer FUN_61203082 calls on OK for 2154 and 0x3D6F.
// No row change. T3a baseline hooks stay, and are labelled apart from the observes.
// Usage: node26 work/scripts/route_method_c1.mjs om-emu work/out/trace-method-c1.jsonl
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
const UI = 0x3d6f, PROFILE = 0xa031e920, PROFILE_CACHED = 0x6031e920, PAGE27 = 0x6158f0f8, SOURCE = 0x61529ce8;
const lines = [];
const emit = (x) => { const row = { hook: 'observe', role: 'observation', ...x }; lines.push(JSON.stringify(row)); console.log(JSON.stringify(row)); };
const native = (a) => 0x50000000 + a - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);
const ranges = [];
for (const line of readFileSync(resolve('ref/analysis/decompiled-main/functions.tsv'), 'utf8').split(/\r?\n/).slice(1)) {
  if (!line) continue;
  const [a, name] = line.split('\t');
  ranges.push([parseInt(a, 16), name]);
}
const fnOf = (addr) => {
  let lo = 0, hi = ranges.length - 1, best = null;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (ranges[mid][0] <= addr) { best = ranges[mid]; lo = mid + 1; } else hi = mid - 1; }
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
const keyEntry = (code) => { const entries = layout.groups.flatMap(({ entries }, group) => entries.filter(([, , c]) => c === code).map((e) => [group, ...e])); assert.equal(entries.length, 1); return entries[0]; };
apply_uiin_layout(fw.rom);
const parked = keyEntry(0x120b);
UIIN_ENTRIES.set(parked.slice(0, 3).join(','), parked);
const pl = new Player({ ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true }, { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} } }, patch: fw.summary, patchRanges: fw.changed, loaded: 'on' });
pl.camapp_components = true; pl.camapp_native_tra = true;
const state = { phase: 'off', hits: [] };
try {
  pl.open_session();
  const s = pl.session, l = s.lab;
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: l.sim.read(PROFILE, 1)[0] }); }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => { if (!own(r)) { l.passthrough(r); return; } writeByte(PROFILE, r.d1); writeByte(PROFILE_CACHED, r.d1); h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon setter');
  l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
  l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
  const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  const desc = 0x6031e9a0, node = 0x6031e9b8, bucket = 0x62a84970 + (UI & 0x7f) * 4;
  const head = l.sim.u32(bucket);
  const nodeBytes = Buffer.alloc(8); nodeBytes.writeUInt32LE(desc, 0); nodeBytes.writeUInt32LE(head, 4); l.sim.write(node, nodeBytes);
  const headBytes = Buffer.alloc(4); headBytes.writeUInt32LE(node, 0); l.sim.write(bucket, headBytes);
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(70); key(k, 'up'); idle(400); };
  idle(1200); press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const seen = new Set(); let menuRow = null;
  for (let n = 0; n < 24 && !menuRow; n++) {
    const texts = textsOf(); menuRow = texts.find((t) => t.endsWith('AF Button')); if (menuRow) break;
    const sig = texts.join('\n'); if (seen.has(sig)) break; seen.add(sig); press('left');
  }
  assert.ok(menuRow, 'AF Button missing');
  walk.to([{ row: [menuRow] }]); idle(150);
  l.observe(native(0x61203082), (lab, r) => {
    if (state.phase !== 'ok' || state.hits.length >= 4) return;
    const a0 = r.a0 >>> 0;
    const ptr = a0 > 0x40000000 ? lab.sim.u32(a0 + 0x50) >>> 0 : 0;
    state.hits.push({ a0: hex(a0), at50: hex(ptr), name: fnOf(ptr), d0: r.d0 >>> 0 });
  }, 'obs-method68');
  const traced = (label) => { state.hits = []; state.phase = 'ok'; press('ok'); state.phase = 'off'; emit({ step: 'ok', label, hits: state.hits }); };
  traced('2154'); press('menu'); idle(120); press('down'); press('down'); traced('3d6f');
  emit({ step: 'done', measured: true, ok: false });
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
