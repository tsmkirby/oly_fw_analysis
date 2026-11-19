# AF-ON profile encoding

The encode and decode rules do not name a storage key. This file uses the 13 unnamed u16 cells of `0x5b82` as the 26-byte record. A later key can carry the same bytes.

The 28-byte figure is the cell width of the fields. It is not the packed size. The stock setter does not clamp. The legal ranges below are the editor descriptor tables, checked against the image. Where a descriptor does not exist, the field keeps its cell width.

## Storage

Key `0x5b82` is 16 × u16. Named indices are 5, 12 and 13. The record is the little-endian bytes of indices 0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14 and 15, in that order. 26 bytes, 208 bits.

## Legal ranges

Command 08, `work/out/ranges-t10c.json`. The UI map is `0x6062555c`, ids `0..0x8cf`, one u16 key and one u16 index. The descriptor table is `0x6061912c`, stride 20, 1712 records. `FUN_60405178` scans a stride-2 table for a value and a stride-1 table for a byte. An index past the quotient is rejected by `FUN_604052d5` (`mov 0x80,D0`).

The stock setter `FUN_600634ee` stores the byte at `0x6006354e` (`f056`) and the halfword at `0x60063534` (`f076`) after an equality check. There is no min or max compare on that path. Command 08 checked those bytes.

| Field | UI id | Descriptor | Legal values | Bits |
| --- | --- | --- | --- | --- |
| Zone `0x99a1` bank 1 | 1333 | `0x6061fd9c`, table `0x60617864` | `0, 1, 2, 3, 5, 10, 6, 7, 8, 9` | 4, as the table index |
| Zone bank 5 | 1645 | `0x6061fdec`, same table | same 10 values | 4 |
| Zone bank 3 | 1643 | `0x6061fdc4`, same table | same 10 values | 4 |
| Size `0x9a41[0]` | 1803 | no descriptor record | full u8, `0..255` | 8 |
| Position `0x5962` bank 1 | 1339 | `0x60620454`, type 5, stride 2 | `0..1052` (1053 values, min 0, max 1052, 1053 unique) | 11 |
| Position bank 5 | 1649 | `0x606204a4` | `0..1052` | 11 |
| Position bank 3 | 1647 | `0x6062047c` | `0..1052` | 11 |
| `0x1dd1` vertical indices 0, 2, 4, 6, 8 | 1657, 1659, 1661, 1663, 1665 | type 1, stride 1 | `1, 3, 5, 7, 9, 11, 15, 19, 23, 27` | 4 each |
| `0x1dd1` horizontal indices 1, 3, 5, 7, 9 | 1658, 1660, 1662, 1664, 1666 | type 1, stride 1 | `1, 3, 5, 7, 9, 11, 15, 19, 23, 27, 33, 39` | 4 each |
| `0x1de1` vertical indices 0, 2, 4, 6 | 1667, 1669, 1671, 1673 | type 1 | `1, 2, 3, 4, 5` | 3 each |
| `0x1de1` horizontal indices 1, 3, 5, 7 | 1668, 1670, 1672, 1674 | type 1 | `1, 2, 3, 4, 5, 6, 7, 8` | 3 each |

T3b measured the zone dial visiting 0, 1, 2, 3, 5, 10 and 6, and positions 418, 427, 428, 500, 526, 529, 532 and 535. T3l measured `0x1dd1` values 1 and 33 and `0x1de1` values 5 and 8. Those values are inside the tables. They do not widen a table. `0x9a41[0]` has no table, so it stays 8 bits. UI 1803 is the only map entry for that key, and it has no descriptor.

The zone, dimension and step fields are stored as the index in the descriptor's order. Position is the raw integer. Size is the raw byte.

Payload: `4*3 + 8 + 11*3 + 4*5 + 4*5 + 3*4 + 3*4 = 117` bits.

## Marker, version, checksum

| Item | Bits | Value | Why |
| --- | --- | --- | --- |
| Marker | 16 | `0xA70F` | One halfword. It is not 0, so a reset fails it. It is not `0x0C80`, the stock named-cell value T2 used as the stock-plausible pattern. |
| Version | 8 | 1 | Any other byte is no profile, so a later layout is not read as this one. |
| Pad | 3 | 0 | Brings the field bits to a byte boundary. A 1 fails the decode. |
| CRC-16/IBM | 16 | computed | Poly `0xA001`, init `0xFFFF`, over the first 18 bytes. One flipped bit in those bytes, or in the CRC itself, fails the compare. |
| Spare | 48 | 0 | Bytes 20..25. A nonzero spare is no profile. |

`117 + 16 + 8 + 3 + 16 = 160` bits, 20 bytes. `208 - 160 = 48` spare bits. The record fits in 26 bytes. Nothing is dropped.

Bit 0 is the low bit of byte 0. Fields are written low bit first, in this order: marker, version, zone banks 1 then 5 then 3, size, position banks 1 then 5 then 3, vertical `0x1dd1` indices 0, 2, 4, 6, 8, horizontal `0x1dd1` indices 1, 3, 5, 7, 9, vertical `0x1de1` indices 0, 2, 4, 6, horizontal `0x1de1` indices 1, 3, 5, 7, three zero pad bits, then the CRC.

## Decode

`decode` returns null, which is "no profile", when any of these fail:

- the length is not 26;
- bytes 20..25 are not 0;
- a pad bit is 1;
- the CRC does not match;
- the marker is not `0xA70F`;
- the version is not 1;
- a zone, dimension or step code is outside its table;
- a position is above 1052.

Null means the factory initialization accepted in T3l and T8b: the mirror stays `FF`, and the AF-ON target uses that fallback.

`encode` refuses a value outside a table, a position above 1052, or a size outside `0..255`. Size has no narrower range, so every byte is accepted.

## Mirror

The mirror is 71 bytes at `0xa031eeb0`. The codec fills every other byte with `FF` and writes:

| Field | Offset |
| --- | --- |
| Zone banks 1, 5, 3 | `0x01`, `0x05`, `0x03` |
| Size `0x9a41[0]` | `0x08` |
| Position banks 1, 5, 3 | `0x0c`, `0x14`, `0x10`, little-endian u16 |
| `0x1dd1` indices 0..9 | `0x16` |
| `0x1de1` indices 0..7 | `0x37` |

Banks 1, 5 and 3 are the pose banks in the T6 design. `0x1dd1` indices 2 and 3, 4 and 5, 6 and 7, and 8 and 9 are the C1–C4 dimensions. Indices 0 and 1 are the current vertical and horizontal sizes. `0x1de1` is the eight-byte step table. T6's ten-byte builder reads the zone, the size, the position and `0x1dd1`. It does not read `0x1de1`. The step table stays in the record because the brief names it.

Profile A, used by the tests: zone `2, 6, 1`, size `0`, position `529, 532, 418`, `0x1dd1` `1, 1, 5, 7, 1, 3, 9, 11, 15, 33`, `0x1de1` `5, 8, 1, 2, 3, 4, 4, 1`. Landscape bank 1 is zone 2 and position 529. The T6 Small target for that pair is `11 02 03 00 01 00 01 00 00 00`.

## What the unit test covers

Command 09. Round-trip of profile A, every zone value on every stored bank, position 0 and 1052, size 0 and 255, and every table value of every `0x1dd1` and `0x1de1` index. All-zero, all-`FF`, and thirteen `0x0C80` halfwords decode as null. Every one of the 208 bits, flipped, decodes as null. A zone code of 10 with a recomputed CRC decodes as null. A version byte of 2 with a recomputed CRC decodes as null. `encode` throws on zone 4, position 1053, horizontal dimension 2, and vertical step 8.
