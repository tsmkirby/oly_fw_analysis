# Page-27 action records

The bytes below are from `inputs/00_0100_50000020.decoded.bin`. Listings are in `work/out/disasm-*-e1.txt`. `work/out/listing-check-e1.txt` compares every listing byte with the image: 316 instructions, 0 mismatches. The decode is `work/out/static-records-e1.txt`.

Section 7, the record at `0x60029b70`, has destination `0x6103f000` and flag 1. It is compressed. The action records, the pointer at `0x6150f5f0`, and the dispatch table at `0x615e32d8` are in that section. An overlay CSV cannot carry them.

## Record layout

Each record is 24 bytes. `FUN_611a2631` walks them with stride `0x18`.

| Offset | Size | What it is | Where it is used |
|---|---|---|---|
| `+0x00` | u32 | Match key. These records hold 1. | Compared with the halfword at object `+0x54`. Listing `0x611a26d5` `f190 cmp A0,D0`. |
| `+0x04` | u16 | Provider UI id. | Loaded by `0x611a26de` `f86204 movhu (0x4,A2),D0` and compared with the selected id in D1 by `0x611a26e1` `a4 cmp D1,D0`. |
| `+0x06` | u16 | Sub-key. These records hold 0. | Compared when object `+0x54` is not 1. For these rows that halfword is 1, so the compared value stays 0. |
| `+0x08` | u32 | Handler. These records hold 0. | A non-zero value is called. Zero takes the pair path below. |
| `+0x0c` | u32 | First dispatch word. These records hold 8. | Low half is the first argument of `FUN_6119a177`. |
| `+0x10` | u32 | Second dispatch word. | Low half is the second argument of `FUN_6119a177`. |
| `+0x14` | u32 | Callback. These records hold 0. | A non-zero value is called to produce the pair. Zero uses the two words directly. |

## Stock bytes

Page-27 table `0x6150c514`, count word 2 at `0x6150f5f4`. The only image pointer to `0x6150c514` is the word at `0x6150f5f0`.

| Record | Address | Raw 24 bytes | UI id | Pair |
|---|---|---|---|---|
| Page 27, shutter priority | `0x6150c514` | `010000006a0800000000000008000000e301000000000000` | 2154 | 8, `0x1e3` |
| Page 27, custom-button priority | `0x6150c52c` | `010000006b0800000000000008000000e401000000000000` | 2155 | 8, `0x1e4` |

C-AF table `0x6150c4cc`, count 3. Its only image pointer is the word at `0x6150f5cc`. The Area record is the first one. The other two are the same shape and are listed because they show the id sequence.

| Record | Address | Raw 24 bytes | UI id | Pair |
|---|---|---|---|---|
| C-AF Area | `0x6150c4cc` | `010000006c0800000000000008000000e001000000000000` | 2156 | 8, `0x1e0` |
| C-AF, next | `0x6150c4e4` | `010000006d0800000000000008000000e101000000000000` | 2157 | 8, `0x1e1` |
| C-AF, third | `0x6150c4fc` | `010000009d0800000000000008000000e201000000000000` | 2205 | 8, `0x1e2` |

All five handlers and callbacks are 0. All five match keys are 1. All five sub-keys are 0. The second words are the consecutive ids `0x1e0`, `0x1e1`, `0x1e2`, `0x1e3`, `0x1e4`.

## What 8 and `0x1e3` / `0x1e4` / `0x1e0` mean

On a match with a null handler and a null callback, `FUN_611a2631` calls `FUN_6119a177` with those two halfwords and returns 4.

`FUN_6119a177` at `0x6119a177` stores them:

- `fc83449d3760 movhu D0,(0x60379d44)` stores the 8
- `fc87469d3760 movhu D1,(0x60379d46)` stores `0x1e3`, `0x1e4`, or `0x1e0`

`FUN_6119a162` at `0x6119a162` copies them back out: `0x60379d44` to `*A1`, and `0x60379d46` to the halfword addressed by D0. Those are the only reads and writes of the two addresses in the image.

