# Verdict v3 for settings key 0x5b82

**UNRESOLVED for normal use.**

Named cells stay index 5 (UI 2017), index 12 (UI 2031), and index 13 (UI 2034). Zero still decodes as no profile. The whole-key default and the bank-7 invalid-area rebuild still write ROM zeros. Those facts are carried from T2 and from Sol's review. This round does not reopen them.

What this round closed, and what still blocks ownership, is below.

## Parameter-key route: FUN_6183dcee, load at 0x6183e9b5

The key is the zero-extended word at record+8.

```
0x6183e9a1  call 0x60063356
0x6183e9b4  mov D2,D0
0x6183e9b5  call 0x60063962
```

D2 was loaded by `mov (0x8,A0),D2` and `exthu D2` at the start of inner command 53 (target 0x6183e991). Lookup failure stores 0x201d and skips the write. Success is a type-4 whole-key default, which copies the ROM default. For this key that default is zeros.

The only call to 0x6183dcee is the rel16 at 0x6183bdef (`cd ff 1e f0 10`). That instruction is the thunk for outer command 0x9029 in the table at 0x61953548. The thunk is `mov A2,A0` and the call, so the record is the adjustment packet already in A2.

FUN_6183bc55 runs that thunk only when the halfword at RAM 0x62d31d10 equals 1. Otherwise it jumps to 0x6183be0d and handles only 0x1002 and 0x9034. Command 0x1002 is what stores 1: `mov 0x1,D0` (bytes `80 01`) at 0x6183be63, then FUN_6183bbf5. The flag is clear until that command arrives.

The two in-image builders of outer command 0x9029, FUN_61a0e5ff and FUN_61a0e676, store inner commands 0xe and 0xc. Neither is 53, so neither takes this case. No aligned halfword 0x5b82 in the image is an adjustment record. The only aligned 0x5b82 values that are key constants are the registration record and the three UI-map entries.

This route can name 0x5b82 only from a runtime adjustment packet, and the write it performs is zeros.

## Parameter-key route: FUN_6183cc7d to the span copier

Two callers, both rel16, both inside the same adjustment dispatcher:

| Call | Bytes | Outer command | Key |
|---|---|---|---|
| 0x61841ea8 | `cd d5 ad f0 6c` | 0x902b, inner command 18 | zero-extended word at record+8 |
| 0x6183bd67 | `cd 16 0f f0 6c` | 0x9007 | zero-extended word at record+4 |

The 0x902b case is listed in `listings-5b82-v3.txt`. The 0x9007 thunk is in `listings-adj-thunks-v1.txt`. Both pass the source pointer from record+0x2c. FUN_6183cc7d calls FUN_6006327f. Bank 7 is not the 5, 8, or 9 special case, and key type `(0x5b82 & 7) == 2`, so a packet that names 0x5b82 reaches FUN_60063567 at 0x6183cd6e and the span copy. The copied bytes are the caller's. They can be non-zero, and the index and length are fields of the packet, so unnamed cells are in range.

No other call of FUN_6183cc7d exists. No other call of FUN_60063567 takes a runtime key. The other 30 span sites use immediates, and none of those immediates is 0x5b82.

This path is the adjustment task FUN_6183b9aa (task slot 0x6003915c), and only after command 0x1002 has set the flag. It is not a menu, C1, or reset path. It is classified. It is not a normal-operation writer.

## Transaction replay FUN_600630a3

The callback pointer is the bytes `fc dc a3 30 06 60` at 0x600631cd. Replay sends type 1 to FUN_600634ee, type 2 to FUN_60063684, and type 4 to FUN_6006398b.

Only three instructions call the enqueue function FUN_60063116:

| Site | Bytes of the type move | Type |
|---|---|---|
| 0x600634d9 | `80 01` at 0x600634d2 | 1, one cell |
| 0x60063668 | `80 02` at 0x60063666 | 2, span |
| 0x6006397b | `80 04` at 0x60063979 | 4, whole-key default |

No straight-line `mov immediate,D0` into any of the 307 filler calls is 0x5b82.

Type 4 writes ROM zeros, including when the key is 0x5b82. The ROM walk FUN_603c2a6b defaults 13 keys at 0x605af01c and 0x5b82 is not among them. FUN_6006bf7f's one-cell keys are 0x4e7a through 0x4eea. FUN_603c2731's one-cell keys are that same 13-entry ROM table, indices 0 through 3. FUN_6183cde5's key is the immediate 0xc202. FUN_6041937f writes the map index only.

Fillers that can still queue key 0x5b82 with a caller-chosen index, and whose value can be non-zero:

