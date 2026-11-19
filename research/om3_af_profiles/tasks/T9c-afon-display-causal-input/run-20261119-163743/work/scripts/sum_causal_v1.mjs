import { readFileSync } from 'node:fs';
const lines = readFileSync('work/out/obs-causal-v1.jsonl', 'utf8').trim().split(/\n/);
for (const line of lines) {
  const r = JSON.parse(line);
  if (r.id !== 'v1-causal' && r.id !== 'v1-observe') continue;
  const a = r.actual;
  process.stdout.write(r.id + ' pass ' + r.pass + '\n');
  process.stdout.write(JSON.stringify(a).slice(0, 2500) + '\n\n');
}
