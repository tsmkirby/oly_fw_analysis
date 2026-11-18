# Key 0x5b82 — correction verdict

Classification: **UNRESOLVED**

This file replaces `work/out/verdict.md`. That round-1 file still says OWNABLE and still gives the six-dword layout `0x4831CCVV`. Both of those are withdrawn. Do not use these cells for T3.

The 16 cells are one key, slot `0x5b8`, type 2, width 2. Named indices, written by the UI map:

| index | UI id | name |
|---:|---:|---|
| 5 | 2017 | MODE_COLORTONE_TOY_PHOTO_TYPE3_CURSOR |
| 12 | 2031 | MODE_COLORTONE_VINTAGE_TYPE3_CURSOR |
| 13 | 2034 | MODE_COLORTONE_PARTCOLOR_TYPE3_CURSOR |

The other 13 indices (0–4, 6–11, 14, 15) are the 26 unnamed bytes.

## (a) Normal use and persistence

The mapped setter `FUN_6041937f` writes the index stored in the UI map and no other index. A direct call with value `0x2222` changed index 5 for UI id 2017, index 12 for 2031, and index 13 for 2034. The unnamed cells were left as they were. Log: `dynamic-5b82-mark-w.jsonl`.

A completed stills Custom Mode cycle does not rewrite this key. In `dynamic-5b82-mark-w.jsonl` and `dynamic-5b82-mark-x.jsonl` the markers were present at Assign, the unnamed cells were then changed to `49920 + index`, Recall was confirmed, the menu was left until an M save posted, and the next session restored that second pattern with the named cells still at 3200. The control `dynamic-5b82-control-p.jsonl` did the same steps from stock unnamed zeros and also came back with the second pattern and named cells at 3200. Recall did not restore the values that had been current at Assign. The two marked runs agree with each other, and the control's named cells match.

Earlier runs that never posted a save came back as stock on the next session (`dynamic-5b82-mark-t.jsonl`, `dynamic-5b82-mark-u.jsonl`). That is an unsaved file, not a recall wipe. The live getter after Recall, and after the menu-close press, still showed the second pattern.

Round-1 menu, dial, and art-filter walks left the unnamed markers in place. Those `0x1111` writes were probe writes, not firmware behaviour.

## (b) Reset and default paths

`FUN_604193ca` resolves the UI id to a key and calls `FUN_60063962` without an index. `FUN_6006398b` copies the ROM default over both copies of the key. For `0x5b82` that default is 32 zero bytes. A direct call with UI id 2017 set all 16 cells to 0 (`dynamic-5b82-mark-w.jsonl`, return value 7). The same call for 2031 and 2034 then changed nothing, because the key was already zero.

That function is not on the menu path for these three UI ids. Its only caller is `FUN_618cfda1`, which jumps to the default handler when D0 is below `0x5001`. The 23 call instructions inside it pass other constants (`0x1`, `0x3`, `0x4`, `0x6`, `0x10`, `0x18`, `0x19`, `0x4e`, `0x121`, `0x6b6`, `0x6bd`, `0x6be`, `0x6c1`, `0x6c5`, `0x6c6`, `0x72b`, `0x72f`, `0x730`, `0x2726`). None is 2017, 2031, or 2034. Listing: `listings-5b82-v2.txt`.

The bank-7 invalid-area rebuild (`mov 0x7,D0` at `0x60063eb0`, then `FUN_60062a60`) and the debug handler `FUN_600619a9` also write the ROM zeros. The handler pointer is stored only at `0x602ec448` and `0x602eda1c`. No aligned word points at those slots (`debug-slot-scan-v1.txt`). A reset that writes zeros decodes as no profile under the layout below.

## (c) Remaining gaps

- The art-filter cursor pages were not opened through the UI. Twelve menu tabs contained no Toy Photo, Vintage, or Partial Color row (`c1-cycle-v21.txt`). The scalar setter rejects these ids. The direct mapped-setter call is the evidence for what those pages' setter writes.
- `FUN_6183dcee` at `0x6183e9b5` loads a key from a record and, when the lookup succeeds, calls `FUN_60063962`. No static immediate `0x5b82` feeds it. Whether a runtime record can name this key is not closed.
- `FUN_6183cc7d` passes a parameter key into `FUN_60063567`, the span copier. Its other direct callers pass other keys. Whether a caller can pass `0x5b82` is not closed.
- `FUN_600630a3` replays a queued transaction. Type 1 writes one cell, type 2 copies a span, type 4 runs the whole-key default. The queue is filled by the setter, by `FUN_60063567`, and by `FUN_60063962`. No static site queues `0x5b82`.

These gaps are why the key is UNRESOLVED. The C1 result does not by itself make it OWNABLE, and it does not show a normal-use wipe.

## Capacity

Stock fields, from `af-profile-fields-v1.txt`. Defaults are zero.

| key | count | width | cells used for one profile |
|---|---:|---:|---|
| 0x99a1 zone type | 8 | 1 | indices 0, 2, 4 (3 bytes) |
| 0x9a41 target size | 1 | 1 | index 0 (1 byte) |
| 0x5962 position | 6 | 2 | indices 0, 2, 4 (6 bytes) |
| 0x1dd1 custom size | 10 | 1 | indices 0 and 1 (2 bytes) |

That is 12 payload bytes: zone type, size, and position for three orientations, plus the current custom height and width. The CHANGE shadows, the four custom preset slots (8 bytes), and the step table `0x1de1` (8 bytes) are not part of this profile. Adding those 16 bytes makes 34 bytes with the header below, which is 8 bytes over the 26 available.

Proposed layout of the 13 unnamed cells, index order 0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14, 15, little-endian:

| bytes | cell index | contents |
|---|---|---|
| 0–1 | 0 | magic `0xA70F` |
| 2 | 1, low | version 1 |
| 3 | 1, high | length 12 |
| 4–15 | 2, 3, 4, 6, 7, 8 | 12 payload bytes, in the field order above |
| 16–17 | 9 | CRC-16/IBM, poly `0xA001`, init `0xFFFF`, over bytes 2 through 15 |
| 18–25 | 10, 11, 14, 15 | reserved 0 |

26 bytes are available. 18 are used. 8 are reserved. The 12-byte profile fits.

All-zero fails the magic. A run of the stock named value `0x0C80` fails the magic. A bad version, a length other than 12, or a bad CRC decodes as no profile. A reset that writes ROM zeros therefore decodes as no profile.

The round-1 layout of six `0x4831CCVV` dwords does not match these field widths. It left only five profile bytes after the version.
