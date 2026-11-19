// Static map from K1e half-press cells to the 55-byte mirror.
// Factory bytes are K1 claim 2 (reference-t8b.json setup). ROM registration
// payloads for these keys are zero; see work/out/factory-defaults-c1.json.
export const LAYOUT = [
  { key: 0x99a1, off: 0x00, n: 8, width: 1, half: 'k99a1' },
  { key: 0x9a41, off: 0x08, n: 2, width: 1, half: 'k9a41' },
  { key: 0x5962, off: 0x0a, n: 6, width: 2, half: 'k5962' },
  { key: 0x1dd1, off: 0x16, n: 10, width: 1, half: 'k1dd1' },
  { key: 0x84d1, off: 0x20, n: 1, width: 1, half: 'k84d1' },
  { key: 0x88b2, off: 0x22, n: 1, width: 2, half: 'k88b2' },
  { key: 0x90d1, off: 0x24, n: 8, width: 1, half: 'k90d1' },
  { key: 0x5a11, off: 0x2c, n: 11, width: 1, half: 'k5a11' },
  { key: 0x1de1, off: 0x37, n: 8, width: 1, half: 'k1de1' },
  { key: 0x1df1, off: 0x3f, n: 8, width: 1, half: 'k1df1' },
];

export const FACTORY_HALF = {
  k99a1: [2, 0, 2, 0, 2, 0, 5, 5],
  k9a41: [0, 1],
  k5962: [526, 526, 526, 526, 526, 526],
  k1dd1: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  k84d1: [3],
  k88b2: [526],
  k90d1: [2, 2, 2, 2, 2, 2, 5, 5],
  k5a11: [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1],
  k1de1: [1, 1, 1, 1, 1, 1, 1, 1],
  k1df1: [1, 1, 1, 1, 0, 0, 0, 0],
};

export const MAPS = ['half-to-mirror', 'zone-byte'];
export const PROV = /K1 claim 2|T8 decision|T6 design|T3l decision|T3m decision|T7 decision|T5 /;

export function packHalf(half) {
  const mirror = Array(55).fill(255);
  for (const row of LAYOUT) {
    const cells = half[row.half];
    if (!cells) continue;
    for (let i = 0; i < row.n; i++) {
      const at = row.off + i * row.width;
      if (at >= 55) continue;
      const value = cells[i] | 0;
      if (row.width === 2) {
        mirror[at] = value & 255;
        mirror[at + 1] = (value >> 8) & 255;
      } else mirror[at] = value & 255;
    }
  }
  return mirror;
}

export const FACTORY_MIRROR = packHalf(FACTORY_HALF);

export function zoneByte(half) {
  const now = half.k99a1 || [];
  const base = FACTORY_HALF.k99a1;
  if (now[0] !== base[0]) return now[0];
  if (now[1] !== base[1]) return now[1];
  return 0;
}

export function factorySlots() {
  const slots = [];
  for (const row of LAYOUT) {
    const cells = FACTORY_HALF[row.half];
    for (let i = 0; i < row.n; i++) {
      slots.push({ key: row.key, index: i, width: row.width, value: cells[i] });
    }
  }
  return slots;
}

export const FACTORY_TARGET = [14, 2, 2, 0, 1, 0, 1, 0, 0, 0];
export const FF55 = Array(55).fill(255);
