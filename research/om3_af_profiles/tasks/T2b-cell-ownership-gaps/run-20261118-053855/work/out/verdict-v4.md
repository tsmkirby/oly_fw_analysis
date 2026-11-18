# Verdict v4 for settings key 0x5b82

**UNRESOLVED for normal use.**

The open one-cell setters are closed. None of them can pass key 0x5b82. The residual is five data occurrences of the bytes `82 5b` whose structure is not identified. Two of them are aligned halfwords. Until that structure is named, it is not shown that no path loads one of them as a key and writes a non-zero value into an unnamed cell.

Named cells stay index 5 (UI 2017), index 12 (UI 2031), and index 13 (UI 2034). Zero still decodes as no profile. The whole-key default and the bank-7 invalid-area rebuild still write ROM zeros. Registration at 0x600e5874, the mapped setter 0x6041937f, and the completed C1 cycle are carried and not reopened. Cursor pages stay BOUNDARY. No emulator session was started.

## Setters that were open

### FUN_601eff7a, call at 0x601effcf

The key is the halfword at the start of an 8-byte record. The function rejects a slot `>= 0x7a` (`cmp 0x7a,D3` then `bge`) and does not call the setter on that path. The accepted path does `mov 0x6035a038,A2` (bytes `fc de 38 a0 35 60` at 0x601eff84), `movhu (A2),D0` at 0x601effc8, and `mov D2,D1` at 0x601effce. D2 was loaded from record+2, so D1 is the cell index stored in the record.

The table runs from 0x6035a038 to 0x6035a408 exclusive: 122 records, 108 distinct keys. The full dump is in `setters-5b82-v1.txt`. Key 0x5b82 does not appear. The byte at 0x6035a408 is the start of `68 23 2d 60 28 21 2d 60`, which is past the bound the function checks. Cache stores in the walker are `mov A0,(A3)` and `mov A0,(A2)` at record+4. They do not change the key halfword.

Classification: **cannot name 0x5b82**.

### FUN_60196ee3, FUN_601971f5, FUN_601972f1

`FUN_60196ecc` is four instructions, bytes `fb 00 9c 00 f1 e0 fc d0 24 23 24 60`: multiply the index by 0x9c, add 0x60242324, return that address. `FUN_60196ee3` and `FUN_601972f1` both call it, then `mov 0x4c,A0`, `add A2,A0`, and store that pointer at `(0x10,sp)`. The call at 0x60196f73 is `movhu (A0),D0` from that pointer, so the key is the halfword at record+0x4c.

The same pointer, or the sibling pointer that replaces `(0xc,sp)` when the dword at record+0x6c is not 0x3e, is what the later calls in these functions load. Of the 26 `FUN_60063431` calls from 0x60196ee3 through 0x6019766d, 22 load `movhu (A0),D0` and one loads `movhu (0x2,A0),D0` (0x601972da, the call at 0x601972e6, key at record+0x4e). The other four are:

- 0x6019719c and 0x601971ae: `movhu (A2),D0` after `add 0x2,A2`, and A2 was loaded from `(0x10,sp)`.
- 0x601971d0 and 0x601971e2: `movhu (A3),D0` after `add 0x2,A3`, and A3 was loaded from `(0xc,sp)`.

Those four keys are the halfword at record+0x4e. `(0xc,sp)` is initially the same record+0x4c pointer (`mov (0x10,sp),D0` then `mov D0,(0xc,sp)` at 0x60196ef0). It is replaced with a second record+0x4c only when the link at record+0x6c is not 0x3e (`mov (A1),D0`, `cmp 0x3e,D0`, then another call to `FUN_60196ecc` and `mov A1,(0xc,sp)` at 0x60196f0b).

