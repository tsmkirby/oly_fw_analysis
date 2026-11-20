// Loads a dependency that reads a display reference. EMULATOR-ONLY.
import { readRef } from '../harness/dep_read_v1.mjs';

process.stdout.write(String(readRef()) + '\n');
