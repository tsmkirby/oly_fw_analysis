// Inventory probe. `throw` exercises the exit check on the failure path.
import { readListed } from './inventory_v3.mjs';

const mode = process.argv[2] || 'ok';
if (!globalThis.__t12Inventory) throw new Error('registrar missing');
if (mode === 'read') readListed('work/harness/predicates_v3.mjs');
if (mode === 'throw') throw new Error('probe throw');
process.stdout.write('probe ' + mode + '\n');
