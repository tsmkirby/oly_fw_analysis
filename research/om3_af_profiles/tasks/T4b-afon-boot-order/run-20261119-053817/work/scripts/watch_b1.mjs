// Stock OM-Emu watch from the lab's first guest instruction.
// Probes are armed in PlayLab.preinit, after the machine exists and before
// OsdLab runs mm_ctors. No image write, no overlay, no behaviour hook.
// Usage: node26 work/scripts/watch_b1.mjs om-emu
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const checkout = process.argv[2];
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/watch_b1.mjs om-emu\n');
  process.exit(2);
}
const nvramEnv = Object.prototype.hasOwnProperty.call(process.env, 'OM_EMU_NVRAM') ? process.env.OM_EMU_NVRAM : null;
if (nvramEnv !== null && nvramEnv !== 'off') {
  process.stderr.write('OM_EMU_NVRAM is not off: ' + nvramEnv + '\n');
  process.exit(1);
}
process.env.OM_EMU_MODEL = 'E147';

const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadNand, loadImage, loadBlock, createHash: fwHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE, MODEL_INFO } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { UIIN_ENTRIES, uiin_layout, apply_uiin_layout } = await use('src/lab/play.mjs');
const { PlaySession, PlayLab } = await use('src/lab/play.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { S, R, MDR, A1 } = await use('src/core/cpu.mjs');

const outDir = resolve('work/out');
mkdirSync(outDir, { recursive: true });
const hitsPath = resolve(outDir, 'watch-b1.jsonl');
const summaryPath = resolve(outDir, 'watch-b1-hits.json');
const inventoryPath = resolve(outDir, 'import-inventory-b1.json');

const IMAGE = 0x60021020;
const ARRAY = 0x615c540c;
const PAGE_CTOR = 0x61203696;
const WALKERS = [
  ['walk-1', 0x6124f4e5, 0x6124f55e],
  ['walk-2', 0x6124f55e, 0x6124f63d],
  ['walk-3', 0x6124f63d, 0x6124f7bd],
];
const PROBE_NAMED = [
  ['builder', 0x60405865],
  ['builder-call', 0x6040476d],
  ['hook', 0x6017a5fc],
  ['walk-1', 0x6124f4e5],
  ['walk-2', 0x6124f55e],
  ['walk-3', 0x6124f63d],
  ['page-ctor', PAGE_CTOR],
];
const WATCHES = [
  { id: 'dup', lo: 0x615c6234, len: 24, kind: 1 },
  { id: 'first', lo: 0x615c59dc, len: 24, kind: 1 },
  { id: 'dir', lo: 0x615cc934, len: 8, kind: 1 },
  { id: 'past151', lo: 0x615c624c, len: 4, kind: 1 },
  { id: 'bucket', lo: 0x62a84b2c, len: 4, kind: 2 },
  { id: 'dup-uncached', lo: 0xa15c6234, len: 24, kind: 1 },
  { id: 'first-uncached', lo: 0xa15c59dc, len: 24, kind: 1 },
  { id: 'dir-uncached', lo: 0xa15cc934, len: 8, kind: 1 },
  { id: 'past151-uncached', lo: 0xa15c624c, len: 4, kind: 1 },
  { id: 'bucket-uncached', lo: 0xa2a84b2c, len: 4, kind: 2 },
];
const CAP = 100000;

const imageFile = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const imageSha = createHash('sha256').update(imageFile).digest('hex');
const rom = loadImage();
const romSha = createHash('sha256').update(rom).digest('hex');
const romBytes = (addr) => rom[(addr - IMAGE_BASE) >>> 0];
const mulSites = [];
for (const [name, start, end] of WALKERS) {
  for (let a = start; a + 3 < end; a++) {
    const op = romBytes(a);
    const regb = romBytes(a + 1);
    if (regb < 0x14 || regb > 0x17) continue;
    const imm8 = op === 0xf9 && romBytes(a + 2) === 0x18;
    const imm16 = op === 0xfb && romBytes(a + 2) === 0x18 && romBytes(a + 3) === 0x00;
    if (!imm8 && !imm16) continue;
    mulSites.push({ name, addr: a, reg: regb - 0x14, form: imm8 ? 'imm8' : 'imm16' });
  }
}
const probeByPc = new Map();
for (const [name, pc] of PROBE_NAMED) probeByPc.set(pc >>> 0, { name, reg: null });
for (const site of mulSites) {
  probeByPc.set(site.addr >>> 0, { name: 'idx-' + site.name, reg: site.reg, form: site.form });
}

const counts = new Map();
const firsts = [];
const invocations = [];
const currentInv = new Map();
const pageIds = [];
let stored = 0;
let dropped = 0;
let buf = [];
let machine = null;
const started = Date.now();

function clock() {
  try { return machine.devices.clock.t; } catch { return null; }
}
function flush() {
  if (!buf.length) return;
  appendFileSync(hitsPath, buf.join('\n') + '\n');
  buf = [];
}
function emit(row) {
  buf.push(JSON.stringify(row));
  if (row.step) flush();
  else if (buf.length >= 400) flush();
}
function remember(id, row) {
  const n = (counts.get(id) ?? 0) + 1;
  counts.set(id, n);
  if (n === 1) firsts.push({ id, ...row });
  if (n <= CAP) {
    emit({ kind: 'hit', id, n, ...row });
    stored += 1;
  } else {
    dropped += 1;
    if (n === CAP + 1) emit({ kind: 'cap', id, at: CAP, insns: row.insns });
  }
}

function arm(lab) {
  machine = lab.sim.m;
  const pcs = [...probeByPc.keys()];
  machine.setWatchpoints(WATCHES.map((w, i) => ({
    id: i, lo: w.lo, hi: w.lo + w.len, kind: w.kind, stop: false,
  })), {
    onLog: (rec) => {
      try {
        const w = WATCHES[rec.id];
        if (!w) return;
        const row = {
          pc: rec.pc >>> 0,
          insns: rec.insns,
          caller: R[MDR] >>> 0,
          addr: rec.addr >>> 0,
          size: rec.size,
          dir: rec.dir,
          value: rec.value >>> 0,
          labNs: clock(),
        };
        if (w.id === 'dir' || w.id === 'dir-uncached') {
          try {
            const b = machine.dbgRead(0x615cc934, 12);
            row.dir0 = (b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24) >>> 0;
            row.dir4 = (b[4] | b[5] << 8 | b[6] << 16 | b[7] << 24) >>> 0;
            row.count = b[8] | (b[9] << 8);
          } catch { /* unreadable */ }
        }
        remember(w.id, row);
      } catch { /* a probe must not change the run */ }
    },
  });
  machine.setProbes(pcs, (pc) => {
    try {
      const info = probeByPc.get(pc >>> 0);
      const id = info ? info.name : 'pc';
      const row = { pc: pc >>> 0, insns: S.insns, caller: R[MDR] >>> 0, labNs: clock() };
      if (info && info.reg !== null) {
        const index = R[info.reg] >>> 0;
        row.index = index;
        row.form = info.form;
        const inv = currentInv.get(info.name.slice(4));
        if (inv) {
          if (index > inv.maxIndex) inv.maxIndex = index;
          if (index >= 151) inv.reached151 = true;
          if (index >= 152) inv.passed151 = true;
          inv.samples += 1;
        }
      }
      if (id.startsWith('walk-')) {
        const inv = {
          id, pc: pc >>> 0, insns: S.insns, caller: R[MDR] >>> 0,
          maxIndex: -1, reached151: false, passed151: false, samples: 0,
        };
        invocations.push(inv);
        currentInv.set(id, inv);
      }
      if (pc === PAGE_CTOR) {
        const a1 = R[A1] >>> 0;
        row.a1 = a1;
        try {
          const b = machine.dbgRead((a1 + 4) >>> 0, 2);
          row.pageId = b[0] | (b[1] << 8);
          pageIds.push({ pageId: row.pageId, insns: S.insns, caller: row.caller });
        } catch { row.pageId = null; }
      }
      remember(id, row);
    } catch { /* a probe must not change the run */ }
  });
  emit({
    step: 'armed',
    where: 'PlayLab.preinit, after the machine exists and before OsdLab.mm_ctors',
    insns: S.insns,
    pc: R[9] >>> 0,
    watches: WATCHES.map((w) => ({ id: w.id, lo: '0x' + w.lo.toString(16), len: w.len, kind: w.kind === 1 ? 'r' : 'w' })),
    probes: [...probeByPc.entries()].map(([pc, info]) => ({ name: info.name, pc: '0x' + pc.toString(16), reg: info.reg })),
    mulSites: mulSites.map((s) => ({ walker: s.name, pc: '0x' + s.addr.toString(16), reg: 'D' + s.reg, form: s.form })),
  });
}

class ArmedLab extends PlayLab {
  preinit(opts) {
    super.preinit(opts);
    arm(this);
  }
}
class ArmedSession extends PlaySession {
  static lab_class = ArmedLab;
}

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, base + '.mjs', base + '.js', join(base, 'index.mjs'), join(base, 'index.js')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function moduleInventory(seeds) {
  const seen = new Map();
  const queue = [...seeds];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    const data = readFileSync(file);
    seen.set(file, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    const text = data.toString('utf8');
    IMPORT_RE.lastIndex = 0;
    let match;
    while ((match = IMPORT_RE.exec(text))) {
      const next = resolveSpec(file, match[1]);
      if (next && !seen.has(next)) queue.push(next);
    }
  }
  return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([file, rec]) => ({
    path: relative(resolve('.'), file).split('\\').join('/'),
    sha256: rec.sha256,
    bytes: rec.bytes,
  }));
}
const inventory = moduleInventory([
  resolve('work/scripts/watch_b1.mjs'),
  resolve(checkout, 'emu/checks/lib/env.mjs'),
  resolve(checkout, 'emu/src/fw/model.mjs'),
  resolve(checkout, 'emu/src/lab/player.mjs'),
  resolve(checkout, 'emu/scenarios/session_replay.mjs'),
  resolve(checkout, 'emu/src/lab/play.mjs'),
  resolve(checkout, 'emu/src/lab/menuwalk.mjs'),
  resolve(checkout, 'emu/src/core/cpu.mjs'),
]);
writeFileSync(inventoryPath, JSON.stringify({
  note: 'SHA-256 of the watch script and the static import graph of the emulator modules it loads, taken before the session starts.',
  modules: inventory.length,
  inventory,
}, null, 2) + '\n');

