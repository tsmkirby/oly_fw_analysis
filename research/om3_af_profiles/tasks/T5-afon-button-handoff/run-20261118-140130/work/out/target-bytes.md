# Ten-byte AF target and the AF-ON profile byte

Listings below were disassembled from the overlay bytes, not from Ghidra's stock program memory, and checked against those bytes: 314 instructions, 0 mismatches (`work/out/cmd/04.out`). Addresses are runtime. `0x6031e920` and `0xa031e920` are the same DRAM byte (OM-Emu maps `0xA0000000` as the uncached view of `0x60000000`).

## Where the ten bytes sit

The consumer record is ten bytes at `0xa33ca384`. The home builder writes one orientation bank, and reconciliation copies the selected bank there. The builder is `0x60a8f6bb`. Banks, selected by the orientation argument in D2:

| D2 | bank |
| --- | --- |
| 0 | `0xa031eaa0` |
| 1 | `0xa031eab0` |
| 2 | `0xa031eac0` |

In the combined image those three addresses, and the state they belong to, are relocated by `+0x3e0` (see `design.md`). The field layout is unchanged.

## Which byte is which

The builder at `0x60a8f708` is the producer. Checked bytes:

```
60a8f708 fccca19f0000  mov 0x9fa1,D0
60a8f70e 89            mov D2,D1          ; orientation into the getter
60a8f70f fcdc00000000  mov 0x0,A0
60a8f715 dd6b3c5dffc00c call 0x60063380,[d2,d3],0xc
60a8f71c 3c            mov sp,A0
60a8f71d 2004          add 0x4,A0
60a8f71f ddae47f2ffe014 call 0x609b3ecd,[d2,d3,a2],0x14
60a8f726 f8b804        movbu (0x4,sp),D0
60a8f729 f85302        movbu D0,(0x2,A3)  ; +2 kind
60a8f72c f8b805        movbu (0x5,sp),D0
60a8f72f f87304        movhu D0,(0x4,A3)  ; +4 vertical
60a8f732 f8b806        movbu (0x6,sp),D0
60a8f735 f87306        movhu D0,(0x6,A3)  ; +6 horizontal
60a8f738 f8b807        movbu (0x7,sp),D0
60a8f73b f85308        movbu D0,(0x8,A3)  ; +8 priority
60a8f73e fccca1df0000  mov 0xdfa1,D0
60a8f757 f85303        movbu D0,(0x3,A3)  ; +3 size
60a8f75a fcccd2990000  mov 0x99d2,D0
60a8f760 8d            mov D3,D1          ; position orientation
60a8f76e f073          movhu D0,(A3)      ; +0 position
60a8f770 fccc011e0000  mov 0x1e01,D0
60a8f789 f85309        movbu D0,(0x9,A3)  ; +9
60a8f78c f84302        movbu (0x2,A3),D0
60a8f78f a002          cmp 0x2,D0         ; kind 2 forces position 526
60a8f7bb fccc0e020000  mov 0x20e,D0
60a8f7c1 f073          movhu D0,(A3)
60a8f798 a000          cmp 0x0,D0         ; kind 0 clears priority
60a8f7a1 a003          cmp 0x3,D0         ; kind 3 and vertical 3 clears priority
60a8f7c3 fccc00000000  mov 0x0,D0
60a8f7c9 f85308        movbu D0,(0x8,A3)
```

| offset | width | meaning | producer |
| --- | --- | --- | --- |
| +0 | u16 | grid position. 526 (`0x020e`, bytes `0e 02`) is the centre | `0x99d2`, unless kind is 2, which forces 526 |
| +2 | u8 | internal area kind | converter `0x609b3ecd` |
| +3 | u8 | target-size key `0xdfa1` | `0xdfa1`, index 0 |
| +4 | u16 | vertical size | converter |
| +6 | u16 | horizontal size | converter |
| +8 | u8 | central priority | converter, then cleared for kind 0, kind 2, or kind 3 with vertical 3 |
| +9 | u8 | C-AF central start `0x1e01` | `0x1e01`, index 0 |

The zone type is not stored in the ten bytes. It is the argument to the converter. The converter writes four bytes at A0: +0 kind, +1 vertical, +2 horizontal, +3 priority. Its jump table is `0x60a7da08`, index = type × 4. Checked heads:

| UI value | meaning | converter head | kind | size | priority source |
| --- | --- | --- | --- | --- | --- |
| 0 | All | `609b3ee8 mov 2` | 2 | 1×1 | cleared, because kind is 2 |
| 1 | Single | `jmp 609b3fc5` clear | 0 | 1×1 | cleared, because kind is 0 |
| 2 | Small | `609b3eef mov 3`, then the 1×1 path | 3 | 1×1 | converter writes 0 |
| 3, 5, 10 | Cross, Mid, Large | `mov 3`, then read `0x1df1` | 3 | 1×1 | `0x1df1` |
| 6 | C1 | `609b3f13 mov 7`, then `0x1dd1` index 2 and 3, `0x1df1` index 4 | 7 | from `0x1dd1` | `0x1df1` |
| 7 | C2 | kind 7, `0x1dd1` index 4 and 5 | 7 | from `0x1dd1` | `0x1df1` index 5 |
| 8 | C3 | kind 7, index 6 and 7 | 7 | from `0x1dd1` | index 6 |
| 9 | C4 | kind 7, index 8 and 9 | 7 | from `0x1dd1` | index 7 |

