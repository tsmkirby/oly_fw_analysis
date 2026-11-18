# Editor descriptors for 2154 and UI 238

The two records are 20-byte entries in one table. The word previous notes called a template is a packed list of legal values. It does not hold images or texts. The byte count, divided by the stride, is the number of those values.

## Table

`FUN_60405865` at `0x60405865` clears 128 hash buckets at `0x62a84970`, then walks `0x6061912c`. The listing `work/out/disasm-5865-g1.txt` has `mov 0x6061912c,A3`, `add 0x14,A3` (stride 20) and `cmp 0x6b0,D1` (1712 records). The table ends at `0x606216ec`. Each record's first halfword is the UI id. The node array is `0x62a84b70`, 8 bytes per record. `FUN_604058bc` (`work/out/disasm-58bc-g1.txt`) walks bucket `0x62a84970 + (id & 0x7f) * 4` and returns the record whose first halfword matches. `FUN_6040547b` is that lookup and nothing else (`work/out/disasm-547b-g1.txt`).

2154 is record 1664 at `0x6062132c`. UI 238 is record 1430 at `0x606200e4`. Both addresses are on the 20-byte grid (`work/out/descriptors-g1.txt`).

## Fields

| Offset | Field | 2154 `0x6062132c` | UI 238 `0x606200e4` |
|---|---|---|---|
| +0 | u16 id | 2154 | 238 |
| +2 | u16 flags | `0x0080` | `0x0080` |
| +4 | u32 value table | `0x606190b7` | `0x606178b1` |
| +8 | u32 second pointer | 0 | 0 |
| +0xc | u16 byte count | 2 | 10 |
| +0xe | u16 stride | 1 | 1 |
| +0x10 | u32 tail | `0x00000100` | `0x00000100` |
| +0x11 | u8 type | 1 (unsigned byte) | 1 |

Raw 2154: `6a088000 b7906160 00000000 02000100 00010000`.

Raw 238: `ee008000 b1786160 00000000 0a000100 00010000`.

2155 at `0x60621340` is the same record as 2154 with id 2155. It shares `0x606190b7`. UI 1692 and 1693, the next two records after 238, share `0x606178b1` and the same count, stride and type.

## What the value table is

`FUN_604052d5` (`work/out/disasm-52d5-g1.txt`) loads the halfword at +0xc, divides it by the halfword at +0xe, and rejects an index above that quotient. Stride 1 reads a byte at `(pointer at +4) + index` (`mov (0x4,A0),A0` then `movbu (D2,A0),D0`). Stride 2 reads a halfword at `index * 2`. Any other stride returns `0x80`.

`FUN_60405178` (`work/out/disasm-5178-g1.txt`) uses the same quotient as the element count and scans the table for a value. Type 6 is a different scan. Type 1, which both records have, is the byte scan.

`FUN_604050e5` (`work/out/disasm-50e5-g1.txt`) reads the pointer at +8 and returns the caller's value unchanged when that pointer is 0. Both records have 0 there, so this function does not use their value tables. The 146 records whose +8 pointer is non-zero are the other population: stride 64, tail `0x00000600`, type 6. One of them is `0x6061912c` (id 3265, byte count 960, 15 elements of 64). That is the option-list shape from the menu research. 2154 and 238 are not in it.

`FUN_604057c8` (`work/out/disasm-57c8-g1.txt`) reads the type byte at +0x11. Type 1 masks a value to a byte.

The bytes at the two pointers, checked in `work/out/descriptors-g1.txt`:

- `0x606190b7`: `00 01`. Values 0, 1. Two elements. The 24 bytes before it end the ASCII run `GHIJKLMNOPQRSTUVWXYZ_`. The pointer is into a packed byte pool, not an aligned widget structure.
- `0x606178b1`: `00 01 02 03 05 0a 06 07 08 09`. Values 0, 1, 2, 3, 5, 10, 6, 7, 8, 9. Ten elements.

The byte count is not a separate "option count" field. With stride 1 it is the number of values. With stride 2 it would be twice the number of values. `FUN_604052d5` treats the quotient as the number of entries.

## Where images and texts come from

They are not in the descriptor and not in the value table. A menu option record is 12 bytes: u32 value, u16 kind, u16 id, u32 class. `FUN_611c7785` (`work/out/disasm-7785-g1.txt`) multiplies the index by `0xc` (`udfu01 0xc,D2` at `0x611c7791`), compares the u32 value, then reads the kind halfword. Kind `0xc` (12), 3, 8 or 7 copies the halfword at record+6 into the image slot. Kind 4, 1, 2, 10, 11 or 9 copies that halfword into the string slot. `FUN_611c782f` (`work/out/disasm-782f-g1.txt`) does the same kind split for one record.