const envRecord = {};
for (const key of Object.keys(process.env).filter((k) => k.startsWith('OM_EMU_')).sort()) envRecord[key] = process.env[key];
writeFileSync(hitsPath, '');
emit({
  step: 'image',
  model: 'E147',
  imageSha,
  imageBytes: imageFile.length,
  romSha,
  romBytes: rom.length,
  modelSha: MODEL_INFO.rom_sha256,
  fileMatch: imageSha === MODEL_INFO.rom_sha256,
  romMatch: romSha === imageSha,
  imageBase: '0x' + (IMAGE_BASE >>> 0).toString(16),
  nvramEnv,
  nvramObject: 'absent',
  overlay: 'none',
  loaded: 'on',
  env: envRecord,
  arrayBase: '0x' + ARRAY.toString(16),
  index151: '0x' + (ARRAY + 151 * 24).toString(16),
});
if (imageSha !== MODEL_INFO.rom_sha256) {
  emit({ step: 'done', ok: false, error: 'input image hash is not the model stock hash' });
  flush();
  process.exit(1);
}

const resBlock = loadBlock();
apply_uiin_layout(rom);
const lay = uiin_layout(rom);
const keyEntry = (code) => {
  const entries = lay.groups.flatMap(({ entries }, group) => entries.filter(([, , c]) => c === code).map((entry) => [group, ...entry]));
  if (entries.length !== 1) throw new Error('key entries for 0x' + code.toString(16) + ': ' + entries.length);
  return entries[0];
};
const parked = keyEntry(0x120b);
UIIN_ENTRIES.set(parked.slice(0, 3).join(','), parked);
emit({
  step: 'harness-120b',
  note: 'Lab key-matrix entry only. The image is not written. UIIN_ENTRIES gains the 0x120b code so the board variant accepts it. Same entry the T4 stock watch installed.',
  code: '0x120b',
});

