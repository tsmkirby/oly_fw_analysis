// Read the v1b trace. No emulator run.
import { readFileSync } from 'node:fs';
const hex = (n) => '0x' + (n >>> 0).toString(16);
const steps = readFileSync('work/out/persist-v1b.jsonl', 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
for (const row of steps) {
  if (!row.interest) continue;
  const changed = row.changed || [];
  const mirror = row.mirror || {};
  const touched = mirror.k1dd1 && mirror.k1dd1.some((v) => v !== 255);
  if (!changed.length && !touched && !(row.saves > 2)) continue;
  console.log(JSON.stringify({
    session: row.session, id: row.id, flag: row.flag, screen: row.screen,
    saves: row.saves, exits: row.exits, changed, interest: row.interest,
    live: row.live, mirror, eventFrom: row.eventFrom, eventTo: row.eventTo,
  }));
}
const events = readFileSync('work/out/persist-v1b-events.jsonl', 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
const writes = events.filter((e) => e.dir === 'w' || e.dir === 'set' || e.dir === 'nand');
console.log('--- writes/sets/nand ' + writes.length + ' of ' + events.length);
for (const e of writes) {
  const row = {
    session: e.session, n: e.n, step: e.step, dir: e.dir, flag: e.flag,
  };
  if (e.addr !== undefined) row.addr = hex(e.addr);
  if (e.pc !== undefined) row.pc = hex(e.pc);
  if (e.caller !== undefined) row.caller = hex(e.caller);
  if (e.value !== undefined) row.value = e.value;
  if (e.watch) row.watch = e.watch;
  if (e.key !== undefined) row.key = hex(e.key);
  if (e.index !== undefined) row.index = e.index;
  if (e.routed !== undefined) row.routed = e.routed;
  if (e.size !== undefined) row.size = e.size;
  console.log(JSON.stringify(row));
}
