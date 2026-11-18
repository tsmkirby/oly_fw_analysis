# What a firmware change would have to touch

This is a proposal for the native data and code behind the measured gate. It is not a choice of where an AF-ON value is stored, and it is not a persistence design.

K1 did not open the chooser. K2 and K3 were not run. Acceptance was not run. The only route that opened a chooser was K4, and its confirm wrote setting 2154's key `0x90a1`, not `0x5b82`.

## The gate

OK returns 4 when the selected row's provider id equals the halfword at offset 4 of a 24-byte record, and returns 1 when it does not. The compare is `0x611a26e1`. The page-27 table is `0x6150c514`, count 2, records for 2154 and 2155. The only image pointer to that table is the word at `0x6150f5f0`, and the next word is the count. The compare, the table, and the pointer are in section 7 (section-table row 6, destination `0x6103f000`, flag 1), which is compressed. An overlay CSV cannot carry those bytes.

A firmware that wants this row's OK to return 4 needs a third record whose UI id field is `0x3D6F`, and the count at `0x6150f5f4` raised from 2 to 3. Both edits are in that compressed section. K4 did the match in the emulator by forcing the compare, leaving the record's stored id at 2154. That opened the two-option chooser and the confirm path called `FUN_6041937f` with UI id 2154.

## The commit

`FUN_6041937f` then called `FUN_60063431` with key `0x90a1` and index 0. That is 2154's map entry at `0x60627704` (uncompressed section 2, destination `0x603ba800`, flag 0). `0x5b82` was not an argument. Cancel did not call the setter.

`0x3D6F` is 15727. The UI-map ranges end at 2256, 3046, 10070, and 15455, so there is no map slot for it. `FUN_60419446` returns 0 for an id past `0x3c5f` without reading an entry. K1 made that getter return `0x5b82`, and the index getter return 0, only for `0x3D6F`. The deciding compare still saw 15727, no record matched, and OK stayed at 1. A map entry on its own does not open this chooser. Extending the getter's range check would also be a code edit in uncompressed section 2, and this run did not show the setter being called with `0x3D6F`, so that edit was not measured as a commit path.

The registry call inside the decision was key `0x5941` for 2154, 2155, `0x3D6F`, and C-AF Area. The row id is not a registry lookup. `0x5b82` is already readable as 16 cells. Nothing here registers a new key or picks a cell for AF-ON.

## Overlay bytes

`work/out/overlay-changed-bytes.csv` has 140 bytes, all in uncompressed section 1 (destination `0x60134000`, flag 0). They are the T3a section-1 tail with the third row replaced by stock row 2154 and id `0x3D6F`. No byte is in a compressed section. The section-7 page and source redirects are runtime writes, labelled EMULATOR-ONLY in the JSONL, and they are not in the CSV. K1's getter hooks and K4's compare hook are emulator hooks, not overlay bytes.
