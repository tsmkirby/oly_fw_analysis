// Compare probe stores and the overlay CSV with T3i's. Do not edit after it has run.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { base64Bytes } = await import(pathToFileURL(resolve('om-emu/emu/src/util/bytes.mjs')).href);

function stores(file) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const out = {};
  for (const name of ['M', 'E']) out[name] = Buffer.from(base64Bytes(doc[name]));
  return out;
}
const control = stores('work/out/nvram-probe-control.json');
const cand = stores('work/out/nvram-probe-c1.json');
console.log(JSON.stringify({
  m: control.M.length,
  e: control.E.length,
  sameM: control.M.equals(cand.M),
  sameE: control.E.equals(cand.E),
}));
const a = readFileSync('work/out/overlay-probe-cprobe.csv');
const b = readFileSync('ref/tasks/T3i-afon-zone-acceptance/run-20261118-123315/work/out/overlay-changed-bytes.csv');
console.log(JSON.stringify({ overlayBytes: a.length, t3iBytes: b.length, sameOverlay: a.equals(b) }));
