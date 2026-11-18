// Prints pageTitle for the T3i control dump. Do not edit after it has run.
import { readFileSync } from 'node:fs';
import { pageTitle } from './observe_j1.mjs';

const text = readFileSync('work/out/cmd/01.out', 'utf8');
for (const line of text.split(/\r?\n/)) {
  if (!line.startsWith('{')) continue;
  const row = JSON.parse(line);
  if (row.step === 'menu' && row.profile === 0) break;
  const title = pageTitle(row.texts);
  console.log(row.step + '\t' + JSON.stringify(title) + '\t' + JSON.stringify(row.highlight));
}