- FUN_60196ee3 at 0x60196f73 (`movhu (A0),D0`), and the same shape in FUN_601971f5 and FUN_601972f1. The index is computed from the record. Nothing in the window limits it to indices 5, 12, and 13.
- FUN_601eff7a at 0x601effc8 (`movhu (A2),D0`). A2 is not an immediate in the window. The index comes from D2.
- FUN_6041ab1d at 0x6041ab71 (`movhu (0x20,sp),D0`).
- FUN_607135ad at the sites that copy A3 or D2 into D0 (0x607136b7, 0x607136fa, 0x60713720, 0x60713737, 0x60713754, 0x60713780). The A2 sites in that function use the immediate 0xfa64.

The debug `prm` handler FUN_600619a9 can also queue type 1 at 0x60061c46 and type 4 at 0x60061d50, with the key parsed into `(0x28,sp)`. That handler is reached only through the debug dispatchers below. Type 4 still writes zeros. Type 1 can write one cell, including an unnamed index, from the debug console.

These four runtime groups are why the verdict stays UNRESOLVED. The adjustment span is classified and is outside normal operation. The open groups are not shown to be outside normal operation.

## Debug dispatchers

Both tables have 63 entries of 8 bytes (name pointer, handler). Entry 14 is the name `prm` and the handler 0x600619a9. The earlier reading that the slot was named `flash.rec.file.sc.exp.db` was a misread of the neighbouring names. Slot 0x602ec448 is table 1 entry 14. Slot 0x602eda1c is table 2 entry 14.

FUN_60215a26 loads base 0x602ec3d4 and calls the handler at entry+4 (indirect call 0x60215a44). Its only caller is 0x60215922 in FUN_602158a8. That function's callers are the four sites in FUN_6021552a, whose only caller is 0x6021550d in FUN_602154af, the `dbgall` handler. This dispatcher runs from the debug shell's `dbgall` command.

FUN_6021818d loads base 0x602ed9a8 and calls the handler the same way (indirect call 0x602181ab). One caller is FUN_6021822f, which has no direct calls and is pointed to from the task slots 0x6003a170, 0x6003d39c, 0x6003ea7c, and 0x6003f2b8. The function references the string `Tsk_USHL`. The other caller is FUN_602181e3, reached from 0x61841cd2 (one case of the adjustment dispatcher) and from 0x618c9894 in FUN_618c97a2. FUN_618c97a2 reads the adjustment flag and branches away from the shell call unless the flag is 1.

Both entry paths are the debug console, or an adjustment command after the flag is set. Neither is a normal menu path.

## Candidates

`candidates-5b82-v3.tsv` has the 150 rows from the T2 table. The 29 `mov 0x5b8,REG` rows are no longer the eight-instruction guess. Each register was followed through unconditional and conditional branches to the instruction that consumes it. Twenty-four are added to another register and used as an address. Two, 0x60cc0c5a and 0x60cebcac, pass UI id 0x5b8 to FUN_60419315. The map dword for that UI id is at 0x60626c3c and is `d1 4b 01 00` (key 0x4bd1, index 1), not key 0x5b82. 0x608f8614 stores 0x5b8 as an argument beside the strings `albm_main.c` and `albm_main_search_filehandle_picno()`. 0x616ddb03 passes D1=0x5b8 into FUN_616a192d with the string `CAvpiVenHEVCCodec.cpp`. 0x6007f39b branches to 0x6007f3d5 and the next instruction is `retf`. None of the 29 is shifted into 0x5b82.

The two aligned data halfwords stay UNRESOLVED as data. 0x607c69f4 (next halfword 0x92b7) and 0x607cb986 (next halfword 0x530d) sit in the 478237-byte gap from 0x60773486 to 0x607e80a3. They are not instruction starts. No image dword equals either address. They are not a registration record (a registration record is key, count 0x0010, then zeros). They do not themselves write a cell. Their structure inside the pool is not identified.

Every other aligned `82 5b` is inside an instruction whose operand is not the key: a displacement, an address constant such as `mov 0x60e75b82,D0`, or the one-byte opcode `mov D0,D2` followed by a different instruction.

## Cursor pages

BOUNDARY. In `dynamic-5b82-mark-w.jsonl`, `dynamic-5b82-mark-x.jsonl`, and `dynamic-5b82-control-p.jsonl`, the step `cursor-page-search` has twelve samples and all twelve are the same six strings: Recall, Assign, Save Settings, Custom Mode Name, Set, Reset. That is the C1 action list, sampled twelve times. It is not twelve menu tabs, and it is not the Toy Photo, Vintage, or Partial Color type-3 cursor page. Those pages were not opened, so cursors 2017, 2031, and 2034 were not changed from the UI, and there is no completed cursor operation to attach a C1-managed setting to. The C1 cycle Sol already confirmed was not run again. No new emulator session was started.

## What would make this OWNABLE

Show that FUN_60196ee3, FUN_601971f5, FUN_601972f1, FUN_601eff7a, FUN_6041ab1d, and the A3/D2 sites in FUN_607135ad cannot pass key 0x5b82, or that when they do, the index is one of 5, 12, and 13, or that the value written is zero. Name the structure that contains 0x607c69f4 and 0x607cb986, or leave them as unresolved data that is not a writer.
