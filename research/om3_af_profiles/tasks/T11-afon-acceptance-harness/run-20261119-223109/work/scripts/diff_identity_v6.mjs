import { readFileSync } from 'node:fs';

const lines = readFileSync('work/out/identity-t11-v6.jsonl', 'utf8').split(/\n/).filter(Boolean);
const rows = lines.map((line) => JSON.parse(line)).filter((row) => row.actual && row.actual.slots);

function diffArr(a, b, label) {
  const out = [];
  if (!a || !b) return ['missing ' + label];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) out.push(label + '[' + i + '] ' + a[i] + '->' + b[i]);
  return out;
}

let prev = null;
for (const row of rows) {
  if (!prev || prev.role !== row.role) {
    prev = row;
    process.stdout.write('\n== ' + row.id + ' baseline screen=' + row.actual.screen + '\n');
    continue;
  }
  const changes = [];
  for (let i = 0; i < prev.actual.slots.length; i++) {
    const a = prev.actual.slots[i];
    const b = row.actual.slots[i];
    if (a.value !== b.value) changes.push(a.key.toString(16) + ':' + a.index + ' ' + a.value + '->' + b.value);
  }
  changes.push(...diffArr(prev.actual.mirror71, row.actual.mirror71, 'm'));
  changes.push(...diffArr(prev.actual.target, row.actual.target, 't'));
  changes.push(...diffArr(prev.actual.halfTarget, row.actual.halfTarget, 'h'));
  if (prev.actual.flag !== row.actual.flag) changes.push('flag ' + prev.actual.flag + '->' + row.actual.flag);
  if (prev.actual.owner !== row.actual.owner) changes.push('owner ' + prev.actual.owner + '->' + row.actual.owner);
  if (prev.actual.subject !== row.actual.subject) changes.push('subject');
  if (prev.actual.poseWord !== row.actual.poseWord) changes.push('pose ' + prev.actual.poseWord + '->' + row.actual.poseWord);
  if (prev.actual.screen !== row.actual.screen) changes.push('screen ' + prev.actual.screen + '->' + row.actual.screen);
  process.stdout.write(row.id + ': ' + (changes.length ? changes.join(', ') : 'UNCHANGED') + '\n');
  prev = row;
}
