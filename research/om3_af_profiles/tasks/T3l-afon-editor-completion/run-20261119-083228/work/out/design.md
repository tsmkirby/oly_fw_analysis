# AF-ON editor: native sites, exit handling, initialization

Emulator only. The Z5 overlay is unchanged: 3262 rows, sections 1 (1308), 2 (95), 4 (1856), and the three inherited section-7 bytes `0x610bf5e3`–`0x610bf5e5`. No new menu row. Values stay in RAM.

SCP Subject Detect is `MODE_SUBJECT_DETECT`, key `0x1e71[0]`. On stock and on Z5 the native getter reads 0. The stock 2.AF row "Subject Detection" shows Off (`work/out/entry-m3-detect-22-detect-row.png`). The model names 0 OFF. It was read and not set. `0x90a1` is the page-27 per-button priority, not Subject Detect.

## Native sites

- Settings getter `0x60063380`. Settings setter `0x60063431`.
- The custom-size OK writes through the cell setter whose return is `0x604193c7`.
- GUI state log: the lab's `STATE_LOG`, the E147 port of `0x5124BA59`. The old state is in `a0` and the new state is in `a1` (`fact('state_log.regs')`).
- Direct screen `0x0405` `SS_MENU_LV/ID_ST_MENU_DIRECT`. Menu `0x0b02` `SS_MENU/ID_ST_MENU`. Shooting `0x0108`. Playback from the direct screen lands on state 261, `0x0105` `SS_COMMON/ID_ST_WARNING`. The frame text is "One Moment" (`work/out/exit-l6.jsonl`, `play-exit`). That frame is not a proven no-picture warning.
- Flag `0xa031eef7`, cached alias `0x6031eef7`. Value 1 is AF-ON mode. `0` and `0xFF` are off. The image byte is `0xFF`.
- Zone byte `0xa031e920`, cached alias `0x6031e920`. The Z5 image byte is 0. K1 reads `0xFF` because that byte is not in the stock image as a live zone.
- Mirror base `0xa031eeb0`. Layout in `work/out/profile-layout.md`.
- ShutDown entry from `fact('power.off').shutdown.entry`: disassembly `0x50B12B11` (`work/out/import-inventory-l6.json`). The hook observes it. No session read the flag after that call. Under this task's camapp mode (native transactions), `power_down` does not reach its last write: `startShutDown` waits on TRA 586 for an HLS answer the lab does not create, and the 10000 ms deadline in `power.mjs` fires first (`work/out/accept-m4.jsonl` and `work/out/accept-m5.jsonl`, id `save`).

The getter and setter routing is the routing already accepted for this flag. While the flag is 1, a layout key is answered from the mirror and a write of `0x99a1` index 0 or 1 also stores the low byte in both zone aliases. Any other flag value passes the call through.

## Exit handling

One behaviour change. The hook clears the flag and restores the zone byte. The harness never writes the flag back to 0.

The zone value to restore is the zone byte at the moment the flag is already 1 and the first getter or setter runs, taken before that setter stores a new `0x99a1` value into the zone byte. In the exit-proof sessions that snapshot is 0. It is 0 because the Z5 image byte is 0 and a normal edit does not write the zone byte, so K2 still holds 0 after the same dials. Restoring that snapshot puts the candidate's zone byte back where K2's is. The AF-ON selection stays in the mirror. `entry_m3.mjs` also restored a snapshot that was 4.

The hook is a wrap of the state log, after the existing observer has run:

- A transition whose old state is `0x0405` and whose new state is not `0x0405` is an exit from the direct screen. A transition that stays on `0x0405` is not an exit. Opening the screen (`0x0108` to `0x0201` to `0x0405`) is not an exit.
- The custom-size editor never leaves `0x0b02`. Right's release event `0x900b` marks it open. OK's commit `0x900d`, or MENU `0x900e`, while that mark is set, is the exit. The setter writes land before that state-log call, so the clear happens after the mirror write.

Observed exits, each with the hook's reason:

| Exit | Event | Hook reason | Lands on | Following normal edit |
| --- | --- | --- | --- | --- |
| OK | `0x900d` | `direct-900d` | shooting `0x0108` | matches K1 and K2 |
| MENU | `0x900e` | `direct-900e` | menu `0x0b02`, then MENU returns to shooting | matches K1 and K2 |
| S1 | `0x972b` | `direct-972b` | shooting `0x0108` | matches K1 and K2 |
| Custom-size OK, C1 and C2 | `0x900d` | `size-900d` | stays on menu `0x0b02` | matches K1 and K2 |
| Playback | `0x972b` | `direct-972b` | state 261, `0x0105`, frame text "One Moment" | not reached |
| Session end | shutDown `0x50B12B11` | not called to completion | | not run |

Playback uses the same event id as S1 and a different destination. The hook treats both as leaving `0x0405`. The OK, MENU, and S1 rows are the earlier `exit_l4` result. The correction-round acceptance that repeats them with the new entry did not finish (`work/out/accept-m6.jsonl`).

One non-zero snapshot was restored. In `entry_m3.mjs` the zone byte was 4 before entry. Up published zone 1. OK restored zone 4, flag 0, reason `direct-900d` (`work/out/cmd/20.out`, `snap-ok`).

## Initialization

EMULATOR-ONLY. One change, in `work/scripts/entry_m1.mjs` and copied unchanged into `entry_m2.mjs`, `entry_m3.mjs`, and the acceptance runners. On the first getter or setter after the flag becomes 1, each mirror byte that is still `0xFF`, and each mirror word that is still `0xFFFF`, is written to the descriptor default 0. Nothing else is copied. The harness does not write the half-press into the mirror and does not clear the flag. The exit hook is the inherited l6 hook, not a new change.

`entry_m3.mjs` (command 20, `ok:true`) showed:

- An all-`FF` mirror becomes all zeros. The following Up still draws. The title-band hash is Single `42a83c79ead5126577e529b063c94c43e6d6d7a3177476b1be78a8c12c09b1a7`, and the setter publishes zone 1. Descriptor 0 is All, and the stock Up on that zero mirror writes Single and moves the position. A further main-dial detent while `0x5a11` is still zeros writes nothing (`entry_m2.mjs`).
- A mixed mirror keeps the bytes that were not `FF` and zeroes the rest.
- C1, then exit, then C2: both slot groups stay in the mirror. From zero custom slots the landing is `0x1dd1` 1 and 33, `0x1de1` 5 and 8, and the matching `0x1df1` byte 1. The half-press, including `0x1df1[8]`, stays at its boot value.
- The mirror after that first Up (type 1, position 994, size 1×1) is still that mirror after one normal half-press edit and after the next entry.

Half-press invariance in these runs means the asserted LIVE cells, including all nine `0x1df1` bytes. Live `0x9a41` is the one descriptor byte. The mirror's second `0x9a41` byte has no descriptor. It does not mean every settings cell in the camera is isolated from the profile.
