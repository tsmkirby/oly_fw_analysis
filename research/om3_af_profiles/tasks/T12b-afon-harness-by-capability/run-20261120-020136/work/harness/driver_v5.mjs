// Driver. Iterates the operation descriptions exposed by the harness entry.
// EMULATOR-ONLY.
import { runWithGate } from './entry_v5.mjs';

export async function drive(opts) {
  return runWithGate(opts, async (gate) => {
    const executed = [];
    for (const op of gate.operations()) {
      if (opts.kind && !op.kinds.includes(opts.kind)) continue;
      await gate.perform(op.id);
      executed.push(op.id);
    }
    return { executed, results: gate.results() };
  });
}
