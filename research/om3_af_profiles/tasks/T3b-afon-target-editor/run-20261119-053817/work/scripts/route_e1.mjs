// Z5 plus one combined change: while the AF-ON editor flag at 0xa031e91f is 1,
// the cell getter 0x60063380 and the cell setter 0x60063431 redirect the
// target keys to the profile extension at 0xa031eeb0. EMULATOR-ONLY.
// The flag is a session action. No new menu row. Do not edit after it has run.
// Usage: node26 work/scripts/route_e1.mjs om-emu
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/route_e1.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const OUT = resolve('work/out/route-e1.jsonl');
const CSV = resolve('work/out/overlay-changed-bytes.csv');
const BASE = 0x60021020;
const GETTER = 0x60063380;
const SETTER = 0x60063431;
const MODE = 0xa031e91f;
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const EXT = 0xa031eeb0;
const LAYOUT = {
  0x99a1: { off: 0x00, n: 8, width: 1 },
  0x9a41: { off: 0x08, n: 2, width: 1 },
  0x5962: { off: 0x0a, n: 6, width: 2 },
  0x1dd1: { off: 0x16, n: 10, width: 1 },
  0x84d1: { off: 0x20, n: 1, width: 1 },
  0x88b2: { off: 0x22, n: 1, width: 2 },
  0x90d1: { off: 0x24, n: 8, width: 1 },
  0x5a11: { off: 0x2c, n: 11, width: 1 },
};

const { loadNand, loadImage, loadBlock, patchedFirmware, createHash: fwHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { apply_uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { fileNvram } = await use('host/nvram.mjs');

const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const patches = [];
for (const row of readFileSync(CSV, 'utf8').trim().split(/\r?\n/).slice(1)) {
  const [o, , old, next] = row.split(',');
  const off = parseInt(o, 16);
  const oldB = parseInt(old, 16);
  const neu = parseInt(next, 16);
  if (image[off] !== oldB) throw new Error('overlay stock mismatch at ' + (BASE + off).toString(16));
  const last = patches.at(-1);
  if (last && off === last.offset + last.old.length) { last.old.push(oldB); last.neu.push(neu); }
  else patches.push({ offset: off, old: [oldB], neu: [neu] });
}
const fw = patchedFirmware(patches.map((x, n) => ({
  block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: CSV, n,
})));
apply_uiin_layout(fw.rom);
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ step: row.step, screen: row.screen, diffHalf: row.diffHalf, diffProf: row.diffProf, zone: row.zone, pos: row.pos }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const nv = fileNvram(resolve('work/out/nvram-route-e1.json'));
const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  {
    ...fw, nand: loadNand(), createHash: fwHash, wallClock: () => performance.now() / 1000,
    machine: { coverage: { mark() {}, stub() {} } }, nvram: nv, patch: fw.summary, patchRanges: fw.changed, loaded: 'on',
  },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

function diffCells(a, b, path = '', out = []) {
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push([path + '[' + i + ']', a[i], b[i]]);
    return out;
  }
  if (a && b && typeof a === 'object') {
    for (const k of Object.keys(a)) diffCells(a[k], b[k], path ? path + '.' + k : k, out);
    return out;
  }
  if (a !== b) out.push([path, a, b]);
  return out;
}