`FUN_6124f82b` is the copy used on the menu path. If the object pointer is 0 it writes the sentinel pair 0x23, 0 (`0x6124f83f` `8023 mov 0x23,D0`, then a zero halfword). Otherwise it calls `FUN_6119a162`.

`FUN_611a3655` reads that pair. If the first halfword is 0x23 it clears the match result (`0x611a36be` `a023 cmp 0x23,D0`, then `0x611a36c2` `08 clr D2`). The value 8 is not 0x23, so a match is kept. 0x23 means "no action".

`FUN_6124f6c7` turns the inner 4 into the value its caller tests. At `0x6124f7f6` `a004 cmp 0x4,D0`, a match becomes 3 (`0x6124f7fa` `8003 mov 0x3,D0`). `FUN_61283b1c` then calls `FUN_6127e750` with D0 still holding 8 and D1 still holding the second id. `FUN_6127e750` does not overwrite those registers. It calls the virtual method at `*(A0+8)`, vtable slot `+4` (`0x6127e750` `f82008 mov (0x8,A0),A0`, `f82504 mov (0x4,A1),A1`, `f0f1 calls (A1)`). The pair is the argument that method sees.

If that call returns 0, `FUN_61283f10` searches the 12-byte table at `0x615e32d8`. The loop index runs 0 through `0x46` (`0x61283f39` `a547 cmp 0x47,D1`). Each record is a word, a halfword, a spare halfword, and a word. A hit requires the word to equal 8 and the halfword to equal the second id. The image has 36 records whose word is 8. None of them has halfword `0x1e0`, `0x1e1`, `0x1e2`, `0x1e3`, or `0x1e4`. A miss returns 0. Those five ids do not select a row of that table.

So the pair is not an option-list pointer and not a text id. The 8 is the "keep this action" value, as against the 0x23 discard sentinel. The second halfword is the per-setting id passed with it into the menu virtual call. 2154, 2155, and C-AF Area differ only in that id (`0x1e3`, `0x1e4`, `0x1e0`) and in the UI id at `+4`.

## What is not in the record

No field is an option-list pointer, a row text id, or a help id.

The option list belongs to the row, which is a different 36-byte record. Page-27 rows:

| Row | Address | Kind | Label | Options | Count | Alternate |
|---|---|---|---|---|---|---|
| 2154 | `0x6158dc44` | 12 | `0x06b1` | `0x6158ba04` | 2 | 0 |
| 2155 | `0x6158dc68` | 12 | `0x282c` | `0x6158ba04` | 2 | 0 |

`0x6158ba04`, two 12-byte records, both kind 4:

| Value | Text id |
|---|---|
| 1 | `0x127b` |
| 0 | `0x124f` |

`0x6158ba1c`, ten 12-byte records, all kind 12 (images, not text):

| Value | Image id |
|---|---|
| 0 | `0x23a3` |
| 2 | `0x028a` |
| 1 | `0x064a` |
| 5 | `0x23a4` |
| 3 | `0x19b5` |
| 10 | `0x23a5` |
| 6 | `0x23a6` |
| 7 | `0x23a7` |
| 8 | `0x23a8` |
| 9 | `0x23a9` |

That list is page 28's zone list. The action record does not point at it.

## Third record

The owned copy is 72 bytes at `0x6031ea00`, in the section-1 tail. Section 1's record at `0x60029b28` has flag 0, uncompressed. `0x6031ea00` is below the established section-1 end `0x6031f000`, and those 72 image bytes are `0xFF`.

The copy is the two page-27 records, byte-exact, then 2154's record with only the UI id changed from 2154 to `0x3D6F`:

`010000006f3d00000000000008000000e301000000000000`

Each field is kept for a reason:

- `+0x00` stays 1, so the object `+0x54` compare still passes.
- `+0x04` becomes `0x3D6F`, so `0x611a26e1` can match this row.
- `+0x06` stays 0, so the sub-key compare still passes.
- `+0x08` stays 0, so the null-handler path runs.
- `+0x0c` stays 8, so the result is not the 0x23 discard, and the virtual call receives 2154's first value.
- `+0x10` stays `0x1e3`, so the virtual call receives 2154's editor id rather than 2155's `0x1e4` or C-AF's `0x1e0`.
- `+0x14` stays 0, so no callback replaces the pair.

