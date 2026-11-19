// Copy the execution-time helper hashes the emulator logged. Not an experiment version.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rows = readFileSync(resolve('work/out/session-proof6-k1e.jsonl'), 'utf8').trim().split(/\n/).map((line) => JSON.parse(line));
const row = rows.find((r) => r.step === 'helper-hashes');
if (!row) throw new Error('helper-hashes missing');
const doc = {
  tag: row.tag,
  note: row.note,
  helpers: row.helpers,
  resources: row.resources,
};
writeFileSync(resolve('work/out/proof6-helpers.json'), JSON.stringify(doc, null, 2) + '\n');
process.stdout.write(JSON.stringify({ helpers: doc.helpers.length, resources: doc.resources.length }) + '\n');
