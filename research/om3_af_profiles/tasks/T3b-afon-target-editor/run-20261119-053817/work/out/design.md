# Native change list

The prototype adds no image byte. `work/out/overlay-changed-bytes.csv` is the Z5 overlay, 3262 rows, with a section column added by `work/scripts/section_rows_e1.py`. The only section 6 or 7 rows are the three inherited call-site bytes `0x610bf5e3`–`0x610bf5e5`, marked "section 7, EMULATOR-ONLY runtime call-site patch (inherited central-edge)". Their native placement stays a T4 question. `work/out/section-rows-e1.json` is `ok: true`.

The one combined change is a runtime hook, EMULATOR-ONLY, role behaviour. While `0xa031e91f` is 1:

- cell getter `0x60063380` returns the mirror byte or halfword for a key in the layout, and passes every other key through;
- cell setter `0x60063431` stores A1 into that slot and passes every other key through. A `0x99a1` write of index 0 or 1 also stores the low byte at `0xa031e920` and `0x6031e920`.

Both hooks return without running the stock function. The flag is set by the session, not by a menu row. When the flag is not 1, both hooks pass through, so a normal edit writes the half-press cells and does not write the mirror.

## Sites a native build has to branch

The branch is the pair the trace actually uses.

1. `0x60063380`, the cell getter. D0 is the key, D1 is the index. The direct screen's reads return through `0x6041a202`. A native build returns the profile slot instead of the half-press slot when the AF-ON editor is active and the key is one of `0x99a1`, `0x9a41`, `0x5962`, `0x1dd1`, `0x84d1`, `0x88b2`, `0x90d1`, `0x5a11`.

2. `0x60063431`, the cell setter. D0 is the key, D1 is the index, A1 is the value. The direct screen reaches it from the mapped setter `0x6041937f` (UI id in D0, value in D1 on entry, saved to A2, then A1 for the call at `0x604193c0`). The UI ids observed for this screen are 1333 (`0x99a1` index 1), 1873 (`0x90d1` index 1), 40 (`0x84d1`), 1657 and 1658 (`0x1dd1` index 0 and 1), 1339 (`0x5962` index 1), and 85 (`0x88b2`). A native build can branch at `0x6041937f` for those UI ids, or at `0x60063431` for the keys. The prototype branches at the getter and the setter, because that pair covers the read and the write with the value already in A1. Z5 already hooks `0x6041937f` for UI id `0x3D6F` only. This hook does not replace that hook. It passes every key that is not in the layout, including whatever `0x3D6F` later stores through the cell setter.

The mode test is the byte at `0xa031e91f`. A native build needs the same test, fed by whichever entry it chooses below. Subject Detect is untouched: `0x90a1` stays `[1, 1]`, and the editor never presses S1 or AF-ON.

## Owner decision Q5

The prototype's entry is only the session flag. It does not add a row, a page, or a key. The three ways to open this same screen in AF-ON mode:

1. The EMULATOR-ONLY session flag at `0xa031e91f`, which is what this run uses. No visible menu change.
2. A second row on the AF-ON button page, or a page-29-style row, whose editor is this stock target screen rather than a new page. That is a visible menu change and is not in the prototype.
3. A key behaviour that opens `ID_ST_MENU_DIRECT` with the flag set. The arrow keys already open that screen for the half-press target. A native build would have to choose a different key, or a different behaviour of an existing key, and that choice is not made here.

No storage decision. No hardware recommendation.