The row's option pointer is a separate choice. X1 leaves it at `0x6158ba04`.

## UI map for the ORIGINALLY ids

`FUN_60419446` and `FUN_60419696` cover 0–`0x8CF`, 3000–3046, 10000–10070, and 15000–`0x3C5F`. The low-map formula `0x6062555c + id * 4` puts 2154 at `0x60627704`, and those four bytes are `a1900000`: key `0x90a1`, index 0.

Named `MODE_AF_HOME*` ids that fall in the low map:

| UI id | Name | Key | Index |
|---|---|---|---|
| 165 | `MODE_AF_HOME` | `0x99d2` | 0 |
| 238 | `MODE_AF_HOME_AREA_TYPE` | `0x9fa1` | 0 |
| 517 | `MODE_AF_HOME_AREA_TARGET_SIZE` | `0xdfa1` | 0 |
| 1332 | `MODE_FIXED_FOCUS_AF_HOME` | `0x9ec1` | 0 |
| 1335 | `MODE_FOCUS_AF_HOME` | `0x9ed1` | 0 |
| 1336 | `MODE_SAF_MF_AF_HOME` | `0x9ee1` | 0 |
| 1337 | `MODE_AF_TRACKING_AF_HOME` | `0x9ef1` | 0 |
| 1343 | `MODE_FOCUS_AF_HOME_ONOFF` | `0x59b1` | 0 |
| 1692 | `MODE_AF_HOME_AREA_TYPE_CCW` | `0x9fa1` | 1 |
| 1693 | `MODE_AF_HOME_AREA_TYPE_CW` | `0x9fa1` | 2 |
| 1694 | `MODE_AF_HOME_CCW` | `0x99d2` | 1 |
| 1695 | `MODE_AF_HOME_CW` | `0x99d2` | 2 |
| 1713 | `MODE_AF_HOME_STATE_FLAG` | `0x1ea1` | 0 |

Ids 2274–2279 are `0x8E2`–`0x8E7`. They sit after `0x8CF` and before 3000. Both getters return 0 without reading a slot (`FUN_60419446` goes to the zero return; `FUN_60419696` returns 0 in that gap). The typed accessor `FUN_60063a20` reads a cell only when it is given a key and an index. There is no key to give it. Those six ids have no backing cell through the UI map:

| UI id | Name |
|---|---|
| 2274 | `MODE_AF_HOME_AREA_TYPE_ORIGINALLY` |
| 2275 | `MODE_AF_HOME_AREA_TYPE_CCW_ORIGINALLY` |
| 2276 | `MODE_AF_HOME_AREA_TYPE_CW_ORIGINALLY` |
| 2277 | `MODE_AF_HOME_POS_ORIGINALLY` |
| 2278 | `MODE_AF_HOME_POS_CCW_ORIGINALLY` |
| 2279 | `MODE_AF_HOME_POS_CW_ORIGINALLY` |

The names are from `ref/analysis/review/setting-name-candidates.json`. The slots are `work/out/home-map-e1.json`.

## What the runs added

X1 used the third record above. At `0x611a26e1` the walk compared D0 2154, then 2155, then `0x3D6F` (15727) against D1 15727. The matching A2 was `0x6031ea30`, and its 24 bytes were the record above. OK then opened the two-option chooser. The help on screen was the value-1 text, "When a specified subject is detected". Confirm called `0x6041937f` with UI id 2154 and value 1. The RAM byte stayed 0.

X4 changed only the second word, from `0x1e3` to `0x0e3d`. The same compare matched `0x3D6F` at `0x6031ea30`, and the record bytes were `010000006f3d000000000000080000003d0e000000000000`. The page stayed on the three rows. No chooser opened and the setter was not called.

So `+0x04` is the id the compare matches, and `+0x10` is the id the editor path requires. `0x1e3` is the editor id that then commits UI 2154. `0x0e3d` is not used by any aligned record of this shape in `0x6150b000`–`0x61511000`, and it does not open an editor. The option list and the help text are still not fields of this record. The log lines are `work/out/cmd/08.out` and `work/out/cmd/14.out`.
