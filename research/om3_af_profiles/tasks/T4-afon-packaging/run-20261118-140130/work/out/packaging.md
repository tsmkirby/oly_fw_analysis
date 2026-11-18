# Packaging analysis for the AF-ON zone row

Static measurements on `inputs/00_0100_50000020.decoded.bin`. File offset is runtime address minus `0x60021020`. Every listing row was compared with that image: 1,329 rows, 0 mismatches (`work/out/cmd/09.out`). This file does not choose a store for the value. Storage remains Q7.

Labels: STATIC is disassembly or instruction bytes. DATA is table or image bytes. INFERRED is a conclusion from those. HYPOTHESIS is a proposal that this image does not demonstrate. RECOMMENDATION is a proposal, not a finding.

## 1. How section 7 can be modified

### What the loader does

DATA. Ten 12-byte descriptors at `0x60029b28`. Each is destination, source, third word. Section 7 is destination `0x6103f000`, source `0x5101e000`, third word `0x1`. Sections 6 and 7 are the only rows whose third word is 1. The other eight are 0. Raw row: `00f0036100e0015101000000`.

DATA. The source is in place. File offset of `0x5101e000` is `0x101dfe0`, and `0x6103f000 - 0x60021020` is the same offset. The same identity holds for all ten sections.

STATIC. The exclusive end comes from `mov imm32,D0` in the end selector `0x60045e6c`. Section 7's immediate is `0x6164b000` at `0x60045ea2`. Loaded length is `0x6164b000 - 0x6103f000` = 6,340,608 bytes. The next destination, section 8, is `0x6169e800`, so 342,016 bytes after the loaded end are not copied by this loader.

STATIC. `work/out/listings/loader.txt`. `0x60045ed5` indexes the descriptor with `(n - 1) * 12`, reads the destination at `(A2)` and the source at `(0x4,A2)`, subtracts the destination from the end, and calls `0x600232d1` with `D1 = 0x10200`. It never reads the third word. On a non-zero return it logs the strings at `0x60047790` (`UserSub_FlashReadErr`) and `0x600477a6` (`LoadNo`). It then ORs `1 << (n - 1)` into `0xa32de590`. There is no sum of the copied bytes.

STATIC. The boot task reaches that loader with `D0 = 7` at `0x600457ea` (`work/out/listings/boot-task.txt`). Ghidra records ten calls, one per section (`work/out/xrefs-t4.txt`, target `0x60045ed5`).

STATIC. The other two uses of the table base do not read the third word either. `0x60045f98` loads the destination (`mov (D0,A0),D0` after multiplying by 12) and dispatches constructors by section number (`work/out/listings/section-init-b.txt`). `0x60046095` loads the first word of the table (`work/out/listings/section-init-c.txt`). No instruction in the image contains the address of any third word (`work/out/static-t4.txt`).

DATA. The image contains no `olycompress` magic. Resource `inputs/02_0106_458c0020.decoded.bin` contains none either. The bytes at `0x6124f4e5` are the plain instruction `f8972004`, inside section 7's loaded span. The head's own copies use the same mode `0x10200` (`work/out/listings/head.txt`).

INFERRED. On this image the third word is not a compression format the loader decodes. Section 7 is stored as the bytes the CPU executes, and the loader copies that span. Wrapping it in an LZ4 or `olycompress` container would not be expanded by `0x60045ed5`. This contradicts the algorithm half of `HARDWARE-STAGE0-RECORD.md` Finding 2, which treats flag 1 as a compressed stream that has to be re-encoded. The flag value and the address range match that record.

DATA. The decoded file does not start with the `OE` component header. The additive word-sum trailer described in `ref/contribution/docs/format/CONTAINERS.md` is not in this input, so it was not recomputed. The loader's only check of the copy is the flash-read status.

### Option (a): edit the plain bytes

DATA. An edit that stays inside `0x6103f000`–`0x6164b000` does not change the copy length and does not require a new end immediate. The fields this row needs are a few aligned words inside that span (section 6 below). Growing the section would mean changing the immediate at `0x60045ea2` and placing the extra bytes before `0x6169e800`.

INFERRED. There is no section checksum to repair. A repacked `OE` component would still need its trailer sum brought back to zero, and that trailer is outside this input. The boot copies the whole section before the camera application runs, so a bad pointer in this section fails when that pointer is used. It does not fail inside a decompressor, because this loader has none.

### Option (b): rewrite the fields after the copy

