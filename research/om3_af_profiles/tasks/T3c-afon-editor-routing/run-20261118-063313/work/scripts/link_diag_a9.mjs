// Link diagnostic. Not a prototype. Dumps the descriptor node and the lookup result after boot.
// Usage: node26 work/scripts/link_diag_a9.mjs om-emu work/out/link-diag-a9.jsonl
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

const UI = 0x3d6f;
const lines = [];
const emit = (x) => { lines.push(JSON.stringify(x)); console.log(JSON.stringify(x)); };
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
try {
  pl.open_session();
  const l = pl.session.lab;
  const s = pl.session;
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  idle(800);
  const desc = 0x6031e9a0, node = 0x6031e9b8, bucket = 0x62a84970 + (UI & 0x7f) * 4;
  emit({ step: 'before', desc: [...l.sim.read(desc, 20)], node: [...l.sim.read(node, 8)], head: hex(l.sim.u32(bucket)) });
  const head = l.sim.u32(bucket);
  const nodeBytes = Buffer.alloc(8); nodeBytes.writeUInt32LE(desc, 0); nodeBytes.writeUInt32LE(head, 4); l.sim.write(node, nodeBytes);
  const headBytes = Buffer.alloc(4); headBytes.writeUInt32LE(node, 0); l.sim.write(bucket, headBytes);
  emit({ step: 'after-write', node: [...l.sim.read(node, 8)], bucket: [...l.sim.read(bucket, 4)] });
  const result = l.call(native(0x604058bc), { d0: UI }, null, null, 200000);
  emit({ step: 'lookup', d0: hex(result.d0 >>> 0), a0: hex(result.a0 >>> 0) });
  const known = l.call(native(0x604058bc), { d0: 2154 }, null, null, 200000);
  emit({ step: 'lookup-2154', d0: hex(known.d0 >>> 0), a0: hex(known.a0 >>> 0) });
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
