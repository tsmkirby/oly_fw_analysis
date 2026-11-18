# Native data for the AF-ON zone chooser, including the face source

This is the data a later firmware would have to carry. It is not a storage decision, not a placement of the binding array, and not a firmware image. Every behaviour write the prototype performed is EMULATOR-ONLY. The live value stays in RAM at `0xa031e920` through T3a's value hooks. The setter `FUN_6041937f` writes that byte and the alias at `0x6031e920`. A new session reads 0 again, because the save file does not gain the value. The image byte at `0x6031e920` is the default 0.

`work/out/overlay-changed-bytes.csv` is the Z1 overlay plus the 36-byte private face record. All of it is in uncompressed section 1 (`0x60134000` through `0x603ba7ff`, flag 0). Nothing in section 6 or section 7 is an overlay byte. The section-7 directory, page, source and action pointers are runtime redirects.

## Action record

Page 27's stock table is two 24-byte records at `0x6150c514`. The prototype adds a third, copied from the first, with UI id `0x3D6F` and editor id `0x1e6`:

`01000000 6f3d0000 00000000 08000000 e6010000 00000000`

The 72-byte table sits at `0x6031ea00`. At runtime the prototype points `0x6150f5f0` at that table and writes count 3 at `0x6150f5f4`.

## Binding record

The stock directory at `0x615cc934` points at `0x615c540c`, count 416. The prototype copies those records, appends one, and points the directory at `0x60320000` with count 417. The new record is:

`e6010000 3b000000 6f3d0000 42000000 2d000000 00000000`

Editor id `0x1e6`, marker `0x3b`, UI id `0x3D6F`, marker `0x42`, word `0x2d`. The word at +0x10 is the face-table key. `0x2d` is also editor `0x1e3`'s key (2154, `0x615c5e14`). 2155's key is `0x2e`. `0x60320000` is outside the loaded image. A resident home for the 10008-byte array is still required, and this proposal does not choose one.

## Descriptor and registration

Twenty bytes at `0x6031e9a0`, a clone of UI 238 at `0x606200e4` with the id set to `0x3D6F`:

`6f3d8000 b1786160 00000000 0a000100 00010000`

Flags `0x0080`, value table `0x606178b1`, second pointer 0, count 10, stride 1, type 1. The ten values are `00 01 02 03 05 0a 06 07 08 09`. The hash node is at `0x6031e9b8`. The bucket is `0x62a84970 + (0x3D6F & 0x7f) * 4 = 0x62a84b2c`.

## Row

The third page-27 row is a copy of 2154 with UI id `0x3D6F`. Kind stays 12. The primary list is `0x6158ba1c`, count 10. The alternate pointer stays 0. That list is the row glyph. It is not the chooser's face list.

## Face source

`FUN_611f81aa` resolves each slot. The record it reads is `*(chooser+0xdb8)`. `FUN_611f7f01` selects that record from the table at `0x6037bedc`, stride `0x24`, count `0x60`, by the halfword key. The key is the binding word at +0x10.

Record fields the drawer reads:

- +0 `u16` key
- +8 `u16` count, used for the face search and the help search
- +0xc `u32` face list
- +0x10 `u32` help list

Key `0x2d` is record 76 at `0x6037c98c`: count 2, face list `0x61575880` (kind 4, values 0 and 1, string ids `0x124f` and `0x127b`), help list `0x61576520`. That is why the stock chooser shows the two priority strings and eight blank slots. The reader is `FUN_611c7785`. Kind 12 is an image kind there, so the zone records can be drawn.

A firmware that shows the zone faces on this row needs a face-table record whose count is 10 and whose list is `0x6158ba1c`, and a binding word at +0x10 that selects it. Key `0x2d` cannot be reused for that record, because editor `0x1e3` selects it. Every key in the 96-record table is already selected by some binding (`work/out/static-free-keys-h1.txt`). This proposal does not choose a new key, does not extend the scan, and does not place a new record in the image. The prototype leaves record 76 and the binding word `0x2d` as they are, and substitutes the pointer for UI `0x3D6F` only.

The substituted record is 36 bytes at `0x6031ea48`, stock `0xFF`, a copy of record 76 with count 10 and list `0x6158ba1c`. The help pointer stays `0x61576520`. The hook is `0x611f7f42`: after the lookup stores record 76, if the parent halfword at +0x54 is `0x3D6F`, the stored pointer becomes `0x6031ea48`. That hook is EMULATOR-ONLY.

## Value

The profile byte is RAM at `0xa031e920`. The setter writes the same byte to `0x6031e920`. Confirm of a slot stores `table[index]` through `FUN_6041937f`. Cancel does not call the setter. A native save leaves the settings stores byte-identical to a stock control, and a new session reads the profile as 0.
