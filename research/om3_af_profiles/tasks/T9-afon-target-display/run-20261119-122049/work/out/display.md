# What the shooting screen draws

Emulator only. No storage decision and no hardware recommendation. Subject Detect is `0x1e71[0]`. `0x90a1` is not Subject Detect.

The spec sentence is unchanged: “Show the AF-ON target while AF-ON is in control.” The measured shooting screen does not do that under the T6 configuration. It draws the half-press presentation.

## What is drawn

On stock K1, S-AF, TFT, state `0x108` (`SS_COMMON` / `ID_ST_CA_REQ_DISP`), the live view draws four grey corner marks, rgb `31,31,31`, each 19×21 and 111 pixels.

| state | union | png sha256 |
| --- | --- | --- |
| rest, `0x88b2` = 526 | (417, 265) 66×70 | `f29e503e88ac6c42974ab698b750d348a2b2e5cd50ed3d1cc5bc46f2cf9bfd69` |
| Small, `0x88b2` = 412 | (356, 198) 65×71 | `26002479a84b9f5cc6250b9b340ed2e48d5257906096920a707b40459dc0d276` |

The rest union hash is `fd4b6b218f0c70418579f88159fc15f5a4455cd481d6ad1249748bdedbe0ac97`. The moved union hash is `338e83c790a0e67dcf7cc6578372128d968d466e9c8fee0a6b24f8a8fe87e690`. Holding S1 does not move the marks: the Small S1 shot has the same union box. The composite planes are IMG2, OSD1, OSD2 and OSD3.

During the return from the direct screen, `GPI_DRAW_RECT` is entered with return address `0x610f66df` and draws a 4×63 rectangle at (356, 202), colour index 22, layer 1, and a second 4×63 rectangle at (417, 202). That return address also paints the left information bar, so it is a shared rectangle entry, not a dedicated frame function. The widget that reaches it starts at `0x610f6649` and calls `0x610f74e6` at `0x610f66da`.

After the half-press kind `0x84d1` is set to 2 (All), those 444 grey pixels are background rgb `11,11,11`. The difference is exactly the rest union (417, 265) 66×70. No other viewfinder pixel in x 280–780, y 60–520 changes (`work/out/scan-diff-v1.json`).

## Where the position comes from

The routine that reads the live grid position and scales it is the function entered at `0x609eec84`. There is no `ret` between that entry and the reads below. Two callers: the thunk at `0x603efa50` (`call 0x609eec84` / `ret`) and `0x61a43e3f`.

Bounded listing, checked against `inputs/00_0100_50000020.decoded.bin` with 0 mismatches (`work/out/check-listing-v1.json`, `work/out/check-listing-v2.json`):

```
609eed24  mov 0x3,D0
609eed27  call 0x609f0631          ; case 3 reads 0x84d1
609eed2c  mov D0,D3
609eed2d  mov 0x88b2,D0
609eed38  mov 0x88b2,D0
609eed3e  clr D1
609eed3f  call 0x60063380          ; getter, index 0
609eed46  mov D0,D2
609eed48  cmp 2,D3
609eed4c  mov 0x20e,D2             ; kind 2 forces position 526
```

Case 3 of `0x609f0631` is `0x609f06a1`: `mov 0x84d1,D0` / `clr D1` / `call 0x60063380`. The jump table at `0x60a83854` points entry 3 there.

`0x609eff7e` is not the painter. It passes key `0x88b2` to `0x60063356` and stores the returned address at `0xa33f377c`.

The positioner does not read the ten-byte record at `0xa33ca384`. It does not read `0x5962`, `0x99a1`, `0x9a41` or `0x1dd1` at this site. Kind 2, which is All, forces grid position 526.

On stock K1 the corners move with `0x88b2` and with `0x5962[0]`. They do not move with the ten-byte record, which stayed `[14,2,2,0,27,0,39,0,0,0]` (All, 27×39, position 526) while `0x88b2` went from 526 to 412. `0x5962[1]` stayed 526. The direct-screen dial wrote zone index 0, and index 1 stayed 0. Dirty byte `0xa33f2cea` stayed 1, so this session did not show the stock writer `0x609b3c79` refreshing that record.

The OK-window trace did not enter `0x609eed46`. The getter calls in that window were the editor wrapper `0x6041a202`, reading `0x99a1`, `0x88b2` and `0x1dd1`. The identification of `0x609eec84` as the source of the coordinates is the listing plus the pixel movement with `0x88b2`. It is not a captured entry of that function during the move.

## T6 configuration

Reused, not a new change. Half-press All and the mirror seed (Small at 529) are test setup. Candidate and K2, at AF-ON press:

| | ten-byte `0xa33ca384` | owner `0xa031ed00+4` | `0x88b2` | viewfinder pixels vs its own rest |
| --- | --- | --- | --- | --- |
| candidate | `[17,2,3,0,1,0,1,0,0,0]` Small at 529 | 2 | 526 | 0 differences |
| K2 | `[14,2,2,0,1,0,1,0,0,0]` All at 526 | 2 | 526 | 0 differences |

The two AF-ON screens are the same png, sha256 `809889a2b07b9ea60d623a40ff8572979d2b3150cb455fcc5fe99a3cc48d4a88`. The same equality holds at rest, release, S1, and S1 held with AF-ON. `0x1e71[0]` read back 0, and the Subject Detection row showed Off. The positioner entry was not reached during those armed edges. The displayed frame does not follow the AF-ON target.

## The change

Version 6 is the one intended change: while the home builder’s record is the one being published, the positioner’s getter reads of `0x84d1` and `0x88b2` would return that record’s kind and position, and the builder `ret` at `0x60a8f7d2` would call `0x609eec84` so the frame is redrawn. It is labelled EMULATOR-ONLY in `work/scripts/obs_t6_v6.mjs`. It adds no image byte.

That run aborted before `open_session`. Importing `emu/src/lab/sim.mjs` before `runZone` set `OM_EMU_MODEL` cached the lab as E143, and the session hasher then missed the E147 image. No edge was asserted. This was experiment version 6, so it was not run again. The change is not an observed result.
