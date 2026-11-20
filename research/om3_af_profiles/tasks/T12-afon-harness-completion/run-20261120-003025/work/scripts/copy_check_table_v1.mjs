import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync('ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/harness/check_table_v2.mjs', 'utf8');
const start = source.indexOf('export function checkTable');
const end = source.indexOf('if (process.argv[1]');
if (start < 0 || end < 0) throw new Error('check table markers');
const body = '// Table checker carried forward from check_table_v2. The function is unchanged.\n// EMULATOR-ONLY records are not produced here.\n' + source.slice(start, end);
writeFileSync('work/harness/check_table_v3.mjs', body);
process.stdout.write(String(body.length) + '\n');
