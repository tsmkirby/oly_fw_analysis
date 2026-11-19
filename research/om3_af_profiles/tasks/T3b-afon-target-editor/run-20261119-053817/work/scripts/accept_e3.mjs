// Table-driven acceptance of the route_e1 hook. Two fresh AF-ON sessions and a stock control.
// Expects are literals from route_e1 and custom_e2, not values computed from this run.
// A failed comparison or a missing screenshot stops the run. Do not edit after it has run.
// Usage: node26 work/scripts/accept_e3.mjs om-emu
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/accept_e3.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const OUT = resolve('work/out/accept-e3.jsonl');
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
const HALF = {
  k99a1: [2, 0, 2, 0, 2, 0, 5, 5],
  k9a41: [0, 1],
  k5962: [526, 526, 526, 526, 526, 526],
  k1dd1: [27, 39, 3, 3, 3, 3, 3, 3, 3, 3],
  k84d1: 2,
  k88b2: 526,
  k90d1: [2, 2, 2, 2, 2, 2, 5, 5],
  k5a11: [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1],
  k99d2: [526, 526, 526],
  kdfa1: 0,
  k9fa1: [0, 0, 0],
  k90a1: [1, 1],
};
const ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const INIT = {
  profileByte: 1,
  k99a1: [1, 1, 0, 0, 0, 0, 0, 0],
  k9a41: [0, 0],
  k5962: [500, 500, 500, 500, 500, 500],
  k1dd1: [1, 1, 4, 6, 3, 3, 3, 3, 3, 3],
  k84d1: 0,
  k88b2: 500,
  k90d1: [1, 1, 0, 0, 0, 0, 0, 0],
  k5a11: ones,
};
const OPEN = { ...INIT, k5962: [500, 421, 500, 500, 500, 500], k88b2: 421 };
const SMALL = {
  ...OPEN, profileByte: 2, k99a1: [1, 2, 0, 0, 0, 0, 0, 0],
  k5962: [526, 421, 526, 526, 526, 526], k1dd1: [3, 3, 4, 6, 3, 3, 3, 3, 3, 3], k84d1: 3, k88b2: 421,
  k90d1: [1, 2, 0, 0, 0, 0, 0, 0],
};
const R1 = { ...SMALL, k5962: [526, 424, 526, 526, 526, 526], k88b2: 424 };
const R2 = { ...SMALL, k5962: [526, 427, 526, 526, 526, 526], k88b2: 427 };
const CROSS = { ...R2, profileByte: 3, k99a1: [1, 3, 0, 0, 0, 0, 0, 0], k1dd1: [7, 9, 4, 6, 3, 3, 3, 3, 3, 3], k84d1: 6, k90d1: [1, 3, 0, 0, 0, 0, 0, 0] };
const MID = { ...CROSS, profileByte: 5, k99a1: [1, 5, 0, 0, 0, 0, 0, 0], k84d1: 3, k90d1: [1, 5, 0, 0, 0, 0, 0, 0] };
const LARGE = { ...MID, profileByte: 10, k99a1: [1, 10, 0, 0, 0, 0, 0, 0], k1dd1: [11, 15, 4, 6, 3, 3, 3, 3, 3, 3], k90d1: [1, 10, 0, 0, 0, 0, 0, 0] };
const C1 = { ...LARGE, profileByte: 6, k99a1: [1, 6, 0, 0, 0, 0, 0, 0], k1dd1: [4, 6, 4, 6, 3, 3, 3, 3, 3, 3], k84d1: 7, k90d1: [1, 6, 0, 0, 0, 0, 0, 0] };

const { loadNand, loadBlock, patchedFirmware, createHash: fwHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { apply_uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { fileNvram } = await use('host/nvram.mjs');

const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ session: row.session, id: row.id, record: row.record, pass: row.pass, problems: row.problems, screen: row.screen }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
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
const z5fw = patchedFirmware(patches.map((x, n) => ({
  block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: CSV, n,
})));
apply_uiin_layout(z5fw.rom);
const stockRom = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const { loadImage } = await use('checks/lib/env.mjs');
const stockFw = { rom: loadImage(), resBlock: loadBlock(), summary: null, changed: [] };
apply_uiin_layout(stockFw.rom);
void stockRom;

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
const USE_RE = /use\('([^']+)'\)/g;
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, base + '.mjs', base + '.js', join(base, 'index.mjs'), join(base, 'index.js')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function inventory() {
  const seeds = [resolve('work/scripts/accept_e3.mjs')];
  USE_RE.lastIndex = 0;
  let found;
  const text0 = readFileSync(seeds[0], 'utf8');
  while ((found = USE_RE.exec(text0))) seeds.push(resolve(checkout, 'emu', found[1]));
  const seen = new Map();
  const queue = [...seeds];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    const data = readFileSync(file);
    seen.set(file, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    IMPORT_RE.lastIndex = 0;
    let match;
    const text = data.toString('utf8');
    while ((match = IMPORT_RE.exec(text))) {
      const next = resolveSpec(file, match[1]);
      if (next && !seen.has(next)) queue.push(next);
    }
  }
  return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([path, meta]) => ({ path: path.replaceAll('\\', '/'), ...meta }));
}
const modules = inventory();
writeFileSync(resolve('work/out/import-inventory-e3.json'), JSON.stringify({
  note: 'SHA-256 taken before the acceptance sessions start.', hashed: 'execution', modules,
}, null, 2) + '\n');
emit({ record: 'import-inventory', hashed: 'execution', modules: modules.length, pass: true });

