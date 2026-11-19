# What the shooting screen draws

Emulator only. No storage decision and no hardware recommendation. Subject Detect is `0x1e71[0]`. `0x90a1` is not Subject Detect.

The spec sentence is unchanged: “Show the AF-ON target while AF-ON is in control.” The measured shooting screen draws the half-press frame. An AF-ON press does not repaint the corner marks.

## What is drawn

On stock K1, S-AF, TFT, state `0x108` (`SS_COMMON` / `ID_ST_CA_REQ_DISP`), the live view draws four grey corner marks, rgb `31,31,31`, each 19×21 and 111 pixels.

| state | union | png sha256 |
| --- | --- | --- |
| rest, `0x88b2` = 526 | (417, 265) 66×70 | `f29e503e88ac6c42974ab698b750d348a2b2e5cd50ed3d1cc5bc46f2cf9bfd69` |
| Small, `0x88b2` = 412 | (356, 198) 65×71 | `26002479a84b9f5cc6250b9b340ed2e48d5257906096920a707b40459dc0d276` |

Holding S1 does not move the marks. The composite planes are IMG2, OSD1, OSD2 and OSD3.

The return from the direct screen enters `GPI_DRAW_RECT` with return address `0x610f66df`. On the moved frame that return paints four colour-22, layer-1 bars: (356, 198) 65×4, (356, 202) 4×63, (356, 265) 65×4 and (417, 202) 4×63. The same return also paints the viewfinder border in colour 34. The widget that reaches the rectangle call starts at `0x610f6649` and calls `0x610f74e6` at `0x610f66da`.

## The previous positioner attribution

The previous result treated `0x609eec84` as the function that reads `0x88b2` and scales the corners. The image has `df 30 10` at `0x609eece0`, which is `ret [a2,a3],0x10`. That return sits between `0x609eec84` and the reads. The function that contains the reads starts at the next instruction, `0x609eece3`.

Those reads are still in the image, and the listings match it (`work/out/check-calls-c1.json`, `work/out/check-calls-c2.json`, 0 mismatches):

```
609eece0  ret [a2,a3],0x10
609eece3  mov A1,(0x20,sp)
609eed24  mov 0x3,D0
609eed27  call 0x609f0631          ; case 3 reads 0x84d1
609eed2d  mov 0x88b2,D0
609eed3f  call 0x60063380          ; getter, index 0, return 0x609eed46
609eed4c  mov 0x20e,D2             ; kind 2 forces position 526
```

`cd`/`dd` callers of `0x609eece3`, size-filtered, are `0x607118ed` and `0x60907dad`. `0x607118c9` is the thunk that reaches `0x607118ed`. Its callers are `0x603efa5b`, `0x61a43e59` and `0x61a49a3e`. `0x603efa50` calls `0x609eec84`, the function that returns at `0x609eece0`.

`0x6041a202` is the return of the four-byte getter thunk at `0x6041a1f9` (`exthu D0` / `exthu D1` / `call 0x60063380` / `ret [],0x4`). It is a generic getter return. In the OK window the `0x88b2` reads through that return are recorded after the colour-22 bars have already been issued.

`0x609eece3` was entered zero times during the direct-screen move, the OK repaint, the AF-ON press, and the setter call that writes `0x88b2`. The reads in that function are not on the observed redraw path.

## The path that did run

During the OK repaint the only caller of widget `0x610f6649` is `0x610eee13`. The eight bytes before that return are `48 1b 4e 10 5c 20 f0 f2`, and the image bytes at `0x610eee11` are `f0 f2`, which is `calls (A2)`. The moved-frame entry arrives with `d0` = 356 and `d1` = 198. The address `0x610f6649` is placed at `(0x3c,sp)` by `0x610f62a5`.

The coordinates consumed by that call are stack halfwords. `0x610eedee` reloads `(0x26,sp)` into `D0` and `0x610eedf1` reloads `(0x24,sp)` into `D3`, and the following instructions turn those into the width and height passed on the stack. This site does not execute `call 0x60063380` and does not name `0x88b2` or `0x5962`.

