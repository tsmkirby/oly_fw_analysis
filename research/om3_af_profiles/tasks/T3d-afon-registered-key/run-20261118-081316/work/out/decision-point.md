# Decision point

The page-27 OK path that returns 4 or 1 is the `0x900C` handler entered from `FUN_611a1229`. The handler calls `FUN_611a2631`. That function returns 4 when the selected row's UI id is in the page's action table, and 0 when it is not. The handler returns the 4, and returns 1 when `FUN_611a2631` returns 0.

## Chain

Measured on the E1 baseline (stock-shaped row, id `0x3D6F`, T3a overlay, section-7 redirects, no value hooks). The same object and the same function pointer are used for 2154, 2155, and `0x3D6F`.

1. `0x6124f7be` calls vtable slot 0 of the page object. The slot is `FUN_6119a2be`.
2. For key `0x900C` that function reaches `0x6119a773`, which calls vtable slot `+0x68`, `FUN_61203082`.
3. `FUN_61203082` calls the pointer at object `+0x50`, which is `FUN_6120308d`.
4. `FUN_6120308d` calls vtable slot 0 of the object at `+0x58`. That slot is `FUN_6119a2be` again, on vtable `0x6151346c`. Its slot `+0x68` is `FUN_611a0da0`.
5. `FUN_611a0da0` calls the pointer at object `+0x4c`, which is `FUN_611a1229` for all three page-27 rows.
6. `FUN_611a1229` range-checks the key and jumps through the table at `0x615130d8`. Key `0x900C` lands at `0x611a129d`.
7. `0x611a12a5` calls `FUN_611a2631` with the table pointer from object `+0x78` and the count from the halfword at object `+0x7c`.

C-AF Area uses a different pointer at object `+0x4c` (`FUN_611a48d8`) and a different table, and it still reaches the call at `0x611a12a5`. Its result is reported separately below.

`*(object+0x50)` is `0x111` for the three page-27 rows, so the compare with `0x8c` at `0x611a12d4` fails and `0x611a12da` jumps to `0x611a13c0`. The 4-versus-1 split is not that compare.

## The read that differs

`FUN_611a2631` walks the table. Each record is 24 bytes. Three compares have to succeed:

- `0x611a26d5`: the record's first word equals the halfword at object `+0x54`. That halfword is 1 for every row measured here.
- `0x611a26e1`: the halfword at record `+4` equals the selected row's UI id.
- `0x611a26ec`: the halfword at record `+6` equals 0. The value stays 0 because the halfword at object `+0x54` is 1, and `0x611a26a5` then skips the calls that would fill it.

The selected UI id is the return of the call at `0x611a2699`: vtable `+0x10` of `*(object+0x60)`, called with the row index returned by vtable `+4` of that same object (`0x611a265c`). The index is 0, 1, and 2 on the three page-27 rows. The id that comes back is the provider id of that row.

The deciding instruction is `0x611a26e1`, `cmp D1, D0`. `D1` is the selected UI id. `D0` was loaded by `0x611a26de`, `movhu (0x4, A2), D0`, from the record. Listing bytes `f86204 a4`, checked against the image.

| Row | Row index | UI id compared | Table | Matching record | `FUN_611a2631` return | Value at `0x6124f7d4` |
|---|---:|---:|---|---|---:|---:|
| 2154 | 0 | 2154 | `0x6150c514` count 2 | `0x6150c514` | 4 | 4 |
| 2155 | 1 | 2155 | `0x6150c514` count 2 | `0x6150c52c` | 4 | 4 |
| `0x3D6F` | 2 | 15727 | `0x6150c514` count 2 | none | 0 | 1 |
| C-AF Area | 0 | 2156 | `0x6150c4cc` count 3 | `0x6150c4cc` | 4 | 4 |

`0x3D6F` is not in the table, so no record matches.

