// Checks whether a named fs.readFileSync import is inventoried. EMULATOR-ONLY.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

readFileSync(resolve('work/out/probe-identity.json'));
