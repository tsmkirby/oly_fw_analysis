// Writes the declarative T8b sequence. Static. Not an experiment version.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function u16(m, off, v) { m[off] = v & 255; m[off + 1] = (v >> 8) & 255; }
function copy(m) { return m.slice(); }
function target(pos, kind, size, vw, hw) {
  return [pos & 255, (pos >> 8) & 255, kind, size, vw, 0, hw, 0, 0, 0];
}

const open = Array(55).fill(0);
open[1] = 1;
for (const off of [10, 14, 16, 18, 20]) u16(open, off, 526);
u16(open, 12, 994);
u16(open, 34, 994);
open[22] = 1;
open[23] = 1;
open[37] = 1;

const small = copy(open);
small[1] = 2;
small[37] = 2;

const exifUp = copy(small);
exifUp[5] = 1;
u16(exifUp, 20, 994);
exifUp[41] = 1;

const exif = copy(exifUp);
u16(exif, 20, 997);

const seeded = copy(exif);
seeded[24] = 3;
seeded[25] = 3;

const c1dims = copy(seeded);
c1dims[24] = 5;
c1dims[25] = 7;

const enabled = copy(c1dims);
for (let i = 0; i < 11; i++) enabled[44 + i] = 1;

const c1 = copy(enabled);
c1[1] = 6;
c1[37] = 6;

const sized = copy(c1);
sized[8] = 4;

const zeros = Array(55).fill(0);
const ff = Array(55).fill(255);

const profiles = { open, small, exifUp, exif, seeded, c1dims, enabled, c1, sized, zeros, ff };
const targets = {
  small: target(994, 3, 0, 1, 1),
  exif: target(997, 0, 0, 1, 1),
  c1: target(994, 7, 0, 5, 7),
  sized: target(994, 7, 4, 5, 7),
  all: target(526, 2, 0, 1, 1),
  stock: [14, 2, 2, 0, 27, 0, 39, 0, 0, 0],
};

const ALL = ['k1', 'k2', 'candidate'];
const TAIL = ['k2', 'candidate'];
const CAND = ['candidate'];
const EDGES = [
  ['s1', 'down'], ['s1', 'up'],
  ['afon', 'down'], ['afon', 'up'],
  ['s1', 'down'], ['afon', 'down'], ['afon', 'up'], ['s1', 'up'],
  ['afon', 'down'], ['s1', 'down'], ['s1', 'up'], ['afon', 'up'],
];
const OWNED = new Set([2, 5, 8, 9, 10]);
const OWNER = [1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0];

const actions = [];
function add(row) { actions.push(row); }

add({ id: 'setup', action: 'setup', who: ALL, phase: 'main', editor: false, shared: true, mirror: 'k2' });
add({ id: 'zone-up', action: 'key', key: 'up', who: ALL, phase: 'main', editor: false, shared: true, mirror: 'k2' });
add({ id: 'zone-ok', action: 'key', key: 'ok', who: ALL, phase: 'main', editor: false, shared: true, mirror: 'k2' });

add({ id: 'e-enter', action: 'enter', who: CAND, phase: 'main', editor: true, mirror: 'zeros', zone: 0, flag: 1, screen: 'shooting', anchor: 'zone-ok' });
add({ id: 'e-up', action: 'key', key: 'up', who: CAND, phase: 'main', editor: true, mirror: 'open', zone: 1, flag: 1, screen: 'direct', anchor: 'zone-ok' });
add({ id: 'e-dial', action: 'dial', dial: 'main', detents: 1, who: CAND, phase: 'main', editor: true, mirror: 'small', zone: 2, flag: 1, screen: 'direct', anchor: 'zone-ok' });
add({ id: 'e-ok', action: 'key', key: 'ok', who: CAND, phase: 'main', editor: true, mirror: 'small', zone: 0, flag: 0, screen: 'shooting', anchor: 'zone-ok' });

for (const [id, action, extra] of [
  ['n-up', 'key', { key: 'up' }],
  ['n-dial', 'dial', { dial: 'main', detents: 1 }],
  ['n-ok', 'key', { key: 'ok' }],
]) add({ id, action, ...extra, who: ALL, phase: 'main', editor: false, shared: true, mirror: 'small' });

