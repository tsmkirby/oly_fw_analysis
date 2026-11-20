// One display edge, to see whether its reference JSON is inventoried. EMULATOR-ONLY.
import { createFakeSession } from '../harness/fake_session_v1.mjs';
import { prepare } from '../harness/execute_v1.mjs';
import { OPERATIONS } from '../harness/operations_v2.mjs';

const op = OPERATIONS.find((item) => item.expectationSource === 'edge');
prepare(op, createFakeSession({}));
process.stdout.write(op.id + '\n');
