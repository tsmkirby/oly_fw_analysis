import { stepExpect } from '../harness/expect_v2.mjs';
import { judge, judgeDown, RESET } from '../harness/judge_v2.mjs';
import { table } from '../harness/table_v2.mjs';

const half = {};
for (const name of Object.keys(RESET)) half[name] = RESET[name].slice();
const row = () => ({
  half, mirror: Array(55).fill(1), mirror71: Array(71).fill(1),
  target: Array(10).fill(1), halfTarget: Array(10).fill(1),
  owner: 0, flag: 0, subject: 0, edge: { status: 0, enabled: 1 },
  bank: 0, halfBank: { zone: 2, pos: 526 }, sizeRecord: Array(72).fill(0),
  slots: Array.from({ length: 63 }, () => ({ key: 1, index: 0, value: 1 })),
  poseWord: 1, readCount: 1, readBank: 0, screen: 'shooting',
});
const recorded = { k1e: {}, k2: {}, candidate: {} };
const order = table.steps.map((step) => step.id);
for (const role of ['k1e', 'k2', 'candidate']) {
  for (const step of table.steps) {
    if (!step.who.includes(role)) continue;
    const phases = step.action === 'key' ? ['down', 'up'] : [step.action === 'edge' ? step.dir : step.action];
    for (const phase of phases) {
      try {
        const expect = stepExpect(step, phase, role, recorded);
        if (!expect.named || !expect.hold) throw new Error('empty');
        const actual = row();
        actual.poseWord = step.pose;
        actual.bank = step.bank;
        if (phase === 'down' && step.action === 'key') judgeDown(role, step, actual, recorded, order);
        else judge(role, step, actual, recorded, order);
      } catch (error) {
        process.stderr.write(role + ' ' + step.id + ' ' + phase + ' ' + (error && error.message) + '\n');
        process.exit(1);
      }
    }
    recorded[role][step.id] = row();
    if (step.action === 'key') recorded[role][step.id + '-down'] = row();
  }
}
process.stdout.write('preflight ok\n');
