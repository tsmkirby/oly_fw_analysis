// Inventory probe. `inputs` reads the session's non-module files.
// `throw` exercises the exit check on the failure path.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { T6_OVERLAY } from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { NON_MODULE } from './inventory_v4.mjs';

const mode = process.argv[2] || 'ok';
if (!globalThis.__t12Inventory) throw new Error('registrar missing');
if (mode === 'inputs') {
  for (const rel of NON_MODULE) fs.readFileSync(resolve(rel));
  fs.readFileSync(resolve(T6_OVERLAY));
  const env = await import(pathToFileURL(resolve('om-emu/emu/checks/lib/env.mjs')).href);
  env.loadImage();
  env.loadBlock();
  const nand = env.loadNand();
  globalThis.__t12Inventory.note({ kind: 'loadNand', backing: env.NAND || null, model: 'E147', empty: nand == null });
  globalThis.__t12Inventory.note({ kind: 'loadBlock', backing: String(env.BLOCK).replaceAll('\\', '/'), model: 'E147' });
  globalThis.__t12Inventory.note({ kind: 'loadImage', backing: String(env.ORIGINAL).replaceAll('\\', '/'), model: 'E147' });
}
if (mode === 'throw') throw new Error('probe throw');
process.stdout.write('probe ' + mode + '\n');
