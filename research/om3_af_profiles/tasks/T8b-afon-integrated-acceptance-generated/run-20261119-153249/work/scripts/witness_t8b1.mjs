// Pulls the reference-run save witness and the store-diff count. Static.
import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';

const want = new Set(['k2-save-leave-1', 'k1-save-leave-1', 't8b1-k1-k2-stores', 't8b1-done', 't8b1-reference-hash', 'k2-save-before-commit', 'k2-reopen-afon-down', 'k2-reopen-afon-up', 'k2-reopen-base']);
const out = {};
const rl = createInterface({ input: createReadStream(resolve('work/out/t8b1.jsonl')), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.includes('"id"')) continue;
  let row;
  try { row = JSON.parse(line); } catch { continue; }
  if (!want.has(row.id)) continue;
  const actual = row.actual || {};
  out[row.id] = {
    pass: row.pass,
    ok: row.ok || null,
    problems: row.problems,
    zone: actual.zone,
    flag: actual.flag,
    owner: actual.owner,
    status: actual.status,
    enabled: actual.enabled,
    target: actual.target,
    focus: actual.focus,
    screen: actual.screen,
    pageTitle: actual.pageTitle,
    highlight: actual.highlight,
    subject: actual.subject,
    mirrorFF: Array.isArray(actual.mirror) ? actual.mirror.every((b) => b === 255) : null,
    save: row.save || null,
    count: actual.count,
    sha256: actual.sha256,
    bytes: actual.bytes,
  };
}
writeFileSync(resolve('work/out/witness-t8b1.json'), JSON.stringify(out, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: true, ids: Object.keys(out) }) + '\n');
