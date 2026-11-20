// A freeze that omits the harness entry, with a seal that matches that bad file. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const body = JSON.parse(readFileSync(resolve('work/harness-freeze.json'), 'utf8'));
body.files = body.files.filter((row) => !String(row.path).endsWith('/entry_v5.mjs'));
const text = JSON.stringify(body, null, 2) + '\n';
const path = resolve('work/out/bad-freeze-v2.json');
writeFileSync(path, text);
const raw = readFileSync(path);
const seal = { sha256: createHash('sha256').update(raw).digest('hex'), bytes: raw.length, path: 'work/out/bad-freeze-v2.json' };
writeFileSync(resolve('work/out/bad-freeze-v2.seal.json'), JSON.stringify(seal, null, 2) + '\n');
process.stdout.write(JSON.stringify({ files: body.files.length, seal: seal.sha256 }) + '\n');
