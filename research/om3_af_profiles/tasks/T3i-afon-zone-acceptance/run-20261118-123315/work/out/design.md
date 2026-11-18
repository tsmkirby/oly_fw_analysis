# Native data for the final AF-ON zone row

This is the data a later firmware would have to carry. It is not a storage decision and not a placement of the binding array. Every behaviour write in the prototype is EMULATOR-ONLY. The live value stays in RAM at `0xa031e920`. The image byte at `0x6031e920` is the default 0. A native save does not gain the value, and a new session reads 0.

`work/out/overlay-changed-bytes.csv` is the complete image diff of the final configuration: the T3a tail, the UI-238 descriptor clone, the kind-4 row, the 72-byte action table, the private face record (including +0x10), and the 120-byte help list. 368 bytes. All of them are in uncompressed section 1, `0x60134000` through `0x603ba7ff`, flag 0. No overlay byte is in section 6 or section 7. The section-7 directory, page, source, and action pointers are runtime redirects.

Load records are 12 bytes at file offset `0x8b08` (runtime `0x60029b28`). Record 0 is section 1: destination `0x60134000`, flag 0. The next record starts at `0x603ba800`. Record 6 is section 7: destination `0x6103f000`, flag 1, and the next record starts at `0x6169e800`. `work/out/cmd/12.out`.

## Action record

Page 27's stock table is two 24-byte records at `0x6150c514`. The prototype adds a third, copied from the first, with UI id `0x3D6F` and editor id `0x1e6`. The 72-byte table sits at `0x6031ea00` (section 1). At runtime the prototype points `0x6150f5f0` at that table and writes count 3 at `0x6150f5f4`.

Native constraint: `0x6150f5f0` is in compressed section 7. A firmware change of that pointer is a compressed-section edit. The table itself is 72 bytes.

## Binding record

The stock directory at `0x615cc934` points at `0x615c540c`, count 416. The prototype copies those records, appends one, and points the directory at `0x60320000` with count 417. The new record is editor `0x1e6`, UI `0x3D6F`, face key `0x2d` (the same key as editor `0x1e3` / 2154). 2155's key is `0x2e`.

`0x60320000` is inside the loaded image. File offset `0x2fefe0`, image length 33554368. The 10008 bytes there (`416 * 24 + 24`) are `0xFF`, and the address is in uncompressed section 1. `work/out/cmd/12.out`. Those `0xFF` bytes do not establish a native owner for the array. The stock array and its directory are in compressed section 7. This proposal does not choose a resident home for the 10008-byte array.

## Descriptor and registration

Twenty bytes at `0x6031e9a0` (section 1), a clone of UI 238 at `0x606200e4` with id `0x3D6F`. Value table `0x606178b1`, count 10, stride 1, type 1. Values `00 01 02 03 05 0a 06 07 08 09`. The hash node is runtime at `0x6031e9b8`. The bucket is `0x62a84970 + (0x3D6F & 0x7f) * 4 = 0x62a84b2c`.

Native constraint: the stock descriptor table is the hashed table (1712 records of 20 bytes). Registration is a bucket update. The prototype's 20-byte clone is section 1; the bucket write is runtime.

## Row

36 bytes at `0x6031e978`. Kind `u16` at +4 is 4. Label `u16` at +6 is `0x0DD2` ("@A040@AF Target Mode"). Primary list `0x6158ba1c`, count 10. Alternate pointer 0, alternate count 0. The chooser does not read the row's alternate list; it reads the face record. Item 1 did not show the alternate in use, so it stays 0.

This is one change against H plus the help list. H had left the row as a kind-12 copy of 2154, which drew the half-press glyph and its label. The final row shows "AF Target Mode" and the current zone glyph (`work/out/accept-c1-zone-row.png`, `work/out/accept-c1-commit-9.png`).

Native constraint: 36 bytes in the page's row array. The page-27 list pointer the prototype redirects (`0x6158f0f8`) is in compressed section 7.

## Face record and help list

The substituted face record is 36 bytes at `0x6031ea48`, stock `0xFF`, a copy of record 76 (`0x6037c98c`) with count 10 and face list `0x6158ba1c`. Combined with the help list, +0x10 is `0x6031ea6c`. The hook at `0x611f7f42` writes that pointer when the parent halfword at +0x54 is `0x3D6F`. Role: behaviour. EMULATOR-ONLY. Record 76 itself is not rewritten. Key `0x2d` stays shared with editor `0x1e3`.

The help list is 120 bytes at `0x6031ea6c`: ten kind-4 records, text `0x01a8`, extra `0x61574870`, values in UI-238 order. See `work/out/help.md`.

Native constraint: the face table at `0x6037bedc` is uncompressed section 1, stride `0x24`, 96 records, and every key is already selected by some binding. This proposal does not choose a new key and does not extend the scan. The help list is 120 bytes; stock help lists live in compressed section 7. The face record's +0x10 has to point at whichever list a firmware owns.

## Section-7 pointers and counts

Runtime writes, all EMULATOR-ONLY, all in compressed section 7:

- `0x6158f0f8` page list, pointer `0x6031e930`, count 3
- `0x61529ce8` source list, pointer `0x6031e928`, count 3
- `0x6150f5f0` action table, pointer `0x6031ea00`, count 3
- `0x615cc934` binding directory, pointer `0x60320000`, count 417

Page 28 is not one of these. It has no native route. The acceptance renders it by the T3c reference construction: `0x61529cec = 0x61529816`, count 3, and the constructor at `0x61203696` rewrites page id 27 to 28 once while the phase is `build`. That construction is EMULATOR-ONLY and is labelled as a reference construction.

## Value routing

Getter `0x6041931e` returns the byte at `0xa031e920` when `D0`'s low halfword is `0x3D6F`. Setter `0x6041937f` writes `D1`'s low byte to `0xa031e920` and to `0x6031e920` and returns 0. Mapped getter `0x60419446` returns `0xA70F`. Index getter `0x60419696` returns 0. Any other id passes through. All four hooks are EMULATOR-ONLY.

Confirm stores `table[index]` through the setter. Cancel does not. Acceptance stored 2 and then 9, and cancel from C4 left the byte at 0 (`work/out/accept-i1.jsonl`). The M and E stores matched the stock control byte for byte (262144 and 196608). A new session read the profile as 0.
