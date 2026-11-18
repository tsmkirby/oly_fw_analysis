# T3e native-change proposal

This is a proposal for a later firmware change. It is not a storage decision. The value stays in the RAM byte at `0xa031e920`. Nothing here maps `0x3D6F` onto `0x5b82` or any stock key.

X1 is the proposed record. It opens the two-option chooser. Confirm on that path calls `0x6041937f` with UI id 2154, not `0x3D6F`, and the RAM byte stays 0. X4 changed the second word to `0x0e3d` and the chooser stopped opening. A firmware that only copies 2154's record and changes the UI id does not route the confirm to `0x3D6F`.

## Action record and table

72 bytes at `0x6031ea00`, in the uncompressed section-1 tail. Stock bytes there are `0xFF`. The first 48 bytes are the page-27 table at `0x6150c514`, copied exactly. The third record is 2154's record with the UI id changed:

`010000006f3d00000000000008000000e301000000000000`

| Offset | Value | Why this value |
|---|---|---|
| `+0x00` | 1 | The object `+0x54` compare still passes. |
| `+0x04` | `0x3D6F` | `0x611a26e1` matched this id in X1 and in X4. |
| `+0x06` | 0 | The sub-key compare still passes. |
| `+0x08` | 0 | The null-handler path runs and stores the pair. |
| `+0x0c` | 8 | 8 keeps the action. 0x23 would discard it. |
| `+0x10` | `0x1e3` | X1 opened the chooser with this word. X4's `0x0e3d` matched the record and opened nothing. |
| `+0x14` | 0 | No callback replaces the pair. |

`0x1e3` is also the second word of the stock record at `0x6150c514`, whose UI id is 2154. X1's confirm used that UI id. The proposed record therefore opens 2154's editor. It is the record the brief asked to build, and it is not sufficient for a `0x3D6F` commit.

## Section-7 pointer and count

The only image pointer to `0x6150c514` is the word at `0x6150f5f0`. The next word, `0x6150f5f4`, is the count 2. Both are in compressed section 7, so they are not overlay bytes.

The prototype writes them at run time, after the image is resident:

| Address | Stock | Written |
|---|---|---|
| `0x6150f5f0` | `0x6150c514` | `0x6031ea00` |
| `0x6150f5f4` | 2 | 3 |

A native build can change those two words in the section, or a runtime installer can write them. In both X1 and X4 the page-entry copy already held `0x6031ea00` and count 3 at object `0x6247a270+0x78`. The prepared live-object write did not run.

## Four T3a section-7 fields

Also compressed, also runtime writes in the prototype:

| Address | Stock | Written |
|---|---|---|
| `0x6158f0fc` (page 27 row pointer, descriptor `0x6158f0f8+4`) | `0x6158dc44` | `0x6031e930` |
| `0x6158f100` (page 27 count) | 2 | 3 |
| `0x61529cec` (source id pointer, `0x61529ce8+4`) | `0x61529812` | `0x6031e928` |
| `0x61529cf0` (source count) | 2 | 3 |

Each write is 8 bytes: a `u32` pointer and a `u16` count of 3. The following halfword is left alone.

## Value routing for `0x3D6F`

Installed on stock code, never on an overlay byte. Other ids pass through.

| Site | For `0x3D6F` |
|---|---|
| `0x6041931e` getter | Returns the byte at `0xa031e920`. |
| `0x6041937f` setter | Writes D1's low byte to `0xa031e920` and `0x6031e920`, and returns 0 without the native setter body. |
| `0x60419446` mapped getter | Returns `0xA70F`. That sentinel is T3a's. It was not shown to be unregistered. |
| `0x60419696` index getter | Returns 0. |

X1's confirm did not call the setter with `0x3D6F`. The call was `(2154, 1)` from `0x6041937c`, and the hook passed it through. A later `0x60063431` then ran with key `0x90a1` and index 0. The cell read back `[1, 1]`, the same value it held before OK. The RAM byte stayed 0 on confirm and on cancel.

A native setter branch for `0x3D6F` is still required, and it does not by itself move this confirm off UI 2154. The editor selected by `0x1e3` has to call the setter with `0x3D6F`. This proposal does not contain that editor.

## Overlay bytes

`work/out/overlay-changed-bytes.csv` is the complete proposed overlay. It is the X1 overlay: 212 bytes, every stock byte `0xFF`, all in the section-1 tail. The X4 second word `0x0e3d` is not in it.

| Range | Bytes | Contents |
|---|---|---|
| `0x6031e920` | 4 | Profile head `00 a7 01 00`. The live value is the byte at the uncached alias `0xa031e920`. |
| `0x6031e928` | 8 | Provider ids `2154`, `2155`, `0x3D6F`, `0`. |
| `0x6031e930` | 108 | Three rows. The third, at `0x6031e978`, is stock row `0x6158dc44` with the UI id set to `0x3D6F`. Kind 12, label `0x06b1`, options `0x6158ba04`, count 2, alternate pointer 0. |
| `0x6031e9a0` | 20 | T3a's editor descriptor, id `0x3D6F`. The hash-bucket link was not installed. X1 opened the chooser without it. |
| `0x6031ea00` | 72 | The action table above. |

The row keeps the two-record list because X1 did not commit `0x3D6F`, so the zone-list change was not run. The option pointer is a row field, not an action-record field.
