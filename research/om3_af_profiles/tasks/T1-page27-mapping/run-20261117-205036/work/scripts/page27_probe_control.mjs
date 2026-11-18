// Restored source of the control run. Label IDs include 0xff0, 0xff2, 0x5b4, 0xc6.
// String reads are 180 bytes. The toggle body is the first key sequence; control mode does not enter it.
// Usage: node26 work/scripts/page27_probe_control.mjs om-emu <control|toggle> <out.jsonl> <run-id>
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, mode, outPath, runId = mode] = process.argv.slice(2);
assert(checkout && (mode === 'control' || mode === 'toggle') && outPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadImage, loadBlock, loadNand, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE, A } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { BY_ID, UIIN_ENTRIES, apply_uiin_layout, uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');

const lines = [];
const emit = (x) => {
  const row = { run: runId, mode, ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const fw = { rom: loadImage(), resBlock: loadBlock() };
const layout = uiin_layout(fw.rom);
const keyEntry = (code) => {
  const entries = layout.groups.flatMap(({ entries }, group) =>
    entries.filter(([, , candidate]) => candidate === code).map((entry) => [group, ...entry]));
  assert.equal(entries.length, 1, 'one active UI_IN key for ' + code.toString(16));
  return entries[0];
};
apply_uiin_layout(fw.rom);
const parked = keyEntry(0x120b);
assert.equal(parked[4], 2);
UIIN_ENTRIES.set(parked.slice(0, 3).join(','), parked);

const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} } } },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const copies = [];
  l.observe(native(0x611c782f), (lab, r) => {
    if (copies.length >= 80) return;
    const src = r.a1 >>> 0;
    if (src < 0x60000000) return;
    const raw = Buffer.from(lab.sim.read(src, 4));
    copies.push({ src: hex(src), dest: hex(r.d0), kind: raw.readUInt16LE(0), id: raw.readUInt16LE(2) });
  }, 'obs-desc-copy');
  const getString = A(0x510bb079);
  const label = (id) => {
    const v = l.call(getString, { d0: id }, null, null, 200000).a0 >>> 0;
    return v ? Buffer.from(l.sim.read(v, 180)).toString('utf16le').split(String.fromCharCode(0))[0] : null;
  };
  const readKey = (key, index) => l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 >>> 0;
  const readback = () => ({
    id2154: s.get(2154),
    id2155: s.get(2155),
    key90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
  });
  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const key = (k, d) => {
    const rec = s.key(k, d);
    s.camapp.pump();
    return rec;
  };
  const press = (k) => {
    key(k, 'down');
    idle(100);
    key(k, 'up');
    idle(800);
  };
  const ids = [0x1279, 0x06b1, 0x282c, 0x127b, 0x124f, 0x06a1, 0x122b, 0x11c4, 0x0b90, 0x0da4, 0x0dd2, 0x0ff0, 0x0ff2, 0x05b4, 0x00c6];
  emit({
    step: 'menu-labels',
    strings: Object.fromEntries(ids.map((id) => [hex(id), label(id)])),
    ...readback(),
  });
  idle(2000);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log });
  let menuRow;
  const visited = new Set();
  while (!menuRow) {
    const visible = walk.read().texts.map((row) => row.text);
    menuRow = visible.find((text) => text.endsWith('AF Button'));
    if (menuRow) break;
    const page = visible.join('\n');
    assert.ok(!visited.has(page) && visited.size < 64, 'AF Button missing from the live menu pages');
    visited.add(page);
    press('left');
  }
  walk.to([{ row: [menuRow] }]);
  const snap = (step, keyName) => {
    const scr = walk.read();
    const texts = scr.texts.map((t) => ({ text: t.text, box: t.box }));
    let cursor = null;
    let rows = null;
    const one = scr.texts.find((t) => typeof t.text === 'string' && t.text.includes('Priority'));
    if (one) {
      try {
        const listed = walk.list(scr, one);
        rows = listed.rows.map((t) => t.text);
        cursor = listed.cursor;
      } catch (e) {
        cursor = e.message;
      }
    }
    emit({ step, key: keyName ?? null, texts, rows, cursor, pagesVisited: visited.size, ...readback() });
    return { texts, rows, cursor };
  };
  const place = (index) => {
    for (let n = 0; n < 6; n++) {
      const scr = walk.read();
      const one = scr.texts.find((t) => t.text.includes('Priority'));
      assert.ok(one, 'no Priority row on the AF Button page');
      const listed = walk.list(scr, one);
      if (listed.cursor === index) return listed;
      const dir = listed.cursor === null ? 'right' : listed.cursor < index ? 'down' : 'up';
      press(dir);
      snap('cursor', dir);
    }
    throw new Error('cursor did not reach row ' + index);
  };
  snap('af-button-page', null);
  emit({ step: 'descriptor-copies', copies });
  if (mode === 'toggle') {
    for (const index of [0, 1]) {
      place(index);
      const before = readback();
      press('right');
      const afterRight = snap('toggle-right', 'right');
      const changed = afterRight && (readback().id2154 !== before.id2154 || readback().id2155 !== before.id2155);
      if (!changed) {
        press('ok');
        snap('toggle-ok', 'ok');
        press('down');
        snap('option-down', 'down');
        press('ok');
        snap('option-ok', 'ok');
      } else {
        press('right');
        snap('toggle-right-restore', 'right');
      }
    }
    snap('toggle-end', null);
  }
  emit({ step: 'done', ok: true, ...readback() });
} catch (e) {
  emit({ step: 'boundary', error: e.stack });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
