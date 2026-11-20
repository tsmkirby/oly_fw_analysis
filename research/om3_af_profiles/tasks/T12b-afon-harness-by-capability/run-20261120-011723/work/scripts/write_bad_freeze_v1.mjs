// Drop one module that the proof runner loads, so enforce must refuse. EMULATOR-ONLY.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = JSON.parse(readFileSync(resolve('work/harness-freeze.json'), 'utf8'));
const dropped = '/work/harness/entry_v1.mjs';
const files = source.files.filter((row) => !String(row.path).replaceAll('\\', '/').endsWith(dropped));
if (files.length !== source.files.length - 1) throw new Error('entry_v1.mjs was not in the freeze');
writeFileSync(resolve('work/out/bad-freeze.json'), JSON.stringify({
  task: source.task,
  method: 'good freeze with entry_v1.mjs removed',
  dropped,
  files,
}, null, 2) + '\n');
process.stdout.write(JSON.stringify({ kept: files.length, dropped }) + '\n');