Priority list `0x6158ba04`, two records:

| Value | Kind | Id |
|---|---|---|
| 1 | 4 (string) | `0x127b` |
| 0 | 4 (string) | `0x124f` |

Zone list `0x6158ba1c`, ten records, every kind 12 (image), class `0x6158aeb4`:

| Order | Value | Image |
|---|---|---|
| 0 | 0 | `0x23a3` |
| 1 | 2 | `0x028a` |
| 2 | 1 | `0x064a` |
| 3 | 5 | `0x23a4` |
| 4 | 3 | `0x19b5` |
| 5 | 10 | `0x23a5` |
| 6 | 6 | `0x23a6` |
| 7 | 7 | `0x23a7` |
| 8 | 8 | `0x23a8` |
| 9 | 9 | `0x23a9` |

The zone values are the same set as UI 238's table. The order is not the same. The descriptor order is 0, 1, 2, 3, 5, 10, 6, 7, 8, 9. The option-list order is 0, 2, 1, 5, 3, 10, 6, 7, 8, 9. Value 4 is in neither.

Page 27's own rows do not carry a second list. Row 2154 at `0x6158dc44` is kind 12, label image `0x06b1`, options `0x6158ba04` count 2, alternate pointer 0 count 0. Row 2155 at `0x6158dc68` is the same shape with label image `0x282c`. Page 28's first row at `0x6158dc8c` is UI 238, kind 4, text `0x0dd2`, and both the primary and the alternate pointers are `0x6158ba1c` count 10.

T3f's B2 run pointed the new row's primary list at `0x6158ba1c` and left the 2154-shaped descriptor in place. The row glyph became the value-0 zone image. The chooser stayed the two priority strings. Those strings live in `0x6158ba04`, which that run's row no longer pointed at, and the alternate pointer on that row is 0. The value-table readers above do not load images or strings. So the open chooser's pictures are not produced by the value table alone, and they are not produced by the row's primary pointer alone.

## UI 238's name and key

Resource 0106, stride 52, base `0x28803f0`. Slot 238 is `MODE_AF_HOME_AREA_TYPE`. The UI map `0x6062555c + 238 * 4` is `0x60625914`, bytes `a19f0000`: key `0x9fa1`, index 0.

The same table gives 1692 `MODE_AF_HOME_AREA_TYPE_CCW` key `0x9fa1` index 1, and 1693 `MODE_AF_HOME_AREA_TYPE_CW` key `0x9fa1` index 2. 2154 is `MODE_AF_SUBJECT_PRIORITY_RELEASE`, key `0x90a1` index 0.

## What the experiments showed

A clone of 238 with the id set to `0x3D6F` differs from the 2154 clone in exactly two fields: the value-table pointer (`0x606190b7` to `0x606178b1`) and the byte count (2 to 10). Flags, the zero second pointer, the stride and the type byte stay. That replacement is a combined change of those two fields. The binding and the hash registration stay. The row's primary options stay at `0x6158ba1c` count 10, which is the B2 baseline.

Z1 (`work/out/exp-z1-g1.jsonl`) loaded that combined record. OK opened a grid with a scrollbar. The drawn faces were the two priority strings, and the other visible slots were blank. The ten zone images did not appear. Three Rights then OK called the setter with id `0x3D6F` and value 3, which is byte index 3 of `0x606178b1`. Cancel left the RAM byte at 0.

Z2 changed only the byte count, from 2 to 10, and left the pointer at `0x606190b7`. The grid grew and the faces repeated the two priority strings, following the bytes that continue after `00 01`. Three Rights stored 1. The count is the number of slots.

Z3 changed only the pointer, to `0x606178b1`, and left the count at 2. The first two bytes of that table are also `00 01`. The chooser stayed the two priority buttons and stored 1. The pointer is the value source. It does not add slots, and it does not select the zone images.

The row glyph does use the primary option list. The open chooser's faces do not. They follow the value-table byte, and only values 0 and 1 have kind-4 faces in the list the chooser searches. Where that search looks, given that this row's alternate pointer is 0, is still open. `work/out/design.md` records the native-data proposal from the Z1 configuration.
