# AF-ON profile encoding, version 2

The encode and decode rules do not name a storage key. Q7 option (a) is unchanged. The 26-byte record is still the little-endian bytes of the 13 unnamed u16 cells of `0x5b82`, indices 0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14 and 15, in that order. 26 bytes, 208 bits. A later key can carry the same bytes. The codec module itself does not contain that key.

Version is 2. Version 1 is the T10 layout, whose custom tables had no zero and whose horizontal step was 3 bits. A version byte other than 2 is no profile, so a version-1 record is not read as this layout.

## Pose-keyed layout

Zone and position are stored once per pose, in this order: landscape, EXIF 6, EXIF 8. The record does not store a `0x5962` or `0x99a1` index. The mapping from pose to index belongs to the reader, which T8c set to the saved index the stock direct screen writes.

From `hook_t8c2.mjs` `bank()`: when `0x1db1[0]` and `0x1dc1[0]` are both 1, pose word 2 (EXIF 6) selects index 4 and pose word 4 (EXIF 8) selects index 2; every other pose word selects index 0. When the link is off, every pose selects index 0. T6's change indices were 1, 5 and 3. Either map is applied by the reader before encode and after decode. `codec_v2.mjs` accepts only the pose names `landscape`, `exif6` and `exif8`. A profile keyed by cell index is an encode error.

`0x1dd1` (ten bytes) and `0x1de1` (eight bytes) are the shared custom tables. They are not per pose. Even indices are the vertical slots and odd indices are the horizontal slots. Indices 0 and 1 are the current size and step. Indices 2 and 3, then 4 and 5, are the C1 and C2 slots from the T3l layout. Size is `0x9a41[0]`, one byte, shared across poses.

The packed fields are the T10 field set: three pose zones, the size byte, three pose positions, ten dimension bytes, eight step bytes. The other mirror keys (`0x84d1`, `0x88b2`, `0x90d1`, `0x5a11`, `0x1df1`) stay outside this record, as they did in T10.

## Value domain

Command 01 re-read the image (`work/out/domain-t10b.json`). The image base used for file offsets is `0x60021020`. For each field the domain is the union of the descriptor table, the registration payload, the T3l initialization, and the T8c reset values. A partly filled custom array is a combination of those values, one per index. Where that union is a finite set, the field is packed to the set. Size has no descriptor, so it keeps the full byte.

| Field | Domain | Bits | Cell | Why this width |
| --- | --- | --- | --- | --- |
| Zone, each pose | `0, 1, 2, 3, 5, 10, 6, 7, 8, 9` | 4 | 8 | The six pose-cell descriptors (UI 163, 1333, 1642, 1643, 1644, 1645) share `0x60617864`, ten bytes `00 01 02 03 05 0a 06 07 08 09`. Registration is 0, already in the table. Reset zones are 0, 2 and 5, already in the table. |
| Size `0x9a41[0]` | `0..255` | 8 | 8 | UI 1803 has no descriptor record. `0x6006354e` stores the byte after an equality check, with no min or max compare. |
| Position, each pose | `0..1052` | 11 | 16 | UI 1338, 1339, 1646, 1647, 1648 and 1649 share `0x60617946`, 2106 bytes, the integers 0 through 1052. Registration is 0. Reset is 526. Both sit inside the table. |
| `0x1dd1` vertical indices 0, 2, 4, 6, 8 | `0, 1, 3, 5, 7, 9, 11, 15, 19, 23, 27` | 4 | 8 | Descriptor `01 03 05 07 09 0b 0f 13 17 1b` at `0x60617870` and `0x60617886` (UI 1657, 1659, 1661, 1663, 1665). The added value is 0. Eleven values still fit in 4 bits. |
| `0x1dd1` horizontal indices 1, 3, 5, 7, 9 | `0, 1, 3, 5, 7, 9, 11, 15, 19, 23, 27, 33, 39` | 4 | 8 | Descriptor `01 03 05 07 09 0b 0f 13 17 1b 21 27` at `0x6061787a` and `0x60617890`. The added value is 0. Thirteen values still fit in 4 bits. |
| `0x1de1` vertical indices 0, 2, 4, 6 | `0, 1, 2, 3, 4, 5` | 3 | 8 | Descriptor `01 02 03 04 05` at `0x6061789c`. The added value is 0. Six values fit in 3 bits. |
| `0x1de1` horizontal indices 1, 3, 5, 7 | `0, 1, 2, 3, 4, 5, 6, 7, 8` | 4 | 8 | Descriptor `01 02 03 04 05 06 07 08` at `0x606178a1`. The added value is 0. Nine values do not fit in 3 bits, so this field is 4 bits. |

Registration payloads, each key's record header included, are zeros:

| Key | Record | Bytes at the record |
| --- | --- | --- |
| `0x99a1` | `0x6011ebdc` | `a1 99 08 00` then 8 zeros |
| `0x9a41` | `0x6011ec34` | `41 9a 01 00` then 1 zero |
| `0x5962` | `0x600e575c` | `62 59 06 00` then 12 zeros |
| `0x1dd1` | `0x600e4f4c` | `d1 1d 0a 00` then 10 zeros |
| `0x84d1` | `0x600e5fe8` | `d1 84 01 00` then 1 zero |
| `0x88b2` | `0x60117870` | `b2 88 01 00` then 1 zero word |
| `0x90d1` | `0x6011e7a8` | `d1 90 08 00` then 8 zeros |
| `0x5a11` | `0x600e57c4` | `11 5a 0b 00` then 11 zeros |
| `0x1de1` | `0x600e4f5c` | `e1 1d 08 00` then 8 zeros |
| `0x1df1` | `0x600e4f68` | `f1 1d 09 00` then 9 zeros |

