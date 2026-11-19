# AF-ON profile layout

The zone-type byte stays where Z5 put it: `0xa031e920`, the same DRAM byte as cached `0x6031e920`. Z5 stores `00 a7 01 00` at `0x6031e920`–`0x6031e923`. Central-edge occupies `0x6031e925`–`0x6031e927`. The relocated block occupies `0x6031ed00` through `0x6031eeaf` inclusive (408 bytes in the Z5 CSV). This task adds no image byte.

## Why the neighbouring holes are too small

`work/out/ram-gaps-m1.json` lists free `FF` runs of at least 8 bytes in `0x6031e800`–`0x60322000` that are not Z5 rows:

| start | bytes | why it is not the mirror |
| --- | --- | --- |
| `0x6031e910` | 16 | Ends at the zone byte. Position alone is 6 × u16 = 12 bytes, and `0x1dd1` is 10. The mirror below is 55 bytes. |
| `0x6031eae4` | 46 | Between the Z help text and the central-edge bytes. Too tight, and it splits Z5's block. |
| `0x6031ece2` | 30 | Immediately in front of the relocated block. Still short of 55. |
| `0x6031ed18`, `0x6031ed72` | 8 and 14 | Cracks inside the relocated block. Not used. |
| `0x6031eeb0` | 12624 | The first run that is clear of Z5 and large enough. |

`0x6031e924` is the single free byte between the 4-byte head and central-edge. It is not a field.

## Placement

| item | address | role |
| --- | --- | --- |
| mode flag | `0xa031e91f` | Last byte of the 16-byte hole. Value 1 means the screen is in AF-ON mode. A session write, not a profile field, not an image byte. |
| zone byte | `0xa031e920` | Unchanged address. The hook also writes `0x6031e920`. |
| mirror | `0xa031eeb0` | Uncached alias of `0x6031eeb0`. 55 bytes, `0xa031eeb0`–`0xa031eee6`. |

The mirror is the screen's copy of the cells it actually reads and writes, plus `0x5a11` so AF-ON mode can offer C1–C4 without writing the half-press on/off cells.

| key | offset | count | width | bytes |
| --- | --- | --- | --- | --- |
| `0x99a1` | `0x00` | 8 | 1 | 8 |
| `0x9a41` | `0x08` | 2 | 1 | 2 |
| `0x5962` | `0x0a` | 6 | 2 | 12 |
| `0x1dd1` | `0x16` | 10 | 1 | 10 |
| `0x84d1` | `0x20` | 1 | 1 | 1 |
| pad | `0x21` |  |  | 1 |
| `0x88b2` | `0x22` | 1 | 2 | 2 |
| `0x90d1` | `0x24` | 8 | 1 | 8 |
| `0x5a11` | `0x2c` | 11 | 1 | 11 |

A write of `0x99a1` index 0 or index 1 also stores the low byte at `0xa031e920`. The direct screen writes index 1, the change index. Index 0 of the mirror is not updated by OK. The zone byte follows index 1, because that is the value the screen leaves in effect.

`0x99d2`, `0xdfa1`, and `0x9fa1` are not in the mirror. The stock screen does not write them, and they are the home cells the AF-ON profile must not use.

The image byte at `0x6031e920` in the Z5 overlay is 0. A new session that does not run the editor reads 0 (`accept-e3` session `reopen`). The mirror is `FF` in the image. A new session does not keep the edited mirror: it was never an image byte, and the native stores from the confirm session match a session that never edited.