UI order on the row is `[0, 1, 2, 3, 5, 10, 6, 7, 8, 9]`. Types 6–9 read the stock half-press custom cells. That is a read. This task does not use those four values for the button trials, so the size claim does not depend on `0x1dd1`.

## Where orientation comes from

Reconciliation reads `0xe91` index 3 (pose: 4 is CCW, 5 is CW), `0x1db1` index 0 (area-orientation enable) and `0x1dc1` index 0 (position-orientation enable). D2 is the area orientation passed into the `0x9fa1` getter (`mov D2,D1` at `0x60a8f70e`). D3 is the position orientation passed into `0x99d2` (`mov D3,D1` at `0x60a8f760`). The single RAM profile byte is not stored per orientation.

## The legacy AF Home read, and the one-byte swap

Before the swap, the zone type is `0x9fa1`. The twenty bytes at `0x60a8f708` are `fc cc a1 9f 00 00 89 fc dc 00 00 00 00 dd 6b 3c 5d ff c0 0c`. Byte `0xff` of the call displacement equals stock, so it was absent from the combined CSV until the swap script added the patched row.

The swap replaces those twenty bytes with `fc a8 20 e9 31 a0 dc 0e 00 00 00` and nine zeros:

```
60a8f708 fca820e931a0  movbu (0xa031e920),D0
60a8f70e dc0e000000    jmp 0x60a8f71c
```

`0x60a8f71c` is the existing `mov sp,A0` that calls the converter. The nine zeros are not executed. The reads of `0xdfa1` (`0x60a8f73e`), `0x99d2` (`0x60a8f75a`) and `0x1e01` (`0x60a8f770`) are not part of the patch.

After the swap, from the profile byte at `0xa031e920`:

- +2 kind
- +4 and +5 vertical
- +6 and +7 horizontal
- +8 priority, after the kind-based clear
- +0 and +1 position, only when the resulting kind is 2 (UI value 0, All). The builder then forces 526 and does not keep `0x99d2`

Not from the profile byte. These stay on the legacy provider until T3b:

- +3, from `0xdfa1`
- +0 and +1, from `0x99d2`, whenever kind is not 2
- +9, from `0x1e01`
- for UI values 6–9 only, the vertical and horizontal sizes are the converter's reads of `0x1dd1`

The half-press record is not produced by this builder. It is the stock capture (`0x609b3c79`, buffer `0xa33f2ce0`). A zone change on the AF-ON row does not write it.

## Records

Stock AF Home `0x9fa1` index 0 is 0, and stock position `0x99d2` is 526. `0xdfa1` index 0 is 0. `0x1e01` index 0 is 0. These four were the prediction. The runs then locked them.

| who | zone byte | ten bytes | where it was seen |
| --- | --- | --- | --- |
| AF-ON, Single | 1 | `0e 02 00 00 01 00 01 00 00 00` | kind 0, 1×1, position 526 from `0x99d2`, size 0, priority cleared. `edges-k6.jsonl` P1 edge 2 and P3 edge 2 |
| AF-ON, Small | 2 | `0e 02 03 00 01 00 01 00 00 00` | kind 3, 1×1, position 526 from `0x99d2`, priority left at 0. `edges-k6.jsonl` P2 edge 2, and `edges-k7.jsonl` after the profile byte was set to 2 |
| AF-ON, All | 0 | `0e 02 02 00 01 00 01 00 00 00` | kind 2, 1×1, position forced to 526. `accept-reopen-k1.jsonl` after a new session, profile byte 0 |
| overlay half-press | stock `0x99a1` index 0 = 2 | `0e 02 03 00 03 00 03 00 00 00` | kind 3, 3×3. Present while S1 owns, and restored when AF-ON is released |
| no-overlay control | none | `0e 02 02 00 1b 00 27 00 00 00` | kind 2, 27×39. The same ten bytes on S1 and on AF-ON |

Releasing AF-ON does not leave the AF-ON record in the consumer buffer. Owner returns to 0, or to 1 if S1 is still held, and the ten bytes return to the half-press record. The AF-ON record is present only while AF-ON owns.

After the focus-mode write, `0x1dd1` is `[3, 3, 3, 3, 3, 3, 3, 3, 3, 3]` on both the control and the candidate, before any edge. The menu acceptance, which does not call that writer, still shows index 0 and 1 as 27 and 39. The edge itself does not change `0x1dd1` further.
