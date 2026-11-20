# What the shooting screen draws

Emulator only. No storage decision and no hardware recommendation. Subject Detect is `0x1e71[0]`, and it read 0 on every recorded shot. No image byte was written.

The spec sentences are unchanged. “Show the AF-ON target while AF-ON is in control.” “Update the displayed AF target to reflect the active profile.”

## Superseded T9c sentences

These sentences in the T9c display note are superseded by the measurements below.

- The T9c sentence that `0x6041935b` returns a size for key `0x1dd1`, and a kind for key `0x84d1`, is superseded. The writer window presents `0x1dd1` at `0x6041a1fb`. It never presents `0x84d1`. The kind branch is absent from this hook.
- The T9c profile B, zone 6 at position 540 with an empty band, is superseded. Profile B is Single at position 529. The reference frame is four 8×9 marks.
- The T9c bound of 666.73128 ms is superseded. This run’s bound is 599.60794 ms: the measured stock setter latency 283.60794 ms plus the measured idle period 316 ms.
- The fitted minus-6 sentence remains a hypothesis about three sampled words. It was not used to choose a frame. Expected frames are the hashed K1e and K2 screenshots.

## The frame function

`0x61184dd6` saves the object and reaches the writer `0x61184e51` through the call at `0x61184e30`. The two `0x610cd5ac` checks gate that call. The producer that schedules `calls (A2)` at `0x610c8b66` is not named. The refresh criterion is the measured bound above.

The object the writer uses is `0x62c54158`. On every sweep trial, at position 529, object+`0x364` read 523 when the writer was entered. Object+`0x374` at that same entry is the mode word for the zone that was just set. At the function entry the mode can still be the previous trial’s mode. The instruction that stores the new mode was not captured.

The pointer the size switch reads is formed inside the writer. `0x61184e90` adds `0x34c` to the object and stores it at `(0x58,sp)`. `0x61184f0b` copies that pointer, adds `0x28`, and stores it at `(0x5c,sp)`. That address is object+`0x374`. `0x6118522e` reads it and branches on the mode.

The jump table at `0x61470350` sends mode 1 to `0x61185213`, modes 2, 3 and 5–10 to the size switch `0x6118522e`, mode 4 to `0x6118558f`, and mode 11 to `0x61184c21`. Mode 0 goes to `0x61185d6c`. The sweep did not produce mode 0 or mode 11.

## Size constants

Checked against the image, 474 listed instructions, zero mismatches. The size switch stores these constants:

- Mode 2: `mov 0x3,D0` at `0x61185253`, then both slots.
- Mode 3: `mov 0x1,D0` at `0x61185257`, then both slots.
- Mode 5: `mov 0x9,D0` at `0x6118525f` and `mov 0x7,D0` at `0x61185263`.
- Mode 6: `mov 0xf,D0` at `0x61185267` and `mov 0xb,D0` at `0x6118526b`.
- Modes 7–10: `call 0x60b8696a` at `0x6118526f` and `0x61185285`, then `calls (A2)` with `D0=0x67a` (`0x61185280`) and `D0=0x679` (`0x61185296`).

In the writer window those `0x67a` and `0x679` calls arrive at the settings getter as key `0x1dd1`, indices 0 and 1. The return address on every getter call in that window is `0x6041a202`, which is the return from `call 0x60063380` at `0x6041a1fb`. The outer site `0x6041935b` is `call 0x6041a1f9`. The trace cannot see past that shared return, and it never shows key `0x84d1`.

Keys seen on every zone, all at `0x6041a202`: `0x6721` index 0 returns 0, `0x8551` index 0 returns 0, `0x5681` index 0 returns 2, `0x3081` index 0 returns 1, `0xc321` index 0 returns 0, and `0x1dd1` indices 0 and 1 return the size cells. `0x5681` stays 2 on every zone, so it is not the mode word. Modes 1–6 read `0x1dd1` once per index. Modes 7–10 read it three times per index.

