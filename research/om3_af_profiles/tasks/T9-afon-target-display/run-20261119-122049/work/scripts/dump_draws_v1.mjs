// Print the version-3 draw samples. Reads only. Do not edit after it has run.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const rows = readFileSync(resolve('work/out/obs-k1-v3.jsonl'), 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
const moved = rows.find((r) => r.id === 'v3-moved');
const text = JSON.stringify({ gets: moved.gets, draws: moved.draws, samples: moved.drawSamples }, null, 2);
writeFileSync(resolve('work/out/draw-samples-v3.json'), text + '\n');
console.log(text);
