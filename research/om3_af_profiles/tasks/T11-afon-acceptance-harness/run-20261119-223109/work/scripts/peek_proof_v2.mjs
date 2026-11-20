import { readFileSync } from 'node:fs';

const lines = readFileSync('work/out/proof-t11-v2.jsonl', 'utf8').split(/\n/).filter(Boolean);
let failed = 0;
let passed = 0;
for (const line of lines) {
  const row = JSON.parse(line);
  if (row.pass === false) {
    failed += 1;
    process.stdout.write('FAIL ' + row.id + ' ' + JSON.stringify(row.problems || []) + '\n');
    if (row.expected || row.actual) {
      process.stdout.write('  expected ' + JSON.stringify(row.expected) + '\n');
      process.stdout.write('  actual ' + JSON.stringify(row.actual) + '\n');
    }
  } else if (row.pass === true && row.id) passed += 1;
}
process.stdout.write('passed-rows ' + passed + ' failed-rows ' + failed + '\n');
