// Validation helpers for T9d. EMULATOR-ONLY.
// Do not edit after a run has imported this file.
// Display hook, owner 2 only:
//   0x6041935b key 0x88b2 returns the saved-bank mirror position.
//   0x6041935b key 0x99a1 index 0 returns the saved-bank mirror zone.
//   0x6041a1fb key 0x1dd1 returns the mirror size byte.
// The kind branch at 0x6041935b is not installed: that call is not entered
// with key 0x84d1. A mirror byte 0xFF, or a position 0xFFFF, is left stock.
// Saved bank is the T8c index: linked pose 2 -> 4, pose 4 -> 2, otherwise 0.

export const EDGES = [
  ['s1', 'down'], ['s1', 'up'], ['afon', 'down'], ['afon', 'up'],
  ['s1', 'down'], ['afon', 'down'], ['afon', 'up'], ['s1', 'up'],
  ['afon', 'down'], ['s1', 'down'], ['s1', 'up'], ['afon', 'up'],
];
export const OWNERS = [1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0];
export const ALL = [0x0e, 0x02, 0x02, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
export const SMALL = [0x11, 0x02, 0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
export const SINGLE = [0x11, 0x02, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
export const STOCK = [0x0e, 0x02, 0x02, 0x00, 0x1b, 0x00, 0x27, 0x00, 0x00, 0x00];
export const CENTRE = [
  { x: 417, y: 265, w: 19, h: 21 }, { x: 464, y: 265, w: 19, h: 21 },
  { x: 417, y: 314, w: 19, h: 21 }, { x: 464, y: 314, w: 19, h: 21 },
];

export const SET = 0x60063431;
export const GET = 0x60063380;
export const CONVERTER = 0x604050e5;
export const SET_API = 0x50ac4afe;
export const CALL = 0x6041935b;
export const SIZE_CALL = 0x6041a1fb;
export const MIRROR = 0xa031eeb0;
export const MIRROR_C = 0x6031eeb0;
export const OWN = 0xa031ed04;
export const POSE = 0xa32c568c;
export const RET_ZONE = 0x60a8f71c;
export const RET_SIZE = 0x60a8f757;
export const RET_POS = 0x60a8f76e;
export const RET_PLUS9 = 0x60a8f789;
export const CALL_CONV = 0x60a8f71f;
export const BACK_CONV = 0x60a8f726;
export const T6_OVERLAY = 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv';

export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const frameSame = (a, b) => same(a.boxes, b.boxes) && a.pixels === b.pixels && a.n31 === b.n31;

export function mirrorProfile(zone, pos, size0, size1) {
  const m = new Uint8Array(55);
  m.fill(0xff);
  m[0] = zone;
  m[1] = zone;
  m[0x0a] = pos & 0xff;
  m[0x0b] = (pos >> 8) & 0xff;
  m[0x0c] = pos & 0xff;
  m[0x0d] = (pos >> 8) & 0xff;
  m[0x16] = size0;
  m[0x17] = size1;
  return m;
}

export function boxesOf(marks) {
  return marks.map(({ x, y, w, h }) => ({ x, y, w, h }));
}

export function greyMarks(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => {
    const i = (y * w + x) * 3;
    const hi = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]);
    const lo = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]);
    return lo >= 18 && hi <= 60 && hi - lo <= 12;
  };
  const marks = [];
  let pixels = 0;
  let n31 = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3;
      if (rgb[i] === 31 && rgb[i + 1] === 31 && rgb[i + 2] === 31) n31 += 1;
      const si = (x - x0) + (y - y0) * (x1 - x0);
      if (seen[si] || !on(x, y)) continue;
      let minX = x, minY = y, maxX = x, maxY = y, n = 0;
      const stack = [[x, y]];
      seen[si] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        n += 1;
        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < x0 || ny < y0 || nx >= x1 || ny >= y1) continue;
          const ni = (nx - x0) + (ny - y0) * (x1 - x0);
          if (seen[ni] || !on(nx, ny)) continue;
          seen[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      pixels += n;
      if (n >= 15 && n <= 8000) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return { marks, pixels, n31, boxes: boxesOf(marks) };
}

export function makeReader(ctx) {
  return (key, index) => ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
}

export function makeSetter(ctx) {
  const readKey = makeReader(ctx);
  return (key, index, value) => {
    ctx.l.call(ctx.native(SET), { d0: key, d1: index, a1: value }, null, null, 200000);
    const got = readKey(key, index);
    if (got !== (value & 0xffff)) throw new Error('setter readback ' + key.toString(16) + '[' + index + '] ' + got);
  };
}

export async function prepare(ctx, A) {
  ctx.bringUp();
  ctx.s.switch_input('lever', 1);
  ctx.s.camapp.pump();
  ctx.idle(250);
  const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
  ctx.l.call(A(SET_API), { d0: 289, d1: argument }, null, null, 200000);
  ctx.l.call(A(SET_API), { d0: 1712, d1: 0 }, null, null, 200000);
  ctx.idle(150);
  const readKey = makeReader(ctx);
  if (readKey(0x1e71, 0) !== 0) throw new Error('subject');
  return readKey;
}

export function pokeAll(setKey) {
  setKey(0x84d1, 0, 2);
  setKey(0x1dd1, 0, 1);
  setKey(0x1dd1, 1, 1);
  setKey(0x99a1, 0, 0);
  setKey(0x1db1, 0, 1);
  setKey(0x1dc1, 0, 1);
}

