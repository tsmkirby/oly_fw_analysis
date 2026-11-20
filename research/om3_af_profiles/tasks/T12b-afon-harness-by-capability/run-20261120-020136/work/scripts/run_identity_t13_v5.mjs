// T13 identity pass. EMULATOR-ONLY. The session stays inside the harness entry.
import { runRunner } from '../harness/entry_v5.mjs';

await runRunner('identity');
