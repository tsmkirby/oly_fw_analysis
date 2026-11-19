// Declarative T8b correction sequence. Static. Not an experiment version.
// K1e presses the same AF-ON editor keys in normal mode. Candidates follow the T8 §2.3 order.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ALL = ['k1', 'k2', 'candidate'];
const TAIL = ['k2', 'candidate'];
const EDIT = ['k1e', 'candidate'];
const K1E = ['k1e'];
const CAND = ['candidate'];
const POSE = ['k1', 'k2', 'k1e', 'candidate'];

const actions = [];
function add(row) { actions.push(row); }

add({ id: 'ke-base', action: 'check', who: K1E, phase: 'main', measure: true, note: 'K1e factory observation before any editor key' });

add({ id: 'setup', action: 'setup', who: ALL, phase: 'main', shared: true });
add({ id: 'zone-up', action: 'key', key: 'up', who: ALL, phase: 'main', shared: true });
add({ id: 'zone-ok', action: 'key', key: 'ok', who: ALL, phase: 'main', shared: true, k2ExitFor: 'zone-ok' });

add({
  id: 'e-enter', action: 'enter', who: CAND, phase: 'main', editor: true,
  mirrorFrom: 'factory', zoneFrom: 'literal', zone: 0, flagFrom: 'on', screenFrom: 'literal', screen: 'shooting', anchor: 'zone-ok',
});
add({ id: 'e-up', action: 'key', key: 'up', who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'zone-ok', bank: 1 });
add({ id: 'e-dial', action: 'dial', dial: 'main', detents: 1, who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'zone-ok', bank: 1 });
add({ id: 'e-right', action: 'key', key: 'right', who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'zone-ok', bank: 1 });
add({
  id: 'e-ok', action: 'key', key: 'ok', who: EDIT, phase: 'main', editor: true, exit: true, k2Exit: 'zone-ok',
  mirrorFrom: 'k1e', zoneFrom: 'literal', zone: 0, flagFrom: 'off', screenFrom: 'k1e', anchor: 'zone-ok', bank: 1,
});
add({ id: 'ke-s1-down', action: 'edge', key: 's1', dir: 'down', who: K1E, phase: 'main', measure: true, note: 'K1e half-press target after the landscape edit' });
add({ id: 'ke-s1-up', action: 'edge', key: 's1', dir: 'up', who: K1E, phase: 'main', measure: true });

for (const [id, action, extra] of [
  ['n-up', 'key', { key: 'up' }],
  ['n-dial', 'dial', { dial: 'main', detents: 1 }],
  ['n-ok', 'key', { key: 'ok' }],
]) add({ id, action, ...extra, who: ALL, phase: 'main', shared: true, mirrorFrom: 'k1e-hold', hold: 'e-ok', flagFrom: 'off' });

const EDGES = [
  ['s1', 'down'], ['s1', 'up'],
  ['afon', 'down'], ['afon', 'up'],
  ['s1', 'down'], ['afon', 'down'], ['afon', 'up'], ['s1', 'up'],
  ['afon', 'down'], ['s1', 'down'], ['s1', 'up'], ['afon', 'up'],
];
const OWNED = new Set([2, 5, 8, 9, 10]);
const OWNER = [1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0];
EDGES.forEach((pair, i) => {
  add({
    id: 'edge-' + i, action: 'edge', key: pair[0], dir: pair[1],
    who: ALL, phase: 'main', shared: true, mirrorFrom: 'k1e-hold', hold: 'e-ok', flagFrom: 'off',
    edge: { owned: OWNED.has(i), owner: OWNER[i], bank: 1, targetFrom: OWNED.has(i) ? 'k1e' : 'k2', k1eStep: 'ke-s1-down' },
  });
});

