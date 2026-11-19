// Stock OM-Emu read watches for the duplicate binding record and the key-8
// directory entry, plus execute probes for builder / hook / binding walks.
// No image write, no overlay. Blank camera (no nvram file).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const checkout = process.argv[2];
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/watch_c1.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadNand, loadImage, loadBlock, createHash: fwHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE, MODEL_INFO } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { UIIN_ENTRIES, uiin_layout, apply_uiin_layout } = await use('src/lab/play.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { S } = await use('src/core/cpu.mjs');

const outDir = resolve('work/out');
mkdirSync(outDir, { recursive: true });
const stepsPath = resolve(outDir, 'watch-c1.jsonl');
const hitsPath = resolve(outDir, 'watch-c1-hits.json');
const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  writeFileSync(stepsPath, lines.join('\n') + '\n');
  console.log(JSON.stringify(row));
};

const imageFile = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const imageSha = createHash('sha256').update(imageFile).digest('hex');
emit({
  step: 'image',
  model: 'E147',
  imageSha,
  modelSha: MODEL_INFO.rom_sha256,
  match: imageSha === MODEL_INFO.rom_sha256,
  imageBase: '0x' + (IMAGE_BASE >>> 0).toString(16),
  nvram: 'none',
  overlay: 'none',
});
if (imageSha !== MODEL_INFO.rom_sha256) {
  emit({ step: 'done', ok: false, error: 'input image hash is not the model stock hash' });
  process.exit(1);
}

const rom = loadImage();
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
  note: 'Lab key-matrix entry only. The image is not written. Same entry the T3 stock control installed so the board variant sees 0x120b.',
  code: '0x120b',
});

const WATCHES = [
  { id: 'dup', lo: 0x615c6234, len: 24 },
  { id: 'dir', lo: 0x615cc934, len: 8 },
  { id: 'dup-uncached', lo: 0xa15c6234, len: 24 },
  { id: 'dir-uncached', lo: 0xa15cc934, len: 8 },
];
const PROBES = [
  ['builder', 0x60405865],
  ['builder-call', 0x6040476d],
  ['hook', 0x6017a5fc],
  ['walk-1', 0x6124f4e5],
  ['walk-2', 0x6124f55e],
  ['walk-3', 0x6124f63d],
];

const hits = new Map();
const firstWatch = [];
const probeFirst = new Map();
const probeCount = new Map();
let watchHits = 0;
const EARLY = 4000;
const early = [];

function bump(id, pc, insns) {
  const key = id + ':' + (pc >>> 0).toString(16);
  let row = hits.get(key);
  if (!row) {
    row = { id, pc: pc >>> 0, n: 0, first: insns, last: insns };
    hits.set(key, row);
    if (firstWatch.length < 200) firstWatch.push({ id, pc: pc >>> 0, insns });
  }
  row.n += 1;
  row.last = insns;
  watchHits += 1;
  if (early.length < EARLY) early.push({ id, pc: pc >>> 0, insns });
}

const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  {
    rom, resBlock, nand: loadNand(), createHash: fwHash,
    wallClock: () => performance.now() / 1000,
    machine: { coverage: { mark() {}, stub() {} } },
    loaded: 'on',
  },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

const started = Date.now();
const WALL = 8 * 60 * 1000;
function timedOut() { return Date.now() - started > WALL; }

function dump(why) {
  const byId = {};
  for (const row of hits.values()) {
    (byId[row.id] ??= []).push({
      pc: '0x' + row.pc.toString(16),
      n: row.n,
      firstInsns: row.first,
      lastInsns: row.last,
    });
  }
  for (const k of Object.keys(byId)) byId[k].sort((a, b) => a.firstInsns - b.firstInsns);
  const probes = PROBES.map(([name, pc]) => ({
    name,
    pc: '0x' + pc.toString(16),
    n: probeCount.get(pc) ?? 0,
    firstInsns: probeFirst.has(pc) ? probeFirst.get(pc) : null,
  }));
  const doc = {
    why,
    watchHits,
    earlyKept: early.length,
    probes,
    firstDistinct: firstWatch.map((x) => ({ id: x.id, pc: '0x' + x.pc.toString(16), insns: x.insns })),
    byId,
    early: early.map((x) => ({ id: x.id, pc: '0x' + x.pc.toString(16), insns: x.insns })),
  };
  writeFileSync(hitsPath, JSON.stringify(doc, null, 2) + '\n');
}

