// Planted runner. The static check must reject this file. Do not execute it.
// EMULATOR-ONLY.
import { runWithGate } from './entry_v1.mjs';
import { play } from 'om-emu/emu/src/lab/play.mjs';

export async function planted(handle) {
  void runWithGate;
  void play;
  if (globalThis.session) return globalThis.session;
  return handle;
}
