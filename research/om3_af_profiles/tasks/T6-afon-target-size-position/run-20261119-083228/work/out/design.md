# AF-ON target: size and position from the profile mirror

Emulator only. One combined change on the accepted Z5 overlay. Values stay in RAM. No storage decision and no hardware recommendation. Subject Detect is `MODE_SUBJECT_DETECT`, key `0x1e71[0]`. `0x90a1` is the page-27 per-button priority and is not Subject Detect.

The home builder `0x60a8f6bb` is Z5 overlay code. In the stock image that window is `0xFF` (`work/out/listing-check-t6b.txt`). Applying the Z5 CSV reproduces the T5 listing except the three bank pointers, which Z5 moved by `+0x3e0`, and the 20-byte zone swap (`work/out/listing-check-t6c.txt`). The converter `0x609b3ecd` matches the stock image: 45 instructions, 0 mismatches (`work/out/listing-check-t6b.txt`).

## What the ten bytes are

Consumer record: ten bytes at `0xa33ca384`. The builder writes one bank and reconciliation copies it while AF-ON owns. Z5 bank bases, after the `+0x3e0` relocation, are `0xa031ee80`, `0xa031ee90` and `0xa031eea0`. The 55-byte mirror starts at `0xa031eeb0` and does not overlap them.

Checked builder body, addresses runtime. Bytes outside the zone swap match the Z5 image. The swap window is the Z5 bytes, not the pre-swap listing.

| offset | width | field | Z5 source |
| --- | --- | --- | --- |
| +0 | u16 | grid position. 526 (`0x020e`) is the centre | getter `0x99d2`, index D3, at `0x60a8f75a`. Kind 2 then forces 526 at `0x60a8f7bb` |
| +2 | u8 | internal kind | converter `0x609b3ecd`, called at `0x60a8f71f` |
| +3 | u8 | size key | getter `0xdfa1` index 0 at `0x60a8f73e` |
| +4 | u16 | vertical | converter |
| +6 | u16 | horizontal | converter |
| +8 | u8 | priority | converter, then cleared for kind 0, kind 2, or kind 3 with vertical 3 |
| +9 | u8 | C-AF central start | getter `0x1e01` index 0 at `0x60a8f770` |

The zone type is the converter argument, not a stored field. Z5 loads it with `movbu (0xa031e920),D0` at `0x60a8f708` and jumps to `0x60a8f71c`. That one byte is not per pose.

A scan of the builder window finds immediates `0xdfa1`, `0x99d2` and `0x1e01` only. It finds no `0x5962`, no `0x88b2`, no `0x1dd1` and no `0x9a41` (`work/out/listing-check-t6c.txt`).

## Where size, position and +9 come from

**Size.** Two different producers write +3 and +4/+6.

- +3 is the size key. The AF-ON builder reads AF Home `0xdfa1` index 0. The stock half-press writer `0x609b3c79` reads the direct-target size key `0x9a41` index 0 into the same offset (`work/out/listings` in T7, quoted in `orientation-producer.md`). `0xdfa1` is not in the mirror. `0x9a41` is, at mirror+`0x08`, descriptor count 1.
- +4 and +6 for All, Single and Small are the converter's fixed 1×1. The jump table at `0x60a7da08` was read from the stock image: UI 0 head `0x609b3ee8` (`mov 2`), UI 1 head `0x609b3eec` (clear, kind 0), UI 2 head `0x609b3eef` (`mov 3`, then 1×1). UI 3, 5 and 10 share the `mov 3` head at `0x609b3efb`.
- +4 and +6 for C1–C4 are `0x1dd1`, read by the converter, not by the builder. Checked calls, each `mov 0x1dd1` / `mov 0,A0` / `mov index,D1` / `call 0x60063380`:

| UI | head | vertical index | horizontal index | priority `0x1df1` index |
| --- | --- | --- | --- | --- |
| 6 C1 | `0x609b3f13` | 2 at `0x609b3f18` | 3 at `0x609b3f27` | 4 at `0x609b3f36` |
| 7 C2 | `0x609b3f3f` | 4 at `0x609b3f44` | 5 at `0x609b3f53` | 5 at `0x609b3f62` |
| 8 C3 | `0x609b3f6b` | 6 at `0x609b3f70` | 7 at `0x609b3f7f` | 6 at `0x609b3f8e` |
| 9 C4 | `0x609b3f98` | 8 at `0x609b3f9d` | 9 at `0x609b3fac` | 7 at `0x609b3fbb` |

Those `0x1dd1` reads are the half-press cells. The mirror holds its own ten bytes at +`0x16`.

**Position.** Three cells, three roles.

- The AF-ON builder's +0 comes from AF Home `0x99d2`, indexed by D3. `0x99d2` is not in the mirror. Kind 2 still forces 526 after that read.
- The direct editor's per-pose position is `0x5962`. With Orientation Linked on (`0x1db1[0]` = `0x1dc1[0]` = 1) the indices are 1 (landscape, pose word `0xa32c568c` = 1), 5 (EXIF 6, pose word 2) and 3 (EXIF 8, pose word 4). With either enable not 1, the index is 1. `0x5962` is in the mirror at +`0x0a`, six u16 cells. The builder does not read it today.
- `0x88b2` is one u16, the live grid position. The stock half-press writer stores it at +0 unless kind is 2. The AF-ON builder does not read it. The editor writes it together with the current `0x5962` bank. It cannot select a pose by itself.

