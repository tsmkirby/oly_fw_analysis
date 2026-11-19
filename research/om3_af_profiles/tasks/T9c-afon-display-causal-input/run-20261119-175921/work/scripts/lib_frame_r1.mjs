// Shared frame helpers for the T9c correction runs.
// EMULATOR-ONLY. Do not edit after a run has imported this file.
// The display hook is the one call site 0x6041935b, and only while the owner
// byte is 2. Kind values are the converter's immediates:
//   zone 0 -> kind 2 at 0x609b3ee8, zone 1 -> kind 0 (UI 1 clears),
//   zone 2 -> kind 3 at 0x609b3eef, zone 6 -> kind 7 at 0x609b3f13.
// A mirror byte of 0xFF or a position of 0xFFFF is left to the stock call.

export const EDGES = [
  ['s1', 'down'], ['s1', 'up'], ['afon', 'down'], ['afon', 'up'],
  ['s1', 'down'], ['afon', 'down'], ['afon', 'up'], ['s1', 'up'],
  ['afon', 'down'], ['s1', 'down'], ['s1', 'up'], ['afon', 'up'],
];
export const OWNERS = [1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0];
export const ALL = [0x0e, 0x02, 0x02, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
export const SMALL = [0x11, 0x02, 0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
export const C1 = [0x1c, 0x02, 0x07, 0x00, 0x05, 0x00, 0x07, 0x00, 0x00, 0x00];
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
export const IDLE_PERIOD_MS = 600;
export const T6_OVERLAY = 'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv';

const KIND_OF_ZONE = { 0: 2, 1: 0, 2: 3, 6: 7 };

export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function mirrorA() {
  const m = new Uint8Array(55);
  m[1] = 2;
  m[0x0c] = 529 & 0xff;
  m[0x0d] = (529 >> 8) & 0xff;
  m[0x22] = 529 & 0xff;
  m[0x23] = (529 >> 8) & 0xff;
  return m;
}

export function mirrorB() {
  const m = new Uint8Array(55);
  m[1] = 6;
  m[0x0c] = 540 & 0xff;
  m[0x0d] = (540 >> 8) & 0xff;
  m[0x16] = 5;
  m[0x17] = 7;
  m[0x18] = 5;
  m[0x19] = 7;
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
      if (n >= 15 && n <= 800) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return { marks, pixels, n31, boxes: boxesOf(marks) };
}

export function bandSig(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  let n31 = 0;
  let xsum = 0;
  let ysum = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3;
      if (rgb[i] !== 31 || rgb[i + 1] !== 31 || rgb[i + 2] !== 31) continue;
      n31 += 1;
      xsum = (xsum + x) >>> 0;
      ysum = (ysum + y) >>> 0;
    }
  }
  return n31 + ':' + xsum + ':' + ysum;
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

export function applyHalf(setKey, profile) {
  if (profile === 'A') {
    setKey(0x84d1, 0, 3);
    setKey(0x99a1, 0, 2);
    setKey(0x1dd1, 0, 3);
    setKey(0x1dd1, 1, 3);
    setKey(0x88b2, 0, 529);
    setKey(0x5962, 1, 529);
    return;
  }
  setKey(0x84d1, 0, 7);
  setKey(0x99a1, 0, 6);
  setKey(0x1dd1, 0, 5);
  setKey(0x1dd1, 1, 7);
  setKey(0x1dd1, 2, 5);
  setKey(0x1dd1, 3, 7);
  setKey(0x88b2, 0, 540);
  setKey(0x5962, 1, 540);
}

export function readCells(readKey) {
  return {
    k88b2: readKey(0x88b2, 0),
    k84d1: readKey(0x84d1, 0),
    k99a1: readKey(0x99a1, 0),
    k1dd1: [0, 1, 2, 3].map((i) => readKey(0x1dd1, i)),
    k5962: readKey(0x5962, 1),
    subject: readKey(0x1e71, 0),
  };
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
  const counts = { pos: 0, zone: 0, size: 0, kind: 0, pass: 0, seen: {} };
  ctx.l.hook(ctx.native(CALL), (h, r) => {
    if (u8(OWN) !== 2) { counts.pass += 1; ctx.l.passthrough(r); return; }
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    const tag = key.toString(16) + ':' + index;
    counts.seen[tag] = (counts.seen[tag] || 0) + 1;
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
    if (key === 0x1dd1) {
      const v = u8(MIRROR + 0x16 + (index & 0xff));
      if (v === 0xff || v === 0) { ctx.l.passthrough(r); return; }
      counts.size += 1;
      r.d0 = v;
      h.skip_call(r);
      return;
    }
    if (key === 0x84d1) {
      const z = u8(MIRROR + b);
      const kind = KIND_OF_ZONE[z];
      if (z === 0xff || kind === undefined) { ctx.l.passthrough(r); return; }
      counts.kind += 1;
      r.d0 = kind;
      h.skip_call(r);
      return;
    }
    ctx.l.passthrough(r);
  }, 'EMULATOR-ONLY display change: owner 2, call 0x6041935b returns the mirror position and size.');
  return counts;
}

export async function shoot(ctx, wordsToRgb, writePng, file) {
  const fr = ctx.s.frame('boundary');
  if (!fr) throw new Error('screenshot failed');
  const rgb = wordsToRgb(fr[2]);
  if (file) writePng(file, fr[0], fr[1], rgb);
  const g = greyMarks(rgb, fr[0]);
  return { rgb, w: fr[0], h: fr[1], sig: bandSig(rgb, fr[0]), ...g };
}

export async function waitChange(ctx, wordsToRgb, t0, beforeSig, limitMs) {
  const cap = t0 + limitMs * 1e6;
  let now = await shoot(ctx, wordsToRgb, null, null);
  if (now.sig !== beforeSig) return { latencyMs: (ctx.l.lab_time() - t0) / 1e6, shot: now };
  while (ctx.l.lab_time() < cap) {
    ctx.idle(25);
    now = await shoot(ctx, wordsToRgb, null, null);
    if (now.sig !== beforeSig) return { latencyMs: (ctx.l.lab_time() - t0) / 1e6, shot: now };
  }
  return { latencyMs: null, shot: now };
}

export async function idleUntil(ctx, t0, ms) {
  const cap = t0 + ms * 1e6;
  while (ctx.l.lab_time() < cap) ctx.idle(25);
}