EDGES.forEach((pair, i) => {
  add({
    id: 'edge-' + i, action: 'edge', key: pair[0], dir: pair[1],
    who: ALL, phase: 'main', editor: false, shared: true, mirror: 'small',
    edge: { owned: OWNED.has(i), target: 'small', owner: OWNER[i] },
  });
});

add({ id: 'pose-exif6', action: 'pose', key: 'exif6', who: ALL, phase: 'main', editor: false, shared: true, mirror: 'small' });
add({ id: 'p-enter', action: 'enter', who: CAND, phase: 'main', editor: true, mirror: 'small', zone: 0, flag: 1, screen: 'shooting', anchor: 'pose-exif6' });
add({ id: 'p-up', action: 'key', key: 'up', who: CAND, phase: 'main', editor: true, mirror: 'exifUp', zone: 0, flag: 1, screen: 'direct', anchor: 'pose-exif6' });
add({ id: 'p-right', action: 'key', key: 'right', who: CAND, phase: 'main', editor: true, mirror: 'exif', zone: 0, flag: 1, screen: 'direct', anchor: 'pose-exif6' });
add({ id: 'p-menu', action: 'key', key: 'menu', who: CAND, phase: 'main', editor: true, mirror: 'exif', zone: 0, flag: 0, screen: 'menu', anchor: 'pose-exif6' });
add({ id: 'p-back', action: 'key', key: 'menu', who: CAND, phase: 'main', editor: true, mirror: 'exif', zone: 0, flag: 0, screen: 'shooting', anchor: 'pose-exif6' });

add({
  id: 'exif6-afon-down', action: 'edge', key: 'afon', dir: 'down',
  who: ALL, phase: 'main', editor: false, shared: true, mirror: 'exif',
  edge: { owned: true, target: 'exif', owner: 2 },
});
add({
  id: 'exif6-afon-up', action: 'edge', key: 'afon', dir: 'up',
  who: ALL, phase: 'main', editor: false, shared: true, mirror: 'exif',
  edge: { owned: false, target: 'exif', owner: 0 },
});
add({ id: 'pose-land', action: 'pose', key: 'landscape', who: ALL, phase: 'main', editor: false, shared: true, mirror: 'exif' });
add({
  id: 'land-afon-down', action: 'edge', key: 'afon', dir: 'down',
  who: ALL, phase: 'main', editor: false, shared: true, mirror: 'exif',
  edge: { owned: true, target: 'small', owner: 2 },
});
add({
  id: 'land-afon-up', action: 'edge', key: 'afon', dir: 'up',
  who: ALL, phase: 'main', editor: false, shared: true, mirror: 'exif',
  edge: { owned: false, target: 'small', owner: 0 },
});

