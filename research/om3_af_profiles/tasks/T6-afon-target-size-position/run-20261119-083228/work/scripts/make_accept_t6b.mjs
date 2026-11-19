// One-shot copy of the frozen accept runner with the phase-A target fixed.
// Profile A is Small. The frozen runner asked for All. Do not edit after it runs.
import { readFileSync, writeFileSync } from 'node:fs';
let s = readFileSync('work/scripts/accept_runner_t6.mjs', 'utf8');
const from = "if (z5 && step.afon) want = step.phase === 'b' && profile ? C1 : ALL;";
const to = "if (z5 && step.afon) want = !profile ? ALL : (step.phase === 'b' ? C1 : SMALL);";
if (!s.includes(from)) throw new Error('pattern missing');
s = s.replace(from, to);
s = s.replace('accept-t6.jsonl', 'accept-t6b.jsonl');
s = s.replaceAll("'-t6.jsonl'", "'-t6b.jsonl'");
s = s.replaceAll("'-t6'", "'-t6b'");
s = s.replace('accept_runner_t6.mjs', 'accept_runner_t6b.mjs');
writeFileSync('work/scripts/accept_runner_t6b.mjs', s);
console.log('wrote accept_runner_t6b.mjs');
