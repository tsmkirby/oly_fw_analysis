# AF profile layout and the position copies

The mirror is the 71 bytes at `0xa031eeb0`. The flag is the next byte, `0xa031eef7`. The zone byte is separate, at `0xa031e920`.

Factory defaults are the bank-7 registration payloads. Every mirror key's ROM payload is zeros. Boot values that are not zero are runtime values, not a second default table. The zone-type default is 0 (All). The separate zone byte's Z5 image value is also 0. K1, with no overlay, reads that byte as `0xFF`.

| Key | Mirror offset | Layout count | Width | Live address |
| --- | --- | --- | --- | --- |
| `0x99a1` | `0x00` | 8 | 1 | `0x6295946c` |
| `0x9a41` | `0x08` | 2 | 1 | `0x62959484` (live width 1) |
| `0x5962` | `0x0a` | 6 | 2 | `0x62920bf0` |
| `0x1dd1` | `0x16` | 10 | 1 | `0x62920982` |
| `0x84d1` | `0x20` | 1 | 1 | `0x62920fa5` |
| `0x88b2` | `0x22` | 1 | 2 | `0x629526c0` |
| `0x90d1` | `0x24` | 8 | 1 | `0x62959355` |
| `0x5a11` | `0x2c` | 11 | 1 | `0x62920c18` |
| `0x1de1` | `0x37` | 8 | 1 | `0x6292098c` |
| `0x1df1` | `0x3f` | 8 | 1 | `0x62920994` (descriptor and live count 9) |

`0x1df1` index 8 is read from the live cell. The mirror holds eight bytes. Subject Detect is not in this table. It is `0x1e71[0]`, and it reads 0.

Half-press after boot, All: `0x5962` is six 526s and `0x88b2` is 526. One main-dial detent changes the type to Single and leaves the position at 526. The AF-ON move writes 994 into the mirror's `0x5962[1]` and `0x88b2[0]` only.

## Copies outside the mirror

These are not mirror fields. The exit restore has to put them back because the screen publishes the mirror's position into them.

| Copy | Address | Width | Half-press value | AF-ON value |
| --- | --- | --- | --- | --- |
| Settings word the getter reads | `0x62953c10` | 4 | 526, then 0 | 994, then 0 |
| Saved editor record | `0x60379d64` | 16 | `FF FF FF FF` then zeros, until a normal OK saves its own record | eight halfwords starting at 994 |
| Editor object position | object+`0x42` (`0x62473182` on these boots; object `0x62473140`) | 2 of the 16-byte record | 526 | 994 |
| Custom-size words | `0x62954108` (M+211464), 72 bytes | ten `0x1dd1` words then eight `0x1de1` words | `3,3,3,3` and `1,1,1,1` at the C1/C2 slots | the mirror's C1 and C2, written by `0x60063519` before the setter hook |

The object address is the `a0` of `0x6119af02` on that exit, not a fixed global. The two boots in p1 allocated it at the same place. The restore uses the pointer from that call.

Custom sizes from a zeroed mirror, Right, main dial, sub dial, OK:

- C1: `0x1dd1[2]=1`, `0x1dd1[3]=33`, `0x1de1[0]=5`, `0x1de1[1]=8`, `0x1df1[4]=1`.
- C2 keeps C1 and adds `0x1dd1[4]=1`, `0x1dd1[5]=33`, `0x1de1[2]=5`, `0x1de1[3]=8`, `0x1df1[5]=1`.

Those land in the mirror. The half-press `0x1df1` stays nine bytes.
