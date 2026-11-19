# AF-ON editor: native sites, exit handling, initialization

Emulator only. The Z5 overlay is unchanged: 3262 rows, sections 1 (1308), 2 (95), 4 (1856), and the three inherited section-7 bytes `0x610bf5e3`–`0x610bf5e5`. No new menu row. Subject Detect stays off. Values stay in RAM.

## Native sites

- Settings getter `0x60063380`. Settings setter `0x60063431`.
- The custom-size OK writes through the cell setter whose return is `0x604193c7`.
- GUI state log: the lab's `STATE_LOG`, the E147 port of `0x5124BA59`. The old state is in `a0` and the new state is in `a1` (`fact('state_log.regs')`).
- Direct screen `0x0405` `SS_MENU_LV/ID_ST_MENU_DIRECT`. Menu `0x0b02` `SS_MENU/ID_ST_MENU`. Shooting `0x0108`. The no-picture warning is `0x0105` `SS_COMMON/ID_ST_WARNING`.
- Flag `0xa031eef7`, cached alias `0x6031eef7`. Value 1 is AF-ON mode. `0` and `0xFF` are off. The image byte is `0xFF`.
- Zone byte `0xa031e920`, cached alias `0x6031e920`. The Z5 image byte is 0. K1 reads `0xFF` because that byte is not in the stock image as a live zone.
- Mirror base `0xa031eeb0`. Layout in `work/out/profile-layout.md`.
- ShutDown entry from `fact('power.off').shutdown.entry`: disassembly `0x50B12B11` (`work/out/import-inventory-l6.json`). The hook observes it. No session in this task reached the call.

The getter and setter routing is the routing already accepted for this flag. While the flag is 1, a layout key is answered from the mirror and a write of `0x99a1` index 0 or 1 also stores the low byte in both zone aliases. Any other flag value passes the call through.

## Exit handling

One behaviour change. The hook clears the flag and restores the zone byte. The harness never writes the flag back to 0.

The zone value to restore is the zone byte at the moment the flag is already 1 and the first getter or setter runs, taken before that setter stores a new `0x99a1` value into the zone byte. In these sessions that snapshot is 0. It is 0 because the Z5 image byte is 0 and a normal edit does not write the zone byte, so K2 still holds 0 after the same dials. Restoring that snapshot puts the candidate's zone byte back where K2's is. The AF-ON selection stays in the mirror. During the edit the zone byte follows the AF-ON selection (observed 1, then 2, then 3); after the exit it is 0 again.

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
| Playback | `0x972b` | `direct-972b` | `0x0105` warning | not reached |
| Session end | shutDown `0x50B12B11` | not called | | not run |

Playback uses the same event id as S1 and a different destination. The hook treats both as leaving `0x0405`.

## Initialization

The second behaviour change is in `work/scripts/exit_l6.mjs` and did not run. The playback recovery stopped the script before any session with the change enabled.

The change, as written: on the first getter or setter after the flag becomes 1, each mirror byte that is `0xFF` (or each word that is `0xFFFF`) is set to the descriptor default, which is 0. The zone byte is not part of that fill. The zone-type default remains 0 because `0x99a1` initialises to zeros, which is All. The layout's extra `0x9a41` index, which has no descriptor byte, would also become 0. Leaving the editor clears the latch so the next entry initialises only bytes that are still `0xFF`.

The exit-proof sessions do not use this. They copy the current half-press into the mirror after raising the flag, so the stock screen opens on the session's current zone. That copy is harness setup. It also means a later entry replaces the mirror with the half-press, so the C1 bytes and the C2 bytes were proven on separate entries rather than held in one mirror together.
