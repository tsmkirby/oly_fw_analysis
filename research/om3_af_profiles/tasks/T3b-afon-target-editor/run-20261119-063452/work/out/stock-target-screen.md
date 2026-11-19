# Stock AF target selection screen

Measured on the stock OM-3 image in OM-Emu. No overlay and no UI-input harness. The screen is `SS_MENU_LV/ID_ST_MENU_DIRECT`. `s.screen()` reports `direct`. The graphic label is the zone name (All, Single, Small, C1). The text layer is empty, so a text-layer read throws; the frame is still the screen.

## Routes that open it

From shooting, the four arrow keys open it. In `work/out/stock-probe-m1.jsonl`:

| key | step | screen |
| --- | --- | --- |
| up | open-up | direct |
| down | open-up-down | direct |
| left | open-up-left | direct |
| right | open-up-right | direct |

OK does not open it. `open-ok` is `SS_MENU_LV/ID_ST_MENU_DTL_SCP`, title "Color Profile 1". info, the joystick press, delete, the AF/metering key, and the LV key do not open it from shooting. The joystick does not move the target once the screen is open (`stock-edit-m2`).

The menu page "6.AF Target Settings & Operations" is a different editor. Sixteen Left presses from the main menu land on it. OK on "AF Target Mode Settings" writes the half-press zone and also AF Home `0x9fa1`. That page is not this screen.

## What one edit writes

A blank session, before any key (`stock-probe-m1.jsonl` baseline and `stock-edit-m2.jsonl` baseline):

| cell | value |
| --- | --- |
| `0x99a1` | `[2, 0, 2, 0, 2, 0, 5, 5]` |
| `0x9a41` | `[0, 1]` |
| `0x5962` | six cells, each 526 |
| `0x1dd1` | `[27, 39, 3, 3, 3, 3, 3, 3, 3, 3]` |
| `0x84d1` | 2 |
| `0x88b2` | 526 |
| `0x90d1` | `[2, 2, 2, 2, 2, 2, 5, 5]` |
| `0x5a11` | `[1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1]` |
| `0x99d2` | `[526, 526, 526]` |
| `0xdfa1` | 0 |
| `0x9fa1` | `[0, 0, 0]` |
| `0x1db1` / `0x1dc1` | 0 / 0 |
| `0xe91` index 3 | 0 |
| `0x90a1` | `[1, 1]` |

The screen edits the change index, index 1, not the saved index 0. `0x99a1[0]` stayed 2 through the direct-screen edit in `stock-edit-m2`.

Main dial, one detent, from All (`stock-probe-m1.jsonl` `open-up-dial-main`): `0x99a1[1]` 0 to 1, `0x1dd1[0]` 27 to 1, `0x1dd1[1]` 39 to 1, `0x84d1` 2 to 0, `0x90d1[1]` 2 to 1. `0x9a41` does not change. The sub dial steps the type the other way (`open-up-dial-sub` returned to All).

With customs off, the dial offers All (0), Single (1), Small (2), Cross (3), Mid (5), Large (10), then wraps. C1–C4 (6–9) are skipped. Current size follows the type: All 27×39, Single 1×1, Small 3×3, Cross 7×9, Mid stays 7×9, Large 11×15.

Arrow Right on a movable zone writes `0x5962[1]` and `0x88b2` by +3 (526, then 529, 532, 535 in `stock-edit-m2`). All does not move. Up, used to reopen Single, moved 535 to 418: the same key both opens the screen and moves. OK returns to shooting and does not copy index 1 into index 0 (`confirm-ok` diff is only an unrelated `0x5a21` write). MENU leaves to the main menu and does not restore the change indices.

`0x99d2` and `0xdfa1` do not change on this screen. `0x9fa1` changed only when the menu-page OK ran, not on the direct screen.

The value is A1 of the cell setter. `work/scripts/show_a1_m2.py` on `stock-edit-m2.jsonl`: Single is key `0x99a1` index 1, A1 `0x1`; the move is key `0x5962` index 1, A1 `0x211` (529). D0 of the mapped setter `0x6041937f` is the UI id (1333 zone, 40 area, 1657 and 1658 sizes, 1339 position, 85 frame, 1873 the save-area mirror). Its caller return is `0x6041937c`.

## Orientation

On open the screen reads `0x1db1` and `0x1dc1` (`open-up` getter list). Both are 0, and orientation-linked AF is off, so the screen uses the normal bank: zone indices 0 and 1, position indices 0 and 1. It does not select the CCW bank (indices 2 and 3) or the CW bank (indices 4 and 5).

`switch_input('rotate', 1)` and `switch_input('monitor', 0)` leave `0xe91` index 3 at 0 (`stock-probe-m1.jsonl` steps `rotate-1` and `monitor-0`, and `accept-e3` session `store-stock` step `rotate`). The emulator did not supply a second pose. No second orientation was run.

## Functions entered

The names are in the image at `work/out/static-keys-m1.txt`:

