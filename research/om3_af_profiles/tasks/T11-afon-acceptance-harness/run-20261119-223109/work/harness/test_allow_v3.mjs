import { compareState } from './compare_v3.mjs';
import { assertClean } from './static_check_v7.mjs';

const stock = [14, 2, 2, 0, 27, 0, 39, 0, 0, 0];
const before = {
  slots: [], mirror71: [], flag: 0, target: stock, halfTarget: stock, owner: 0, subject: 0, frame: null,
};
const after = { ...before, owner: 1 };
const expect = {
  named: { subject: 0, owner: 1 },
  hold: ['slots', 'mirror71', 'flag', 'frame'],
  seal: ['target', 'halfTarget'],
  slotExcept: [],
};
const rejected = compareState(before, after, expect);
const accepted = compareState(before, after, { ...expect, allowStale: true });
if (!rejected.some((item) => item.startsWith('stale'))) {
  process.stderr.write('default seal did not reject the centre record\n');
  process.exit(1);
}
if (accepted.some((item) => item.startsWith('stale'))) {
  process.stderr.write('reference capture rejected the centre record\n');
  process.exit(1);
}
assertClean();
process.stdout.write('allow-stale ok\n');
