// T8c Q1 and Q2 observation. One emulator process.
// Stock image, no overlay. T8 bring-up, S-AF, pose.mjs, OM_EMU_MODEL=E147.
// Orientation Linked is set with native menu keys. A labelled setter poke
// is a separate contrast, after the native measurements.
// 0x1e71[0] is asserted after every key. Identity (title hash and highlighted
// row) is asserted before every OK. Stop at the first failed assertion.
// EMULATOR-ONLY where a test-setup write is used. Do not edit after this runs.
// Usage: node26 work/scripts/observe_q1.mjs om-emu
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/observe_q1.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';

const POSE_SHA = '09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358';
const IMAGE_BASE = 0x60021020;
const dis = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const GETTER = 0x60063380;
const SETTER = 0x60063431;
const WRAPPER = 0x6041a1f9;
const WRITER = 0x609b3c79;
const WRITER_RET = 0x609b3d6d;
const POSE = 0xa32c568c;
const TEN = 0xa33ca384;
const OUT = resolve('work/out/q1.jsonl');
const SUM = resolve('work/out/q1-summary.json');
if (existsSync(OUT) || existsSync(SUM)) {
  process.stderr.write('refusing to overwrite q1 outputs\n');
  process.exit(2);
}
mkdirSync(resolve('work/out'), { recursive: true });

const poseFile = resolve('ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs');
const poseHash = createHash('sha256').update(readFileSync(poseFile)).digest('hex');
if (poseHash !== POSE_SHA) throw new Error('pose hash ' + poseHash);

