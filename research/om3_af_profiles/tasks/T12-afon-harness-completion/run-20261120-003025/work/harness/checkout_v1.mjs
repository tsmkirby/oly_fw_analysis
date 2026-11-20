// Loads the checkout modules a T13 session resolves. EMULATOR-ONLY.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CHECKOUT_MODULES = [
  'checks/lib/env.mjs',
  'src/fw/model.mjs',
  'src/lab/player.mjs',
  'src/lab/play.mjs',
  'scenarios/session_replay.mjs',
  'src/lab/menuwalk.mjs',
  'checks/lib/png.mjs',
  'src/lab/display.mjs',
  'host/nvram.mjs',
  'src/core/cpu.mjs',
  'src/core/interp.mjs',
  'src/lab/menu.mjs',
];

export async function loadCheckout(checkout = 'om-emu') {
  const mods = {};
  for (const rel of CHECKOUT_MODULES) {
    mods[rel] = await import(pathToFileURL(resolve(checkout, 'emu', rel)).href);
  }
  return mods;
}