add({ id: 'c-enter', action: 'enter', who: CAND, phase: 'main', editor: true, mirror: 'exif', zone: 0, flag: 1, screen: 'shooting', anchor: 'land-afon-up' });
const sizeKeys = [{ id: 'c-menu', action: 'key', key: 'menu', titleFrom: 'save-open' }];
for (let i = 0; i < 16; i++) {
  const id = 'c-left-' + String(i).padStart(2, '0');
  sizeKeys.push({ id, action: 'key', key: 'left', titleFrom: 'save-left-' + String(i).padStart(2, '0') });
}
sizeKeys.push({ id: 'c-page-ok', action: 'key', key: 'ok', titleFrom: 'save-open' });
for (let i = 0; i < 5; i++) sizeKeys.push({ id: 'c-down-' + i, action: 'key', key: 'down', titleFrom: 'save-open' });
sizeKeys.push({ id: 'c-size-right', action: 'key', key: 'right', titleFrom: 'save-open' });
add({
  who: CAND, phase: 'main', editor: true, mirror: 'exif', zone: 0, flag: 1, screen: 'menu', anchor: 'land-afon-up',
  keys: sizeKeys,
});
add({ id: 'c-seed', action: 'seed-c1', who: CAND, phase: 'main', editor: true, mirror: 'seeded', zone: 0, flag: 1, screen: 'menu', anchor: 'land-afon-up', titleFrom: 'save-open' });
add({ id: 'c-size-v', action: 'dial', dial: 'main', detents: 1, who: CAND, phase: 'main', editor: true, mirror: 'seeded', zone: 0, flag: 1, screen: 'menu', anchor: 'land-afon-up', titleFrom: 'save-open' });
add({ id: 'c-size-h0', action: 'dial', dial: 'sub', detents: -1, who: CAND, phase: 'main', editor: true, mirror: 'seeded', zone: 0, flag: 1, screen: 'menu', anchor: 'land-afon-up', titleFrom: 'save-open' });
add({ id: 'c-size-h1', action: 'dial', dial: 'sub', detents: -1, who: CAND, phase: 'main', editor: true, mirror: 'seeded', zone: 0, flag: 1, screen: 'menu', anchor: 'land-afon-up', titleFrom: 'save-open' });
add({ id: 'c-size-ok', action: 'key', key: 'ok', who: CAND, phase: 'main', editor: true, mirror: 'c1dims', zone: 0, flag: 0, screen: 'menu', anchor: 'land-afon-up', titleFrom: 'save-open' });
const back = [];
for (let i = 0; i < 16; i++) back.push({ id: 'c-right-' + String(i).padStart(2, '0'), action: 'key', key: 'right' });
add({ who: CAND, phase: 'main', editor: true, mirror: 'c1dims', zone: 0, flag: 0, screen: 'menu', anchor: 'land-afon-up', titleFrom: 'save-open', keys: back });
add({ id: 'c-tab-leave', action: 'key', key: 'menu', who: CAND, phase: 'main', editor: true, mirror: 'c1dims', zone: 0, flag: 0, screen: 'shooting', anchor: 'land-afon-up' });

add({ id: 'c-reenter', action: 'enter', who: CAND, phase: 'main', editor: true, mirror: 'c1dims', zone: 0, flag: 1, screen: 'shooting', anchor: 'land-afon-up' });
add({ id: 'c-enable', action: 'enable-custom', who: CAND, phase: 'main', editor: true, mirror: 'enabled', zone: 0, flag: 1, screen: 'shooting', anchor: 'land-afon-up' });
add({ id: 'c-up', action: 'key', key: 'up', who: CAND, phase: 'main', editor: true, mirror: 'enabled', zone: 2, flag: 1, screen: 'direct', anchor: 'land-afon-up' });
for (let i = 0; i < 4; i++) {
  add({
    id: 'c-dial-' + i, action: 'dial', dial: 'main', detents: 1,
    who: CAND, phase: 'main', editor: true, mirror: 'c1', zone: 6, flag: 1, screen: 'direct', anchor: 'land-afon-up',
  });
}
add({ id: 'c-s1', action: 'key', key: 's1', who: CAND, phase: 'main', editor: true, mirror: 'c1', zone: 0, flag: 0, screen: 'shooting', anchor: 'land-afon-up' });

for (const [id, action, extra] of [
  ['n2-up', 'key', { key: 'up' }],
  ['n2-dial', 'dial', { dial: 'main', detents: 1 }],
  ['n2-ok', 'key', { key: 'ok' }],
]) add({ id, action, ...extra, who: ALL, phase: 'main', editor: false, shared: true, mirror: 'c1' });

add({
  id: 'c-afon-down', action: 'edge', key: 'afon', dir: 'down',
  who: ALL, phase: 'main', editor: false, shared: true, mirror: 'c1',
  edge: { owned: true, target: 'c1', owner: 2 },
});
add({
  id: 'c-afon-up', action: 'edge', key: 'afon', dir: 'up',
  who: ALL, phase: 'main', editor: false, shared: true, mirror: 'c1',
  edge: { owned: false, target: 'c1', owner: 0 },
});

add({ id: 'size-write', action: 'size-setup', who: CAND, phase: 'main', editor: true, mirror: 'sized', zone: 0, flag: 0, screen: 'shooting', anchor: 'n2-ok' });
add({
  id: 'size-afon-down', action: 'edge', key: 'afon', dir: 'down',
  who: ALL, phase: 'main', editor: false, shared: true, mirror: 'sized',
  edge: { owned: true, target: 'sized', owner: 2 },
});
add({
  id: 'size-afon-up', action: 'edge', key: 'afon', dir: 'up',
  who: ALL, phase: 'main', editor: false, shared: true, mirror: 'sized',
  edge: { owned: false, target: 'sized', owner: 0 },
});