add({ id: 'pose-exif6', action: 'pose', key: 'exif6', who: POSE, phase: 'main', shared: true, mirrorFrom: 'k1e-hold', hold: 'e-ok', flagFrom: 'off', bank: 5 });
add({
  id: 'p-enter', action: 'enter', who: CAND, phase: 'main', editor: true,
  mirrorFrom: 'k1e-hold', hold: 'e-ok', zoneFrom: 'literal', zone: 0, flagFrom: 'on', screenFrom: 'literal', screen: 'shooting', anchor: 'pose-exif6', bank: 5,
});
add({ id: 'p-up', action: 'key', key: 'up', who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'pose-exif6', bank: 5 });
add({ id: 'p-right', action: 'key', key: 'right', who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'pose-exif6', bank: 5 });
add({
  id: 'p-menu', action: 'key', key: 'menu', who: EDIT, phase: 'main', editor: true, exit: true, k2Exit: 'save-open',
  mirrorFrom: 'k1e', zoneFrom: 'literal', zone: 0, flagFrom: 'off', screenFrom: 'k1e', anchor: 'pose-exif6', bank: 5,
});
add({
  id: 'p-back', action: 'key', key: 'menu', who: EDIT, phase: 'main', editor: true, exit: true, k2Exit: 'save-leave-0',
  mirrorFrom: 'k1e', zoneFrom: 'literal', zone: 0, flagFrom: 'off', screenFrom: 'k1e', anchor: 'pose-exif6', bank: 5,
});
add({ id: 'ke-p-s1-down', action: 'edge', key: 's1', dir: 'down', who: K1E, phase: 'main', measure: true });
add({ id: 'ke-p-s1-up', action: 'edge', key: 's1', dir: 'up', who: K1E, phase: 'main', measure: true });

add({
  id: 'exif6-afon-down', action: 'edge', key: 'afon', dir: 'down', who: ALL, phase: 'main', shared: true,
  mirrorFrom: 'k1e-hold', hold: 'p-back', flagFrom: 'off',
  edge: { owned: true, owner: 2, bank: 5, targetFrom: 'k1e', k1eStep: 'ke-p-s1-down' },
});
add({
  id: 'exif6-afon-up', action: 'edge', key: 'afon', dir: 'up', who: ALL, phase: 'main', shared: true,
  mirrorFrom: 'k1e-hold', hold: 'p-back', flagFrom: 'off',
  edge: { owned: false, owner: 0, bank: 5, targetFrom: 'k2' },
});
add({ id: 'pose-land', action: 'pose', key: 'landscape', who: POSE, phase: 'main', shared: true, mirrorFrom: 'k1e-hold', hold: 'p-back', flagFrom: 'off', bank: 1 });
add({
  id: 'land-afon-down', action: 'edge', key: 'afon', dir: 'down', who: ALL, phase: 'main', shared: true,
  mirrorFrom: 'k1e-hold', hold: 'p-back', flagFrom: 'off',
  edge: { owned: true, owner: 2, bank: 1, targetFrom: 'k1e', k1eStep: 'ke-s1-down' },
});
add({
  id: 'land-afon-up', action: 'edge', key: 'afon', dir: 'up', who: ALL, phase: 'main', shared: true,
  mirrorFrom: 'k1e-hold', hold: 'p-back', flagFrom: 'off',
  edge: { owned: false, owner: 0, bank: 1, targetFrom: 'k2' },
});