T3l initialization writes descriptor default 0 into each mirror byte that is still `0xFF` and each mirror word that is still `0xFFFF`. From those zeros, the C1 landing is `0x1dd1` indices 2 and 3 = 1 and 33, and `0x1de1` indices 0 and 1 = 5 and 8. C2 keeps that pair and writes indices 4 and 5 = 1 and 33, and `0x1de1` indices 2 and 3 = 5 and 8. The untouched custom indices stay 0. Those non-zero landings are inside the descriptor tables. The zeros are the addition.

T8c reset equals the fresh store at every reported slot (`q2b-summary.json`, `disagreements` empty). Read through the saved-index map, the reset profile is zone 2, size 0, position 526 on every pose, `0x1dd1` all 3, `0x1de1` all 1. The change-index cells of the same image are zone 0 and position 526, with the same size, dimensions and steps. None of those values falls outside the domains above. UI 1716 and 1717, zone indices 6 and 7, use the shorter table `0, 2, 5, 10`, which is a subset of the pose zone table.

The stored code of a zone, dimension or step is its index in the domain list above. Zero is the first entry of each custom list, and the descriptor order follows it. Position and size are the raw integers. An 11-bit position above 1052, and a code past the end of a list, decodes as no profile.

`0xFF` is the filler in an uninitialized mirror. The accepted initialization replaces those bytes with 0 before the mirror is a stored profile. A 26-byte record of `0xFF` decodes as no profile. 255 is not a member of the zone, dimension or step domains.

## Marker, version, checksum

| Item | Bits | Value | Why |
| --- | --- | --- | --- |
| Marker | 16 | `0xA70F` | One halfword. It is not 0, so a cleared record fails it. It is not `0x0C80`, the stock named-cell value. |
| Version | 8 | 2 | Any other byte is no profile. |
| Pad | 7 | 0 | `145` field bits end one bit into a byte. Seven zero bits reach the next byte. A 1 fails the decode. |
| CRC-16/IBM | 16 | computed | Poly `0xA001`, init `0xFFFF`, over the first 19 bytes. |
| Spare | 40 | 0 | Bytes 21..25. A nonzero spare is no profile. |

Payload: `4*3 + 8 + 11*3 + 4*5 + 4*5 + 3*4 + 4*4 = 121` bits. The T10 payload was 117. The four new bits are the horizontal step, 4 indices times one extra bit.

`121 + 16 + 8 + 7 + 16 = 168` bits, 21 bytes. `208 - 168 = 40` spare bits. The record fits in 26 bytes. The shortfall is 0. Nothing is dropped.

Bit 0 is the low bit of byte 0. Fields are written low bit first, in this order: marker, version, zone landscape, zone EXIF 6, zone EXIF 8, size, position landscape, position EXIF 6, position EXIF 8, vertical `0x1dd1` indices 0, 2, 4, 6, 8, horizontal `0x1dd1` indices 1, 3, 5, 7, 9, vertical `0x1de1` indices 0, 2, 4, 6, horizontal `0x1de1` indices 1, 3, 5, 7, seven zero pad bits, then the CRC.

## Decode and encode

`decode` returns null, which is "no profile", when any of these fail:

- the length is not 26;
- bytes 21..25 are not 0;
- a pad bit is 1;
- the CRC does not match;
- the marker is not `0xA70F`;
- the version is not 2;
- a zone, dimension or step code is outside its domain list;
- a position is above 1052.

Null leaves the caller on the accepted initialization. This codec does not invent that initialization. T3l's zero fill and T8c's reset image are both encodable profiles; a record that fails the checks above is the absent profile.

`encode` throws `RangeError` for a missing pose, a cell-index key, a non-integer, a value outside the domain, a position outside `0..1052`, or a size outside `0..255`. It does not clamp. Size has no narrower range, so every byte is accepted.

## Samples

Profile A, the T10 sample under pose names: zone `2, 6, 1`, size `0`, position `529, 532, 418`, `0x1dd1` `1, 1, 5, 7, 1, 3, 9, 11, 15, 33`, `0x1de1` `5, 8, 1, 2, 3, 4, 4, 1`.

Registration and T3l all-zero custom profile: every pose zone 0, size 0, every pose position 0, ten dimension zeros, eight step zeros.

T8c reset profile at the saved indices: every pose zone 2, size 0, every pose position 526, ten dimensions of 3, eight steps of 1.

## What the unit test covers

Command 02. Round-trip of profile A, the all-zero custom profile, profile A with only the custom arrays zero, each single dimension and step set to zero, each pose zone and each pose position set to zero, and size set to zero from 255. Mixed arrays: the T3l C1 landing, the C1-and-C2 landing, a profile A with scattered zeros, and the two alternating high/zero patterns. Both T8c reset views. The numeric low and high end of every field. Every zone value on every pose, every position `0..1052` on every pose, every size `0..255`, and every domain value of every dimension and step index.

Every other byte of every zone, dimension and step index is rejected, and so is every position from 1053 through 65535 on every pose, plus a negative position, a fractional position, and sizes `-1`, `256` and `1.5`. A profile keyed by `1`, `5` and `3` is rejected. The rejection is `RangeError`.

A 26-byte zero record, a 26-byte `0xFF` record, and thirteen `0x0C80` halfwords decode as null. Each of the 208 bits, flipped, decodes as null, on profile A and on the all-zero profile. A zone code of 10, a vertical-dimension code of 11, a horizontal-step code of 9, and a position of 1053, each with a recomputed CRC, decode as null. Version bytes 0, 1 and 255, each with a recomputed CRC, decode as null.
