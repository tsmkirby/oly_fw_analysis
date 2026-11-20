// Hash the K1e sweep frames that the candidate runs will use.
// No emulator. Do not edit after it has run.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const summary = JSON.parse(readFileSync(resolve('work/out/sweep-summary.json'), 'utf8'));
const byId = Object.fromEntries(summary.trials.map((t) => [t.id, t]));
const boundMs = summary.maxLatencyMs + summary.idlePeriodMs;

function ref(id, profile, roleNote) {
  const t = byId[id];
  const file = resolve('work/out/sweep-' + id + '.png');
  const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (sha256 !== t.sha256) throw new Error('hash drift ' + id);
  return {
    profile, role: 'K1e', version: 1,
    zone: t.zone, position: summary.position,
    idlePeriodMs: summary.idlePeriodMs,
    stockLatencyMs: summary.maxLatencyMs,
    latencySource: 'setter-to-first-frame-change, maximum across the K1e sweep',
    boundMs,
    criterion: 'The producer of 0x610c8b66 is not named. The bound is the measured stock setter latency plus one measured idle period.',
    frame: { marks: t.marks, pixels: t.pixels, n31: t.n31, sha256, file: 'work/out/sweep-' + id + '.png' },
    note: roleNote,
  };
}

const a = ref('small', 'A', 'Small, zone 2, position 529. Four 19 by 21 marks.');
const b = ref('single', 'B', 'Single, zone 1, position 529. Four 8 by 9 marks.');
writeFileSync(resolve('work/out/ref-k1e-a.json'), JSON.stringify(a, null, 2) + '\n');
writeFileSync(resolve('work/out/ref-k1e-b.json'), JSON.stringify(b, null, 2) + '\n');
process.stdout.write(JSON.stringify({ boundMs, a: a.frame.sha256, b: b.frame.sha256 }) + '\n');