CPU watchpoints on the colour-22 corner bytes recorded 0 writes during idle, during OK, and during AF-ON. The OSD engine paints those bytes from `GPI_DRAW_RECT`. A watch count of 0 means the CPU did not store the corner pixels.

What triggers the corner paint is leaving the direct screen. That OK window issues the four colour-22 bars, and `gpiUpdateDisplay` returns at `0x610f70da`. The function there starts at `0x610f70c5`: it tests byte `0x6036faad`, calls `0x610f7b1a`, then toggles byte `0x6036faac`. An armed rest idle issued no colour-22 frame rectangle and no CPU write to the watched bytes. An AF-ON press issued no colour-22 corner rectangle. The union stayed on the OK box, (356, 198) 65×71, through the press and the release.

## Which cell drives the marks

One EMULATOR-ONLY test-setup write, and no other write: the setter `0x60063431` with key `0x88b2`, index 0, value 412. The readback is `0x88b2` = 412 and `0x5962` = [526, 526]. `0x84d1` stays 3 and `0x1e71[0]` stays 0. The marks move from (417, 265) 66×70 to (356, 198) 65×71. The cell that drives the frame is `0x88b2`.

During that setter call the getter `0x60063380` is not entered for `0x88b2`, `0x5962` or `0x84d1`, and `0x609eece3` is not entered. The 500 ms idle after the call issues no colour-22 frame rectangle, so the pixels have already changed when the setter returns. The instruction inside the setter that copies `0x88b2` into the box drawn by `0x610eee11` was not captured. The display change in item 4 was not made.

## Cross-session pixels

`work/out/scan-diff-v1.json` compares `work/out/obs-k1-v2-rest.png` with `work/out/obs-t6-v5-candidate-rest.png` inside x 280–780, y 60–520. They differ at 444 pixels. Every difference is inside (417, 265) 66×70. The stock samples are rgb 31,31,31 and the T6-rest samples are rgb 11,11,11. Those two sessions also differ in overlay, profile-read hook, mirror seed and half-press setup. No trial changed `0x84d1` alone, so this difference is not attributed to that cell.

## Controls

The seeded T6 configuration is reused, not a new change. Half-press All and the mirror seed are test setup. On AF-ON press the ten-byte becomes `[17,2,3,0,1,0,1,0,0,0]` and the owner byte becomes 2, while `0x88b2` stays 526 and the viewfinder differs from its own rest by 0 pixels.

The run previously labelled K2 used `overlay-changed-bytes-c1.csv` and did not install the T6 profile-read hook. That run is Z5 without the T6 hook. Its AF-ON ten-byte is `[14,2,2,0,1,0,1,0,0,0]`, owner 2, and its AF-ON png matches the seeded candidate.

The unseeded T6 control is experiment version 11. It uses `overlay-changed-bytes.csv` and the inherited T6 profile-read hook, and it writes no mirror seed. The mirror head is eight `0xff` bytes. Subject Detection highlight is “Subject Detection”, the texts include “Off”, and `0x1e71[0]` is 0. At rest, AF-ON press, AF-ON release, S1, S1 held with AF-ON, and the final release, the frame stays four marks at (417, 265) 66×70 and `0x88b2` stays 526. Owner is 2 while AF-ON is down and 0 after release. The hook counts rise. The ten-byte does change, because the unseeded hook returns the fallback value: AF-ON press publishes `[14,2,2,0,1,0,1,0,0,0]`. The full png hash also changes on that press. The four-mark union does not.

## The change

Version 6 proposed calling `0x609eec84` from the builder return. That entry returns at `0x609eece0`, before the reads, so the proposal does not reach the scaler. The run also aborted before `open_session` because `emu/src/lab/sim.mjs` was imported while the lab was still E143. No edge was asserted. The correction sessions set `OM_EMU_MODEL=E147` before importing `emu/src/fw/model.mjs` and assert `MODEL === 'E147'` before any key.

Item 4 is not attempted. The cell is `0x88b2`, and the paint call is `calls (A2)` at `0x610eee11`, but the read that fills that call’s coordinates from the cell was not observed. No substitute hook was installed. No byte was added in section 6 or 7.