- `AF_Target_Actuator` methods, `0x61505433` through `0x615058d5`, including `initialize_direct_af_0` at `0x615056d6` (`AF_Target_Actuator.cpp`) and `up_direct_af` at `0x6150581e`.
- `Plural_AF_Target_Actuator` methods, `0x615a8bee` through `0x615a8fa4`: `invidual_act_direct_af`, `invidual_act_af_target_type_change`, `invidual_act_af_pos_change`, the four diagonal moves, `main_dial_direct_af_target_type_change`, `sub_dial_direct_af_target_type_change`.

Those are the strings. The executed accessors, checked against the image by `work/scripts/check_listings_e3.py` (188 instructions, no mismatch):

- Read: cell getter `0x60063380`. D0 is the key, D1 is the index, A0 is 0 on the lab call. The observed return site `0x6041a202` is the `ret` at the start of `work/out/disasm-wrap-m2.txt`, so the call that uses the getter returns there.
- Write: mapped setter `0x6041937f` saves D1 in A2 and D0 in D2 (`disasm-mapped-m2.txt`), calls `0x60419446` and `0x60419696`, then at `0x604193bf` moves A2 to A1 and at `0x604193c0` calls the cell setter `0x60063431` (`disasm-setcall-m2.txt`). The cell setter takes the value in A1, the index in D1, and the key in D0 (`disasm-cellset-m2.txt`). A second caller of the cell setter, `0x6041987e`, shows up for other keys; the target-cell caller in this trace is `0x604193c7`, the return address of that call.

## Screenshots

- Movable zone, Small, after a move: `work/out/route-e1-02-afon-dial.png`. The stock Single frame is `work/out/stock-m1-011-open-up-dial-main.png`.
- Custom zone, C1: `work/out/route-e1-08-afon-type-3.png`. Stock `0x5a11` skips types 6–9, so this frame is from the AF-ON session whose mirror offers every `0x5a11` slot. The same screen chrome and the same setter path produce it.

C1's step is one column and one row (`custom-e2` `c1-info-right` 427 to 428, `c1-info-up` 428 to 389, and 428 − 39 = 389). INFO on C1 changes no cell. The dial changes the type, and the current size (`0x1dd1` index 0 and 1) becomes the custom preset (`0x1dd1` index 2 and 3). This screen does not write the preset slots.

## Correction measurements

`stock-gaps-f2` is the stock session for the gaps. The trace starts before the key. The unique-target cap is 20000 and was not hit.

| step | screen after | unique calls | cap hit | cell diff |
| --- | --- | --- | --- | --- |
| open-up | direct, zone 0 | 1938 | no | none |
| cancel-menu | menu, zone stays 1 | 2657 | no | none. MENU does not restore the change index |
| c1-right | menu, the size editor | 1289 | no | none. Opening the editor does not write |
| size-ok | menu | 1616 | no | `0x1dd1[0]` 3→5, `[1]` 3→1, `[2]` 3→5, `[3]` 3→1 |

The size editor is the menu page AF Target Mode Settings. From the main menu, Left until the text layer contains "AF Target Settings" (16 Left presses in this run), OK, five Down presses, Right. The main dial changes the vertical size and the sub dial the horizontal size. The cells stay unchanged until OK. OK goes through the cell setter `0x60063431`, caller return `0x604193c7`, and also writes `0x1de1` indices 0 and 1 and `0x1df1` indices 0 and 4 (`work/out/cmd/22.out`). `accept-f3` control step `size-ok` repeated the `[5, 1]` custom result and `0x1df1[4] = 1`.

With `0x5a11[0]` through `[10]` set to 1 through the native setter, the direct-screen dial from zone 1 visits 2, 3, 5, 10, then 6. Zone 6 is C1, current size 3×3. The stock frame is `work/out/stock-gaps-f2-11-custom-direct-hold.png`. The title band hashes, top 16 percent and the centre 56 percent of the width, are All `012041e4f3a3879914a8681e55a7ee206f7fe4c1e998177ba0a6f72520bb9d16`, Single `42a83c79ead5126577e529b063c94c43e6d6d7a3177476b1be78a8c12c09b1a7`, C1 `b1b61046dadf4ac4716b1a9fc70a79d4b2a75e46c1373f6eb46707a54a314794`.

Routes. Arrows open the direct screen. OK opens the color-profile page. info, joystick, delete, afmeter, and lvkey were pressed and stayed on shooting. ael, bkt, and lock are not usefully wired on this lab board. creative_dial and still_movie are wired: creative_dial 1 puts up "Please rotate the creative dial" and the next Up stays on shooting (`stock-gaps-f1`), and still_movie changes the current size. Neither is an entry to this screen.

`stock-gaps-f1` is the run that hit the creative-dial prompt. Its size-editor discovery still stands: Right on C1 opens the editor and OK writes `0x1dd1[2]`. The open-up trace in that run is not a direct-screen trace.

One orientation only. `0xe91` index 3 stays 0. Rotate and monitor-closed do not change the pose, and the E147 model has no accelerometer.