**+9.** Both producers read `0x1e01` index 0. The 55-byte mirror has no `0x1e01` cell. The stock factory value is 0.

## What the AF-ON record must read instead

The half-press record stays the stock writer `0x609b3c79` (buffer `0xa33f2ce0`). The change is only the builder path that runs while AF-ON owns the target.

Bank index, from the pose word `0xa32c568c` and the two link cells:

- `0x1db1[0]` and `0x1dc1[0]` both 1, pose word 2: index 5
- both 1, pose word 4: index 3
- otherwise: index 1

| ten-byte field | Z5 source | mirror source for this pose |
| --- | --- | --- |
| zone type into the converter | single byte `0xa031e920` | `0x99a1[bank]` at mirror+`0x00`. Byte `0xFF` falls back to the zone byte. The image value of that byte is 0, All |
| +3 size key | `0xdfa1[0]` | `0x9a41[0]` at mirror+`0x08`. Byte `0xFF` falls back to 0 |
| +4 and +6 for C1–C4 | half-press `0x1dd1` at the indices above | the same indices of mirror `0x1dd1` (mirror+`0x16`). Byte `0xFF` falls back to 0 |
| +4 and +6 for All, Single, Small and the other fixed kinds | converter constants | unchanged. Small stays 1×1 |
| +0 position | `0x99d2[D3]`, then 526 if kind is 2 | `0x5962[bank]` at mirror+`0x0a`, little-endian u16. Word `0xFFFF` falls back to 0. Kind 2 still forces 526 afterwards |
| +0 via `0x88b2` | not read by this builder. The half-press writer reads the half-press cell | not the AF-ON source. The mirror cell stays put and is checked as unchanged. The half-press writer is not pointed at it |
| +9 | `0x1e01[0]` | no mirror cell. Factory 0, so a half-press write of `0x1e01` does not enter the AF-ON record |
| +8 priority | converter, including half-press `0x1df1` for C1–C4 | unchanged. Not a size or position field |

Uninitialized mirror bytes are `0xFF` in the image. The fallback above is the factory zero the coordinator recorded for an uninitialized AF-ON profile, except the zone type, which falls back to the zone byte, and except the kind-2 position force, which is existing builder code. A fresh session therefore builds the All record `0e 02 02 00 01 00 01 00 00 00`: zone 0, kind 2, size key 0, 1×1, position forced to 526, priority cleared, +9 = 0.

## The one change

Combined, and labelled `EMULATOR-ONLY` / `role: behaviour`.

1. The 20 bytes at `0x60a8f708` become a getter call of key `0x99a1` that returns to `0x60a8f71c`, in place of the Z5 `movbu (0xa031e920),D0`. The call displacement is the stock one and still targets `0x60063380`. No other builder byte moves. No byte is added in section 6 or 7.
2. A hook on the stock getter `0x60063380` answers only when the return address is one of that call, the `0xdfa1` call (`0x60a8f757`), the `0x99d2` call (`0x60a8f76e`) or the `0x1e01` call (`0x60a8f789`), or when the converter was entered from `0x60a8f71f` and the key is `0x1dd1`. Every other caller, including `0x609b3c79`, runs the stock getter.

The converter-entry mark is a pass-through observer on the builder's call and on its return. It does not replace those instructions. Seeding the mirror is test setup, a session write, not this change.

## Native sites a final build must branch

Still emulator placement. Not a firmware image.

- `0x60a8f708`, the zone-type read. Branch to mirror `0x99a1` at the pose bank, with the zone-byte fallback when the mirror byte is uninitialised.
- `0x60a8f73e`, the `0xdfa1` read. Branch to mirror `0x9a41[0]`.
- `0x60a8f75a`, the `0x99d2` read. Branch to mirror `0x5962` at the pose bank. Leave the kind-2 store of 526 at `0x60a8f7bb`.
- `0x60a8f770`, the `0x1e01` read. There is no profile cell. Use factory 0 rather than the live half-press cell.
- Converter `0x1dd1` calls at the eight addresses in the table above, only when the caller is this builder. Branch to the mirror's `0x1dd1`. Leave `0x1df1` on the half-press cell.
- Bank choice: pose word `0xa32c568c`, gated by `0x1db1[0]` and `0x1dc1[0]`, indices 1 / 5 / 3.
- Do not branch `0x609b3c79`. That is the half-press record.
- The three section-7 bytes `0x610bf5e3`–`0x610bf5e5` stay the inherited central-edge call site. Their native placement is a T4 question.

The return addresses above are the ones the getter hook matched in the Q1, Q2 and Q3 runs. Q1's first logged callers included `0x609b3c89`, inside the stock half-press writer, and that call was passed through. The pose word at `0xa32c568c` was 1, 2 and 4 for landscape, EXIF 6 and EXIF 8, and the banks used were 1, 5 and 3. With the link flags not both 1, the bank stayed 1 on all three poses.
