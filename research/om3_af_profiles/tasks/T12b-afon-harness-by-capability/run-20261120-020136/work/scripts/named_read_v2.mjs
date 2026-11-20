// Reads one small file and one display reference with the named import. EMULATOR-ONLY.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const small = readFileSync(resolve('work/out/probe-identity.json'));
const ref = readFileSync(resolve('ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k1e-a.json'));
process.stdout.write(small.length + ' ' + ref.length + '\n');
