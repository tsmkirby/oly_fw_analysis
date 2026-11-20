// Dependency read through the default fs export. EMULATOR-ONLY.
import fs from 'node:fs';
import { resolve } from 'node:path';

export function readRef() {
  return fs.readFileSync(resolve('ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k1e-a.json')).length;
}