const saveHead = [{ id: 'save-open', action: 'key', key: 'menu' }];
for (let i = 0; i < 20; i++) {
  saveHead.push({ id: 'save-left-' + String(i).padStart(2, '0'), action: 'key', key: 'left', assertAfTab: i === 19 });
}
saveHead.push(
  { id: 'save-down-0', action: 'key', key: 'down' },
  { id: 'save-down-1', action: 'key', key: 'down' },
  { id: 'save-ok-0', action: 'key', key: 'ok' },
  { id: 'save-subok-0', action: 'key', key: 'ok' },
  { id: 'save-submenu-0', action: 'key', key: 'menu' },
  { id: 'save-subdown-0', action: 'key', key: 'down' },
  { id: 'save-subok-1', action: 'key', key: 'ok' },
  { id: 'save-submenu-1', action: 'key', key: 'menu' },
  { id: 'save-subdown-1', action: 'key', key: 'down' },
);
add({ who: ALL, phase: 'main', editor: false, shared: true, mirror: 'sized', keys: saveHead });
add({
  who: TAIL, phase: 'main', editor: false, shared: true, mirror: 'sized', k1Skip: true,
  keys: [
    { id: 'save-before-commit', action: 'check', assertRow: true },
    { id: 'save-commit-open', action: 'key', key: 'ok', commitStart: true },
    { id: 'save-commit-right', action: 'key', key: 'right' },
    { id: 'save-commit-ok', action: 'key', key: 'ok' },
    { id: 'save-leave-0', action: 'key', key: 'menu' },
    { id: 'save-leave-1', action: 'key', key: 'menu', saveJudge: true },
  ],
});

add({ id: 'reopen-base', action: 'check', who: ALL, phase: 'reopen', editor: false, shared: false, mirror: 'ff', zone: 0, flag: 255, screenFrom: 'k2', anchor: 'reopen-base' });
add({
  id: 'reopen-afon-down', action: 'edge', key: 'afon', dir: 'down',
  who: ALL, phase: 'reopen', editor: false, mirror: 'ff', zone: 0, flag: 255, screenFrom: 'k2', anchor: 'reopen-afon-down',
  edge: { owned: true, target: 'all', owner: 2 },
});
add({
  id: 'reopen-afon-up', action: 'edge', key: 'afon', dir: 'up',
  who: ALL, phase: 'reopen', editor: false, mirror: 'ff', zone: 0, flag: 255, screenFrom: 'k2', anchor: 'reopen-afon-up',
  edge: { owned: false, target: 'k2', owner: 0 },
});
add({ id: 'reopen-enter', action: 'enter', who: CAND, phase: 'reopen', editor: true, mirror: 'zeros', zone: 0, flag: 1, screen: 'shooting', anchor: 'reopen-afon-up' });

const sequence = {
  task: 'T8b',
  note: 'One declarative action per key, edge, pose, entry, or labelled test-setup write. Profiles hold the 55 mirror bytes. Bank 1 position 994 is the measured AF-ON Up. Bank 5 position 997 is one Right after that snap. C1 [5,7] is the size-editor result from a 3x3 start: one main detent and two negative sub detents. Size byte 4 is a labelled test-setup write.',
  afTabHeader: 'bb086a5b20fe141fc7db882c015fb47fa34bccd9d86ab709799ef8bb8324225c',
  afTabTitle: '2.AF',
  bank1Position: 994,
  bank5Position: 997,
  c1Dimensions: [5, 7],
  sizeByte: 4,
  profiles,
  targets,
  actions,
};
writeFileSync(resolve('work/out/sequence.json'), JSON.stringify(sequence, null, 2) + '\n');
const keyCount = actions.reduce((n, a) => n + (a.keys ? a.keys.length : 1), 0);
process.stdout.write(JSON.stringify({ ok: true, actions: actions.length, keys: keyCount }) + '\n');
