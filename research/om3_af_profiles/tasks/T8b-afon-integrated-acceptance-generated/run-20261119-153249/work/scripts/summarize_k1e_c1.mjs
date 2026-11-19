// Static summary of the stopped K1e log. Not an experiment version.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rows = readFileSync(resolve('work/out/t8bc1.jsonl'), 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
const want = new Set(['ke-base', 'e-up', 'e-dial', 'e-right', 'e-ok', 'ke-s1-down', 'p-up', 'p-right', 'p-back', 'c-menu', 'c-left-19', 'c-page-ok', 'c-down-4', 'c-size-right', 'c-size-v', 'c-size-h', 'c-size-ok']);
const out = [];
for (const row of rows) {
  if (!row.actual) continue;
  const id = String(row.id || '').replace(/^k1e-/, '');
  if (!want.has(id) && row.actual.subject === 0) continue;
  const h = row.actual.half || {};
  out.push({
    id: row.id,
    pass: row.pass,
    problems: row.problems,
    subject: row.actual.subject,
    screen: row.actual.screen,
    title: row.actual.title,
    pageTitle: row.actual.pageTitle,
    highlight: row.actual.highlight,
    k99a1: h.k99a1,
    k5962: h.k5962,
    k88b2: h.k88b2,
    k1dd1: h.k1dd1,
    k9a41: h.k9a41,
    target: row.actual.target,
    halfTarget: row.actual.halfTarget,
    owner: row.actual.owner,
  });
}
writeFileSync(resolve('work/out/k1e-summary-c1.json'), JSON.stringify(out, null, 2) + '\n');
process.stdout.write(JSON.stringify({ rows: out.length, subjects: out.map((r) => [r.id, r.subject]) }) + '\n');
