# Build hook_t8c.mjs from the accepted T8b hook, changing only bank().
# Static. The generated file is what runs. Do not edit the generated file after it runs.
from pathlib import Path
src = Path('ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/accept_t8b_c1.mjs').read_text(encoding='utf-8')
start = src.index('function installCombined(')
end = src.index('async function installWitness')
fn = src[start:end]
old = """  const bank = () => {
    if (!(link.area === 1 && link.pos === 1)) return 1;
    const pose = l.sim.u32(POSE) >>> 0;
    if (pose === 2) return 5;
    if (pose === 4) return 3;
    return 1;
  };"""
new = """  const bank = () => {
    // Stock direct screen, T8c Q1: saved index. Linked pose word 2 -> 4,
    // pose word 4 -> 2, otherwise 0. Not linked -> 0.
    if (!(link.area === 1 && link.pos === 1)) return 0;
    const pose = l.sim.u32(POSE) >>> 0;
    if (pose === 2) return 4;
    if (pose === 4) return 2;
    return 0;
  };"""
if old not in fn:
    raise SystemExit('bank function not found')
fn = fn.replace(old, new, 1)
fn = fn.replace(
    "'EMULATOR-ONLY combined profile read and editor routing. Role: behaviour.'",
    "'EMULATOR-ONLY profile read. The bank is the saved index the stock editor writes. Role: behaviour.'",
    1,
)
header = """// T8c combined hook. Accepted T6 read and T3m restore.
// The one behaviour change is bank(): the saved index the stock direct screen writes.
// initMirror is unchanged. Q2 reset values are the values it already writes.
// EMULATOR-ONLY. Role: behaviour. Do not edit after this runs.
import { FACTORY_HALF, factorySlots } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';

const GETTER = 0x60063380;
const SETTER = 0x60063431;
const EDITOR_COPY = 0x6119af02;
const GLOBAL_POS = 0x60379d64;
const SHADOW_POS = 0x62953c10;
const SIZE_REC = 0x62954108;
const SIZE_N = 72;
const RECORD = 16;
const SHADOW_N = 4;
const OBJECT_OFF = 0x42;
const MODE = 0xa031eef7;
const MODE_CACHED = 0x6031eef7;
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const EXT = 0xa031eeb0;
const EXT_CACHED = 0x6031eeb0;
const DIRECT = 0x0405;
const MENU = 0x0b02;
const POSE = 0xa32c568c;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
const LAYOUT = {
  0x99a1: { off: 0x00, n: 8, width: 1 },
  0x9a41: { off: 0x08, n: 2, width: 1 },
  0x5962: { off: 0x0a, n: 6, width: 2 },
  0x1dd1: { off: 0x16, n: 10, width: 1 },
  0x84d1: { off: 0x20, n: 1, width: 1 },
  0x88b2: { off: 0x22, n: 1, width: 2 },
  0x90d1: { off: 0x24, n: 8, width: 1 },
  0x5a11: { off: 0x2c, n: 11, width: 1 },
  0x1de1: { off: 0x37, n: 8, width: 1 },
  0x1df1: { off: 0x3f, n: 8, width: 1 },
};
const FACTORY = factorySlots();
function callSaved(ctx, fn) {
  const saved = ctx.l.sim.registers();
  try { return fn(); }
  finally { ctx.l.sim.reset(saved); }
}
function readGetter(ctx, key, index) {
  return callSaved(ctx, () => ctx.l.call(ctx.native(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
}
function setKey(ctx, key, index, value) {
  callSaved(ctx, () => ctx.l.call(ctx.native(SETTER), { d0: key, d1: index, a1: value }, null, null, 200000));
}
export { FACTORY_HALF, GETTER, SETTER, MODE, EXT, POSE, LAYOUT, readGetter, setKey };
export """
Path('work/scripts/hook_t8c.mjs').write_text(header + fn, encoding='utf-8')
print('hook bytes', Path('work/scripts/hook_t8c.mjs').stat().st_size)
