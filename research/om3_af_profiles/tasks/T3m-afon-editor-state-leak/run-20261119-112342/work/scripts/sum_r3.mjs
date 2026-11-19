import { readFileSync } from 'node:fs';
const rows = readFileSync('work/out/accept-r3.jsonl', 'utf8').trim().split(/\r?\n/).map((l) => JSON.parse(l));
const by = new Map();
for (const r of rows) {
  if (!by.has(r.session)) by.set(r.session, { n: 0, fail: 0 });
  const s = by.get(r.session);
  s.n += 1;
  if (r.pass === false) s.fail += 1;
  let line = r.session + '\t' + r.id + '\t' + r.pass;
  if (r.actual && Array.isArray(r.actual.diffs)) line += '\t' + JSON.stringify(r.actual.diffs);
  if (r.error) line += '\t' + String(r.error).split('\n')[0];
  process.stdout.write(line + '\n');
}
for (const [k, s] of by) process.stdout.write('COUNT\t' + k + '\trows=' + s.n + '\tfail=' + s.fail + '\n');