const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadNand, loadImage, loadBlock, createHash: fwHash } = await use('checks/lib/env.mjs');
const { Player } = await use('src/lab/player.mjs');
const { apply_uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { A } = await use('src/fw/model.mjs');

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, base + '.mjs', base + '.js', join(base, 'index.mjs'), join(base, 'index.js')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
const seeds = [
  resolve(checkout, 'emu/checks/lib/env.mjs'),
  resolve(checkout, 'emu/src/lab/player.mjs'),
  resolve(checkout, 'emu/src/lab/play.mjs'),
  resolve(checkout, 'emu/scenarios/session_replay.mjs'),
  resolve(checkout, 'emu/src/lab/menuwalk.mjs'),
  resolve(checkout, 'emu/checks/lib/png.mjs'),
  resolve(checkout, 'emu/src/lab/display.mjs'),
  resolve(checkout, 'emu/src/fw/model.mjs'),
  fileURLToPath(import.meta.url),
  poseFile,
];
const seen = new Map();
const queue = [...seeds];
while (queue.length) {
  const file = queue.pop();
  if (!file || seen.has(file) || !existsSync(file)) continue;
  const data = readFileSync(file);
  seen.set(file, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
  IMPORT_RE.lastIndex = 0;
  const text = data.toString('utf8');
  let match;
  while ((match = IMPORT_RE.exec(text))) {
    const next = resolveSpec(file, match[1]);
    if (next) queue.push(next);
  }
}
writeFileSync(resolve('work/out/q1-imports.json'), JSON.stringify(
  [...seen.entries()].map(([path, meta]) => ({ path: path.replaceAll('\\', '/'), sha256: meta.sha256, bytes: meta.bytes })).sort((a, b) => a.path.localeCompare(b.path)),
  null, 2,
) + '\n');

const LAYOUT = [
  ['k99a1', 0x99a1, 8], ['k9a41', 0x9a41, 2], ['k5962', 0x5962, 6],
  ['k1dd1', 0x1dd1, 10], ['k84d1', 0x84d1, 1], ['k88b2', 0x88b2, 1],
  ['k90d1', 0x90d1, 8], ['k5a11', 0x5a11, 11], ['k1de1', 0x1de1, 8],
  ['k1df1', 0x1df1, 8],
];
const WATCH = new Set([0x99a1, 0x5962, 0x9a41, 0x1dd1, 0x88b2, 0x84d1, 0x1db1, 0x1dc1, 0x5991, 0xe1f1, 0x1e01]);
const lines = [];
const summary = [];
const log = (row) => {
  lines.push(JSON.stringify(row));
  writeFileSync(OUT, lines.join('\n') + '\n');
  const brief = {
    step: row.step,
    screen: row.screen || null,
    highlight: row.highlight || null,
    subject: row.subject,
    link: row.link || null,
    pose: row.pose ? { index: row.pose.index, exif: row.pose.exif } : null,
    wrote99: row.wrote99 || null,
    wrote62: row.wrote62 || null,
    t6: row.t6ReadIndex,
    error: row.error || null,
  };
  console.log(JSON.stringify(brief));
};
const msg = (e) => String(e && e.stack ? e.stack : e).slice(0, 800);

function titleBand(frame) {
  if (!frame) return null;
  const [w, h, words] = frame;
  const y1 = Math.max(1, Math.min(h, Math.floor(h * 0.16)));
  const x0 = Math.floor(w * 0.22);
  const x1 = Math.floor(w * 0.78);
  const buf = Buffer.alloc((x1 - x0) * y1 * 4);
  let o = 0;
  for (let y = 0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      buf.writeUInt32LE(words[y * w + x] >>> 0, o);
      o += 4;
    }
  }
  return createHash('sha256').update(buf).digest('hex');
}
function changed(before, after) {
  const out = [];
  const n = Math.min(before.length, after.length);
  for (let i = 0; i < n; i++) if (before[i] !== after[i]) out.push({ index: i, before: before[i], after: after[i] });
  return out;
}
function t6Bank(area, point, poseWord) {
  if (!(area === 1 && point === 1)) return 1;
  if (poseWord === 2) return 5;
  if (poseWord === 4) return 3;
  return 1;
}
function modeOf(calls, key) {
  const counts = {};
  for (const c of calls) {
    if (c.key !== key) continue;
    counts[c.index] = (counts[c.index] || 0) + 1;
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return ranked.length ? { index: Number(ranked[0][0]), count: ranked[0][1], counts } : null;
}

const fw = { rom: loadImage(), resBlock: loadBlock(), summary: null, changed: [] };
apply_uiin_layout(fw.rom);
const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  {
    ...fw, nand: loadNand(), createHash: fwHash, wallClock: () => performance.now() / 1000,
    machine: { coverage: { mark() {}, stub() {} } }, patch: fw.summary, patchRanges: fw.changed, loaded: 'on',
  },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

let failed = null;
let shotN = 0;
try {
  log({ step: 'open', poseHash });
  pl.open_session();
  const DEADLINE = Date.now() + 16 * 60 * 1000;
  const s = pl.session;
  const l = s.lab;
  const pose = attachPose(l);
  let reading = false;
  const calls = [];
  let writerEntries = 0;
  const writerGets = [];
  l.observe(dis(GETTER), (_lab, r) => {
    if (reading) return;
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    const mdr = r.mdr >>> 0;
    if (mdr >= WRITER && mdr < WRITER_RET) {
      if (writerGets.length < 40) writerGets.push({ key, index, mdr: '0x' + mdr.toString(16) });
    }
    if (!WATCH.has(key) || calls.length > 400) return;
    calls.push({ op: 'get', key, index, mdr: '0x' + mdr.toString(16) });
  }, 'obs-q1-getter');
  l.observe(dis(SETTER), (_lab, r) => {
    if (reading) return;
    const key = r.d0 & 0xffff;
    if (!WATCH.has(key) || calls.length > 400) return;
    calls.push({
      op: 'set', key, index: r.d1 & 0xffff, value: r.a1 >>> 0,
      mdr: '0x' + (r.mdr >>> 0).toString(16),
    });
  }, 'obs-q1-setter');
  l.observe(dis(WRAPPER), (_lab, r) => {
    if (reading) return;
    const key = r.d0 & 0xffff;
    if (!WATCH.has(key) || calls.length > 400) return;
    calls.push({
      op: 'wrap', key, index: r.d1 & 0xffff,
      mdr: '0x' + (r.mdr >>> 0).toString(16),
    });
  }, 'obs-q1-wrapper');
  l.observe(dis(WRITER), () => { writerEntries += 1; }, 'obs-q1-writer');

  const readKey = (key, index) => {
    reading = true;
    try { return l.call(dis(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff; }
    finally { reading = false; }
  };
  const setKey = (key, index, value) => {
    reading = true;
    try {
      l.call(dis(SETTER), { d0: key, d1: index, a1: value }, null, null, 200000);
      const back = l.call(dis(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
      return back;
    } finally { reading = false; }
  };
  const half = () => {
    const out = {};
    for (const [name, key, n] of LAYOUT) out[name] = Array.from({ length: n }, (_, i) => readKey(key, i));
    return out;
  };
  const linkOf = () => ({
    area: readKey(0x1db1, 0),
    point: readKey(0x1dc1, 0),
    k5991: readKey(0x5991, 0),
    ke1f1: readKey(0xe1f1, 0),
  });
  const subject = () => readKey(0x1e71, 0);
  const timeLeft = () => Date.now() < DEADLINE;
  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to && timeLeft()) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const assertSubject = (where) => {
    const v = subject();
    if (v !== 0) throw new Error('0x1e71[0]=' + v + ' after ' + where);
    return v;
  };
  const keyDown = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => {
    keyDown(k, 'down');
    idle(80);
    keyDown(k, 'up');
    idle(350);
    assertSubject(k);
  };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 40 });
  const viewOf = () => {
    let screen = null;
    try { screen = s.screen(); } catch { /* not ready */ }
    try {
      const scr = walk.read();
      let highlight = null;
      for (const t of scr.texts) {
        try {
          const listed = walk.list(scr, t);
          if (listed && listed.cursor != null && listed.rows[listed.cursor]) {
            highlight = listed.rows[listed.cursor].text;
            break;
          }
        } catch { /* not a list */ }
      }
      const texts = scr.texts.map((t) => t.text);
      return { screen, texts, highlight, frame: scr.frame, title: titleBand(scr.frame) };
    } catch (e) {
      let frame = null;
      try { frame = s.frame('boundary'); } catch { /* none */ }
      return { screen, texts: [], highlight: null, frame, title: titleBand(frame), error: msg(e) };
    }
  };
  const shot = (step, view) => {
    if (!view.frame) return null;
    const file = resolve('work/out/q1-' + String(shotN).padStart(3, '0') + '-' + step.replace(/[^a-z0-9-]+/gi, '_') + '.png');
    shotN += 1;
    write_png(file, view.frame[0], view.frame[1], words_to_rgb(view.frame[2]));
    return file.split(/[/\\]/).pop();
  };
  const escapeShooting = () => {
    for (let i = 0; i < 8 && timeLeft(); i++) {
      if (s.screen() === 'shooting') return true;
      press('menu');
    }
    return s.screen() === 'shooting';
  };
  const commitOk = (step, highlightNeedles, textNeedles) => {
    const view = viewOf();
    const highlightOk = highlightNeedles.some((h) => (view.highlight || '').includes(h));
    const textOk = textNeedles.some((h) => (view.texts || []).some((t) => t.includes(h)));
    const row = {
      step, screen: view.screen, texts: view.texts, highlight: view.highlight, title: view.title,
      subject: subject(), link: linkOf(),
      identity: { highlightOk, textOk },
      screenshot: shot(step, view),
    };
    log(row);
    if (!highlightOk || !textOk || !view.title) throw new Error('identity failed at ' + step);
    press('ok');
    return row;
  };
  const seekHighlight = (needle, limit = 10) => {
    for (let i = 0; i < limit && timeLeft(); i++) {
      const cur = viewOf();
      if ((cur.highlight || '').includes(needle)) return cur;
      press('down');
    }
    return viewOf();
  };
  const openLinked = () => {
    if (s.screen() !== 'menu') press('menu');
    for (let i = 0; i < 28 && timeLeft(); i++) {
      if ((viewOf().texts || []).some((t) => t.includes('Orientation Linked'))) break;
      press('left');
    }
    seekHighlight('Orientation Linked', 8);
    commitOk('link-open', ['Orientation Linked'], ['Orientation Linked']);
  };
  const setLinkedNative = (wantOn) => {
    openLinked();
    seekHighlight('AF Target Mode', 4);
    let link = linkOf();
    if ((link.area === 1) !== wantOn) commitOk('link-area-' + (wantOn ? 'on' : 'off'), ['AF Target Mode'], ['Orientation Linked']);
    press('down');
    link = linkOf();
    if ((link.point === 1) !== wantOn) commitOk('link-point-' + (wantOn ? 'on' : 'off'), ['AF Target Point'], ['Orientation Linked']);
    const view = viewOf();
    const back = linkOf();
    const row = {
      step: wantOn ? 'linked-on' : 'linked-off',
      screen: view.screen, texts: view.texts, highlight: view.highlight, title: view.title,
      link: back, subject: subject(), screenshot: shot(wantOn ? 'linked-on' : 'linked-off', view),
    };
    log(row);
    if (back.area !== (wantOn ? 1 : 0) || back.point !== (wantOn ? 1 : 0)) {
      throw new Error('link readback ' + JSON.stringify(back));
    }
    escapeShooting();
    return back;
  };
  const applyPose = (name) => {
    pose.setPose(name);
    const fired =     pose.deliver();
    idle(700);
    const read = pose.read();
    if (read.exif !== { landscape: 1, exif6: 6, exif8: 8 }[name]) throw new Error('pose exif ' + name + ' ' + read.exif);
    return { name, fired, read, word: l.sim.u32(POSE) >>> 0 };
  };
  const oneUp = (tag, poseName) => {
    if (!timeLeft()) throw new Error('deadline before ' + tag);
    if (s.screen() !== 'shooting') escapeShooting();
    const applied = applyPose(poseName);
    const before = half();
    const link = linkOf();
    calls.length = 0;
    const writerBefore = writerEntries;
    writerGets.length = 0;
    press('up');
    const after = half();
    const view = viewOf();
    const sets = calls.filter((c) => c.op === 'set' && (c.key === 0x5962 || c.key === 0x99a1));
    const wraps = calls.filter((c) => c.op === 'wrap' && (c.key === 0x5962 || c.key === 0x99a1));
    const row = {
      step: tag,
      screen: view.screen,
      texts: view.texts,
      highlight: view.highlight,
      title: view.title,
      subject: subject(),
      link,
      pose: applied.read,
      poseWord: applied.word,
      wrote99: changed(before.k99a1, after.k99a1),
      wrote62: changed(before.k5962, after.k5962),
      wrote88: changed(before.k88b2, after.k88b2),
      t6ReadIndex: t6Bank(link.area, link.point, applied.word),
      setter: sets.slice(0, 12),
      wrapper: wraps.slice(0, 12),
      getterMode99: modeOf(calls.filter((c) => c.op === 'get'), 0x99a1),
      getterMode62: modeOf(calls.filter((c) => c.op === 'get'), 0x5962),
      writerEntered: writerEntries - writerBefore,
      writerGets: writerGets.slice(),
      half: after,
      screenshot: shot(tag, view),
    };
    log(row);
    summary.push({
      step: tag,
      link,
      poseWord: applied.word,
      exif: applied.read.exif,
      screen: view.screen,
      title: view.title,
      wrote99: row.wrote99,
      wrote62: row.wrote62,
      t6ReadIndex: row.t6ReadIndex,
      getterMode62: row.getterMode62,
      getterMode99: row.getterMode99,
      setter: sets.slice(0, 8),
      wrapper: wraps.slice(0, 8),
    });
    press('menu');
    escapeShooting();
    return row;
  };

  const bringUp = () => {
    const inits = [];
    for (const address of [0x6071181e, 0x608fe1b0, 0x609df7e4]) {
      const r = l.call(dis(address), null, null, null, 2000000);
      inits.push({ address: '0x' + address.toString(16), ret: r.d0 >>> 0 });
    }
    const tid = l.sim.u32(0x60042da0) & 0xffff;
    const entry = dis(0x609df84d);
    if (l.nk.entry(tid) !== entry) throw new Error('TAKE_FOCUS entry');
    if (l.nk.state(tid) !== 0x10) throw new Error('TAKE_FOCUS state');
    if (l.sim.read(0xa33f3640, 1)[0] !== 1) throw new Error('TAKE_FOCUS flag');
    l.lt.allow.add(entry);
    const act = l.nk.svc('act_tsk', { d0: tid })[0];
    if (act !== 0) throw new Error('act_tsk ' + act);
    s.settle('E147 native TAKE_FOCUS start');
    return { tid, inits };
  };

  idle(400);
  const brought = bringUp();
  log({ step: 'bring-up', label: 'EMULATOR-ONLY native bring-up 0x6071181e, 0x608fe1b0, 0x609df7e4, task 105. Role: behaviour.', brought });
  s.switch_input('lever', 1);
  s.camapp.pump();
  idle(400);
  const api = A(0x50ac4afe);
  const argument = l.call(dis(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
  l.call(api, { d0: 289, d1: argument }, null, null, 200000);
  l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
  idle(300);
  log({
    step: 's-af',
    label: 'EMULATOR-ONLY test setup. Public focus API sets mode 289 to S-AF and 1712 to 0. Role: test setup.',
    subject: assertSubject('s-af'),
  });
  const bootPose = applyPose('landscape');
  const fresh = half();
  const freshLink = linkOf();
  log({
    step: 'fresh',
    subject: subject(),
    link: freshLink,
    pose: bootPose.read,
    poseWord: bootPose.word,
    half: fresh,
    ten: [...l.sim.read(TEN, 10)],
    t6ReadIndex: t6Bank(freshLink.area, freshLink.point, bootPose.word),
  });

  const nativeOn = setLinkedNative(true);
  log({ step: 'native-on-confirmed', link: nativeOn, subject: subject() });
  for (const name of ['landscape', 'exif6', 'exif8']) oneUp('native-on-' + name, name);

  const nativeOff = setLinkedNative(false);
  log({ step: 'native-off-confirmed', link: nativeOff, subject: subject() });
  for (const name of ['landscape', 'exif6', 'exif8']) oneUp('native-off-' + name, name);

  const pokedArea = setKey(0x1db1, 0, 1);
  const pokedPoint = setKey(0x1dc1, 0, 1);
  log({
    step: 'poke-link',
    label: 'EMULATOR-ONLY test setup. Setter writes 0x1db1[0]=1 and 0x1dc1[0]=1, the T8 harness poke, after the native measurements. Role: test setup.',
    link: linkOf(),
    readback: { area: pokedArea, point: pokedPoint },
    subject: assertSubject('poke'),
  });
  if (pokedArea !== 1 || pokedPoint !== 1) throw new Error('poke readback');
  for (const name of ['landscape', 'exif6', 'exif8']) oneUp('poke-on-' + name, name);

  if (s.screen() !== 'shooting') escapeShooting();
  const writerBefore = writerEntries;
  writerGets.length = 0;
  calls.length = 0;
  keyDown('s1', 'down');
  idle(250);
  assertSubject('s1-down');
  keyDown('s1', 'up');
  idle(250);
  assertSubject('s1-up');
  log({
    step: 's1-writer',
    subject: subject(),
    link: linkOf(),
    writerEntered: writerEntries - writerBefore,
    writerGets: writerGets.slice(),
    ten: [...l.sim.read(TEN, 10)],
    half: half(),
  });

  if (s.screen() !== 'menu') press('menu');
  for (let i = 0; i < 16 && timeLeft(); i++) {
    const texts = viewOf().texts || [];
    if (texts.some((t) => t.includes('Reset/Initialize Settings'))) break;
    press('left');
  }
  seekHighlight('Reset/Initialize Settings', 8);
  commitOk('reset-row', ['Reset/Initialize Settings'], ['Reset/Initialize Settings']);
  idle(400);
  let page = viewOf();
  log({ step: 'reset-page', screen: page.screen, texts: page.texts, highlight: page.highlight, title: page.title, subject: subject() });
  const resetNeedle = (page.texts || []).some((t) => t.includes('Initialize All Settings'))
    ? 'Initialize All Settings'
    : ((page.texts || []).find((t) => /Initialize|Reset/.test(t) && t !== 'Reset/Initialize Settings') || 'Initialize');
  seekHighlight(resetNeedle, 8);
  commitOk('reset-action', [resetNeedle], [resetNeedle]);
  idle(400);
  page = viewOf();
  log({ step: 'reset-confirm-page', screen: page.screen, texts: page.texts, highlight: page.highlight, title: page.title, subject: subject() });
  if ((page.texts || []).some((t) => t === 'Yes') || (page.highlight || '').includes('Yes')) {
    seekHighlight('Yes', 6);
    commitOk('reset-yes', ['Yes'], ['Yes']);
    idle(1200);
  }
  const resetHalf = half();
  const resetLink = linkOf();
  log({
    step: 'reset-readback',
    subject: subject(),
    link: resetLink,
    half: resetHalf,
    ten: [...l.sim.read(TEN, 10)],
    screen: s.screen(),
  });
  const slots = [];
  for (const [name, , ] of LAYOUT) {
    const a = fresh[name];
    const b = resetHalf[name];
    for (let i = 0; i < a.length; i++) {
      slots.push({ name, index: i, fresh: a[i], reset: b[i], agree: a[i] === b[i] });
    }
  }
  writeFileSync(resolve('work/out/q1-reset-slots.json'), JSON.stringify({ freshLink, resetLink, slots }, null, 2) + '\n');
  writeFileSync(SUM, JSON.stringify({ summary, fresh, freshLink, reset: resetHalf, resetLink }, null, 2) + '\n');
  log({ step: 'done', disagreements: slots.filter((s) => !s.agree).length, subject: subject() });
} catch (e) {
  failed = e;
  log({ step: 'fail', error: msg(e), subject: null });
  try { writeFileSync(SUM, JSON.stringify({ summary, error: msg(e) }, null, 2) + '\n'); } catch { /* keep the jsonl */ }
} finally {
  try { if (pl.session) pl.close_session(); } catch { /* already closed */ }
}
if (failed) process.exitCode = 1;
