# T14 per-zone table, correction round

Setting named by the question: custom-switch element `0x90a1[1]` stored value 0, "Always tracks" (PRIOR T1). Zone stored values are PRIOR T8d. Image bytes at `0x60617864` are `00 01 02 03 05 0a 06 07 08 09` (STATIC, r1).

The writer formula below is STATIC for `0x609b3c79` when that function runs. It is the same formula on every direct call. It is not a measured AF-ON record and not a measured half-press record. Equality of the two buttons is conclusion (c) in `work/result.md`: the formula applies only if both edges rebuild from the same seven cells and the same shadow, or both consume a record already built from those same inputs. This image does not show that.

If cached `0xe951[0]` is 1, `0x609832f5` replaces kind, position, vertical, and horizontal from `0xa33d4a94`, `0xa33d4a96`, `0xa33d4a98`, and `0xa33d4a9a` before the kind-2 and priority overrides. The only direct store of those four shadow words is `0x60983156`, which writes 0, `0x020e`, 1, and 1. Whether either button runs that store before a rebuild is open.

| Record bytes | Writer formula |
| --- | --- |
| 0–1 position | `0x88b2[0]`, or `0x020e` when the kind byte is 2 (`0x609b3d1a`) |
| 2 kind | `0x84d1[0]` |
| 3 size key | `0x9a41[0]` |
| 4–5 vertical | `0x1dd1[0]` |
| 6–7 horizontal | `0x1dd1[1]` |
| 8 priority | low byte of `0x1df1[0]`, cleared at `0x609b3d33` when kind is 0, kind is 2, or kind is 3 and vertical is 3 |
| 9 | low byte of `0x1e01[0]` |

Landscape and EXIF 6 do not appear as an index in this writer. Pose can still change the cells before the call. No such store was found in the button bodies that were walked.

| Zone | `0x84d1[0]` | Pose | AF-ON vs half-press | Differing instruction |
| --- | --- | --- | --- | --- |
| All | 0 | landscape | not decided | none identified |
| All | 0 | EXIF 6 | not decided | none identified |
| Single | 1 | landscape | not decided | none identified |
| Single | 1 | EXIF 6 | not decided | none identified |
| Small | 2 | landscape | not decided | none identified |
| Small | 2 | EXIF 6 | not decided | none identified |
| Cross | 3 | landscape | not decided | none identified |
| Cross | 3 | EXIF 6 | not decided | none identified |
| Mid | 5 | landscape | not decided | none identified |
| Mid | 5 | EXIF 6 | not decided | none identified |
| Large | 10 | landscape | not decided | none identified |
| Large | 10 | EXIF 6 | not decided | none identified |
| C1 | 6 | landscape | not decided | none identified |
| C1 | 6 | EXIF 6 | not decided | none identified |
| C2 | 7 | landscape | not decided | none identified |
| C2 | 7 | EXIF 6 | not decided | none identified |
| C3 | 8 | landscape | not decided | none identified |
| C3 | 8 | EXIF 6 | not decided | none identified |
| C4 | 9 | landscape | not decided | none identified |
| C4 | 9 | EXIF 6 | not decided | none identified |
| release | — | either | not decided | S1 up calls `0x610a6323` from `0x610aef7c`. Function-id 10 release calls `0x610a58c7` with 1 from `0x610a2fcb`, and that path also reaches `0x610a6323` at `0x610a5921`. The indirect calls inside `0x610a6323` are unresolved. |

`0x90a1[1] == 0` versus any other cached value changes whether `0x609024c2` calls `0x609025aa` while `0xa33ca30d` is 0. That call reaches `0x6004cdf8` and sometimes `0x6004cefd`. No instruction on that path was shown storing one of the ten record bytes. The path is not shown to be unable to affect a later rebuild.
