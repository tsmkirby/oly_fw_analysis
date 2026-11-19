# What the shooting screen draws

Emulator only. No storage decision and no hardware recommendation. Subject Detect stays off: `0x1e71[0]` read back 0. `0x90a1` is not Subject Detect.

The spec sentences are unchanged. “Show the AF-ON target while AF-ON is in control.” “Update the displayed AF target to reflect the active profile.” On the seeded T6 configuration and on the unseeded T6 control, an AF-ON press changes the ten-byte target and the owner to 2. The corner-mark union stays on the half-press frame. The requirement is not met. No display change was installed: the writer of the pixel fields was not identified.

## What is drawn

Stock K1, S-AF, model E147. Four grey corner marks. Writing key `0x88b2` index 0 to 412, and leaving `0x5962` at 526, moves that union during the following idle. The same-session screenshots are `work/out/obs-trace-v6-stock-rest.png` and `work/out/obs-trace-v6-stock-after.png`.

| state | cell `0x88b2` | union | png sha256 |
| --- | --- | --- | --- |
| rest | 526 | (417, 265) 66×70 | `9f9f70d370fa55efdb72ecc21b80760c393d659be2b64873c1f5c0ac9c0effa6` |
| after the write and 500 ms idle | 412 | (356, 198) 65×71 | `d3b40303be068a76582e3de81c76237f81f2102bbc8482bbe80f1b4264c636a4` |

The rest hash and the moved hash match the version-9 screenshots of the previous task. A screenshot taken before the idle, in version 3, still showed (417, 265). The move is not inside the setter call.

## Where the cell is written

`(0x8050)` is 0 on this screen, so setter `0x60063431` takes the direct store. The call at `0x600634e6` enters `0x600634ee`. The halfword store at `0x60063534` writes 412 to cached `0x629526c0` and the uncached alias `0xa29526c0`. The byte store at `0x6006355e` writes 1 to `0xa32bfb32`. The queued path `0x60063116` and the callback `0x600630a3` are not entered. This is a direct store of the cell. It is not a registered callback and it is not a copy of a pixel rectangle.

## What the idle reads

During the idle that moves the marks, the only read of `0x629526c0` is the halfword load at `0x60063a5e`, value 412. That load is the unsigned-half arm of `0x60063a20`. The getter `0x60063380` calls it at `0x6006339a`. In the same idle the getter is entered with key `0x88b2` and the return address `0x6041a202`. That address is the `ret [],0x4` of the four-byte thunk at `0x6041a1f9`, which the previous task already identified as a generic getter return. It does not name one display writer. The thunk was entered 1998 times in the 500 ms idle.

The paint reload at `0x610eedee` also runs in that idle, six times, from caller return `0x610ef4db`, object `0x62bb6cd8`. The coordinates are (123, 554) and (4, 110). None is 356 or 198. `GPI_DRAW_RECT` issued no colour-22 frame bar in the call, the idle, or the screenshot. The corner marks still moved. The stack slot reloaded at `0x610eedee` is filled by `movhu D0,(0x26,sp)` at `0x610eedcb` in the same function. That fill was observed, and it is not the AF corner-mark geometry.

## Invalidation

The setter does not write `0x6036faad`. That flag is already 1 before the write. During the idle, `0x610f70c5` runs, `0x610f70eb` stores 0, and `0x610f7172` (in `0x610f7106`) stores 1. The dirty byte `0xa32bfb32` was not read during that idle.

## AF-ON

Seeded T6, mirror Small at 529, and unseeded T6. Both use the T6 overlay and the inherited profile-read hook. No new display hook.

| session | owner after AF-ON down | ten-byte target | cell | union |
| --- | --- | --- | --- | --- |
| seeded | 2 | `11 02 03 00 01 00 01 00 00 00` (position 529) | 526 | (417, 265) 66×70 |
| unseeded | 2 | `14 02 02 00 01 00 01 00 00 00` (position 532) | 526 | (417, 265) 66×70 |

Both presses enter the getter for key `0x88b2` (return addresses `0x609b3cd0` and `0x6041a202`) and run the flag writer `0x610f7172`. The frame union does not move. The AF-ON png hash is `02c5a7eac3e923b9d19b0ccf13a526e391841fb6cb6d7c05cef51c98c0cf2c73` for both sessions, which is not the rest hash. The union measurement does not say the pixels are unchanged.

The T6 overlay has 3262 rows. Sections computed from `0x60029b28`: 1 = 1308, 2 = 95, 4 = 1856, 7 = 3. The only section-7 addresses are `0x610bf5e3`–`0x610bf5e5`. No section 6.
