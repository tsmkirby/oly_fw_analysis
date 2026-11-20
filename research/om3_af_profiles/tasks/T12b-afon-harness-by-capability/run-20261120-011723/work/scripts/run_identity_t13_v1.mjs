// T13 identity pass. EMULATOR-ONLY. The session is the fake inside the harness entry.
import { runRunner } from '../harness/entry_v1.mjs';

await runRunner('identity');
