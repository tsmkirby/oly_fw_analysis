import { readFileSync } from 'node:fs';
const lines = readFileSync('work/out/obs-valid-v4.jsonl', 'utf8').trim().split(/\n/);
for (const line of lines) {
  const r = JSON.parse(line);
  if (!r.id.startsWith('v4-e') && r.id !== 'v4-done') continue;
  if (r.id === 'v4-done') {
    process.stdout.write('DONE ' + JSON.stringify(r.actual).slice(0, 500) + ' pass ' + r.pass + '\n');
    continue;
  }
  const a = r.actual;
  process.stdout.write(r.id + ' pass ' + r.pass + ' problems ' + JSON.stringify(r.problems) + ' owner ' + a.owner + ' cell ' + a.cell + ' sub ' + a.subject + ' px ' + a.pixels + ' n31 ' + a.n31 + '\n');
  process.stdout.write('  target ' + JSON.stringify(a.target) + '\n');
  process.stdout.write('  marks ' + JSON.stringify(a.marks) + '\n');
}
