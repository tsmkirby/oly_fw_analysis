import { LAYOUT as MAP } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { compareState } from '../harness/compare_v4.mjs';
import { DECLARED } from '../harness/declared_v2.mjs';
import { setupExpect } from '../harness/expect_v3.mjs';
import { CONSUMER, EXT, HALF_TARGET, LIVE, MODE, captureState } from '../harness/state_v1.mjs';

const mem = new Map();
function put(addr, bytes) {
  for (let i = 0; i < bytes.length; i++) mem.set((addr + i) >>> 0, bytes[i] & 255);
}
const half = DECLARED.setup.half;
for (const row of MAP) {
  const live = LIVE[row.key];
  const cells = half[live.name];
  for (let i = 0; i < row.n; i++) {
    if (live.w === 2) {
      const v = cells[i] & 0xffff;
      put(live.addr + i * 2, [v & 255, (v >> 8) & 255]);
    } else put(live.addr + i, [cells[i] & 255]);
  }
}
put(MODE, [DECLARED.setup.flag & 255]);
put(CONSUMER, DECLARED.setup.target);
put(HALF_TARGET, DECLARED.setup.halfTarget);
put(EXT, new Array(71).fill(3));
function read(addr, size) {
  const out = new Uint8Array(size);
  for (let i = 0; i < size; i++) out[i] = mem.get((addr + i) >>> 0) || 0;
  return out;
}
const ctx = {
  readOwn() { return [0, 0, 0, 0, DECLARED.setup.owner]; },
  s: { screen() { return 'shooting'; } },
  l: { sim: { read }, call() { return { d0: 0 }; } },
};
ctx.l.sim.registers = () => ({});
ctx.l.sim.reset = () => {};
ctx.l.sim.u32 = (addr) => {
  const b = read(addr, 4);
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
};
const frame = { boxes: [], pixels: 0, n31: 0, sha256: 'a' };
const actual = captureState(ctx, () => 0, frame);
const before = captureState(ctx, () => 0, frame);
const problems = compareState(before, actual, setupExpect());
process.stdout.write(JSON.stringify({ problems, slots: actual.slots.length, owner: actual.owner, flag: actual.flag, subject: actual.subject }) + '\n');
if (problems.length) process.exitCode = 1;
