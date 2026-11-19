// Generates the short-proof table. One row per key. Static. Do not edit after it runs.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DIRECT = '9d6a92dc9914061304a8f94e2515a22b5fd6ba2846405649f740cc62282aea02';
const exitSeq = (key) => [{ key, dir: 'down' }, { key, dir: 'up' }];
const lit = (value, provenance) => ({ source: 'literal', value, provenance });

const steps = [
  { id: 'enter-land', action: 'enter', who: ['candidate'], pose: 1, bank: 0, expect: { mirrorFactory: true } },
  { id: 'e-open', action: 'key', key: 'up', who: ['k1e', 'candidate'], pose: 1, bank: 0, editor: true, identity: { screen: 'direct', highlight: null, title: DIRECT }, expect: { zone: 2, bankCell: 'k5962' } },
  { id: 'e-up', action: 'key', key: 'up', who: ['k1e', 'candidate'], pose: 1, bank: 0, editor: true, identity: { screen: 'direct', highlight: null, title: DIRECT }, expect: { zone: 2, bankCell: 'k5962' } },
  { id: 'e-ok', action: 'key', key: 'ok', who: ['k1e', 'candidate'], pose: 1, bank: 0, editor: true, exit: true, exitSeq: exitSeq('ok'), identity: { screen: 'direct', highlight: null, title: DIRECT } },
  { id: 'af-down', action: 'edge', key: 'afon', dir: 'down', who: ['candidate'], pose: 1, bank: 0, exitSeq: [{ key: 'afon', dir: 'down' }], expect: { positionFrom: 'k1e:e-ok', small: true, owner: 2 } },
  { id: 'af-up', action: 'edge', key: 'afon', dir: 'up', who: ['candidate'], pose: 1, bank: 0, exitSeq: [{ key: 'afon', dir: 'up' }], expect: { releaseFrom: 'k1e:e-ok', owner: 0 } },
  { id: 'pose-exif6', action: 'pose', key: 'exif6', who: ['k1e', 'candidate'], pose: 2, bank: 4 },
  { id: 'enter-exif6', action: 'enter', who: ['candidate'], pose: 2, bank: 4 },
  { id: 'p-up', action: 'key', key: 'up', who: ['k1e', 'candidate'], pose: 2, bank: 4, editor: true, identity: { screen: 'direct', highlight: null, title: DIRECT }, expect: { zone: 2, bankCell: 'k5962' } },
  { id: 'p-menu', action: 'key', key: 'menu', who: ['k1e', 'candidate'], pose: 2, bank: 4, editor: true, exit: true, exitSeq: exitSeq('menu'), identity: { screen: 'direct', highlight: null, title: DIRECT } },
  { id: 'p-af-down', action: 'edge', key: 'afon', dir: 'down', who: ['candidate'], pose: 2, bank: 4, exitSeq: [{ key: 'afon', dir: 'down' }], expect: { positionFrom: 'k1e:p-menu', small: true, owner: 2 } },
  { id: 'p-af-up', action: 'edge', key: 'afon', dir: 'up', who: ['candidate'], pose: 2, bank: 4, exitSeq: [{ key: 'afon', dir: 'up' }], expect: { releaseFrom: 'k1e:p-menu', owner: 0 } },
  { id: 'pose-land', action: 'pose', key: 'landscape', who: ['candidate'], pose: 1, bank: 0 },
  { id: 'l-af-down', action: 'edge', key: 'afon', dir: 'down', who: ['candidate'], pose: 1, bank: 0, exitSeq: [{ key: 'afon', dir: 'down' }], expect: { positionFrom: 'k1e:e-ok', small: true, owner: 2 } },
  { id: 'l-af-up', action: 'edge', key: 'afon', dir: 'up', who: ['candidate'], pose: 1, bank: 0, exitSeq: [{ key: 'afon', dir: 'up' }], expect: { releaseFrom: 'k1e:e-ok', owner: 0 } },
  { id: 'n-open', action: 'key', key: 'up', who: ['k2', 'candidate'], pose: 1, bank: 0, identity: { screen: 'direct', highlight: null, title: DIRECT } },
  { id: 'n-up', action: 'key', key: 'up', who: ['k2', 'candidate'], pose: 1, bank: 0, identity: { screen: 'direct', highlight: null, title: DIRECT } },
  { id: 'n-ok', action: 'key', key: 'ok', who: ['k2', 'candidate'], pose: 1, bank: 0, exit: true, matchExit: 'n-ok', exitSeq: exitSeq('ok'), identity: { screen: 'direct', highlight: null, title: DIRECT } },
  { id: 'n-s1', action: 'edge', key: 's1', dir: 'down', who: ['k2', 'candidate'], pose: 1, bank: 0, exitSeq: [{ key: 's1', dir: 'down' }], expect: { halfFrom: 'k2:n-s1' } },
];

for (const step of steps) {
  step.fields = {
    subject: lit(0, 'T8c brief: 0x1e71[0] is 0 after every key'),
    bank: lit(step.bank, 'T8c Q1: saved index, linked pose ' + step.pose),
  };
}

const table = {
  task: 'T8c',
  directTitle: DIRECT,
  link: { area: 1, point: 1 },
  editorBank: { unlinked: 0, pose1: 0, pose2: 4, pose4: 2 },
  steps,
};
writeFileSync(resolve('work/out/proof-table.json'), JSON.stringify(table, null, 2) + '\n');
process.stdout.write(JSON.stringify({ steps: steps.length }) + '\n');
