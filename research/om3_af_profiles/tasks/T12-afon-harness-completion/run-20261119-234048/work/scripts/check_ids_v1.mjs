// Text search of declared_v2. Does not import the harness.
import { readFileSync } from 'node:fs';

const text = readFileSync('work/harness/declared_v2.mjs', 'utf8');
const ids = [
  'candidate-af-up', 'k1e-ke-s1-down', 'k1e-ke-s1-up',
  'zone-landscape', 'zone-landscape#2', 'zone-link-1db1', 'zone-link-1db1#2',
  'zone-link-1dc1', 'zone-link-1dc1#2',
  'zk1e-z0-up-down', 'zk1e-z0-up-up', 'zk1e-zone-z0-down', 'zk1e-z0-s1-down', 'zk1e-z0-s1-up',
  'custom-s1-down', 'custom-s1-up', 'zcand-z0-af-down', 'zcand-z0-af-up',
  'zcand-custom-af-down', 'zcand-custom-af-up',
  'seek-0-down', 'seek-ok-0-down', 'offer-custom', 'zk1e-zone-dismiss-0-down',
  'zcand-enter-z0', 'zcand-enter-custom', 'custom-flag-clear',
  'custom-mirror-1dd1#2', 'custom-live-1dd1#2', 'zcand-z0-set-1dd1#2',
];
const missing = ids.filter((id) => !text.includes('"' + id + '"'));
process.stdout.write(JSON.stringify({ missing, bytes: text.length }) + '\n');
if (missing.length) process.exitCode = 1;
