// Full-frame mark inventory of the retained T9d sweep screenshots.
// Static. No emulator. The first sweep counted only x in [280, 780).
// Do not edit after it has run.
// Usage: node26 work/scripts/marks_full_t9d.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

const FILES = [
  'sweep-rest.png', 'sweep-all.png', 'sweep-single.png', 'sweep-small.png', 'sweep-cross.png',
  'sweep-mid.png', 'sweep-large.png', 'sweep-c1.png', 'sweep-c2.png', 'sweep-c3.png', 'sweep-c4.png',
  'sweep-custom.png',
];

function readPng(file) {
  const data = readFileSync(file);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  const bitDepth = data[24];
  const colorType = data[25];
  if (bitDepth !== 8 || colorType !== 2) throw new Error('png ' + file + ' depth ' + bitDepth + ' color ' + colorType);
  const idat = [];
  for (let pos = 8; pos < data.length;) {
    const length = data.readUInt32BE(pos);
    const kind = data.toString('latin1', pos + 4, pos + 8);
    if (kind === 'IDAT') idat.push(data.subarray(pos + 8, pos + 8 + length));
    pos += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = 3 * width;
  const rgb = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[(stride + 1) * y];
    if (filter !== 0) throw new Error('filter ' + filter + ' in ' + file);
    raw.copy(rgb, stride * y, (stride + 1) * y + 1, (stride + 1) * (y + 1));
  }
  const sha256 = createHash('sha256').update(data).digest('hex');
  return { width, height, rgb, sha256, bytes: data.length };
}

function components(rgb, w, h, x0, y0, x1, y1, on, minN) {
  const spanX = x1 - x0;
  const seen = new Uint8Array(spanX * (y1 - y0));
  const marks = [];
  let pixels = 0;
  let nOn = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3;
      if (!on(rgb, i)) continue;
      nOn += 1;
      const si = (x - x0) + (y - y0) * spanX;
      if (seen[si]) continue;
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
          const ni = (nx - x0) + (ny - y0) * spanX;
          if (seen[ni] || !on(rgb, (ny * w + nx) * 3)) continue;
          seen[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      pixels += n;
      if (n >= minN) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return { marks, pixels, nOn };
}

const is31 = (rgb, i) => rgb[i] === 31 && rgb[i + 1] === 31 && rgb[i + 2] === 31;
const isGrey = (rgb, i) => {
  const hi = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]);
  const lo = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]);
  return lo >= 18 && hi <= 60 && hi - lo <= 12;
};

const out = [];
for (const name of FILES) {
  const file = resolve('work/out', name);
  const png = readPng(file);
  const full = components(png.rgb, png.width, png.height, 0, 0, png.width, png.height, is31, 8);
  const fullGrey = components(png.rgb, png.width, png.height, 0, 0, png.width, png.height, isGrey, 15);
  const old = components(png.rgb, png.width, png.height, 280, 60, 780, 520, is31, 8);
  const oldGrey = components(png.rgb, png.width, png.height, 280, 60, 780, 520, isGrey, 15);
  const leftOf280 = full.marks.filter((m) => m.x < 280);
  out.push({
    file: 'work/out/' + name,
    sha256: png.sha256,
    bytes: png.bytes,
    width: png.width,
    height: png.height,
    full31: { n31: full.nOn, pixelsInMarks: full.pixels, marks: full.marks },
    fullGrey: { nOn: fullGrey.nOn, pixelsInMarks: fullGrey.pixels, marks: fullGrey.marks },
    window31: { n31: old.nOn, marks: old.marks },
    windowGrey: { nOn: oldGrey.nOn, pixelsInMarks: oldGrey.pixels, marks: oldGrey.marks },
    marksWithXBelow280: leftOf280,
  });
}

const dest = resolve('work/out/marks-full-t9d.json');
writeFileSync(dest, JSON.stringify({
  note: 'Retained sweep screenshots, whole frame. The first detector used x in [280, 780) and y in [60, 520). rgb-31 components are 4-connected and kept when n>=8. Grey components use the first detector predicate and n>=15. No emulator.',
  frames: out,
}, null, 2) + '\n');
console.log('frames ' + out.length + ' wrote ' + dest);
for (const row of out) {
  const boxes = row.full31.marks.map((m) => m.w + 'x' + m.h + '@' + m.x + ',' + m.y).join(' ');
  console.log(row.file + ' n31=' + row.full31.n31 + ' marks=' + row.full31.marks.length + ' ' + boxes);
}