STATIC. The loaded bit for section 7 is bit 6 of `0xa32de590`, set at `0x60045f33` before the loader returns. The key-port callback `0x6017a5fc` begins with two whole instructions, 5 bytes: `movm [a2],(sp)` and `add -0x8,sp` (`work/out/listings/hook.txt`).

DATA. The archived placement already replaces those 5 bytes (`work/out/static-t4.txt`, reason "key-port interrupt callback trampoline"). One prologue holds one patch.

INFERRED. A runtime installer can store the section-7 pointer and count fields after bit 6 is set. The stage-0 record already places this callback before GUI dispatch, on core 0, in interrupt context (`HARDWARE-STAGE0-RECORD.md`, hook task and core). Opening the menu takes a key, so that callback is before the first menu use if nothing reads these fields during boot constructors. This image does not show a constructor reading `0x6158f0fc`, `0x61529cec`, `0x6150f5f0`, or `0x615cc938` (no Ghidra reference to those addresses, `work/out/xrefs-t4.txt`). That is not a proof that no computed read exists.

The installer's code has to live in a loaded, uncompressed area. The section-1 tail and the section-4 tail are the stage-0 candidates. Both are already occupied by the archived placement (section 6).

RECOMMENDATION. Use option (b). Keep section 7's stored bytes identical to this image, and write the pointer and count fields in RAM after the loader sets bit 6, from the same key-port hook the archived installer already owns. Do not recompress section 7: this loader would copy the compressed bytes through as if they were the section. Option (a) is a plain edit of a few words, with no length change and no section checksum, and it is the smaller image change. It still puts a modified camera-application section into the file the boot copies. The archived installer and the stage-0 record both keep that section stock-identical. Follow that, and extend the one existing hook rather than adding a second prologue.

## 2. A home for the binding array

STATIC. `work/out/listings/binding.txt`. `FUN_6124f4e5` at `0x6124f4e5` walks the directory at `0x615cc934`, stride 12, at most 14 entries. `D0` is the key. On the first match it takes the pointer at +4 and the halfword count at +8 and leaves the directory loop. It then walks that array, stride 24, and compares the record's first word with the saved `D1`. On the first match it copies six words and calls `0x6124f11a`. If nothing matches, the saved pointer is still 0 and the function returns. It does not walk a second array.

DATA. Fourteen directory entries, no duplicate keys (`work/out/static-t4.txt`). Key 8 is the first entry: pointer `0x615c540c`, count 416, pad 0. The array is `0x615c540c` through `0x615c7b0c` (9,984 bytes) in section 7. Editor id `0x1e6` does not occur in this array or in any of the other thirteen. The only image word equal to `0x615c540c` is the directory pointer at `0x615cc938`.

DATA. The next 24 bytes are not padding. They are the first record of key `0xf`, whose array is `0x615c7b0c`, count 130. The directory entries tile: each counted array ends where another begins. Incrementing key 8's count by one overwrites key 15's first record.

DATA. Of the 416 ids, 415 are unique. Id `0x216` occurs twice, at index 62 (`0x615c59dc`) and index 151 (`0x615c6234`). The 24 bytes are identical:

`160200003b000000b7070000420000000000000000000000`

That is editor `0x216`, word +4 `0x3b`, UI `0x7b7`, word +12 `0x42`, face key `0`, word +20 `0`. No image word points at either address.

STATIC. Two further functions embed the same directory base, and both also stop at the first matching editor id.

- `0x6124f55e` (`work/out/listings/binding-next.txt`): same directory loop, then stride 24, `cmp` of the first word, `bra` out of the loop on a match.
- `0x6124f63d` (`work/out/listings/binding-third.txt` and `binding-scan.txt`): same directory loop. When the count is 1 it takes that record without an id compare. Key 8's count is 416, so it scans. The scan compares the first word and branches out on the first match (`0x6124f68d` `bne`, `0x6124f691` `bra`).

Ghidra's references to `0x615cc934` are the immediates inside these three functions only.

INFERRED. A second directory key is consulted only when the caller's `D0` equals that key. It does not attach a record to key 8. There is no fall-through to another table. Appending one record in place collides with key 15. The later `0x216` record is not the record any of these three walks return for `0x216`, because the earlier identical record matches first, and nothing in the image names the later address. Replacing those 24 bytes with editor `0x1e6` and UI `0x3D6F` adds the record the lookup can find, and leaves the `0x216` lookup on the first copy. The face-key word at +16 is a separate choice (section 3); it is 0 today.

