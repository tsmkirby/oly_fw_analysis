# Ten-byte field sources, before and after the profile read

Before is Z5. After is the one combined change in `design.md`. The half-press record is not this table: `0x609b3c79` still reads half-press `0x9a41`, `0x1dd1[0,1]`, `0x84d1`, `0x88b2`, `0x1df1` and `0x1e01`.

Bank is the pose index: 1, 5 or 3 when `0x1db1[0]` and `0x1dc1[0]` are both 1, and 1 otherwise. `0xFF` / `0xFFFF` is an uninitialised mirror cell.

| offset | field | before (Z5) | after, AF-ON builder only |
| --- | --- | --- | --- |
| zone argument | area type into `0x609b3ecd` | `0xa031e920`, one byte | mirror `0x99a1[bank]`. `0xFF` → the zone byte (image 0) |
| +0 | position | `0x99d2[D3]`, then 526 if kind is 2 | mirror `0x5962[bank]`. `0xFFFF` → 0. Kind 2 still forces 526 |
| +0 | position, `0x88b2` | not read here. Half-press writer reads half-press `0x88b2[0]` | still not read here. Mirror `0x88b2` is not the per-pose cell |
| +2 | kind | converter of the zone argument | same converter, of the mirror zone |
| +3 | size key | `0xdfa1[0]` | mirror `0x9a41[0]`. `0xFF` → 0 |
| +4 | vertical | converter. C1–C4 read half-press `0x1dd1` indices 2, 4, 6, 8 | same, except those `0x1dd1` reads come from the mirror. `0xFF` → 0 |
| +6 | horizontal | converter. C1–C4 read half-press `0x1dd1` indices 3, 5, 7, 9 | same, from the mirror |
| +8 | priority | converter, including half-press `0x1df1`, then the kind clear | unchanged |
| +9 | C-AF central start | `0x1e01[0]` | factory 0. The mirror has no `0x1e01` cell |

All, Single and Small keep the converter's 1×1 at +4 and +6. A fresh session, mirror `0xFF` and zone byte 0, is the All record `0e 02 02 00 01 00 01 00 00 00`.
