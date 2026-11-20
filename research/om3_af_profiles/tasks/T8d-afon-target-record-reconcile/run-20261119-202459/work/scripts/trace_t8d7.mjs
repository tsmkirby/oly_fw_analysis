// T8d correction experiment. One process: the candidate through the EXIF 6 pose.
// The writer runs from the press-path hook. Store watches cover that pose.
// EMULATOR-ONLY. Do not edit after this runs.
// Usage: node26 work/scripts/trace_t8d7.mjs om-emu
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { installCombined, EXT, readGetter, setKey } from './hook_t8d_writer5.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
const checkout = process.argv[2];
if (checkout !== 'om-emu') {
  process.stderr.write('usage: node26 work/scripts/trace_t8d7.mjs om-emu\n');
  process.exit(2);
}
const tag = 'trace-t8d7';
mkdirSync(resolve('work/out/cmd'), { recursive: true });
const shaFile = (p) => {
  const data = readFileSync(resolve(p));
  return { path: p, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length };
};
const inventory = {
  command: 'node26 work/scripts/trace_t8d7.mjs om-emu',
  when: 'before the emulator process',
  files: [
    'work/scripts/trace_t8d7.mjs',
    'work/scripts/hook_t8d_writer5.mjs',
    'brief.md',
    'TASK.md',
    'ref/tasks/T8c-afon-bank-and-init-reconcile/decision.md',
  ].map(shaFile),
};
writeFileSync(resolve('work/out/cmd/trace-t8d7.json'), JSON.stringify(inventory, null, 2) + '\n');
const lines = [];
const log = (row) => {
  lines.push(JSON.stringify(row));
  writeFileSync(resolve('work/out/trace-t8d7.jsonl'), lines.join('\n') + '\n');
  console.log(JSON.stringify({ id: row.id, pass: row.pass }));
};
const halfOf = (ctx) => {
  const live = {
    k99a1: [0x6295946c, 8, 1], k5962: [0x62920bf0, 6, 2], k88b2: [0x629526c0, 1, 2],
    k84d1: [0x62920fa5, 1, 1], k1dd1: [0x62920982, 10, 1],
  };
  const out = {};
  for (const [name, [addr, n, w]] of Object.entries(live)) {
    out[name] = [];
    for (let i = 0; i < n; i++) {
      const b = ctx.l.sim.read(addr + i * w, w);
      out[name].push(w === 2 ? b[0] | (b[1] << 8) : b[0]);
    }
  }
  return out;
};
const mirrorCells = (ctx) => ({
  pos: [0, 1, 2, 3, 4, 5].map((i) => {
    const b = ctx.l.sim.read(EXT + 0x0a + i * 2, 2);
    return b[0] | (b[1] << 8);
  }),
  live88: (() => { const b = ctx.l.sim.read(EXT + 0x22, 2); return b[0] | (b[1] << 8); })(),
});

