# Native change list

The prototype adds no image byte. `work/out/overlay-changed-bytes.csv` is the Z5 overlay, 3262 rows, with a section column added by `work/scripts/section_rows_e1.py`. The only section 6 or 7 rows are the three inherited call-site bytes `0x610bf5e3`–`0x610bf5e5`, marked "section 7, EMULATOR-ONLY runtime call-site patch (inherited central-edge)". Their native placement stays a T4 question. `work/out/section-rows-e1.json` is `ok: true`.

The one combined change is a runtime hook, EMULATOR-ONLY, role behaviour. While `0xa031eef7` is 1:

- cell getter `0x60063380` returns the mirror byte or halfword for a key in the layout, and passes every other key through;
- cell setter `0x60063431` stores A1 into that slot and passes every other key through. A `0x99a1` write of index 0 or 1 also stores the low byte at `0xa031e920` and `0x6031e920`.

Both hooks return without running the stock function. The flag is set by the session, not by a menu row. When the flag is not 1, both hooks pass through, so a normal edit writes the half-press cells and does not write the mirror.

## Sites a native build has to branch

The branch is the pair the trace actually uses.

1. `0x60063380`, the cell getter. D0 is the key, D1 is the index. The direct screen's reads return through `0x6041a202`. A native build returns the profile slot instead of the half-press slot when the AF-ON editor is active and the key is one of `0x99a1`, `0x9a41`, `0x5962`, `0x1dd1`, `0x84d1`, `0x88b2`, `0x90d1`, `0x5a11`, `0x1de1`, `0x1df1`.

2. `0x60063431`, the cell setter. D0 is the key, D1 is the index, A1 is the value. The direct screen reaches it from the mapped setter `0x6041937f` (UI id in D0, value in D1 on entry, saved to A2, then A1 for the call at `0x604193c0`). The UI ids observed for this screen are 1333 (`0x99a1` index 1), 1873 (`0x90d1` index 1), 40 (`0x84d1`), 1657 and 1658 (`0x1dd1` index 0 and 1), 1339 (`0x5962` index 1), and 85 (`0x88b2`). A native build can branch at `0x6041937f` for those UI ids, or at `0x60063431` for the keys. The prototype branches at the getter and the setter, because that pair covers the read and the write with the value already in A1. Z5 already hooks `0x6041937f` for UI id `0x3D6F` only. This hook does not replace that hook. It passes every key that is not in the layout, including whatever `0x3D6F` later stores through the cell setter.

The mode test is the byte at `0xa031eef7` (cached `0x6031eef7`). A native build needs the same test, fed by whichever entry it chooses below. The byte is inside the owned tail, past the mirror. `0xa031e91f` is outside `0x6031e920`–`0x6031f000` and is not the flag. Subject Detect stays off: `0x90a1` is `[1, 1]`. The AF-ON sequence that passed did not press S1. The stock control's S1 press left the body on shooting (`accept-f3` step `s1-press`).

Branching only at the mapped setter `0x6041937f` is not shown to be equivalent to branching at the getter and the setter. The size editor and the direct screen both reach the cell setter at `0x60063431` from `0x604193c0` (return `0x604193c7`). The prototype branches at the getter/setter pair so a read and a write see the same slot.

## Owner decision Q5

The prototype's entry is only the session flag. It does not add a row, a page, or a key. The three ways to open this same screen in AF-ON mode:

1. The EMULATOR-ONLY session flag at `0xa031eef7`, set on entry and cleared on exit. No visible menu change. This is what the prototype uses.
2. A second row on the AF-ON button page, or a page-29-style row, whose editor is this stock target screen rather than a new page. That is a visible menu change and is not in the prototype.
3. A key behaviour that opens `ID_ST_MENU_DIRECT` with the flag set. The arrow keys already open that screen for the half-press target. A native build would have to choose a different key, or a different behaviour of an existing key, and that choice is not made here.

No storage decision. No hardware recommendation.

## Exit must restore the zone byte

The hook writes `0xa031e920` when AF-ON mode stores `0x99a1` index 0 or 1. Clearing the flag does not put the half-press change index back into that byte. In `accept-f3` session `c1`, MENU cleared the flag and left the half-press cells unchanged, and the zone byte stayed 1. The next normal dial wrote the same type and size as the control and also stepped `0x5962[1]` and `0x88b2` from 526 to 529. The control, which has no Z5 zone byte (the read at `0xa031e920` stayed `0xFF`), did not step position on that dial.

The smallest native change that finishes the exit is: on OK, MENU, S1, and session end, clear `0xa031eef7`, then store the half-press `0x99a1` index 1 into `0xa031e920` and `0x6031e920`. That restore is not in the four experiment versions. The acceptance stopped at this dial.

## Custom-size editor

The stock page is menu tab "6. AF Target Settings & Operations", row "AF Target Mode Settings", then five Down presses onto C1, then Right. Main dial changes the vertical size, sub dial the horizontal size, and OK commits. `stock-gaps-f2` `size-ok` wrote `0x1dd1` indices 0, 1, 2 and 3, plus `0x1de1` indices 0 and 1 and `0x1df1` indices 0 and 4, through setter caller `0x604193c7`. The same getter and setter hook covers those keys. `0x1de1` occupies `0xa031eee7` and `0x1df1` occupies `0xa031eeef`, immediately after the 55-byte mirror. The flag sits one byte later so it does not share those fields. The candidate session did not reach this editor before the acceptance stopped. The stock control in the same run did: `size-ok` left custom size `[5, 1]` and `0x1df1[4] = 1`, and the following restore put the half-press cells back.