DATA. No loaded section contains a `0xFF` run of 10,008 bytes. The longest in-load `0xFF` runs are 1,912 bytes at `0x60a8f088` (section 4) and 1,776 bytes at `0x6031e910` (section 1). The stage-0 tails are those runs, and they are smaller than 10,008. The file bytes at `0x60320000` for 10,008 bytes are `0xFF`, and that address sits in the unloaded gap after section 1 (`0x6031f000`–`0x603ba800`), before the head copy that starts at `0x60357000`. Under the stage-0 standard an unloaded gap is not owned space.

INFERRED. No owned region of 10,008 bytes exists. Relocation of the whole array is not available under that standard.

RECOMMENDATION. Do not relocate the 9,984-byte array. Rewrite the second `0x216` record at `0x615c6234` (24 bytes, 4-byte aligned) so its first word is `0x1e6` and its UI word is `0x3D6F`, and leave the directory count at 416. Do that as one of the option-(b) stores, so the stored section stays stock. This is a proposal. It depends on the three walks above being the only readers, which is what the directory immediates show.

## 3. The face-table key

DATA. The table at `0x6037bedc` has 96 records of `0x24` bytes, ending at `0x6037cc5c`. Its 96 keys are unique. Every one of them appears as some binding record's word at +16, across all fourteen directory arrays. No table key is spare. Twenty-six binding face keys, including 48 and 49, are not among those 96 (`work/out/static-t4b.txt`).

STATIC. The walker is `0x611f7f01` (`work/out/listings/face.txt`). The base is not a data pointer. It is the immediate in `add 0x6037bedc,A2` at `0x611f7f35` (the address bytes sit at `0x611f7f37`). That immediate occurs once in the image. The count is `cmp 0x60,D2` at `0x611f7f47` (`aa60`). Both instructions are in section 7.

STATIC. The table itself is not in any of the ten loaded sections. The reset head copies `0x60357000` through `0x60387094` with mode `0x10200` (`work/out/listings/head.txt`: the end word `0x60387094` stored at `0x60021105`, the copy at `0x60021169` with destination `-0x5fca9000`, which is the uncached form of `0x60357000`). `0x6037bedc` lies in that copy. The copy is raw, the same mode as the section loader.

DATA. The 36 bytes at `0x6037cc5c` are not `0xFF`. They are the start of a pointer table: `0x611f844a`, `0x611f84da`, `0x611f81aa`, `0x611f8033`. Appending a 97th record overwrites that table. The count byte is an imm8, so 97 (`0x61`) fits the existing `cmp` encoding, but the following bytes are live.

INFERRED. A new record can be added by copying the 96 records plus one 36-byte record (3,492 bytes) and changing the immediate at `0x611f7f37` and the count byte at `0x611f7f48`. The pointer that would be redirected lives in section 7 code, at that `add`. There is no owned region of 3,492 bytes (section 2). An in-place append is blocked by the pointer table that follows.

RECOMMENDATION. Do not relocate the face table. Keep the stock table and the stock count. Put a private 36-byte record in the section-1 tail, which is what the 368-byte overlay already does at `0x6031ea48`, and branch at the match in `0x611f7f42` (`bra`, 2 bytes). A 5-byte far patch fits on an instruction boundary there: `bra`, `inc D2`, `mov D2,D0`, and `exthu D2` are 5 bytes, and `cmp 0x60,D2` starts at `0x611f7f47`. Those four instructions have to be replayed. The face-key word in the binding record then stays on a stock key, and the branch substitutes the private record for UI `0x3D6F` only. That is the prototype's substitution, stated as a placement proposal. It does not add a 97th key.

## 4. Descriptor registration

STATIC. `FUN_60405865` at `0x60405865` (`work/out/listings/builder.txt`) clears 128 buckets at `0x62a84970`, then walks `0x6061912c`, stride 20 (`add 0x14,A3`), for `0x6b0` records (`cmp 0x6b0,D1` at `0x604058b3`, bytes `fac9b006`). The table ends at `0x606216ec`. One caller: `0x6040476d`. The lookup `0x604058bc` walks the bucket for `(id & 0x7f)`.

DATA. The table is in section 2 (destination `0x603ba800`, end `0x60718800`, third word 0). Id `0x3D6F` is not among the 1,712 halfwords. The builder's base immediate occurs once, at `0x60405878`. The end address `0x606216ec` occurs six times, all in section 2. At `0x604048f5` the instruction is `add 0x606216ec,A2`, and the next instruction reads a byte at `A2+6` (`work/out/listings/desc-end-a.txt`). The bytes at the end are not `0xFF` (`0000800c800c8000...`). The end address is the base of the next structure, not spare padding.

