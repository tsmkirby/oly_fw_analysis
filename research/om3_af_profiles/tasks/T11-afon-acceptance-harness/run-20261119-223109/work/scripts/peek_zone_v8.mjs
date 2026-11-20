import { readFileSync } from 'node:fs';

const lines = readFileSync('work/out/identity-t11-v8.jsonl', 'utf8').split(/\n/).filter(Boolean);
for (const line of lines) {
  const row = JSON.parse(line);
  if (!row.id || !row.id.startsWith('zcand-') || !row.actual) continue;
  if (!/af-/.test(row.id) && !/set-/.test(row.id) && !row.id.includes('enter')) continue;
  const b = row.before || {};
  const a = row.actual || {};
  const moved = JSON.stringify(b.halfTarget) !== JSON.stringify(a.halfTarget) || JSON.stringify(b.target) !== JSON.stringify(a.target);
  if (!moved && row.pass) continue;
  process.stdout.write(row.id + ' pass=' + row.pass
    + ' target ' + JSON.stringify(b.target) + ' -> ' + JSON.stringify(a.target)
    + ' half ' + JSON.stringify(b.halfTarget) + ' -> ' + JSON.stringify(a.halfTarget)
    + '\n');
}