This compare does not read a mapped settings key, a UI-map index, a descriptor for the row id, or the row's option-list pointer. Across the decision window the mapped getter, the index getter, and the descriptor lookup run only for UI id 1448 (`0x5A8`), and the registry and `FUN_60063380` run only for key 22849 (`0x5941`). Those arguments are the same for 2154, 2155, `0x3D6F`, and C-AF Area. The call with 1448 is the fixed call at `0x611a264b`. It is not the row id.

## How 4 and 1 are produced

A matching record whose pointer at `+8` is 0 and whose word at `+0x14` is 0 takes `0x611a276e`. `D0` is the word at record `+0xc` (8) and `D1` is the word at record `+0x10`. `FUN_6119a177` stores those two halfwords at `0x60379d44` and `0x60379d46`. Then:

- `0x611a277e` `mov 0x4, D0` (bytes `8004`)
- `0x611a2780` stores that 4 in the return slot
- `0x611a2789` loads it and `0x611a278b` returns

The handler saves that return at `(0xc, sp)` at `0x611a12aa`. A non-zero value takes `0x611a1466` to `0x611a1571` and then `0x611a1ab9`, which returns the saved 4. A zero value is the no-match path. `0x611a182e` is `mov 0x1, D0` (bytes `8001`); `0x611a1ab7` stores it and `0x611a1ab9` returns it. The measured outer return is 1 for `0x3D6F` and 4 for the three matching rows. The landing on `0x611a182e` itself was not given its own trace event.

## The table

Both tables are in the decoded image. Section table at `0x60029b28`, row 6 (section 7 in the established numbering): destination `0x6103f000`, flag 1, compressed. The next row starts at `0x6169e800`. The compare, the `mov 0x4`, the `mov 0x1`, and both tables sit in that compressed section. The UI map `0x6062555c` and `FUN_60419446` sit in row 1 (section 2), destination `0x603ba800`, flag 0, uncompressed.

Page-27 records, 24 bytes each, image and runtime agree:

- `0x6150c514`: word 1, UI id 2154, handler 0, halfwords 8 and `0x1e3`, trailing word 0
- `0x6150c52c`: word 1, UI id 2155, handler 0, halfwords 8 and `0x1e4`, trailing word 0

C-AF records at `0x6150c4cc`: UI ids 2156, 2157, and 2205, the same shape, third halfwords `0x1e0`, `0x1e1`, and `0x1e2`.

The only image pointer to `0x6150c514` is the word at `0x6150f5f0`. The next word is the count 2. That pointer is also in compressed section 7.

`0x3D6F` is 15727. The four UI-map ranges end at 2256, 3046, 10070, and 15455. 15727 is past 15455, so `FUN_60419446` returns 0 for it without reading a map entry. Map slot for 2154 is `0x60627704`: key `0x90a1`, index 0.

The E1 row already carries list `0x6158ba04` and count 2 in its stock 2154 bytes. The action table, not that list pointer, is what keeps OK at 1.

## Listing check

Ghidra listings compared with `inputs/00_0100_50000020.decoded.bin`: `disasm-2631-d1.txt` 130, `disasm-2747-d1.txt` 50, `disasm-1ab9-d1.txt` 90, `disasm-182e-d1.txt` 40, `disasm-1229-d1.txt` 90, `disasm-13c0-d1.txt` 140, `disasm-3082-d1.txt` 12, `disasm-308d-d1.txt` 20. 572 instructions, 0 mismatches. `work/out/static-decision-d1.txt`.

## Evidence

- `work/out/trace-match-d1.jsonl` steps `ok` for labels 2154, 2155, 3d6f, caf-area: `key2`, `row-token`, `table-return`, `record-hit`, `returnD0`, `cmpD0`.
- `work/out/match-summary-d1.txt`
- `work/out/static-decision-d1.txt`
- `work/out/static-tableptr-d1.txt`
- `work/out/disasm-2631-d1.txt`, `work/out/disasm-2747-d1.txt`, `work/out/disasm-1229-d1.txt`, `work/out/disasm-13c0-d1.txt`, `work/out/disasm-1ab9-d1.txt`, `work/out/disasm-182e-d1.txt`