add({
  id: 'c-enter', action: 'enter', who: CAND, phase: 'main', editor: true,
  mirrorFrom: 'k1e-hold', hold: 'p-back', zoneFrom: 'literal', zone: 0, flagFrom: 'on', screenFrom: 'literal', screen: 'shooting', anchor: 'land-afon-up', bank: 1,
});
const sizeKeys = [{ id: 'c-menu', action: 'key', key: 'menu' }];
for (let i = 0; i < 20; i++) sizeKeys.push({ id: 'c-left-' + String(i).padStart(2, '0'), action: 'key', key: 'left' });
sizeKeys.push({ id: 'c-page-ok', action: 'key', key: 'ok' });
for (let i = 0; i < 5; i++) sizeKeys.push({ id: 'c-down-' + i, action: 'key', key: 'down' });
sizeKeys.push({ id: 'c-size-right', action: 'key', key: 'right' });
add({
  who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'land-afon-up', bank: 1,
  keys: sizeKeys,
});
add({ id: 'c-size-v', action: 'dial', dial: 'main', detents: 1, who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'land-afon-up', bank: 1 });
add({ id: 'c-size-h', action: 'dial', dial: 'sub', detents: 1, who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'land-afon-up', bank: 1 });
add({
  id: 'c-size-ok', action: 'key', key: 'ok', who: EDIT, phase: 'main', editor: true, exit: true, k2Exit: 'save-subok-0',
  mirrorFrom: 'k1e', zoneFrom: 'literal', zone: 0, flagFrom: 'off', screenFrom: 'k1e', anchor: 'land-afon-up', bank: 1,
});
const back = [];
for (let i = 0; i < 20; i++) back.push({ id: 'c-right-' + String(i).padStart(2, '0'), action: 'key', key: 'right' });
add({
  who: EDIT, phase: 'main', editor: true, exit: false, mirrorFrom: 'k1e', zoneFrom: 'literal', zone: 0, flagFrom: 'off', screenFrom: 'k1e', anchor: 'land-afon-up', bank: 1,
  keys: back,
});
add({
  id: 'c-tab-leave', action: 'key', key: 'menu', who: EDIT, phase: 'main', editor: true, exit: true, k2Exit: 'save-leave-0',
  mirrorFrom: 'k1e', zoneFrom: 'literal', zone: 0, flagFrom: 'off', screenFrom: 'k1e', anchor: 'land-afon-up', bank: 1,
});
add({
  id: 'c-reenter', action: 'enter', who: CAND, phase: 'main', editor: true,
  mirrorFrom: 'k1e-hold', hold: 'c-tab-leave', zoneFrom: 'literal', zone: 0, flagFrom: 'on', screenFrom: 'literal', screen: 'shooting', anchor: 'land-afon-up',
});
add({ id: 'c-up', action: 'key', key: 'up', who: EDIT, phase: 'main', editor: true, mirrorFrom: 'k1e', zoneFrom: 'k1e', flagFrom: 'on', screenFrom: 'k1e', anchor: 'land-afon-up', bank: 1 });
add({
  id: 'c-s1', action: 'key', key: 's1', who: EDIT, phase: 'main', editor: true, exit: true, k2Exit: 'edge-0',
  mirrorFrom: 'k1e', zoneFrom: 'literal', zone: 0, flagFrom: 'off', screenFrom: 'k1e', anchor: 'land-afon-up', bank: 1,
});
add({ id: 'ke-c-s1-down', action: 'edge', key: 's1', dir: 'down', who: K1E, phase: 'main', measure: true });
add({ id: 'ke-c-s1-up', action: 'edge', key: 's1', dir: 'up', who: K1E, phase: 'main', measure: true });

for (const [id, action, extra] of [
  ['n2-up', 'key', { key: 'up' }],
  ['n2-dial', 'dial', { dial: 'main', detents: 1 }],
  ['n2-ok', 'key', { key: 'ok' }],
]) add({ id, action, ...extra, who: ALL, phase: 'main', shared: true, mirrorFrom: 'k1e-hold', hold: 'c-s1', flagFrom: 'off' });

add({
  id: 'c-afon-down', action: 'edge', key: 'afon', dir: 'down', who: ALL, phase: 'main', shared: true,
  mirrorFrom: 'k1e-hold', hold: 'c-s1', flagFrom: 'off',
  edge: { owned: true, owner: 2, bank: 1, targetFrom: 'k1e', k1eStep: 'ke-c-s1-down' },
});
add({
  id: 'c-afon-up', action: 'edge', key: 'afon', dir: 'up', who: ALL, phase: 'main', shared: true,
  mirrorFrom: 'k1e-hold', hold: 'c-s1', flagFrom: 'off',
  edge: { owned: false, owner: 0, bank: 1, targetFrom: 'k2' },
});