DATA. `0x3D6F & 0x7f` is `0x6f`. The bucket word is `0x62a84970 + 0x6f * 4` = `0x62a84b2c`, which is RAM past the image, not a section-7 field.

INFERRED. Extending the 1,712-record table in place overwrites the structure at `0x606216ec` and requires the count immediate and all six end immediates to move. Relocating 1,712 × 20 + 20 = 34,260 bytes needs an owned region of that size, and none exists. A post-build link does not extend the table: after `FUN_60405865` returns, one 8-byte node inserted at the head of bucket `0x6f` is what `0x604058bc` walks. The node has to point at a 20-byte descriptor record. The prototype's record is the 20 bytes at `0x6031e9a0` and the node is at `0x6031e9b8`, both inside the 368-byte overlay.

RECOMMENDATION. Register `0x3D6F` by a post-build link, not by extending the section-2 table. The 20-byte record and the 8-byte node live with the other overlay bytes. The link runs after the single caller of `FUN_60405865`. The key-port hook is after boot, so it is after that caller if the caller runs during section-2 init. This image shows the caller address and not the caller's own caller, so that timing is INFERRED from the section-2 placement, not demonstrated here.

## 5. Native value routing

This does not choose where the value is stored.

STATIC. Three section-2 functions share one gate. Each masks the id to 16 bits and compares it with `0x1770` (6000). Any other id calls the mapped getter `0x60419446`. The get and set functions also call the index getter `0x60419696`.

- Getter `0x6041931e` (`work/out/listings/getter.txt`). If the mapped key in `D2` is 0, it returns 0. Sixteen call sites, all covered by a branch at this entry (`work/out/xrefs-t4.txt`).
- Setter `0x6041937f` (`work/out/listings/setter.txt`). If the mapped key is 0, it does not call the store. Four call sites.
- Default writer `0x604193ca` (`work/out/listings/default-writer.txt`). If the mapped key is 0, it returns without calling `0x60063962`. This is not the get and not the set.

STATIC. Both mapped and index reject `0x3D6F`. The index getter's last accepted range ends at `cmp 0x3c5f,D0` (`0x604196ed`); a greater id goes to `clr D0` at `0x60419704` and returns (`work/out/listings/index.txt`). The mapped getter's last range ends at `cmp 0x3c5f,D2` (`0x6041962d`); a greater id goes to `clr D0` at `0x6041968c` and that zero is the returned halfword (`work/out/listings/mapped.txt`). `0x3D6F` is 15,727, which is greater than 15,455 (`0x3c5f`). Stock get therefore returns 0, and stock set does not store.

STATIC. Site sizes, counted to a whole-instruction boundary:

| Site | Address | Section | Bytes the patch has to cover | Why |
|---|---|---|---|---|
| Getter | `0x6041931e` | 2 | 5 | `mov D0,D2`, `clr D0`, `mov D0,(0x4,sp)`, `exthu D2` |
| Setter | `0x6041937f` | 2 | 6 | `mov D1,A2`, `mov D0,D2`, `clr D0`, `mov D0,(0x4,sp)`. A 5-byte patch splits the last instruction |
| Default writer | `0x604193ca` | 2 | 7 | `clr D1`, `mov D1,(0x4,sp)`, `exthu D0`, `mov 0x1770,A0` |

The 5-byte figure is the same length as the archived prologue patch. The trampoline that tests for `0x3D6F` and then replays those instructions is further code. It was not assembled here. Building it is outside this brief.

INFERRED. Branching inside the mapped or index getter would mean returning a settings key and an index. That is a storage choice. It is not required for get and set to reach a feature path: the getter and the setter already skip the store when the mapped key is 0.

RECOMMENDATION. Branch at the getter (5 bytes at `0x6041931e`) and the setter (6 bytes at `0x6041937f`), both in uncompressed section 2, and replay the displaced instructions for every other id. Leave the mapped getter, the index getter, and the default writer as they are. The default writer stays a no-op for this id, which matches "no registered key" until a store, and a default for that store, are chosen.

## 6. Total payload

### Bytes

The 368 overlay bytes are already grouped (`work/out/static-t4.txt`). They are the uncompressed data. The section-7 numbers are fields overwritten in RAM under option (b), not extra image bytes.