Cross and Single both had `0x1dd1` returning 1 and 1, and their marks are 19×21 and 8×9. The glyph size for modes 2 and 3 follows the immediates. Custom mode 7, with `0x1dd1` returning 9 and 11, draws a different frame from C1’s 5 and 7. That is the size input for modes 7–10.

## Which zones draw marks

Stock K1e, landscape, position 529, one emulator version. Every counted grey pixel in these frames is rgb 31. All, zone 0, mode 1, draws no mark. The other ten trials draw marks:

| Trial | Zone | Mode | Marks | Pixels |
| --- | --- | --- | --- | --- |
| Single | 1 | 3 | four 8×9 | 168 |
| Small | 2 | 2 | four 19×21 | 444 |
| Cross | 3 | 4 | eight 19×21 | 888 |
| Mid | 5 | 5 | four 19×21 | 444 |
| Large | 10 | 6 | two 19×21 | 222 |
| C1 | 6 | 7 | four 19×21 | 444 |
| C2, C3, C4 | 7, 8, 9 | 8, 9, 10 | one 34×38 | 272 |
| Custom | 6 | 7 | clipped, size cells 9 and 11 | 300 |

C3 and C4 match C2 because indices 0 and 1 of `0x1dd1` were 0. The custom marks meet the detector window at x=280, so that frame was kept as evidence and was not used as a reference. Rectangles, colours and hashes are in `work/out/sweep-summary.json`. The pngs were hashed during that version, before any candidate.

## The one change

While the owner byte at `0xa031ed04` is 2, two calls return the AF-ON profile from the mirror. `0x6041935b` returns the saved-bank position for key `0x88b2` and the saved-bank zone for key `0x99a1` index 0. `0x6041a1fb` returns the mirror size byte at `mirror+0x16+index` for key `0x1dd1` and an index of 0 through 9. A mirror byte `0xFF`, or a position `0xFFFF`, is left to the stock call. Owner 0 and owner 1 pass through. The kind branch is not installed.

The saved bank is the T8c index. Linked `0x1db1[0]==1` and `0x1dc1[0]==1`: pose word 2 selects bank 4, pose word 4 selects bank 2, and any other pose, including landscape pose 1, selects bank 0. The reused T6 reader still uses the change index, so landscape selects reader bank 1. The seed writes the same zone and position into bank 0 and bank 1. The reader itself is unchanged. Half-press All, cell `0x88b2` = 526, is test setup.

## What the later runs matched

The bound is 599.60794 ms. An edge whose reference frame differs from the previous edge’s reference must show a change inside that bound. An edge whose reference frame does not differ must keep the frame that was on screen, through the same window.

K1e profile A is Small, zone 2, position 529: (356, 265), (402, 265), (356, 314), (402, 314), each 19×21, 444 rgb-31 pixels. Hash `c3d3c00bfd28a2b95aca5997a0d4962bbc8165b4321d59a2122c5be085fc1e25`.

K1e profile B is Single, zone 1, position 529: (376, 287), (393, 287), (376, 304), (393, 304), each 8×9, 168 rgb-31 pixels. Hash `5513c70292058bf07648a3eb239433330d57c06e0e595be8f15157c9e6492c43`.

Full K2 is the T6 overlay, the T6 reader, and this same display hook, with the mirror left at `0xFF`. All twelve edges keep an empty band, the All ten-byte, and the owner list `[1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0]`. The hook substitutes nothing. Those frames are `ref:K2:<edge>`.

Seeded A, owner 2, matches the Small reference and the Small ten-byte `[0x11, 0x02, 0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00]`. Seeded B, owner 2, matches the Single reference and the Single ten-byte `[0x11, 0x02, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00]`. Owner 0 and owner 1 match the K2 frame for that edge and the All ten-byte. The cell stays 526. Each session ends `ok:true`. Position substitutions 16, zone 16, size 6, on both seeded runs.

Stock K1, with no overlay and no hook, keeps the centre marks (417, 265), (464, 265), (417, 314), (464, 314), each 19×21, the stock ten-byte, and owner 255, on all twelve edges.