const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: 'work/out/player', no_wait_on_error: true },
  {
    rom, resBlock, nand: loadNand(), createHash: fwHash,
    wallClock: () => performance.now() / 1000,
    machine: { coverage: { mark() {}, stub() {} } },
    loaded: 'on',
  },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

const WALL = 14 * 60 * 1000;
function timedOut() { return Date.now() - started > WALL; }
function dump(why) {
  flush();
  const byId = {};
  for (const [id, n] of counts) byId[id] = n;
  const doc = {
    why,
    stored,
    dropped,
    cap: CAP,
    counts: byId,
    firsts: firsts.map((row) => ({
      ...row,
      pc: typeof row.pc === 'number' ? '0x' + row.pc.toString(16) : row.pc,
      caller: typeof row.caller === 'number' ? '0x' + row.caller.toString(16) : row.caller,
      addr: typeof row.addr === 'number' ? '0x' + row.addr.toString(16) : row.addr,
    })),
    invocations: invocations.map((inv) => ({
      ...inv,
      pc: '0x' + inv.pc.toString(16),
      caller: '0x' + inv.caller.toString(16),
    })),
    pageIds: pageIds.map((p) => ({ ...p, caller: '0x' + p.caller.toString(16) })),
    wallMs: Date.now() - started,
  };
  writeFileSync(summaryPath, JSON.stringify(doc, null, 2) + '\n');
}

