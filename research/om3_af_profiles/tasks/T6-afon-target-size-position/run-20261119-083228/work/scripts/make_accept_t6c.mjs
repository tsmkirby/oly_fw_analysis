// Copy the frozen t6b runner onto the t6c tables. The t6c file is edited
// before it runs. Do not edit this maker after it runs.
import { readFileSync, writeFileSync } from 'node:fs';
let s = readFileSync('work/scripts/accept_runner_t6b.mjs', 'utf8');
s = s.replaceAll('accept_table_t6.json', 'accept_table_t6c.json');
s = s.replaceAll('accept_reopen_t6.json', 'accept_reopen_t6c.json');
s = s.replaceAll('accept-t6b.jsonl', 'accept-t6c.jsonl');
s = s.replaceAll("'-t6b.jsonl'", "'-t6c.jsonl'");
s = s.replaceAll("'-t6b'", "'-t6c'");
s = s.replaceAll('accept_runner_t6b.mjs', 'accept_runner_t6c.mjs');
if (!s.includes('const HALF3')) {
  s = s.replace(
    'const STOCK = ',
    'const HALF3 = [0x0e, 0x02, 0x03, 0x00, 0x03, 0x00, 0x03, 0x00, 0x00, 0x00];\nconst STOCK = ',
  );
}
writeFileSync('work/scripts/accept_runner_t6c.mjs', s);
console.log('wrote t6c');