export function savedBank(ctx, readKey) {
  const area = readKey(0x1db1, 0);
  const pos = readKey(0x1dc1, 0);
  if (!(area === 1 && pos === 1)) return 0;
  const pose = ctx.l.sim.u32(POSE) >>> 0;
  if (pose === 2) return 4;
  if (pose === 4) return 2;
  return 0;
}

export function installReader(ctx, readKey) {
  let bankId = 1;
  const refreshBank = () => {
    const area = readKey(0x1db1, 0);
    const pos = readKey(0x1dc1, 0);
    if (!(area === 1 && pos === 1)) { bankId = 1; return; }
    const pose = ctx.l.sim.u32(POSE) >>> 0;
    bankId = pose === 2 ? 5 : pose === 4 ? 3 : 1;
  };
  refreshBank();
  const u8 = (a) => ctx.l.sim.read(a, 1)[0];
  const u16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
  let inConv = false;
  const counts = { zone: 0, size: 0, pos: 0, plus9: 0, dim: 0 };
  ctx.l.observe(ctx.native(CALL_CONV), () => { inConv = true; }, 'obs-builder-converter');
  ctx.l.observe(ctx.native(BACK_CONV), () => { inConv = false; }, 'obs-builder-converter-back');
  ctx.l.hook(ctx.native(GET), (h, r) => {
    const back = r.mdr >>> 0;
    const index = r.d1 & 0xffff;
    const b = bankId;
    if (back === RET_ZONE) {
      let v = u8(MIRROR + b);
      if (v === 0xff) v = u8(0xa031e920);
      counts.zone += 1;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_SIZE) {
      let v = u8(MIRROR + 0x08);
      if (v === 0xff) v = 0;
      counts.size += 1;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_POS) {
      let v = u16(MIRROR + 0x0a + b * 2);
      if (v === 0xffff) v = 0;
      counts.pos += 1;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_PLUS9) { counts.plus9 += 1; h.finish(r, { d0: 0 }); return; }
    if (inConv && (r.d0 & 0xffff) === 0x1dd1) {
      let v = u8(MIRROR + 0x16 + (index & 0xff));
      if (v === 0xff) v = 0;
      counts.dim += 1;
      h.finish(r, { d0: v });
      return;
    }
    ctx.l.passthrough(r);
  }, 'EMULATOR-ONLY reused T6 profile read. Role: test setup.');
  return { refreshBank, counts, bankId: () => bankId };
}

export function installDisplay(ctx, bank) {
  const u8 = (a) => ctx.l.sim.read(a, 1)[0];
  const u16 = (a) => { const b = ctx.l.sim.read(a, 2); return b[0] | (b[1] << 8); };
  const counts = { pos: 0, zone: 0, size: 0, pass: 0 };
  ctx.l.hook(ctx.native(CALL), (h, r) => {
    if (u8(OWN) !== 2) { counts.pass += 1; ctx.l.passthrough(r); return; }
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    const b = bank();
    if (key === 0x88b2) {
      const v = u16(MIRROR + 0x0a + b * 2);
      if (v === 0xffff) { ctx.l.passthrough(r); return; }
      counts.pos += 1;
      r.d0 = v;
      h.skip_call(r);
      return;
    }
    if (key === 0x99a1 && index === 0) {
      const v = u8(MIRROR + b);
      if (v === 0xff) { ctx.l.passthrough(r); return; }
      counts.zone += 1;
      r.d0 = v;
      h.skip_call(r);
      return;
    }
    ctx.l.passthrough(r);
  }, 'EMULATOR-ONLY display change: owner 2, call 0x6041935b returns the saved-bank mirror position and zone.');
  ctx.l.hook(ctx.native(SIZE_CALL), (h, r) => {
    if (u8(OWN) !== 2) { ctx.l.passthrough(r); return; }
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    if (key !== 0x1dd1 || index > 9) { ctx.l.passthrough(r); return; }
    const v = u8(MIRROR + 0x16 + index);
    if (v === 0xff) { ctx.l.passthrough(r); return; }
    counts.size += 1;
    r.d0 = v;
    h.skip_call(r);
  }, 'EMULATOR-ONLY display change: owner 2, call 0x6041a1fb returns the mirror size for key 0x1dd1.');
  return counts;
}

export async function shoot(ctx, wordsToRgb, writePng, file) {
  const fr = ctx.s.frame('boundary');
  if (!fr) throw new Error('screenshot failed');
  const rgb = wordsToRgb(fr[2]);
  if (file) writePng(file, fr[0], fr[1], rgb);
  return greyMarks(rgb, fr[0]);
}

export async function watchEdge(ctx, wordsToRgb, t0, before, boundMs, expectSame) {
  let latencyMs = null;
  let drifted = false;
  const cap = t0 + boundMs * 1e6;
  let cursor = await shoot(ctx, wordsToRgb, null, null);
  if (!frameSame(cursor, before)) {
    latencyMs = (ctx.l.lab_time() - t0) / 1e6;
    if (expectSame) drifted = true;
  }
  while (ctx.l.lab_time() < cap) {
    ctx.idle(25);
    cursor = await shoot(ctx, wordsToRgb, null, null);
    if (!frameSame(cursor, before)) {
      if (latencyMs == null) latencyMs = (ctx.l.lab_time() - t0) / 1e6;
      if (expectSame) drifted = true;
    }
  }
  return { latencyMs, drifted };
}