let failed = null;
let session = null;
try {
  const s = new ArmedSession(pl.env, {
    opts: pl.opts(),
    lang: 'en',
    device: 'tft',
    start: [7, 1, 1],
    out: 'work/out/shots',
    tag: 'play',
    a15: true,
    png: 'none',
    open_menu: false,
  });
  session = s;
  s.enter();
  const l = s.lab;
  emit({
    step: 'after-enter',
    insns: S.insns,
    labNs: l.lab_time(),
    bootStaged: !!l.boot_staged,
    sectionsCopied: l.sections_copied ?? null,
    nvramInEnv: pl.env.nvram ? 'present' : 'absent',
    patch: pl.env.patch ? 'present' : 'absent',
    loadedFlag: pl.env.loaded ?? null,
    camapp: !!s.camapp,
    counts: Object.fromEntries(counts),
    wallMs: Date.now() - started,
  });

  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const walk = new MenuWalk({
    press: () => { throw new Error('MenuWalk.to is not used'); },
    frame: () => s.frame('boundary'),
    draws: () => l.draw_log,
  }, { limit: 40 });
  const screen = () => {
    try {
      const scr = walk.read();
      const texts = scr.texts.map((t) => t.text);
      let best = null;
      for (const t of scr.texts) {
        try {
          const listed = walk.list(scr, t);
          if (listed && listed.rows && (!best || listed.rows.length > best.rows.length)) best = listed;
        } catch { /* not a list */ }
      }
      const cursor = best && best.cursor != null ? best.cursor : null;
      const rows = best ? best.rows.map((r) => r.text) : [];
      const highlight = cursor != null && rows[cursor] ? rows[cursor] : null;
      const title = texts.length ? texts[texts.length - 1] : null;
      return { texts: texts.slice(0, 24), title, highlight, cursor, rows: rows.slice(0, 16) };
    } catch (e) {
      return { texts: [], title: null, highlight: null, cursor: null, rows: [], error: String(e && e.message || e) };
    }
  };
  let keyN = 0;
  const note = (step, view) => {
    const shown = view || screen();
    emit({
      step, title: shown.title, highlight: shown.highlight, cursor: shown.cursor,
      rows: shown.rows, texts: shown.texts, error: shown.error || null,
      insns: S.insns, counts: Object.fromEntries(counts), wallMs: Date.now() - started,
    });
    return shown;
  };
  const press = (k) => {
    key(k, 'down');
    idle(80);
    key(k, 'up');
    idle(420);
    keyN += 1;
    return note('key-' + keyN + '-' + k);
  };
  const onTabs = (view) => view.texts.some((t) => /^\d+\.$/.test(t));
  const untilMenu = () => {
    let view = note('menu-check', screen());
    for (let i = 0; i < 5 && !onTabs(view) && !timedOut(); i++) view = press('menu');
    return view;
  };
  const findMarker = (marker) => {
    let view = screen();
    for (let i = 0; i < 32 && !timedOut(); i++) {
      if (view.texts.includes(marker) || view.rows.includes(marker)) return view;
      view = press('left');
    }
    return null;
  };
  const focusRow = (marker) => {
    let view = screen();
    for (let i = 0; i < 8 && !timedOut(); i++) {
      const next = press('up');
      if (next.highlight === view.highlight && next.cursor === view.cursor) { view = next; break; }
      view = next;
    }
    for (let i = 0; i < 18 && !timedOut(); i++) {
      if (view.highlight === marker || view.rows[view.cursor] === marker) return view;
      const next = press('down');
      if (next.cursor === view.cursor && next.highlight === view.highlight) return next;
      view = next;
    }
    return view;
  };
  const openEditors = (tag, max) => {
    const seen = new Set();
    for (let i = 0; i < max && !timedOut(); i++) {
      const before = note(tag + '-row-' + i, screen());
      const mark = String(before.cursor) + '|' + String(before.highlight);
      if (i > 0 && seen.has(mark)) break;
      seen.add(mark);
      const opened = press('ok');
      note(tag + '-editor-' + i, opened);
      const changed = JSON.stringify(opened.texts) !== JSON.stringify(before.texts) || opened.highlight !== before.highlight;
      if (changed) press('menu');
      const down = press('down');
      if (down.cursor === 0 && i > 0) break;
    }
  };

  idle(800);
  note('after-boot-idle', screen());
  const targets = [
    ['page27', '@A02C@@A065@AF Button', 4],
    ['page25', '@A02C@AF by half-pressing @A052@', 4],
    ['page26', 'Release Priority', 4],
    ['af-mode', '@A02C@AF Target Mode Settings', 6],
    ['af-orient', '@A02C@Orientation Linked @A02F@', 4],
    ['af-home', '@A02C@@A02F@ Set Home', 6],
    ['af-select', '@A02F@Select Screen Settings', 6],
    ['af-loop', '@A02F@ Loop Settings', 4],
    ['af-pad', 'AF Targeting Pad', 4],
    ['buttons', 'Button Settings', 14],
    ['fn-lever', 'Fn Lever Settings', 8],
    ['dial', 'Dial Settings', 8],
  ];
  for (const [tag, marker, editors] of targets) {
    if (timedOut()) break;
    try {
      untilMenu();
      const found = findMarker(marker);
      if (!found) {
        note(tag + '-missing', screen());
        continue;
      }
      focusRow(marker);
      const opened = press('ok');
      note(tag + '-open', opened);
      openEditors(tag, editors);
      note(tag + '-done', screen());
    } catch (e) {
      note(tag + '-error', { texts: [], title: null, highlight: null, cursor: null, rows: [], error: String(e && e.stack || e) });
    }
  }
  emit({
    step: 'done',
    ok: !timedOut(),
    timedOut: timedOut(),
    insns: S.insns,
    stored,
    dropped,
    wallMs: Date.now() - started,
  });
} catch (e) {
  failed = String(e && e.stack ? e.stack : e);
  emit({ step: 'done', ok: false, error: failed, insns: S.insns, stored, dropped, wallMs: Date.now() - started });
} finally {
  dump(failed ? 'error' : 'end');
  try { if (session) session.close(); } catch { /* already closed */ }
}
if (failed) process.exit(1);
