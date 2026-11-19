# Reader audit of the unresolved `0x5b82` items

Static. Checked against `inputs/00_0100_50000020.decoded.bin`. SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Length 33,554,368 bytes (33554368). File offset = address − `0x60021020`. Command 04, `work/out/audit-5b82-t10b.json`, 47 instruction checks, 0 mismatches. Command 01 asserted 33554432 and stopped; that constant is 64 too high, and the script was not edited. This is not a re-run of T2b. The table-B result and the three `mov 0x5b8` classifications are the ones Sol confirmed. The three singleton sites Sol left open are restored below.

Named indices of the 16 × u16 key, re-checked: index 5 (UI 2017) at `0x606274e0` bytes `82 5b 05 00`; index 12 (UI 2031) at `0x60627518` bytes `82 5b 0c 00`; index 13 (UI 2034) at `0x60627524` bytes `82 5b 0d 00`. Unnamed indices: 0–4, 6–11, 14, 15.

The three singleton sites from T2b's final Sol review, claim 12, are on this list. A pointer-shaped dword is not a consumer. The normal-operation table is the sites this audit and T2 established. It is not an exhaustive proof that no other normal-operation reader exists.

## Classification

| Item | Class | Index computation and bounds | Effect on an unnamed index |
| --- | --- | --- | --- |
| Setter-table key fields +0x50 and +0x52 (`FUN_601972f1`) | SAFE | Key is the u16 at record+0x50 or record+0x52. The index is an `exthu`, so its range is `0..65535`, not 5, 12 and 13. The 61 ROM records contain no u16 `0x5b82`. | No read and no write of key `0x5b82`. |
| `mov 0x5b8` at `0x616ddb03` | SAFE | The immediate is a diagnostic line number, not a cell index. | None. |
| `mov 0x5b8` at `0x6118bf47` | SAFE | `A0 = A2 + 0x5b8`, an object field pointer. | None. |
| `mov 0x5b8` at `0x6118c058` | SAFE | Same object-field pointer in the sibling function. | None. |
| Data `0x607c69f4` | UNRESOLVED | No index computation. No image dword points at the address. | Not shown. The structure is unnamed. |
| Data `0x607cb986` | UNRESOLVED | Same. | Not shown. |
| Data `0x60539e07` | UNRESOLVED | The halfword sits in a 4-record, 10-byte run. No consumer and no index. | Not shown. |
| Data `0x607c8e19` | UNRESOLVED | No index computation. No image dword points at the address. | Not shown. |
| Data `0x607e2ef9` | UNRESOLVED | Same. | Not shown. |
| Singleton `0x615fbdb0` | UNRESOLVED | No index computation. The aligned dword is `0x61295b82`. No image dword points at the site or at the aligned address. | Not shown. A base-plus-offset reader is not excluded. |
| Singleton `0x615b9d55` | UNRESOLVED | No index computation. The `82 5b` bytes sit inside the dword `0x615b823c` at `0x615b9d54`. No image dword points at the site or at that aligned address. | Not shown. A halfword read is not excluded. |
| Singleton `0x615b9d91` | UNRESOLVED | Same shape at `0x615b9d90`, dword `0x615b823c`. | Not shown. |

## +0x50 and +0x52

`FUN_601972f1` builds the same record pointer the accepted listing uses: `mov 0x4c,A0` at `0x601972f8`, bytes `90 4c`. Call that pointer P. It is record+0x4c.

The call at `0x6019757f` (`dd b2 be ec ff f0 28`, target `0x60063431`):

- `0x60197543` `add 0x4,D0` (bytes `28 04`) saves P+4, which is record+0x50.
- `0x60197579` `movhu (A0),D0` loads that halfword into D0. That is the key.
- `0x6019756f` loads a stack halfword from `(0x26,sp)` into D1.
- `0x60197572` loads the dword at P+0x18, which is record+0x64, into D3.
- `0x6019757b` adds D3 to D1, and `0x6019757c` `exthu D1`. The index is the low 16 bits of that sum.

The call at `0x6019761f`:

- `0x6019760a` `add 0x6,A0` (bytes `20 06`) selects P+6, record+0x52.
- `0x6019760c` loads the key. `0x60197610` skips the setter when the halfword is 0.
- `0x60197617` loads the dword at P+0x1c, record+0x68, and `0x6019761c` `exthu` keeps its low 16 bits as the index.

The sibling block at `0x6019764d` does the same `add 0x6` from `(0xc,sp)`. That slot is the other record's +0x4c pointer when the link at +0x6c is not `0x3e`. Table B is `0x60242324`, stride `0x9c`, indices `0x00` through `0x3c` (61 records), end exclusive `0x60244850`. Every aligned halfword in those records was compared with `0x5b82`. There are 0 hits, so the sibling record cannot name this key either.

The distinct non-zero halfwords at +0x50 are `0x1404` and `0x1724`. At +0x52 they are `0x13f4` and `0x1714`. The index expression is an `exthu`. Its bounds are `0..65535`. It is not confined to 5, 12 and 13. The settings setter is not bounds-checked (AFON-MENU-RESEARCH §8). If a record's key halfword were `0x5b82`, the index could be any value in `0..65535`. No record has that key, so these calls do not address `0x5b82`.