| Piece | Bytes | Alignment | Image home under the recommendation |
|---|---:|---|---|
| T3a id lists | 84 | starts at `0x6031e920`, 4-byte aligned | section-1 tail, inside the 368 |
| Kind-4 row | 36 | `0x6031e978`, 4-byte aligned | section-1 tail |
| Descriptor record | 20 | `0x6031e9a0`, 4-byte aligned | section-1 tail; not an extension of `0x6061912c` |
| Hash node | 8 | `0x6031e9b8`, 4-byte aligned | section-1 tail; the bucket store is RAM `0x62a84b2c` |
| Action table | 72 | `0x6031ea00`, 4-byte aligned | section-1 tail |
| Private face record | 36 | `0x6031ea48`, 4-byte aligned | section-1 tail |
| Help list | 120 | `0x6031ea6c`, 4-byte aligned | section-1 tail |
| Page pointer and count | 8 | `0x6158f0fc`, 4-byte aligned | runtime store, section 7 RAM |
| Source pointer and count | 8 | `0x61529cec`, 4-byte aligned | runtime store, section 7 RAM |
| Action pointer and count | 8 | `0x6150f5f0`, 4-byte aligned | runtime store, section 7 RAM |
| Binding record | 24 | `0x615c6234`, 4-byte aligned | runtime store into the existing array |
| Getter site | 5 | instruction boundary | section 2, `0x6041931e` |
| Setter site | 6 | instruction boundary | section 2, `0x6041937f` |
| Face match site | 5 | instruction boundary | section 7 code, `0x611f7f42`, if the private record is substituted |
| Whole binding array | 10,008 | 4-byte aligned | not used |

DATA. The 368 changed bytes span `0x6031e920`–`0x6031eae3` (452 bytes of address space, because of holes that stay `0xFF`). `84 + 36 + 20 + 72 + 36 + 120 = 368`.

The existing section ends are 2 KiB aligned (`0x6031f000`, `0x60718800`, `0x60a8f800`, `0x6164b000`). This payload does not move an end. Word and halfword stores above are 4-byte aligned. Code patches are on the instruction boundaries in the table. Feature state in the stage-0 layout is read through one alias, the uncached alias; these menu pointers are cached addresses, which is the alias the GUI reads. That is the stage-0 rule, restated. It is not a new cache finding.

### Conflict with the archived installer and with Q6

DATA. `proposed-changed-bytes.csv` has 3,612 changed bytes, all in sections 1, 2, and 4. The section-4 tail occupancy runs through `0x60a8f7d4`, leaving 43 bytes before `0x60a8f800`. The key-port prologue at `0x6017a5fc` is 5 of those bytes. The section-2 tail holds 42 bytes from `0x607187a4` and 48 bytes of redirect descriptors at `0x607187d0`–`0x607187ff`.

DATA. 349 of the 368 overlay addresses are also addresses that CSV changes. The overlap includes the feature state from `0x6031e920` and the task-context installer that starts at `0x6031ead0`. The help list occupies `0x6031ead0`–`0x6031eae3`, which is the first 20 bytes of that installer.

DATA. The three stage-0 tails are entirely `0xFF` in this stock image. A whole-image scan for pointers into them, any alignment, cached and uncached, found 3 hits in the section-1 tail, 0 in the section-2 tail, and 9 in the section-4 tail. That is 12, the count the stage-0 record reports. One of them is the known constructor immediate: the word `0x60a8f088` at `0x60215407`, inside `mov` at `0x602153fb`, whose following count bytes are still zero (`fcce00000000`). The other hits are the record's coincidental patterns, re-observed, not reclassified. Q6 is still open: this scan does not show what a secondary CPU or DMA does with those tails.

INFERRED. The 368-byte overlay and the archived installer want the same section-1 tail. The 5-byte hook can hold one trampoline, and the archived installer already uses it. The 43 bytes left in the section-4 tail hold neither the overlay nor a 10,008-byte array, and Q6 means that tail is not a settled owner. The binding-array relocation is unnecessary (section 2), so the missing 10 KB home does not block the row. The blocker is the shared tail and the shared prologue.

RECOMMENDATION. Budget the row as the 368 overlay bytes, the 24-byte binding-record store, the three 8-byte section-7 pointer stores, the 5-byte getter patch, the 6-byte setter patch, and the 5-byte face-match patch. Do not add a second copy of the binding array. Do not put any of this in the section-4 tail. A later layout pass has to place the 368 bytes and the routing stubs in uncompressed loaded space without using the archived prologue as a second hook, or it has to fold these stores into that one installer. This task does not build that layout. It also does not pick a store for the value those stubs would read and write.
