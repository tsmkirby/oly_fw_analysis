# T3b decision (Opus)

**Verdict: CLOSED as PARTIAL. Accepted components carried into T3l.** Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-053817` | `run-20261119-062241-review` | REJECT: cancel failed; flag outside owned RAM; custom sizes not routed; measurement gaps; acceptance and manifest overstated |
| `run-20261119-063452` (correction; cancel amended to stock parity) | `run-20261119-071657-review` | REJECT: acceptance `ok:false` at `h1-dial` (stale zone byte); exits other than MENU and AF-ON custom-size editing untested; `FF` fallback not implemented; manifest gaps |

This was the single correction round. The loop rule forbids a third run of this brief, so T3b is closed.
T3l continues with a **different change**: exit handling and initialization inside the hook, plus a Z5
control with the flag off.

## Accepted components (confirmed by Sol)

- **Stock direct target screen** `SS_MENU_LV/ID_ST_MENU_DIRECT`.
  - The arrows open it from shooting.
  - Each key writes the change index immediately (`0x99a1[1]`, `0x5962[1]`, `0x88b2`, and `0x1dd1[0,1]`
    for size); OK and MENU commit nothing more and restore nothing.
  - Writes go through the mapped setter `0x6041937f` to the cell setter `0x60063431`.
  - Open and cancel traces start before the key and stay under the cap.
- **Stock custom-size editor: AF Target Mode Settings.** From the menu: Left to AF Target Settings, OK, five
  Down, Right, the dials, then OK.
  - OK writes `0x1dd1[0..3]`, `0x1de1` and `0x1df1` (caller return `0x604193c7`). Only C1 was measured.
  - A stock C1 screenshot of the direct screen exists.
- **Owned placement.**
  - The 55-byte mirror is at `0xa031eeb0`, the 16-byte extension follows it, and the flag is at
    `0xa031eef7`.
  - All 72 bytes `0x6031eeb0`–`0x6031eef7` are stock `FF`, absent from Z5 and inside the owned tail, beyond
    the relocated block, which ends at `0x6031eeaf`.
- **Routing.** While the flag is set, the same keys write the mirror and leave the tracked half-press cells
  unchanged.
- **MENU parity** for the tested sequence: AF-ON MENU behaves as stock MENU, with no rollback.

## Not established (carried to T3l)

- Exit handling: the harness cleared the flag, not the hook. There is no restore of the zone byte
  `0xa031e920`. Exits by OK, S1 and session end were untested, and the following normal edit failed.
- AF-ON custom-size editing, C2–C4, and `0x1df1` in the readbacks.
- First-entry initialization: the getter returns raw `FF` when the flag is set.
- Two candidate sessions, save completion read back, store comparison, reopen, and `ok:true`.
- A Z5 control with the flag off (the stock control lacks the zone byte).
- Orientation: one pose only. T7 supplies the poses.

## Q5 (entry route)

The options are unchanged. There is still no visible entry, only the session flag. Q5 goes to the owner
once T3l produces a working editor.
