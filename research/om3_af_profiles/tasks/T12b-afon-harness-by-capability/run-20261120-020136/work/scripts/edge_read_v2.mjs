// Reports which readFileSync the runner and the executor see. EMULATOR-ONLY.
import fs from 'node:fs';
import { readFileSync } from 'node:fs';
import { prepare } from '../harness/execute_v1.mjs';
import { OPERATIONS } from '../harness/operations_v2.mjs';
import { createFakeSession } from '../harness/fake_session_v1.mjs';

process.stdout.write('same ' + (readFileSync === fs.readFileSync) + '\n');
process.stdout.write('name ' + readFileSync.name + '\n');
const op = OPERATIONS.find((item) => item.expectationSource === 'edge');
prepare(op, createFakeSession({}));
process.stdout.write(op.id + '\n');
