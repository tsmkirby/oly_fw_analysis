# AF-ON profile encoding for the unnamed cells of `0x5b82`

Stopped. The fields named in the brief do not fit in the 26 unnamed bytes together with a marker and a checksum. No field is dropped. No codec is written.

The encode and decode rules are not tied to this key. The budget below is the reason this location cannot hold the profile. A later location can use the same field list.

## Storage

Key `0x5b82` is 16 × u16. Named indices are 5, 12 and 13. The unnamed indices are 0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14 and 15. That is 13 halfwords, 26 bytes. Registration at `0x600e5874` is count 16 and the next 32 bytes are 0 (`work/out/audit-5b82-t10b.json`).

## Fields and bit widths

Bit width is the cell width. A smaller width is not used. An observed value shows that the field can hold that value. It does not show the maximum. A range check that rejected a legal editor value would fail to round-trip that value, which drops part of the field. T6 reads a zone byte, a size byte, a position word, and `0x1dd1` bytes as stored. `0xFFFF` in a position word is the uninitialized sentinel in the T6 design, not a proven maximum for a stored profile.

| Field | Indices | Cell | Bits |
| --- | --- | --- | --- |
| Zone type `0x99a1` | pose banks 1, 5 and 3 | u8 | 24 |
| Size `0x9a41[0]` | 0 | u8 | 8 |
| Position `0x5962` | pose banks 1, 5 and 3 | u16 | 48 |
| Custom dimensions `0x1dd1` | 0..9 | u8 | 80 |
| Custom dimensions `0x1de1` | 0..7 | u8 | 64 |
| Payload | | | 224 bits = 28 bytes |

Banks 1, 5 and 3 are the pose banks in the T6 design (landscape, EXIF 6, EXIF 8). `0x9a41[0]` is the size byte T6 reads. `0x1dd1` indices 2 and 3, 4 and 5, 6 and 7, and 8 and 9 are the C1–C4 dimensions the converter reads. Indices 0 and 1 are `MODE_AF_AREA_SIZE_VERTICAL` and `MODE_AF_AREA_SIZE_HORIZONTAL`. `0x1de1` is the eight-byte custom step table. The brief names both keys. The ten-byte builder does not read `0x1de1`; the custom-size editor writes it (T3l: values 5 and 8 beside `0x1dd1` values 1 and 33).

These are not in the payload, because the brief does not name them as stored profile fields and T6 does not take the ten-byte target from them: the other `0x99a1` and `0x5962` banks, `0x9a41[1]`, `0x84d1`, `0x88b2`, `0x90d1`, `0x5a11`, `0x1df1`, and `+9`. The mirror region that holds the layout is larger than 26 bytes as well (the T3m layout spans 71 bytes). That larger set is not required to reach the stop. The named set already does.

## Why it does not fit

26 unnamed bytes are available. The payload is 28 bytes before a marker, a version, or a checksum.

A marker has to be distinguishable from the ROM default, which is zeros, and from a stock named-cell value such as `0x0c80` (T2 layout v2). The smallest marker used for this key in that layout is 2 bytes (`0xa70f`). A checksum is required. A 2-byte CRC is the checksum in that layout. Either overhead makes the excess larger. The payload alone is already 2 bytes over.

Omitting `0x1dd1` indices 0 and 1, which the ten-byte builder does not read, leaves 26 bytes. That fills the unnamed cells and leaves no byte for a marker or a checksum. That omission is not taken. The indices stay in the field list.

Omitting `0x1de1` would leave 20 bytes, or 18 bytes if indices 0 and 1 of `0x1dd1` were omitted as well. Eighteen bytes is the set the ten-byte builder reads: 3 zone bytes, 1 size byte, 6 position bytes, and 8 custom-dimension bytes. With a 2-byte marker, a version byte, and a 2-byte checksum, that 18-byte set would occupy 23 bytes and would fit. It is not the set in the brief. Dropping `0x1de1` is a change to the functional requirements. Section 0 says only the owner can make it.

T2's layout v2 stored 12 payload bytes and an 18-byte framed record by keeping three zone bytes, one size byte, three position words, and `0x1dd1` indices 0 and 1, and by leaving out the custom presets and `0x1de1`. Sol confirmed that adding those 16 bytes exceeds 26. This budget uses the pose banks T6 consumes (1, 5, 3) rather than indices 0, 2 and 4, and it keeps the custom dimensions the brief names. The same conclusion follows: the named fields do not fit.

## What was not written

`codec.mjs` and the unit tests were not written. A codec of a subset would drop a field. There is no packing to round-trip, and there is no decode rule to apply to a record that cannot be stored.

All-zero remains the ROM default. Under any framing whose marker is not zero, a reset would decode as no profile. That observation is not an implementation.

## Stop

Persistence, the labelled store and load hooks, and the six emulator tests are not started. No emulator process was run. Experiment versions used: 0.
