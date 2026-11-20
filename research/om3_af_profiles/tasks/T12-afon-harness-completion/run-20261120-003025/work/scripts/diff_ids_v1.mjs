import { DECLARED } from '../harness/declared_v2.mjs';
import { opId } from '../harness/identity_v3.mjs';
import { table } from '../harness/table_v2.mjs';

const ids = new Set();
const add = (id) => ids.add(id);
for (const step of table.steps) {
  for (const role of step.who) {
    if (step.action === 'key') {
      add(opId(role, step, 'down'));
      add(opId(role, step, 'up'));
    } else add(opId(role, step, 'x'));
  }
}
for (const role of ['k1e', 'k2', 'candidate']) {
  add(role + '-pose-landscape');
  add(role + '-link-1db1');
  add(role + '-link-1dc1');
}
const ZONE = [
  { id: 'z0', nav: ['up'] },
  { id: 'z1', nav: ['up', 'dial'] },
  { id: 'z2', nav: ['up', 'dial'] },
  { id: 'z3', nav: ['up', 'dial'] },
  { id: 'z4', nav: ['up', 'dial'] },
  { id: 'z5', nav: ['up', 'dial'] },
];
const names = ['99a1', '84d1', '1dd1', '1dd1#2', '88b2', '5962', '9a41', '1df1'];
function nav(prefix, ops) {
  for (const op of ops) {
    if (op === 'dial') add(prefix + '-dial');
    else {
      add(prefix + '-' + op + '-down');
      add(prefix + '-' + op + '-up');
    }
  }
}
for (const zone of ZONE) {
  nav('zk1e-' + zone.id, zone.nav);
  add('zk1e-zone-' + zone.id + '-down');
  add('zk1e-zone-' + zone.id + '-up');
  add('zk1e-' + zone.id + '-s1-down');
  add('zk1e-' + zone.id + '-s1-up');
  nav('zcand-' + zone.id, zone.nav);
  add('zcand-enter-' + zone.id);
  add('zcand-zone-' + zone.id + '-down');
  add('zcand-zone-' + zone.id + '-up');
  for (const name of names) add('zcand-' + zone.id + '-set-' + name);
  add('zcand-' + zone.id + '-af-down');
  add('zcand-' + zone.id + '-af-up');
}
nav('zk1e-z6', ['up', 'dial']);
add('zk1e-zone-dismiss-0-down');
add('zk1e-zone-dismiss-0-up');
add('offer-custom');
for (let i = 0; i < 4; i++) {
  add('seek-' + i + '-down');
  add('seek-' + i + '-up');
  add('seek-' + i + '-dial');
}
for (let i = 0; i < 3; i++) {
  add('seek-ok-' + i + '-down');
  add('seek-ok-' + i + '-up');
}
add('zk1e-zone-custom-down');
add('zk1e-zone-custom-up');
add('custom-s1-down');
add('custom-s1-up');
add('zcand-enter-custom');
for (const name of names) {
  add('custom-mirror-' + name);
  add('custom-live-' + name);
}
add('custom-flag-clear');
add('zcand-custom-af-down');
add('zcand-custom-af-up');
for (const boot of ['zone-landscape', 'zone-landscape#2']) {
  add(boot);
  add(boot.replace('landscape', 'link-1db1'));
  add(boot.replace('landscape', 'link-1dc1'));
}
const declared = new Set(Object.keys(DECLARED.steps));
const missing = [...ids].filter((id) => !declared.has(id));
const extra = [...declared].filter((id) => !ids.has(id));
process.stdout.write('gen ' + ids.size + ' declared ' + declared.size + '\n');
process.stdout.write('MISSING ' + missing.join(' | ') + '\n');
process.stdout.write('EXTRA ' + extra.join(' | ') + '\n');