Table B is 0x60242324, stride 0x9c, indices 0x00 through 0x3c. The next address, 0x60244850, is not a record: its first 16 bytes are `09 00 2d 00 4d 00 6d 00 8d 00 ad 00 cd 00 ed 00`, and the dwords at +0x14 and +0x6c are not in range. Every record 0x00..0x3c has link+0x14 equal to 0x3e, so the walk stored through `(0x50,sp)` stops after one record. The link at +0x6c is 0x3e except index 0x02 (0x1a) and index 0x35 (0x3c), both inside 0x00..0x3c. No halfword in the 61 records is 0x5b82. The key halfwords that these setters actually load are 0x7084/0x7092, 0x13c4/0x13b4, 0x1704/0x16f4, 0x13e4/0x13d4, 0x1764/0x1754, 0x1784/0x1774, and 0x1744/0x1734.

The index that selects the record comes from `(0x50,sp)`. `FUN_60195424` starts with `mov D0,(0x50,sp)`. Its only asm caller is 0x60194b79, after `FUN_6019525a`. That search writes an index 0x00..0x3c. The not-found path writes 0x3d and a flag that makes the caller skip `FUN_60195424`, so 0x3d does not reach these setters.

`FUN_601972f1` has no asm `call` and no image dword equal to its address. The call is in the listing gap 0x601958df..0x60195a52. At 0x60195a1f the bytes are `cd d2 18 f0 3c`: opcode `cd`, rel16 0x18d2, so the target is 0x60195a1f+0x18d2 = 0x601972f1. The 16 bytes before that call end in `58 50`, which is `mov (0x50,sp),D0`, the same index slot the other two setters use.

Classification of all three: **cannot name 0x5b82**.

### FUN_6041ab1d, call at 0x6041ab7a

The prologue stores the incoming key with `movhu D0,(0x20,sp)` (bytes `f8 93 20` at 0x6041ab22) and reloads it with `movhu (0x20,sp),D0` at 0x6041ab71. The index reload is `movhu (0x22,sp),D1` at 0x6041ab74. No image dword equals 0x6041ab1d. The nine call sites and the D0 immediate at each one are in `setters-5b82-v1.txt`:

| Call | Key immediate |
|---|---|
| 0x6040c6a7 | 0x394 (`2c 94 03`), both arms, `clr D1` |
| 0x60af08db | 0xbac1 |
| 0x60b30044 | 0xbbc1 |
| 0x60b9d0a2, 0x60b9dc24, 0x60b9f5a6 | 0x2994 |
| 0x61a23f3e, 0x61a23f82, 0x61a23f9f | 0x1cb4 |

None of those immediates is 0x5b82.

Classification: **cannot name 0x5b82**.

### FUN_607135ad

A2 is set by `mov 0xfa64,A2` at 0x607135ef, bytes `26 64 fa`. A3 is `mov A2,A3` at 0x6071365d, byte `9b`. The calls that do `mov A2,D0` or `mov A3,D0` therefore pass key 0xfa64. D2 is set from A3 by `mov A3,D2` at 0x607136f6, bytes `f1 de`, so D2 starts as 0xfa64 as well.

The later loads `mov D2,D0` (byte `88` at 0x6071374b, and the loads for index 0x1a) come after `call 0x6071327d`. That call's body, listed in `setters-5b82-v2.txt`, uses D0, D1, A0, and A1 and ends at `jmp (A0)` (bytes `f0 f4` at 0x607132b4). The bytes the asm listing skips, 0x607132b6 through 0x607132f5, are 16 stubs of four bytes. Each is `mov imm,D0` then `bra` to 0x607132f7. The first is `80 70 ca 3f` at 0x607132b6: `mov 0x70,D0`, then `bra` whose target is 0x607132b8+0x3f = 0x607132f7. 0x607132f6 is `clr D0`; 0x607132f7 is `extbu D0`; 0x607132f8 is `retf [],0x0`. None of those instructions writes D2. The early exits in the listed body branch to the same `clr D0`. `FUN_60156943`, the other call in this window, is `call 0x6007822a,[d2,a2]` and then `ret`, so it preserves D2. After the call, `mov D2,D0` is still 0xfa64.

The group is removed from the blocker list. Classification: **cannot name 0x5b82; the key is 0xfa64**. `fa64-d2-v1.txt` is not this evidence. That script treated the stub addresses as missing functions.

## Candidates

`candidates-5b82-v4.tsv` has the same 150 rows. The 29 `mov 0x5b8` rows each name the instruction that consumes the value. None of them is a settings key:

- Twenty-four are added to a base and then loaded or stored through: the consuming instruction is a `mov`/`movhu`/`movbu` with that sum as the address. 0x6128c262 and 0x6128c9c0 pass the sum to `FUN_611c782f`, whose body does `mov D0,A3` and `movhu D0,(A3)` at 0x611c7836.
- 0x60cc0c5a and 0x60cebcac pass UI id 0x5b8 to `FUN_60419315`. The map dword at 0x60626c3c is `d1 4b 01 00`, key 0x4bd1, index 1.
- 0x608f8614 stores 0x5b8 at `(0xc,sp)` (bytes `42 0c`) beside 0x60a39f0d (`[%-12s: %4d] albm_main_search_filehandle_picno()`) and 0x60a3a6cd (`albm_main.c`), then calls 0x608f3e68. The same call is made with 0x5c4 and 0x5c7. It is a line number.
- 0x616ddb03 passes D1=0x5b8 into `FUN_616a192d` with A1 = 0x617c31d7 (`CAvpiVenHEVCCodec.cpp`). `FUN_616a1cfe` copies D1 to D2 and calls `FUN_616a1d83`. That 17-byte body writes a vtable pointer and `(0x4,A0)` from D0, and does not read D2.
- 0x6007f39b branches to `udfu01 0xf4240,D0` (bytes `fd 14 40 42 0f 00` at 0x6007f3d5) and `retf`. The product 0x5b8*0xf4240 is 0x5742de00. The low halfword is 0xde00. The caller at 0x6007f5ed moves the return value to D2 and calls 0x6007f3de, not a settings setter.

The address-constant rows are not keys. The dword at 0x60e29138 is 0x60b55b82 (bytes `82 5b b5 60`) inside a run of image-range dwords from 0x60e27318 to 0x60e2b104. The dword at 0x615fbdb0 is 0x61295b82 and the run is that one dword. 0x615b9d55 and 0x615b9d91 sit inside the dword 0x615b823c at 0x615b9d54 and 0x615b9d90.

Five rows stay UNRESOLVED. The v3 exclusion of the three odd addresses as "unaligned data byte" or "no function coverage" is withdrawn:

| Address | What is there |
|---|---|
| 0x607c69f4 | aligned u16 0x5b82, next halfword 0x92b7, gap 0x60773486..0x607e80a3 |
| 0x607cb986 | aligned u16 0x5b82, next halfword 0x530d, same gap |
| 0x60539e07 | odd address, window `82 5b e8 2e a3 fa 43 c8` |
| 0x607c8e19 | odd address, window `82 5b c8 a2 ce a5 f2 eb` |
| 0x607e2ef9 | odd address, window `82 5b 19 6e f9 29 66 1f` |

No image dword equals any of these addresses, and no record stride was identified. They are not instruction starts and they are not themselves writers. The structure that contains them is not named, so they stay UNRESOLVED.

## Routes and replay

The parameter routes are unchanged from `verdict-v3.md`. `FUN_6183dcee` writes a whole-key ROM default, which is zeros for this key, and only from a runtime adjustment packet after the flag at 0x62d31d10 is 1. `FUN_6183cc7d` can copy a caller span for a runtime packet that names 0x5b82. That path is the adjustment task, not a menu, C1, or reset path. Both debug dispatchers still reach the `prm` handler only from the debug console, or from an adjustment command after the same flag is set.

Replay `FUN_600630a3` still has three enqueue sites: type 1 at 0x600634d9, type 2 at 0x60063668, type 4 at 0x6006397b. The setters above cannot put key 0x5b82 into that queue. The ways a runtime value can still name 0x5b82 are the adjustment span and the debug `prm` handler, both already classified, neither a normal-operation writer. Type 4 still writes ROM zeros.

## What remains

Name the structure that contains 0x607c69f4, 0x607cb986, 0x60539e07, 0x607c8e19, and 0x607e2ef9, or show a bound that keeps those bytes from being read as key 0x5b82. That is the residual. The setter sources in section 7 item 1, and the `FUN_607135ad` group, are not part of it.
