// Counts filesystem calls made while preparing one display edge. EMULATOR-ONLY.
import fs from 'node:fs';

const origOpen = fs.openSync;
const origRead = fs.readFileSync;
let opens = 0;
let reads = 0;
fs.openSync = function countedOpen(path, ...args) {
  if (String(path).includes('ref-k1e') || String(path).includes('ref-k2')) opens += 1;
  return origOpen(path, ...args);
};
fs.readFileSync = function countedRead(path, ...args) {
  if (String(path).includes('ref-k1e') || String(path).includes('ref-k2')) reads += 1;
  return origRead(path, ...args);
};

const { prepare } = await import('../harness/execute_v1.mjs');
const { OPERATIONS } = await import('../harness/operations_v2.mjs');
const { createFakeSession } = await import('../harness/fake_session_v1.mjs');
const op = OPERATIONS.find((item) => item.expectationSource === 'edge');
prepare(op, createFakeSession({}));
process.stdout.write('opens ' + opens + ' reads ' + reads + '\n');
