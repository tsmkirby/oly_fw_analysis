// Full-state capture for the gated input. The 63 slots are the T8c mirror-copied
// half-press cells, every index of every key, not only the current bank.
import { createHash } from 'node:crypto';
import { LAYOUT as MAP } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';

export const LIVE = {
  0x99a1: { name: 'k99a1', addr: 0x6295946c, n: 8, w: 1 },
  0x9a41: { name: 'k9a41', addr: 0x62959484, n: 2, w: 1 },
  0x5962: { name: 'k5962', addr: 0x62920bf0, n: 6, w: 2 },
  0x1dd1: { name: 'k1dd1', addr: 0x62920982, n: 10, w: 1 },
  0x84d1: { name: 'k84d1', addr: 0x62920fa5, n: 1, w: 1 },
  0x88b2: { name: 'k88b2', addr: 0x629526c0, n: 1, w: 2 },
  0x90d1: { name: 'k90d1', addr: 0x62959355, n: 8, w: 1 },
  0x5a11: { name: 'k5a11', addr: 0x62920c18, n: 11, w: 1 },
  0x1de1: { name: 'k1de1', addr: 0x6292098c, n: 8, w: 1 },
  0x1df1: { name: 'k1df1', addr: 0x62920994, n: 8, w: 1 },
};

export const SLOT_COUNT = MAP.reduce((n, row) => n + row.n, 0);
export const EXT = 0xa031eeb0;
export const MODE = 0xa031eef7;
export const POSE = 0xa32c568c;
export const SIZE_REC = 0x62954108;
export const SIZE_N = 72;
export const HALF_TARGET = 0xa33f2ce0;
export const CONSUMER = 0xa33ca384;

export function slotCount() {
  return SLOT_COUNT;
}

function readWidth(sim, addr, width) {
  const b = sim.read(addr, width);
  return width === 2 ? b[0] | (b[1] << 8) : b[0];
}

export function captureState(ctx, readGetter, frame) {
  const sim = ctx.l.sim;
  const slots = [];
  const half = {};
  for (const row of MAP) {
    const live = LIVE[row.key];
    if (!live) throw new Error('no live address for ' + row.key.toString(16));
    const cells = [];
    for (let i = 0; i < row.n; i++) {
      const value = readWidth(sim, live.addr + i * live.w, live.w);
      cells.push(value);
      slots.push({ key: row.key, index: i, value });
    }
    half[live.name] = cells;
  }
  if (slots.length !== 63) throw new Error('slot count ' + slots.length);
  const own = ctx.readOwn();
  const target = Array.from(sim.read(CONSUMER, 10));
  const halfTarget = Array.from(sim.read(HALF_TARGET, 10));
  const mirror71 = Array.from(sim.read(EXT, 71));
  return {
    slots,
    half,
    mirror: mirror71.slice(0, 55),
    mirror71,
    sizeRecord: Array.from(sim.read(SIZE_REC, SIZE_N)),
    flag: sim.read(MODE, 1)[0],
    target,
    halfTarget,
    owner: own[4],
    subject: readGetter(ctx, 0x1e71, 0),
    poseWord: sim.u32(POSE) >>> 0,
    screen: ctx.s.screen(),
    frame: frame || null,
    seals: {
      target: createHash('sha256').update(Buffer.from(target)).digest('hex'),
      halfTarget: createHash('sha256').update(Buffer.from(halfTarget)).digest('hex'),
      mirror: createHash('sha256').update(Buffer.from(mirror71.slice(0, 55))).digest('hex'),
    },
  };
}

export function structuralProblems(actual) {
  const problems = [];
  if (!actual || !Array.isArray(actual.slots) || actual.slots.length !== 63) problems.push('slots');
  if (!actual.mirror71 || actual.mirror71.length !== 71) problems.push('mirror71');
  if (!actual.target || actual.target.length !== 10) problems.push('target');
  if (!actual.halfTarget || actual.halfTarget.length !== 10) problems.push('halfTarget');
  if (actual.subject !== 0) problems.push('subject ' + actual.subject);
  if (typeof actual.owner !== 'number') problems.push('owner');
  if (typeof actual.flag !== 'number') problems.push('flag');
  return problems;
}

export function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
