# Editor binding for the page-27 second word

The second dispatch word is not converted by `0x611a01e8`. That address is a 3-byte entry. The lookup that turns the word into an editor is `FUN_6124f4e5`.

## What 0x611a01e8 does

Section 7, compressed. The bytes, checked against the image (`work/out/listing-check-f1.txt`):

```
611a01e8  f86054  movhu (0x54,A0),D0
611a01eb  de0000  retf [],0
```

It returns the halfword at the object plus `0x54`. The next entry, `0x611a01ee`, is a different slot: if D0 is 1 or 2 it loads a pointer from the object, otherwise it returns 0.

On the OK that opens a chooser, a read-watch of this entry saw D1 in `{12, 339, 0, 7}`, not `0x1e3`. The halfword at A0+`0x54` was 1. Caller `0x6120347a`. This entry does not receive the second dispatch word.

`0x6127e750` is the trampoline that calls vtable slot +4. The caller at `0x61283be8` loads A0, D0 and D1 from the stack and calls it. A zero return goes on to `FUN_61283f10` and then vtable+8. A non-zero return becomes the function result. The second word is not an operand of `0x611a01e8` on this path.

## The lookup

`FUN_6124f4e5` at `0x6124f4e5`, body 121 bytes, section 7, compressed. Listing `work/out/disasm-f4e5-f1.txt`, every listed byte matches the image.

Incoming D0 is the first dispatch word. Incoming D1 is the second word. The first instruction stores D1 at sp+`0x20`.

The directory is at `0x615cc934`, stride 12. The key-8 entry is the first one:

`08 00 00 00  0c 54 5c 61  a0 01 00 00`

Pointer `0x615c540c`, count 416 (`0x01a0`). End = `0x615c540c + 416*24` = `0x615c7b0c`. The halfword after the count is 0. The directory itself is section 7, compressed, so a redirect is a runtime write.

The second loop strides 24. The conversion instruction is:

```
6124f522  72  mov (A2),D0
6124f523  a1  cmp D0,D1
```

D0 is the record's first word. D1 is the sought id. On a match the record is copied, six words, through `0x6124f54c` / `0x6124f54e`, and `FUN_6124f11a` is called with the editor id.

## Record layout

24 bytes. Established by the image decode and by the six words copied at runtime.

| Offset | Field in the 0x1e0–0x1e4 slice |
|---|---|
| +0 | u32 editor id, the second dispatch word |
| +4 | u32 `0x3b` |
| +8 | u32 UI id that confirm uses |
| +12 | u32 `0x42` |
| +16 | u32 sequential index (`0x1e3` → `0x2d`). Role not established |
| +20 | u32 0 |

The option pointer is not in this record. The image has two pointers to `0x6158ba04`, both page-27 rows (`0x6158dc50`, `0x6158dc74`). The row holds the options.

## The array

Section 7, compressed (flag 1, destination `0x6103f000`, next destination `0x6169e800`). 416 records, `0x615c540c` through `0x615c7b0c`. First record `8901000031000000170100003a0000000000000000000000`. Last record `c8020000050000007e080000690000007f00000000000000`.

The sequential slice that contains the page-27 ids is inside that array, not a separate table. Id `0x1e3` is index 107. No image pointer contains `0x615c5e14` or `0x615c59f4`. Ghidra reported no references to those addresses (`work/out/xrefs-binding-f1.txt`).

| Address | Id | UI at +8 | +16 |
|---|---|---|---|
| `0x615c5dcc` | `0x1e0` | 2156 (`0x086c`) | `0x2a` |
| `0x615c5de4` | `0x1e1` | 2157 (`0x086d`) | `0x2b` |
| `0x615c5dfc` | `0x1e2` | 2205 (`0x089d`) | `0x2c` |
| `0x615c5e14` | `0x1e3` | 2154 (`0x086a`) | `0x2d` |
| `0x615c5e2c` | `0x1e4` | 2155 (`0x086b`) | `0x2e` |

Raw `0x1e3` record: `e30100003b0000006a080000420000002d00000000000000`. Each of those UI ids is unique to that editor id in the 47-record run from id `0x1b7` to id `0x1e5`.

`0x1e6` does not occur as a record id in the 416.

## Dynamic trace

The table the CPU reads has to sit in resident RAM. An overlay at `0x60320000` is not resident: that address reads back as `0xA5A5A5A5`. A runtime write there does stick (`work/out/probe-ram-f1.jsonl`). The trace below is the runtime copy of all 416 records plus one new record, directory pointer `0x615cc938` = `0x60320000`, count `0x615cc93c` = 417.

At `0x6124f523`, capped at 100000, dropped 0:

| Case | Match | Address | UI word in the copied record |
|---|---|---|---|
| 2154, menu OK | D0 = D1 = 483 (`0x1e3`) | `0x60320a08` | 2154 |
| 2155, menu OK | D0 = D1 = 484 (`0x1e4`) | `0x60320a20` | 2155 |
| `0x3D6F`, second word `0x1e6`, menu OK | D0 = D1 = 486 (`0x1e6`) | `0x60322700` | 15727 (`0x3D6F`) |
| C-AF Area | D0 = D1 = 480 (`0x1e0`) | `0x603209c0` | 2156 |

C-AF Area was a direct call of `FUN_6124f4e5` with D0 = 8 and D1 = `0x1e0`. No kind-12 menu row whose first word is 2156 was found, so this was not a menu OK.

The new record is the `0x1e3` record with the id and the UI id changed: `e60100003b0000006f3d0000420000002d00000000000000`. The word at +16 was left at `0x2d`.
