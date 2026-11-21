# T14 per-zone record table

Setting under test: custom-switch element `0x90a1[1]` stored value 0, "Always tracks" (PRIOR T1). Stock AF-ON and stock half-press.

Zone stored values are PRIOR T8d. The bytes at `0x60617864` are `00 01 02 03 05 0a 06 07 08 09` (STATIC).

Both buttons, both poses, and the release path use writer `0x609b3c79`. The writer’s cell indices are constants. Landscape and EXIF 6 therefore take the same instructions. "Equal" means the ten bytes match for the same live cells.

Shared formula, little-endian halves:

| Record bytes | Value |
| --- | --- |
| 0–1 position | `0x88b2[0]`, or `0x020e` (526) when the kind byte is 2 |
| 2 kind | `0x84d1[0]` |
| 3 size key | `0x9a41[0]` |
| 4–5 vertical | `0x1dd1[0]` |
| 6–7 horizontal | `0x1dd1[1]` |
| 8 priority | low byte of `0x1df1[0]`, cleared when kind is 0, kind is 2, or kind is 3 and vertical is 3 |
| 9 | low byte of `0x1e01[0]` |

If cached `0xe951[0]` is 1, `0x609832f5` first replaces kind, position, vertical, and horizontal from `0xa33d4a94`, `0xa33d4a96`, `0xa33d4a98`, and `0xa33d4a9a`. The kind-2 position force and the priority clear then run on that replaced kind. This gate is `0xe951`, shared by every caller of the writer.

Custom zones still use `0x1dd1[0]` and `0x1dd1[1]`. The writer has no C1–C4 index and no AF Home key.

| Zone | `0x84d1[0]` | Pose | Bytes 0–9, AF-ON vs half-press | Differing instruction |
| --- | --- | --- | --- | --- |
| All | 0 | landscape | equal | — |
| All | 0 | EXIF 6 | equal | — |
| Single | 1 | landscape | equal | — |
| Single | 1 | EXIF 6 | equal | — |
| Small | 2 | landscape | equal | — |
| Small | 2 | EXIF 6 | equal | — |
| Cross | 3 | landscape | equal | — |
| Cross | 3 | EXIF 6 | equal | — |
| Mid | 5 | landscape | equal | — |
| Mid | 5 | EXIF 6 | equal | — |
| Large | 10 | landscape | equal | — |
| Large | 10 | EXIF 6 | equal | — |
| C1 | 6 | landscape | equal | — |
| C1 | 6 | EXIF 6 | equal | — |
| C2 | 7 | landscape | equal | — |
| C2 | 7 | EXIF 6 | equal | — |
| C3 | 8 | landscape | equal | — |
| C3 | 8 | EXIF 6 | equal | — |
| C4 | 9 | landscape | equal | — |
| C4 | 9 | EXIF 6 | equal | — |
| release (AF-ON up vs S1 up) | (unchanged) | either | equal | — |

Small (kind 2) is the zone whose position half the writer replaces with `0x020e` at `0x609b3d1a`. All (kind 0) and Small clear byte 8 at `0x609b3d33`. Cross (kind 3) clears byte 8 when the vertical half is 3. Those overrides run for both buttons.

Release: S1 event `0x1000003` and AF-ON up `0x610b9653` both call `0x610a6323`. That function has no call of `0x609b3c79`. It does not build a second record.