add({
  id: 'size-write', action: 'size-setup', who: CAND, phase: 'main', editor: true,
  mirrorFrom: 'size', hold: 'c-s1', zoneFrom: 'literal', zone: 0, flagFrom: 'off', screenFrom: 'literal', screen: 'shooting', anchor: 'n2-ok',
});
add({
  id: 'size-afon-down', action: 'edge', key: 'afon', dir: 'down', who: ALL, phase: 'main', shared: true,
  mirrorFrom: 'size', hold: 'c-s1', flagFrom: 'off',
  edge: { owned: true, owner: 2, bank: 1, targetFrom: 'sized', k1eStep: 'ke-c-s1-down' },
});
add({
  id: 'size-afon-up', action: 'edge', key: 'afon', dir: 'up', who: ALL, phase: 'main', shared: true,
  mirrorFrom: 'size', hold: 'c-s1', flagFrom: 'off',
  edge: { owned: false, owner: 0, bank: 1, targetFrom: 'k2' },
});

const saveHead = [{ id: 'save-open', action: 'key', key: 'menu' }];
for (let i = 0; i < 20; i++) saveHead.push({ id: 'save-left-' + String(i).padStart(2, '0'), action: 'key', key: 'left', assertAfTab: i === 19 });
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
add({ who: ALL, phase: 'main', shared: true, mirrorFrom: 'size', hold: 'c-s1', flagFrom: 'off', keys: saveHead });
add({
  who: TAIL, phase: 'main', shared: true, k1Skip: true, mirrorFrom: 'size', hold: 'c-s1', flagFrom: 'off',
  keys: [
    { id: 'save-before-commit', action: 'check', assertRow: true },
    { id: 'save-commit-open', action: 'key', key: 'ok', commitStart: true },
    { id: 'save-commit-right', action: 'key', key: 'right' },
    { id: 'save-commit-ok', action: 'key', key: 'ok' },
    { id: 'save-leave-0', action: 'key', key: 'menu' },
    { id: 'save-leave-1', action: 'key', key: 'menu', saveJudge: true },
  ],
});

add({
  id: 'reopen-base', action: 'check', who: ALL, phase: 'reopen',
  mirrorFrom: 'ff', zoneFrom: 'literal', zone: 0, flagFrom: 'k2', screenFrom: 'k2', anchor: 'reopen-base',
});
add({
  id: 'reopen-afon-down', action: 'edge', key: 'afon', dir: 'down', who: ALL, phase: 'reopen',
  mirrorFrom: 'ff', zoneFrom: 'literal', zone: 0, flagFrom: 'k2', screenFrom: 'k2', anchor: 'reopen-afon-down',
  edge: { owned: true, owner: 2, bank: 1, targetFrom: 'factory-all' },
});
add({
  id: 'reopen-afon-up', action: 'edge', key: 'afon', dir: 'up', who: ALL, phase: 'reopen',
  mirrorFrom: 'ff', zoneFrom: 'literal', zone: 0, flagFrom: 'k2', screenFrom: 'k2', anchor: 'reopen-afon-up',
  edge: { owned: false, owner: 0, bank: 1, targetFrom: 'k2' },
});
add({
  id: 'reopen-enter', action: 'enter', who: CAND, phase: 'reopen', editor: true,
  mirrorFrom: 'factory', zoneFrom: 'literal', zone: 0, flagFrom: 'on', screenFrom: 'literal', screen: 'shooting', anchor: 'reopen-afon-up',
});

const sequence = {
  task: 'T8b',
  note: 'Correction sequence. Candidate mirror after each AF-ON editor key is K1e half-press cells packed by lib_map_c1. AF-ON owned targets are K1e halfTarget after the same edits. Landscape consumer bank 1, EXIF 6 consumer bank 5.',
  afTabHeader: 'bb086a5b20fe141fc7db882c015fb47fa34bccd9d86ab709799ef8bb8324225c',
  afTabTitle: '2.AF',
  actions,
};
writeFileSync(resolve('work/out/sequence-c1.json'), JSON.stringify(sequence, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: true, actions: actions.length }) + '\n');