## The three `mov 0x5b8` sites

`0x616ddb03` is `mov 0x5b8,D1`, bytes `2d b8 05`. D0 is 2 (`80 02` at `0x616ddb01`) and A1 is `0x617c31d7`, the string `CAvpiVenHEVCCodec.cpp`. The call is `0x616a192d`. `FUN_616a1cfe` starts with `mov D1,D2` (byte `86` at `0x616a1cfe`). `0x616a1d41` is `mov D2,(0xc,sp)`, bytes `4a 0c`. The format string at `0x617beab0` is `%s(%u): %s`. The immediate is the `%u` line number. It is not an index into key `0x5b82`.

`0x6118bf47` and `0x6118c058` are both `mov 0x5b8,A0`, bytes `24 b8 05`, followed by `add A2,A0` (byte `f1 78`). The same function uses the same shape with displacements `0x38c`, `0x3e8` and `0x61a` (`0x6118bee0`, `0x6118bef6`, `0x6118bf96`). `FUN_610cd5ac` moves the pointer to A1 (byte `91`). `FUN_610cd6bd` moves A1 to A3 (byte `97` at `0x610cd6be`). The load at `0x610cd6c1`, `movhu (0xc,A2),D0`, uses the other pointer. `0x610cd71b` is `mov A3,A0` (byte `9c`) and the next instruction calls `0x50002909`. The value `0x5b8` is a byte offset from the object in A2. It is not a cell index of key `0x5b82`.

## The five data occurrences

No little-endian dword in the image equals any of these five addresses.

| Address | Aligned u16 `0x5b82` | Window, 8 bytes before through 16 after | Pointers |
| --- | --- | --- | --- |
| `0x607c69f4` | yes, next halfword `0x92b7` | `14 e2 1a be 39 a6 73 4e 82 5b b7 92 7c 5d af fb cf 74 e9 59 5b 76 96 14` | none |
| `0x607cb986` | yes, next halfword `0x530d` | `09 79 9e ad c7 95 7d 86 82 5b 0d 53 7e a5 ef f2 46 e7 62 6c 05 7a 3e cf` | none |
| `0x60539e07` | no; the `82 5b` bytes are at an odd address | see below | none |
| `0x607c8e19` | no | `ab 7f de 9b 92 41 d9 9f 82 5b c8 a2 ce a5 f2 eb 03 6f 3d 34 70 2f 15 b3` | none |
| `0x607e2ef9` | no | `58 76 42 31 d7 b2 74 0f 82 5b 19 6e f9 29 66 1f 55 4e 0b 41 da 4b 82 d3` | none |

`0x60539e07` is the last halfword of a 10-byte window. Command 05 walked that layout while the first dword stayed `0xfaa32ee8` and the halfword at +6 stayed `0xfc00`. The walk is a byte-pattern run of 4 windows, `0x60539dff` through `0x60539e1d`. It is not an identified record structure and not a consumer. The halfwords at +8 are `0x5b82`, then `0x5c82`, and the run ends at `0x5e83`. There is no instruction in this audit that loads one of those halfwords into the settings getter or setter. The index, if any, is missing. What is missing for all five sites is a consumer and, for a consumer that did use the halfword as a key, the index it would pass.

## The three singleton sites

Command 08 counted aligned little-endian dwords. None equals `0x615fbdb0`, `0x615b9d55`, `0x615b9d91`, `0x615b9d54`, or `0x615b9d90` (`work/out/ranges-t10c.json`, `singletons`). The dword at `0x615fbdb0` is `0x61295b82`. The bytes at `0x615b9d55` and `0x615b9d91` sit inside `0x615b823c`. That is the same observation T2b recorded. It does not name a consumer, and it does not bound an index. All three stay UNRESOLVED.

## Normal-operation readers and writers

This table is the sites established here and in T2. Bulk load and save reach the unnamed bytes. The table is not a proof that the list is exhaustive.

| Site | Access | Index source | Class |
| --- | --- | --- | --- |
| Registration `0x600e5874` | writes the ROM default at boot | count halfword is 16 (bytes `82 5b 10 00`); the next 32 bytes are 0; indices 0..15 | REACHES-UNNAMED. Effect: every unnamed cell becomes 0. |
| UI map entries above | the index the mapped getter and setter use | stored index 5, 12, or 13 | SAFE. Named indices only. |
| `FUN_6041937f` | one-cell write | the map index | SAFE. Carried from T2; Sol confirmed a direct call changes only 5, 12, or 13. |
| `FUN_6006398b` | whole-key write of the ROM default | width × count, all 16 cells | REACHES-UNNAMED. Effect: zeros. This is the reset and the bank-7 invalid-area rebuild. |
| Bank-7 load and save | bulk copy of the area that contains the key | no per-cell index; the area image | REACHES-UNNAMED. Effect: carries the stored bytes, including the unnamed cells, without interpreting them. Carried from AFON-MENU-RESEARCH §8. |

Factory-adjustment routes `0x6183dcee` and `0x6183cc7d`, and the debug `prm` handler, can name a key from a runtime packet. T2b classified them as not normal operation. They are not in the table above. They remain able to write a caller-chosen span, which is outside normal operation.
