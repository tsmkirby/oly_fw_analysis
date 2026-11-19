import { readFileSync } from 'node:fs';
const rows = readFileSync('work/out/obs-trace-v4.jsonl', 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
const after = rows.find((r) => r.id === 'v4-after');
const want = new Set(['0x60063534', '0x6006355e', '0x600634e6', '0x610eee11', '0x610eedee', '0x610eedcb', '0x610eedc5', '0x6005753c', '0x610f5713', '0x610f7172', '0x610ee1f8', '0x610ee2a8']);
const out = [];
for (const s of after.actual.samples) {
  if (want.has(s.pc)) out.push(s);
}
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
process.stdout.write('sampleCount ' + after.actual.samples.length + '\n');
