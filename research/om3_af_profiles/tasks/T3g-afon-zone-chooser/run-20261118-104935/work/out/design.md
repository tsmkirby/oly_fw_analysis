# Native data for the AF-ON zone chooser

This is a proposal for the data a later firmware would have to carry. It is not a storage decision, not a placement of the binding array, and not a firmware image. Every write below that the prototype performed is EMULATOR-ONLY. The live value stays in RAM at `0xa031e920` through T3a's value hooks.

The configuration is Z1, the one that committed a zone value. `work/out/overlay-changed-bytes.csv` is that overlay: 212 bytes, all inside uncompressed section 1, addresses `0x6031e920` through `0x6031ea47`. The stock byte on every row is `0xff`. Nothing in section 6 or section 7 is an overlay byte. The section-7 directory, page, source and action pointers are runtime redirects, recorded in the experiment logs and not in the CSV.

## Action record

Page 27's stock table is two 24-byte records at `0x6150c514`. The prototype adds a third, copied from the first, with UI id `0x3D6F` and editor id `0x1e6`:

`01000000 6f3d0000 00000000 08000000 e6010000 00000000`

The 72-byte table sits at `0x6031ea00`. At runtime the prototype points `0x6150f5f0` at that table and writes count 3 at `0x6150f5f4`. On open, the compare at `0x611a26e1` walks the three records and the third compare is `d0 == d1 == 15727` at `0x6031ea30` (`work/out/exp-z1-g1.jsonl`, step `3d6f-after`).

## Binding record

The stock directory at `0x615cc934` points at `0x615c540c`, count 416. The prototype copies those records, appends one, and points the directory at `0x60320000` with count 417. The new record is:

`e6010000 3b000000 6f3d0000 42000000 2d000000 00000000`

That is editor id `0x1e6`, marker `0x3b`, UI id `0x3D6F`, marker `0x42`, and the word `0x2d` copied from 2154's record. The lookup at `0x6124f523` matched `d0 == d1 == 486` and returned UI 15727 from `0x60322700`, which is the appended record (`work/out/exp-z1-g1.jsonl`, step `3d6f-after`).

`0x60320000` is outside the loaded image. It is the prototype's scratch address. A resident home for the 10008-byte array is still required, and this proposal does not choose one.

## Descriptor and registration

Twenty bytes at `0x6031e9a0`, a clone of UI 238's record at `0x606200e4` with the id set to `0x3D6F`:

`6f3d8000 b1786160 00000000 0a000100 00010000`

Fields: flags `0x0080`, value table `0x606178b1`, second pointer 0, byte count 10, stride 1, tail `0x00000100`, type 1. The ten values are `00 01 02 03 05 0a 06 07 08 09`.

The hash node is at `0x6031e9b8` (descriptor pointer, then the previous bucket head). The bucket is `0x62a84970 + (0x3D6F & 0x7f) * 4 = 0x62a84b2c`. After the link, `FUN_604058bc(0x3D6F)` returns the clone. The previous head observed in Z1 was `0x62a84c68`.

Z1 replaces both the value-table pointer and the byte count relative to the 2154 clone. That is one record, and it is a combined change of those two fields. Z2 and Z3 split them: the count is the number of slots, and the pointer is the source of the value at the cursor index.

## Row

The third page-27 row is a copy of 2154's row with UI id `0x3D6F`. Kind stays 12. The primary option pointer is `0x6158ba1c` and the count is 10. The alternate pointer stays 0. The row glyph for value 0 is the All-grid image from that list. The chooser does not draw those images.

## Section-7 pointers and counts

These are runtime writes. The bytes they replace live in compressed section 7, so they are not rows of the overlay CSV.

| Site | Stock | Prototype |
|---|---|---|
| `0x6158f0fc` page-27 row pointer | `0x6158dc44` | `0x6031e930` |
| `0x6158f100` row count | 2 | 3 |
| `0x61529cec` source-id pointer | `0x61529812` | `0x6031e928` |
| `0x61529cf0` source count | 2 | 3 |
| `0x6150f5f0` action-table pointer | stock table | `0x6031ea00` |
| `0x6150f5f4` action count | 2 | 3 |
| `0x615cc938` binding pointer | `0x615c540c` | `0x60320000` |
| `0x615cc93c` binding count | 416 | 417 |

Provider ids at `0x6031e928` are the u16 values 2154, 2155, `0x3D6F`, and 0.

## T3a's fields

The overlay starts from T3a's section-1 tail: the profile head `00 a7 01 00` at `0x6031e920`, the provider ids, and the two stock rows. The live profile byte is the RAM address `0xa031e920`. The image byte at `0x6031e920` stays 0, which is the default the acceptance reopen reads back.

## Value routing

The prototype installs four hooks, labelled EMULATOR-ONLY in every experiment log. Other UI ids pass through.

- `0x6041931e` returns the byte at `0xa031e920`.
- `0x6041937f` writes D1's low byte to `0xa031e920` and to `0x6031e920`, and returns 0. The confirm caller observed in Z1 was `0x6041937c`.
- `0x60419446` returns the sentinel `0xA70F`. This run does not show that sentinel to be an unregistered id.
- `0x60419696` returns 0.

No native store was selected. Acceptance wrote M and E through the camera's own save (`0x60061268` posted the M image) and the two candidate files matched the stock control byte for byte: M 262144 bytes, E 196608 bytes. A new session on the same file read the profile byte as 0 and `0x90a1` as `[1, 1]`.

## What the chooser draws

The slot count follows the descriptor byte count. The value that OK commits is the byte at the value-table pointer plus the cursor index. Values 0 and 1 are drawn as the two priority kind-4 strings. Every other value in the ten-byte table draws a blank slot. The zone list's kind-12 images stay on the row glyph and do not become chooser faces.

A later single change, not run here, would install a ten-record kind-4 text list as the row's option list on top of this descriptor, with each string id taken from a stock string. That is the strongest remaining explanation for the blank slots. It is a recommendation for a later task, not part of this overlay.