const controlGot = new Map();
function strip(cells) {
  const out = {};
  for (const key of Object.keys(HALF)) out[key] = cells[key];
  return out;
}
function judge(step, got) {
  const problems = [];
  const exp = step.expect || {};
  if (exp.screen !== undefined && got.screen !== exp.screen) problems.push('screen');
  if (exp.half && !same(strip(got.half), exp.half)) problems.push('half');
  if (exp.prof) {
    for (const key of Object.keys(exp.prof)) {
      if (!same(got.prof[key], exp.prof[key])) problems.push('prof.' + key);
    }
  }
  if (exp.profileByte !== undefined && got.half.profileByte !== exp.profileByte) problems.push('profileByte');
  if (exp.ext0 !== undefined && got.half.ext0 !== exp.ext0) problems.push('ext0');
  if (exp.pose !== undefined && got.pose !== exp.pose) problems.push('pose');
  if (step.controlStep) {
    const control = controlGot.get(step.controlStep);
    if (!control) problems.push('control-unresolved');
    else if (got.screen !== control.screen || !same(strip(got.half), strip(control.half))) problems.push('control');
  }
  return problems;
}

function boot(overlay, nvramPath) {
  const fw = overlay ? z5fw : stockFw;
  const nv = fileNvram(resolve(nvramPath));
  const pl = new Player(
    { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
    {
      ...fw, nand: loadNand(), createHash: fwHash, wallClock: () => performance.now() / 1000,
      machine: { coverage: { mark() {}, stub() {} } }, nvram: nv,
      patch: overlay ? fw.summary : null, patchRanges: overlay ? fw.changed : [], loaded: 'on',
    },
  );
  pl.camapp_components = true;
  pl.camapp_native_tra = true;
  return pl;
}

async function session(name, spec) {
  const pl = boot(spec.overlay, spec.nvram);
  let shotN = 0;
  try {
    pl.open_session();
    const s = pl.session;
    const l = s.lab;
    const readByte = (addr) => l.sim.read(addr, 1)[0];
    const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
    const writeU16 = (addr, value) => { const b = Buffer.alloc(2); b.writeUInt16LE(value & 0xffff, 0); l.sim.write(addr, b); };
    const half = (addr) => { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); };
    const slotAddr = (key, index) => {
      const row = LAYOUT[key];
      if (!row || index < 0 || index >= row.n) return null;
      return EXT + row.off + index * row.width;
    };
    if (spec.hooks) {
      l.hook(native(GETTER), (h, r) => {
        const key = r.d0 & 0xffff;
        const index = r.d1 & 0xffff;
        const addr = readByte(MODE) === 1 ? slotAddr(key, index) : null;
        if (addr === null) { l.passthrough(r); return; }
        h.finish(r, { d0: LAYOUT[key].width === 2 ? half(addr) : readByte(addr) });
      }, 'EMULATOR-ONLY combined: AF-ON editor getter redirect');
      l.hook(native(SETTER), (h, r) => {
        const key = r.d0 & 0xffff;
        const index = r.d1 & 0xffff;
        const addr = readByte(MODE) === 1 ? slotAddr(key, index) : null;
        if (addr === null) { l.passthrough(r); return; }
        if (LAYOUT[key].width === 2) writeU16(addr, r.a1 >>> 0);
        else writeByte(addr, r.a1 >>> 0);
        if (key === 0x99a1 && (index === 0 || index === 1)) {
          writeByte(PROFILE, r.a1 & 0xff);
          writeByte(PROFILE_CACHED, r.a1 & 0xff);
        }
        h.finish(r, { d0: 0 });
      }, 'EMULATOR-ONLY combined: AF-ON editor setter redirect');
    }
    const callSaved = (fn) => {
      const saved = l.sim.registers();
      try { return fn(); }
      finally { l.sim.reset(saved); }
    };
    const readKey = (key, index) => callSaved(() => l.call(native(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
    const arr = (key, n) => Array.from({ length: n }, (_, i) => readKey(key, i));
    const cells = () => ({
      profileByte: readByte(PROFILE),
      ext0: readByte(EXT),
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
    });
    const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
    const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
    const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
    const dial = (which, n) => { s.dial_input(which, n); s.camapp.pump(); idle(450); };
    const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 8 });
    const snap = () => {
      const saved = spec.hooks ? readByte(MODE) : 0;
      if (spec.hooks) writeByte(MODE, 0);
      const halfCells = cells();
      let prof = null;
      if (spec.hooks) {
        writeByte(MODE, 1);
        prof = cells();
        writeByte(MODE, saved);
      }
      return { half: halfCells, prof, pose: readKey(0xe91, 3) };
    };
    const shot = (step) => {
      let frame = null;
      let textError = null;
      try { frame = walk.read().frame; }
      catch (e) { textError = String(e && e.message || e); frame = s.frame('boundary'); }
      if (!frame) throw new Error('screenshot failed at ' + name + ' ' + step.id + ': ' + textError);
      const file = resolve('work/out/accept-e3-' + name + '-' + String(shotN).padStart(2, '0') + '-' + step.id + '.png');
      shotN += 1;
      write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
      const got = snap();
      got.screen = s.screen();
      got.screenshot = file.split(/[/\\]/).pop();
      return got;
    };
    const act = (step) => {
      if (step.action === 'up') press('up');
      else if (step.action === 'right') press('right');
      else if (step.action === 'ok') press('ok');
      else if (step.action === 'menu') press('menu');
      else if (step.action === 'dial') dial('main', 1);
      else if (step.action === 'mode') writeByte(MODE, 1);
      else if (step.action === 'rotate') { s.switch_input('rotate', 1); s.camapp.pump(); idle(300); }
      else if (step.action === 'save') idle(800);
    };
    if (spec.init) {
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
    }
    idle(1200);
    for (const step of spec.steps) {
      act(step);
      const got = shot(step);
      const problems = judge(step, got);
      emit({
        session: name, id: step.id, action: step.action, controlStep: step.controlStep || null,
        pass: problems.length === 0, problems, screen: got.screen, screenshot: got.screenshot,
        fatalShots: true,
        half: strip(got.half), prof: got.prof && {
          profileByte: got.prof.profileByte, k99a1: got.prof.k99a1, k5962: got.prof.k5962,
          k1dd1: got.prof.k1dd1, k84d1: got.prof.k84d1, k88b2: got.prof.k88b2, k90d1: got.prof.k90d1,
        },
        profileByte: got.half.profileByte, ext0: got.half.ext0, pose: got.pose,
      });
      if (spec.record) controlGot.set(step.id, got);
      if (problems.length) throw new Error('assertion failed at ' + name + ' ' + step.id + ' ' + problems.join(','));
    }
    return true;
  } finally {
    if (pl.session) pl.close_session();
  }
}

function banks(file) {
  const doc = JSON.parse(readFileSync(resolve(file), 'utf8'));
  return { M: Buffer.from(doc.M, 'base64'), E: Buffer.from(doc.E, 'base64') };
}

const editSteps = [
  { id: 'n-base', action: 'none', expect: { screen: 'shooting', half: HALF } },
  { id: 'n-up', action: 'up', expect: { screen: 'direct' }, controlStep: 'n-up' },
  { id: 'n-dial', action: 'dial', expect: { screen: 'direct' }, controlStep: 'n-dial' },
  { id: 'n-right-1', action: 'right', expect: { screen: 'direct' }, controlStep: 'n-right-1' },
  { id: 'n-right-2', action: 'right', expect: { screen: 'direct' }, controlStep: 'n-right-2' },
  { id: 'n-ok', action: 'ok', expect: { screen: 'shooting' }, controlStep: 'n-ok' },
  { id: 'n-save', action: 'save', expect: { screen: 'shooting' }, controlStep: 'n-save' },
];
const afonSteps = [
  { id: 'base', action: 'none', expect: { screen: 'shooting', half: HALF, prof: INIT } },
  { id: 'mode', action: 'mode', expect: { screen: 'shooting', half: HALF, prof: INIT } },
  { id: 'up', action: 'up', expect: { screen: 'direct', half: HALF, prof: OPEN } },
  { id: 'dial-small', action: 'dial', expect: { screen: 'direct', half: HALF, prof: SMALL } },
  { id: 'right-1', action: 'right', expect: { screen: 'direct', half: HALF, prof: R1 } },
  { id: 'right-2', action: 'right', expect: { screen: 'direct', half: HALF, prof: R2 } },
  { id: 'dial-cross', action: 'dial', expect: { screen: 'direct', half: HALF, prof: CROSS } },
  { id: 'dial-mid', action: 'dial', expect: { screen: 'direct', half: HALF, prof: MID } },
  { id: 'dial-large', action: 'dial', expect: { screen: 'direct', half: HALF, prof: LARGE } },
  { id: 'dial-c1', action: 'dial', expect: { screen: 'direct', half: HALF, prof: C1 } },
];

let failed = null;
try {
  emit({
    record: 'hooks', pass: true,
    label: 'EMULATOR-ONLY combined hook, same as route_e1. Z5 image plus the getter and setter redirect. Role: behaviour.',
  });
  await session('store-stock', {
    overlay: false, hooks: false, init: false, record: false,
    nvram: 'work/out/nvram-accept-e3-store-stock.json',
    steps: [
      { id: 'base', action: 'none', expect: { screen: 'shooting', half: HALF, pose: 0 } },
      { id: 'rotate', action: 'rotate', expect: { screen: 'shooting', pose: 0 } },
      { id: 'save', action: 'save', expect: { screen: 'shooting', pose: 0 } },
    ],
  });
  await session('control-edit', {
    overlay: false, hooks: false, init: false, record: true,
    nvram: 'work/out/nvram-accept-e3-control-edit.json',
    steps: editSteps.map((step) => ({ ...step, controlStep: undefined })),
  });
  await session('normal', {
    overlay: true, hooks: true, init: false, record: false,
    nvram: 'work/out/nvram-accept-e3-normal.json',
    steps: editSteps.map((step) => ({
      ...step,
      expect: { ...step.expect, profileByte: 0, ext0: 255 },
    })),
  });
  await session('store-z5', {
    overlay: true, hooks: true, init: false, record: false,
    nvram: 'work/out/nvram-accept-e3-store-z5.json',
    steps: [
      { id: 'base', action: 'none', expect: { screen: 'shooting', half: HALF, profileByte: 0, ext0: 255 } },
      { id: 'save', action: 'save', expect: { screen: 'shooting', half: HALF, profileByte: 0 } },
    ],
  });
  await session('confirm', {
    overlay: true, hooks: true, init: true, record: false,
    nvram: 'work/out/nvram-accept-e3-confirm.json',
    steps: [...afonSteps,
      { id: 'ok', action: 'ok', expect: { screen: 'shooting', half: HALF, prof: C1 } },
      { id: 'save', action: 'save', expect: { screen: 'shooting', half: HALF, prof: C1 } },
    ],
  });
  const stockStore = banks('work/out/nvram-accept-e3-store-stock.json');
  const z5Store = banks('work/out/nvram-accept-e3-store-z5.json');
  const confirmStore = banks('work/out/nvram-accept-e3-confirm.json');
  const sameStock = stockStore.M.equals(confirmStore.M) && stockStore.E.equals(confirmStore.E);
  const sameZ5 = z5Store.M.equals(confirmStore.M) && z5Store.E.equals(confirmStore.E);
  const firstDiff = (a, b) => { const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i; return a.length === b.length ? -1 : n; };
  emit({
    record: 'store', pass: sameZ5, sameZ5, sameStock,
    mBytes: confirmStore.M.length, eBytes: confirmStore.E.length,
    stockMDiff: firstDiff(stockStore.M, confirmStore.M),
    z5MDiff: firstDiff(z5Store.M, confirmStore.M),
    stockEDiff: firstDiff(stockStore.E, confirmStore.E),
    z5EDiff: firstDiff(z5Store.E, confirmStore.E),
    note: 'The matched store control is the Z5 image with the hook idle. Stock differs where the inherited Z5 image differs.',
  });
  if (!sameZ5) throw new Error('store mismatch against the Z5 idle control');
  await session('reopen', {
    overlay: true, hooks: true, init: false, record: false,
    nvram: 'work/out/nvram-accept-e3-confirm.json',
    steps: [
      { id: 'reopen', action: 'none', expect: { screen: 'shooting', profileByte: 0 } },
    ],
  });
  await session('cancel', {
    overlay: true, hooks: true, init: true, record: false,
    nvram: 'work/out/nvram-accept-e3-cancel.json',
    steps: [...afonSteps,
      { id: 'menu', action: 'menu', expect: { screen: 'menu', half: HALF, prof: INIT } },
    ],
  });
  emit({ record: 'done', pass: true, ok: true });
} catch (e) {
  failed = String(e && e.stack ? e.stack : e);
  emit({ record: 'done', pass: false, ok: false, error: failed });
}
if (failed) process.exit(1);