let failed = null;
try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  l.sim.m.setWatchpoints(WATCHES.map((w, i) => ({
    id: i, lo: w.lo, hi: w.lo + w.len, kind: 1, stop: false,
  })), {
    onLog: (rec) => {
      const w = WATCHES[rec.id];
      if (!w) return;
      bump(w.id, rec.pc, rec.insns);
    },
  });
  l.sim.m.setProbes(PROBES.map(([, pc]) => pc >>> 0), (pc) => {
    const k = pc >>> 0;
    probeCount.set(k, (probeCount.get(k) ?? 0) + 1);
    if (!probeFirst.has(k)) probeFirst.set(k, S.insns);
  });
  emit({ step: 'armed', watches: WATCHES.map((w) => ({ id: w.id, lo: '0x' + w.lo.toString(16), len: w.len, kind: 'r' })), probes: PROBES.map(([n, pc]) => [n, '0x' + pc.toString(16)]) });

  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 40 });
  const screen = () => {
    try {
      const scr = walk.read();
      const texts = scr.texts.map((t) => t.text).slice(0, 16);
      let highlight = null;
      for (const t of scr.texts) {
        try {
          const listed = walk.list(scr, t);
          if (listed && listed.cursor != null && listed.rows[listed.cursor]) { highlight = listed.rows[listed.cursor].text; break; }
        } catch { /* not a list */ }
      }
      return { texts, highlight };
    } catch (e) {
      return { texts: [], highlight: null, error: String(e && e.message || e) };
    }
  };
  const note = (step) => {
    const view = screen();
    emit({
      step, texts: view.texts, highlight: view.highlight, error: view.error || null,
      watchHits, probes: Object.fromEntries([...probeCount].map(([pc, n]) => ['0x' + pc.toString(16), n])),
      wallMs: Date.now() - started,
    });
    return view;
  };

  idle(1200);
  note('after-boot-idle');
  if (timedOut()) throw new Error('wall cap before menu');
  press('menu');
  note('menu');
  for (let i = 0; i < 20 && !timedOut(); i++) { press('left'); note('left-' + i); }
  press('down'); note('down-1');
  press('down'); note('down-2');
  press('ok'); note('page27');
  press('ok'); note('page27-editor-1');
  press('menu'); note('page27-editor-1-cancel');
  press('down'); note('page27-down');
  press('ok'); note('page27-editor-2');
  press('menu'); note('page27-editor-2-cancel');
  press('menu'); note('leave-27');
  for (let i = 0; i < 8 && !timedOut(); i++) {
    const view = note('seek26-' + i);
    if (view.texts.some((t) => t.includes('Release Priority'))) break;
    press('left');
  }
  press('ok'); note('page26');
  press('ok'); note('page26-editor');
  press('menu'); note('page26-editor-cancel');
  press('menu'); note('leave-26');
  for (let i = 0; i < 8 && !timedOut(); i++) {
    const view = note('seek25-' + i);
    if (view.texts.some((t) => t.includes('half-pressing'))) break;
    press('left');
  }
  press('ok'); note('page25');
  press('ok'); note('page25-editor');
  press('menu'); note('page25-editor-cancel');
  press('menu'); note('leave-25');
  note('after-pages');
  emit({ step: 'done', ok: !timedOut(), timedOut: timedOut(), watchHits, wallMs: Date.now() - started });
} catch (e) {
  failed = String(e && e.stack ? e.stack : e);
  emit({ step: 'done', ok: false, error: failed, watchHits, wallMs: Date.now() - started });
} finally {
  dump(failed ? 'error' : 'end');
  try { if (pl.session) pl.close_session(); } catch { /* already closed */ }
}
if (failed) process.exit(1);
