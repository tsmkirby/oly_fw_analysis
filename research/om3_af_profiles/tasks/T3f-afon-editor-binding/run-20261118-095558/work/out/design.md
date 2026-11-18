# Native-change proposal

This is a proposal for the emulator prototype. It is not a storage decision. The value stays in the RAM profile byte `0xa031e920`, through the EMULATOR-ONLY value hooks. It is not mapped onto a stock key.

The configuration that commits UI `0x3D6F` is the B4 run: the new editor binding, plus a descriptor cloned from 2154 and linked into the hash. Pointing the row at the zone list changes the glyph on the row and does not change the chooser.

## Action record

72 bytes at `0x6031ea00`, in the resident section-1 tail (stock bytes `0xFF`). The first 48 bytes are the page-27 table. The third record is 2154's record with the UI id set to `0x3D6F` and the second word set to `0x1e6`:

`01 00 00 00  6f 3d 00 00  00 00 00 00  08 00 00 00  e6 01 00 00  00 00 00 00`

`8` is a dispatch value that passes the `0x23` discard. It is not established as a keep-value.

Runtime writes, because the pointer lives in compressed section 7: `0x6150f5f0` → `0x6031ea00`, and the count at `0x6150f5f4` → 3.

## Editor binding

`FUN_6124f4e5` scans the key-8 array of 24-byte records. The new record copies the `0x1e3` record. Its first word is `0x1e6`, which is free in the stock 416. Its word at +8 is `0x3D6F`. The other words stay `0x3b`, `0x42`, `0x2d`, 0. The role of the word at +16 is not established.

The 417 records are 10008 bytes. They do not fit in the resident `0xFF` tail, which ends at `0x6031f000` (1464 bytes from `0x6031ea48`). RAM at and above `0x6031f000` is not loaded from the image; it reads back as `0xA5`. A runtime write of the 10008 bytes at `0x60320000` was visible to the lookup for the whole menu session. The directory writes are `0x615cc938` → `0x60320000` and `0x615cc93c` → 417.

A final image needs a resident home for those 10008 bytes. `0x60320000` is where this prototype put them. Whether the firmware allocates that region later was not measured.

## Descriptor

The two icon buttons come from the editor descriptor, not from the row's option pointer.

2154's descriptor at `0x6062132c` is 20 bytes: UI id, flags `0x0080`, template `0x606190b7`, count 2. The overlay record at `0x6031e9a0` in the proposed CSV is that descriptor with the id replaced by `0x3D6F`:

`6f 3d 80 00  b7 90 61 60  00 00 00 00  02 00 01 00  01 00 00 00`

`FUN_604058bc(0x3D6F)` returns A0 = 0 until the record is linked. The link is a runtime write, because the previous bucket head exists only after boot. Node at `0x6031e9b8`: descriptor pointer, then the previous head. Bucket `0x62a84970 + (0x3D6F & 0x7f) * 4` = `0x62a84b2c`, written with the node pointer. After the link, `FUN_604058bc` returns A0 = `0x6031e9a0`.

Without this descriptor the binding still matches and a screen opens, but the buttons do not draw and confirm stored 12. With it, OK opens the two-option chooser and confirm of the value not currently held calls `0x6041937f` with UI `0x3D6F` and value 1.

## Section-7 fields already in the prototype

Each is a runtime write of a pointer and a count. The following halfword is left alone.

| Address | Stock | Written |
|---|---|---|
| `0x6158f0fc` | `0x6158dc44` | `0x6031e930` |
| `0x6158f100` | 2 | 3 |
| `0x61529cec` | `0x61529812` | `0x6031e928` |
| `0x61529cf0` | 2 | 3 |
| `0x6150f5f0` | page-27 action table | `0x6031ea00` |
| `0x6150f5f4` | 2 | 3 |
| `0x615cc938` | `0x615c540c` | the runtime binding copy |
| `0x615cc93c` | 416 | 417 |

## Value routing

EMULATOR-ONLY hooks. Other ids pass through.

| Hook | For `0x3D6F` |
|---|---|
| `0x6041931e` | returns the byte at `0xa031e920` |
| `0x6041937f` | writes D1's low byte to `0xa031e920` and `0x6031e920`, returns 0 |
| `0x60419446` | returns `0xA70F`. Not shown to be unregistered |
| `0x60419696` | returns 0 |

`0x60063431` was not entered on the confirm that stored 1. The hook returns before the stock store.

## What the row's option pointer does

The row at `0x6031e978` is stock row 2154 with the UI id changed. Options stay `0x6158ba04`, count 2, in the proposed overlay.

B2 changed that pointer to `0x6158ba1c` and the count to 10. The row then drew the value-0 zone image, the grid marked All. OK still opened the two priority buttons, and confirm stored 1, the priority value. The ten images did not appear in the chooser.

B3 replaced the list with one kind-4 record, value 0, text id `0x0034` (the exact English string "All", resource string record 5). The row drew the word All. The chooser was still the two priority buttons.

So the row pointer selects the glyph on the row. The open chooser follows the descriptor template. A zone chooser still needs a descriptor whose template presents `0x6158ba1c`. That was not built. The ten zone values other than 0 have no text id tied to them by a record found here.

## Overlay bytes

`work/out/overlay-changed-bytes.csv` is the B4 overlay: T3a's section-1 tail, the third row as a 2154 copy with UI `0x3D6F`, the 72-byte action table, and the 20-byte descriptor cloned from 2154. Every byte is in uncompressed section 1, below `0x6031f000`. The binding table, the directory writes, the four T3a redirects, the action-table pointer, and the descriptor hash link are runtime writes and are not CSV rows.
