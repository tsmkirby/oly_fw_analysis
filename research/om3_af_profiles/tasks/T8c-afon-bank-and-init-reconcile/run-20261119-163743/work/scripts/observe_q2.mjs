// T8c Q2. Stock settings reset through native menu keys, on stock K1.
// One emulator process. T8 bring-up, no overlay. 0x1e71[0] after every key.
// Identity (title hash and highlighted row) before every OK.
// Do not edit after this runs.
// Usage: node26 work/scripts/observe_q2.mjs om-emu
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/observe_q2.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
const IMAGE_BASE = 0x60021020;
const dis = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const GETTER = 0x60063380;
const OUT = resolve('work/out/q2.jsonl');
const SUM = resolve('work/out/q2-summary.json');
if (existsSync(OUT) || existsSync(SUM)) {
  process.stderr.write('refusing to overwrite q2 outputs\n');
  process.exit(2);
}
mkdirSync(resolve('work/out'), { recursive: true });

const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadNand, loadImage, loadBlock, createHash: fwHash } = await use('checks/lib/env.mjs');
const { Player } = await use('src/lab/player.mjs');
const { apply_uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { A } = await use('src/fw/model.mjs');

const LAYOUT = [
  ['k99a1', 0x99a1, 8], ['k9a41', 0x9a41, 2], ['k5962', 0x5962, 6],
  ['k1dd1', 0x1dd1, 10], ['k84d1', 0x84d1, 1], ['k88b2', 0x88b2, 1],
  ['k90d1', 0x90d1, 8], ['k5a11', 0x5a11, 11], ['k1de1', 0x1de1, 8],
  ['k1df1', 0x1df1, 8],
];
const lines = [];
const log = (row) => {
  lines.push(JSON.stringify(row));
  writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(JSON.stringify({
    step: row.step, highlight: row.highlight || null, title: row.title || null,
    screen: row.screen || null, error: row.error || null,
  }));
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
  for (let y = 0; y < y1; y++) for (let x = x0; x < x1; x++) { buf.writeUInt32LE(words[y * w + x] >>> 0, o); o += 4; }
  return createHash('sha256').update(buf).digest('hex');
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
  pl.open_session();
  const DEADLINE = Date.now() + 8 * 60 * 1000;
  const s = pl.session;
  const l = s.lab;
  const pose = attachPose(l);
  let reading = false;
  const readKey = (key, index) => {
    reading = true;
    try { return l.call(dis(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff; }
    finally { reading = false; }
  };
  const half = () => {
    const out = {};
    for (const [name, key, n] of LAYOUT) out[name] = Array.from({ length: n }, (_, i) => readKey(key, i));
    out.k1db1 = [readKey(0x1db1, 0)];
    out.k1dc1 = [readKey(0x1dc1, 0)];
    out.k5991 = [readKey(0x5991, 0)];
    out.ke1f1 = [readKey(0xe1f1, 0)];
    out.k1e71 = [readKey(0x1e71, 0)];
    return out;
  };
  const timeLeft = () => Date.now() < DEADLINE;
  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to && timeLeft()) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const assertSubject = (where) => {
    const v = readKey(0x1e71, 0);
    if (v !== 0) throw new Error('0x1e71[0]=' + v + ' after ' + where);
    return v;
  };
  const press = (k) => {
    s.key(k, 'down'); s.camapp.pump(); idle(80);
    s.key(k, 'up'); s.camapp.pump(); idle(350);
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
          if (listed && listed.cursor != null && listed.rows[listed.cursor]) { highlight = listed.rows[listed.cursor].text; break; }
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
    const file = resolve('work/out/q2-' + String(shotN).padStart(3, '0') + '-' + step.replace(/[^a-z0-9-]+/gi, '_') + '.png');
    shotN += 1;
    write_png(file, view.frame[0], view.frame[1], words_to_rgb(view.frame[2]));
    return file.split(/[/\\]/).pop();
  };
  const commitOk = (step, highlightNeedles, textNeedles) => {
    const view = viewOf();
    const highlightOk = highlightNeedles.some((h) => (view.highlight || '').includes(h));
    const textOk = textNeedles.some((h) => (view.texts || []).some((t) => t.includes(h)));
    log({
      step, screen: view.screen, texts: view.texts, highlight: view.highlight, title: view.title,
      subject: assertSubject(step + '-before-ok'),
      identity: { highlightOk, textOk }, screenshot: shot(step, view),
    });
    if (!highlightOk || !textOk || !view.title) throw new Error('identity failed at ' + step);
    press('ok');
  };
  const has = (view, needle) => (view.highlight || '').includes(needle) || (view.texts || []).some((t) => t.includes(needle));

  idle(300);
  for (const address of [0x6071181e, 0x608fe1b0, 0x609df7e4]) l.call(dis(address), null, null, null, 2000000);
  const tid = l.sim.u32(0x60042da0) & 0xffff;
  const entry = dis(0x609df84d);
  if (l.nk.entry(tid) !== entry || l.nk.state(tid) !== 0x10) throw new Error('TAKE_FOCUS');
  l.lt.allow.add(entry);
  if (l.nk.svc('act_tsk', { d0: tid })[0] !== 0) throw new Error('act_tsk');
  s.settle('E147 native TAKE_FOCUS start');
  s.switch_input('lever', 1);
  s.camapp.pump();
  idle(400);
  const api = A(0x50ac4afe);
  const argument = l.call(dis(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
  l.call(api, { d0: 289, d1: argument }, null, null, 200000);
  l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
  idle(300);
  pose.setPose('landscape');
  pose.deliver();
  idle(500);
  const fresh = half();
  log({ step: 'fresh', half: fresh, subject: fresh.k1e71[0], label: 'EMULATOR-ONLY T8 bring-up and S-AF before the stock reset. Role: test setup.' });
  if (fresh.k1e71[0] !== 0) throw new Error('subject at fresh');

  if (s.screen() !== 'menu') press('menu');
  let found = null;
  const dirs = ['left', 'right'];
  for (const dir of dirs) {
    for (let i = 0; i < 24 && timeLeft() && !found; i++) {
      const view = viewOf();
      log({ step: 'tab-' + dir + '-' + i, screen: view.screen, texts: (view.texts || []).slice(0, 12), highlight: view.highlight, title: view.title });
      if ((view.highlight || '').includes('Reset/Initialize Settings')) { found = view; break; }
      if ((view.texts || []).some((t) => t.includes('Reset/Initialize Settings'))) {
        for (let d = 0; d < 8 && timeLeft(); d++) {
          const cur = viewOf();
          if ((cur.highlight || '').includes('Reset/Initialize Settings')) { found = cur; break; }
          press('down');
        }
        if (found) break;
      }
      press(dir);
    }
    if (found) break;
  }
  if (!found) throw new Error('reset row not found');
  commitOk('reset-row', ['Reset/Initialize Settings'], ['Reset/Initialize Settings']);
  idle(500);
  let page = viewOf();
  log({ step: 'reset-page', screen: page.screen, texts: page.texts, highlight: page.highlight, title: page.title, screenshot: shot('reset-page', page), subject: assertSubject('reset-page') });
  const prefer = ['Initialize All Settings', 'All Reset', 'Initialize', 'Reset'];
  let action = null;
  for (const needle of prefer) {
    if ((page.texts || []).some((t) => t.includes(needle)) || (page.highlight || '').includes(needle)) { action = needle; break; }
  }
  if (!action) throw new Error('no reset action on page');
  for (let i = 0; i < 8 && timeLeft(); i++) {
    const cur = viewOf();
    if ((cur.highlight || '').includes(action)) break;
    press('down');
  }
  commitOk('reset-action', [action], [action]);
  idle(600);
  page = viewOf();
  log({ step: 'after-action', screen: page.screen, texts: page.texts, highlight: page.highlight, title: page.title, screenshot: shot('after-action', page), subject: assertSubject('after-action') });
  if (has(page, 'Yes')) {
    for (let i = 0; i < 6 && timeLeft(); i++) {
      const cur = viewOf();
      if ((cur.highlight || '') === 'Yes' || (cur.highlight || '').includes('Yes')) break;
      press('down');
    }
    commitOk('reset-yes', ['Yes'], ['Yes']);
    idle(1500);
  }
  const reset = half();
  const slots = [];
  for (const [name] of LAYOUT) {
    for (let i = 0; i < fresh[name].length; i++) {
      slots.push({ name, index: i, fresh: fresh[name][i], reset: reset[name][i], agree: fresh[name][i] === reset[name][i] });
    }
  }
  const summary = {
    fresh, reset, action,
    disagreements: slots.filter((s) => !s.agree),
    subject: reset.k1e71[0],
  };
  writeFileSync(SUM, JSON.stringify(summary, null, 2) + '\n');
  log({ step: 'done', disagreements: summary.disagreements.length, subject: reset.k1e71[0] });
} catch (e) {
  failed = e;
  log({ step: 'fail', error: msg(e) });
} finally {
  try { if (pl.session) pl.close_session(); } catch { /* already closed */ }
}
if (failed) process.exitCode = 1;