let failed = null;
try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const readByte = (addr) => l.sim.read(addr, 1)[0];
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const writeU16 = (addr, value) => { const b = Buffer.alloc(2); b.writeUInt16LE(value & 0xffff, 0); l.sim.write(addr, b); };
  const half = (addr) => { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); };
  const slotAddr = (key, index) => {
    const spec = LAYOUT[key];
    if (!spec || index < 0 || index >= spec.n) return null;
    return EXT + spec.off + index * spec.width;
  };
  l.hook(native(GETTER), (h, r) => {
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    const addr = readByte(MODE) === 1 ? slotAddr(key, index) : null;
    if (addr === null) { l.passthrough(r); return; }
    const spec = LAYOUT[key];
    const value = spec.width === 2 ? half(addr) : readByte(addr);
    h.finish(r, { d0: value });
  }, 'EMULATOR-ONLY combined: AF-ON editor getter redirect');
  l.hook(native(SETTER), (h, r) => {
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    const addr = readByte(MODE) === 1 ? slotAddr(key, index) : null;
    if (addr === null) { l.passthrough(r); return; }
    const spec = LAYOUT[key];
    const value = r.a1 >>> 0;
    if (spec.width === 2) writeU16(addr, value);
    else writeByte(addr, value);
    if (key === 0x99a1 && (index === 0 || index === 1)) {
      writeByte(PROFILE, value & 0xff);
      writeByte(PROFILE_CACHED, value & 0xff);
    }
    h.finish(r, { d0: 0 });
  }, 'EMULATOR-ONLY combined: AF-ON editor setter redirect');
  const gate = { reading: false };
  const callSaved = (fn) => {
    const saved = l.sim.registers();
    gate.reading = true;
    try { return fn(); }
    finally { gate.reading = false; l.sim.reset(saved); }
  };
  const readKey = (key, index) => callSaved(() => l.call(native(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
  const arr = (key, n) => Array.from({ length: n }, (_, i) => readKey(key, i));
  const snapCells = (mode) => {
    writeByte(MODE, mode);
    return {
      mode,
      profileByte: readByte(PROFILE),
      k99a1: arr(0x99a1, 8),
      k9a41: arr(0x9a41, 2),
      k5962: arr(0x5962, 6),
      k1dd1: arr(0x1dd1, 10),
      k84d1: readKey(0x84d1, 0),
      k88b2: readKey(0x88b2, 0),
      k90d1: arr(0x90d1, 8),
      k5a11: arr(0x5a11, 11),
      k99d2: arr(0x99d2, 3),
      kdfa1: readKey(0xdfa1, 0),
      k9fa1: arr(0x9fa1, 3),
      k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
    };
  };
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const dial = (which, n) => { s.dial_input(which, n); s.camapp.pump(); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 8 });
  let shotN = 0;
  let halfBefore = null;
  let profBefore = null;
  const shot = (step) => {
    let frame = null;
    let texts = [];
    let textError = null;
    try {
      const scr = walk.read();
      texts = scr.texts.map((t) => t.text);
      frame = scr.frame;
    } catch (e) {
      textError = String(e && e.message || e);
      frame = s.frame('boundary');
    }
    if (!frame) throw new Error('screenshot failed at ' + step + ': ' + textError);
    const file = resolve('work/out/route-e1-' + String(shotN).padStart(2, '0') + '-' + step + '.png');
    shotN += 1;
    write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
    const saved = readByte(MODE);
    const half = snapCells(0);
    const prof = snapCells(1);
    writeByte(MODE, saved);
    const row = {
      hook: 'EMULATOR-ONLY', role: 'behaviour', step, screen: s.screen(), texts, textError,
      screenshot: file.split(/[/\\]/).pop(),
      half, prof,
      diffHalf: halfBefore ? diffCells(halfBefore, half) : [],
      diffProf: profBefore ? diffCells(profBefore, prof) : [],
      zone: prof.k99a1[1], pos: prof.k5962[1],
    };
    emit(row);
    halfBefore = half;
    profBefore = prof;
    return row;
  };
  const initProfile = () => {
    const zone = 1;
    writeByte(PROFILE, zone);
    writeByte(PROFILE_CACHED, zone);
    for (let i = 0; i < 8; i++) writeByte(EXT + i, i < 2 ? zone : 0);
    writeByte(EXT + 0x08, 0);
    writeByte(EXT + 0x09, 0);
    for (let i = 0; i < 6; i++) writeU16(EXT + 0x0a + i * 2, 500);
    const custom = [1, 1, 4, 6, 3, 3, 3, 3, 3, 3];
    for (let i = 0; i < 10; i++) writeByte(EXT + 0x16 + i, custom[i]);
    writeByte(EXT + 0x20, 0);
    writeU16(EXT + 0x22, 500);
    for (let i = 0; i < 8; i++) writeByte(EXT + 0x24 + i, i < 2 ? zone : 0);
    for (let i = 0; i < 11; i++) writeByte(EXT + 0x2c + i, 1);
    writeByte(MODE, 0);
  };
  emit({
    hook: 'EMULATOR-ONLY', role: 'behaviour', step: 'hooks',
    label: 'Combined one change on Z5: getter 0x60063380 and setter 0x60063431 redirect target keys while 0xa031e91f is 1. Profile extension 0xa031eeb0. Zone byte stays 0xa031e920.',
    csvRows: patches.reduce((n, p) => n + p.old.length, 0),
  });
  idle(1200);
  initProfile();
  shot('baseline-mode-off');
  writeByte(MODE, 1);
  press('up');
  shot('afon-open');
  dial('main', 1);
  shot('afon-dial');
  press('right');
  shot('afon-right-1');
  press('right');
  shot('afon-right-2');
  for (let i = 0; i < 8; i++) {
    dial('main', 1);
    const row = shot('afon-type-' + i);
    if (row.zone >= 6 && row.zone <= 9) break;
  }
  dial('sub', 1);
  shot('afon-sub');
  press('ok');
  shot('afon-ok');
  writeByte(MODE, 0);
  press('up');
  shot('half-open');
  dial('main', 1);
  shot('half-dial');
  press('right');
  shot('half-right');
  press('ok');
  shot('half-ok');
  emit({ hook: 'EMULATOR-ONLY', role: 'behaviour', step: 'done', ok: true });
} catch (e) {
  failed = String(e && e.stack ? e.stack : e);
  emit({ hook: 'EMULATOR-ONLY', role: 'behaviour', step: 'done', ok: false, error: failed });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(OUT, lines.join('\n') + (lines.length ? '\n' : ''));
}
if (failed) process.exit(1);