const menuMod = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
const modelMod = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
const nv = 'work/out/nvram-trace-t8d7.json';
if (existsSync(resolve(nv)) || existsSync(resolve('work/out/session-trace-t8d7.jsonl'))) {
  process.stderr.write('refusing to overwrite trace outputs\n');
  process.exit(2);
}
let failed = null;
const result = await runZone({
  checkout,
  outPath: 'work/out/session-trace-t8d7.jsonl',
  tag: 'trace-t8d7',
  candidate: true,
  help: true,
  rowLabel: true,
  fatalShots: true,
  nvramPath: nv,
  overlayCsv: 'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
  explanation: 'Trace. Writer feed is on the AF-ON press path and 0x88b2[0] follows bank(). EMULATOR-ONLY. Role: behaviour.',
  change: 'EMULATOR-ONLY stock writer on the AF-ON press path, bank-selected position. Role: behaviour.',
  async drive(ctx) {
    const hooks = installCombined(ctx, modelMod, menuMod);
    const pose = attachPose(ctx.l);
    const edge = (key, dir) => {
      if (key === 'afon' && dir === 'down') hooks.armPress(true);
      ctx.key(key, dir);
      ctx.idle(dir === 'down' ? 80 : 400);
      if (key === 'afon' && dir === 'down') hooks.armPress(false);
      const subject = readGetter(ctx, 0x1e71, 0);
      if (subject !== 0) throw new Error('0x1e71[0]=' + subject + ' after ' + key + ' ' + dir);
    };
    const press = (key) => { edge(key, 'down'); edge(key, 'up'); };
    const snap = (id) => {
      const row = {
        id, half: halfOf(ctx), mirror: mirrorCells(ctx),
        target: Array.from(ctx.readTarget()),
        writer: hooks.counts.writer, press: hooks.pressLog.slice(),
        subject: readGetter(ctx, 0x1e71, 0),
      };
      log({ ...row, pass: true });
      return row;
    };
    ctx.bringUp();
    ctx.s.switch_input('lever', 1);
    ctx.s.camapp.pump();
    ctx.idle(400);
    const { A } = modelMod;
    const api = A(0x50ac4afe);
    const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
    ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
    ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
    ctx.idle(300);
    pose.setPose('landscape');
    pose.deliver();
    ctx.idle(500);
    setKey(ctx, 0x1db1, 0, 1);
    setKey(ctx, 0x1dc1, 0, 1);
    hooks.refresh();
    snap('fresh');
    hooks.enter();
    ctx.idle(200);
    press('up');
    press('up');
    press('ok');
    snap('edited');
    edge('s1', 'down');
    edge('s1', 'up');
    snap('after-s1');
    const before = hooks.counts.writer;
    edge('afon', 'down');
    const produced = Array.from(ctx.readTarget());
    const want = [36, 1, 3, 0, 3, 0, 3, 0, 0, 0];
    const recordOk = produced.every((b, i) => b === want[i]);
    log({
      id: 'af-down', pass: hooks.counts.writer === before + 1 && recordOk,
      writer: hooks.counts.writer, produced, want, press: hooks.pressLog.slice(),
      half: halfOf(ctx), mirror: mirrorCells(ctx),
    });
    if (hooks.counts.writer !== before + 1) throw new Error('writer did not run from the press path');
    if (!recordOk) throw new Error('landscape record ' + produced.join(','));
    edge('afon', 'up');
    const prePose = snap('pre-pose');
    hooks.armWatches('pose-exif6');
    let poseError = null;
    try {
      pose.setPose('exif6');
      pose.deliver();
      ctx.idle(600);
      if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) {
        setKey(ctx, 0x1db1, 0, 1);
        setKey(ctx, 0x1dc1, 0, 1);
      }
      hooks.refresh();
    } catch (e) {
      poseError = e;
    }
    const hits = hooks.drainWatches();
    const post = snap('pose-exif6');
    const leaked = post.half.k5962.map((v, i) => v !== prePose.half.k5962[i] ? i : -1).filter((i) => i >= 0);
    writeFileSync(resolve('work/out/trace-t8d7-hits.json'), JSON.stringify({
      leaked, pre: prePose.half, post: post.half, hits,
    }, null, 2) + '\n');
    log({ id: 'pose-watch', pass: !poseError, leaked, hits: hits.length, live: hits.filter((h) => h.id && h.id.startsWith('k')).length, problems: poseError ? [String(poseError.message || poseError)] : [] });
    if (poseError) throw poseError;
    if (leaked.length && !hits.some((h) => h.kind === 'store' && String(h.id || '').startsWith('k'))) {
      throw new Error('live cell changed with no store watch');
    }
  },
});
if (!result.ok) failed = result.failed;
log({ id: 'trace-t8d7-done', pass: !failed && !!result.ok, ok: !failed && !!result.ok, problems: failed ? [String(failed)] : [] });
if (failed || !result.ok) process.exitCode = 1;
