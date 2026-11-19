# T4 packaging, correction round

Corrected answers for the six items in `brief.md`. `work/out/packaging.md` is the first-round text and is left unchanged. Confirmed measurements from that pass stand. Each recommendation below is a proposal.

Labels: STATIC is disassembly or instruction bytes. DATA is table or image bytes. OBSERVED-EMU is the stock emulator run. INFERRED is a conclusion from those. HYPOTHESIS is not demonstrated by this image or this run. RECOMMENDATION is a proposal.

## 1. Binding record at 0x615c6234

The unconditional reuse of the second `0x216` record is withdrawn.

DATA. No little-endian word in the main image equals `0x615c6234`, `0x615c59dc`, or `0x615c6240`. The array base `0x615c540c` occurs once, at the directory slot `0x615cc938`. The directory base `0x615cc934` occurs three times, at `0x6124f4f8`, `0x6124f579`, and `0x6124f650`, which are the three walkers. The constant `0xe28` (151 × 24) occurs four times, at `0x60257658`, `0x602580a0`, `0x6035b660`, and `0x606a8b58`, and none of those sites is a walker. `work/out/static-c1.txt`.

STATIC. The three walkers embed the directory base and return on the first matching editor id. A multiply-by-24 is common in this image (D0 314 sites, D1 83, D2 47, D3 10) and does not identify another reader of this array. A linear scan that continues past index 151 reads the bytes at `0x615c6234` even when it does not return that record.

OBSERVED-EMU. One stock session, command 16. Image sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, `loaded: on`, no overlay, no nvram file. The `0x120b` UI-in entry is a lab key-matrix override and does not write the image. Read watches and execute probes were armed after `open_session` returned, so boot had already finished. Watches: cached and uncached `0x615c6234` for 24 bytes, and cached and uncached `0x615cc934` for 8 bytes.

Paths actually exercised, in order (`work/out/watch-c1.jsonl`):

- After boot the screen was the date prompt `Y/M/D`. Watch hits 0.
- Menu opened on Card/Folder/File. Twenty Left presses walked the tabs and landed on `2. AF`, highlight Subject Detection, with the row AF Button visible.
- Two Downs highlighted AF Button. OK opened page 27 (title AF Button, highlight Priority). OK opened the editor whose help text is "When a specified subject is detected...". Menu returned to page 27. Down left the highlight on Priority. A second OK opened the same editor again. Menu returned. Menu left page 27 for the AF tab.
- One Left landed on `1. AF`. That single tab already contains the rows Release Priority and AF by half-pressing. OK on that tab, highlight still AF Mode, did not open a distinct editor. The following Menu produced an empty screen and then the same `1. AF` list. The same sequence was repeated for the half-press row and ended on the same list.
- Page 28 was not opened. The stock image has no page 28, and this run wrote no page-28 construction.

Results in that window (`work/out/watch-c1-hits.json`): the duplicate range had zero reads, cached and uncached. The directory range had eight reads, all from walk-1: `mov (A1),D1` at `0x6124f4fc` six times, and `mov (0x4,A1),A3` at `0x6124f500` twice. Walk-1's entry ran six times. Walk-2 and walk-3 ran zero times. The two pointer loads are the two walks that matched key 8; both are the page-27 editor opens. Those two scans did not read `0x615c6234`. The instruction counter in the hit log is not a single increasing timeline, so order inside the session is taken from the step log, not from the raw counts.

HYPOTHESIS. The second `0x216` record is not the record the three first-match walks return. That is conditional. It is unresolved whether another path selects it, and whether a scan for an id past index 151 reads those bytes. This run did not exercise walk-2, walk-3, boot, a scan past index 151, or page 28.

RECOMMENDATION. Do not rewrite `0x615c6234`. Do not count those 24 bytes as free. The home for a new binding record stays unresolved.

## 2. Face match, control flow preserved

The five-byte proposal at `0x611f7f42` is replaced. That proposal covered `bra`, `inc D2`, `mov`, and `exthu`, and it put the incoming `bne` at `0x611f7f3e` inside the new instruction.

STATIC. Stock bytes at `0x611f7f3e` are `c9 06 f0 18 ca 08`: `bne 0x611f7f44`, `mov A2,(A0)`, `bra 0x611f7f4a`. The `bne` target is `inc D2` at `0x611f7f44`. The compare that sets the flags is `cmp D0,D3` at `0x611f7f3d`. A scan of section 7 found one branch whose target lies in `[0x611f7f3e, 0x611f7f4a)`: that `bne`. `work/out/static-c1.txt`, `work/out/listings/face-c1.txt`.

The corrected site is six bytes, `0x611f7f3e` through `0x611f7f43`. Ghidra decoded the candidate bytes (`work/out/face-site-c1.txt`):

```
611f7f3e  dc826a12ff  jmp 0x6031e9c0
611f7f43  cb          nop
```

`0x611f7f44` (`inc D2`) is unchanged and remains an instruction boundary. The `jmp` replaces `bne` + `mov A2,(A0)` + `bra` exactly. A `jmp REL32` does not write the flags, so the helper's first instruction retests the flags from `cmp D0,D3`.

The helper is 48 bytes. At the candidate address `0x6031e9c0` Ghidra decoded (`work/out/face-helper-c1.txt`):

```
6031e9c0  c92b        bne 0x6031e9eb
6031e9c2  f018        mov A2,(A0)
6031e9c4  f8fefc      add -0x4,sp
6031e9c7  4700        mov A1,(sp)
6031e9c9  259809      mov 0x998,A1
6031e9cc  f17d        add A3,A1
6031e9ce  f005        mov (A1),A1
6031e9d0  2154        add 0x54,A1
6031e9d2  f061        movhu (A1),D0
6031e9d4  fac86f3d    cmp 0x3d6f,D0
6031e9d8  c909        bne 0x6031e9e1
6031e9da  fccc48ea3160 mov 0x6031ea48,D0
6031e9e0  60          mov D0,(A0)
6031e9e1  5d00        mov (sp),A1
6031e9e3  f8fe04      add 0x4,sp
6031e9e6  dc6495ed00  jmp 0x611f7f4a
6031e9eb  dc5995ed00  jmp 0x611f7f44
```

Match: the stock store `mov A2,(A0)` runs, then the parent word at `A3+0x998` is loaded and the halfword at `parent+0x54` is compared with `0x3D6F`. On that UI the private face pointer `0x6031ea48` is stored through `A0`. `A1` and `SP` are restored, and `jmp 0x611f7f4a` joins the walker's done path (`clr D0`). Miss: `jmp 0x611f7f44` joins `inc D2` and does not write `D2`, `A0`, `A2`, or `A3`. Both jumps leave `SP` restored. `A1` is saved because the helper uses `A1`. The walker's done path writes `A1` at `0x611f7f5a`, so the save is conservative. The displacements check: `0x6031e9e6 + 0x00ed9564 = 0x611f7f4a`, and `0x6031e9eb + 0x00ed9559 = 0x611f7f44`.

DATA. The 48 bytes at `0x6031e9c0` are `0xFF` in this image, and the overlay CSV has 0 rows there and 0 rows on the node `0x6031e9b8`–`0x6031e9c0`. The archived CSV has 48 rows in that hole. A search of the section-1 tail, the section-4 tail, and the section-2 tail near its end found 0 windows of 48 bytes that are `0xFF` and free of both CSVs (`work/out/gaps-c1.txt`).

RECOMMENDATION. Use this six-byte site and this 48-byte helper. The candidate home `0x6031e9c0` is unresolved, because the archived installer already occupies it and no other qualifying window was established. A different home changes the three `jmp REL32` displacements and no other byte of the helper. The site bytes above are valid for `0x6031e9c0` only.

## 3. Budget, separated

The eight-byte hash node is not part of the 368 overlay rows. Overlay rows in `0x6031e920`–`0x6031eae4` are 368. Overlay rows on `0x6031e9b8`–`0x6031e9c0` are 0 (`work/out/static-c1.txt`). `84 + 36 + 20 + 72 + 36 + 120 = 368`. Adding the node gives 376, inside the 452-byte span, before any further code.

### Changed image bytes

| Piece | Bytes | Where |
|---|---:|---|
| Overlay data (id lists, kind-4 row, descriptor record, action table, private face, help list) | 368 | `0x6031e920`–`0x6031eae3`, holes stay `0xFF` |
| Hash node | 8 | `0x6031e9b8`. Not in the overlay CSV |
| Data subtotal inside the 452-byte span | 376 | before the helper and before other code |
| Getter site | 5 | `0x6041931e`, section 2 |
| Setter site | 6 | `0x6041937f`, section 2 |
| Face site | 6 | `0x611f7f3e`, only for a helper at `0x6031e9c0` |
| Face helper | 48 | home unresolved; the candidate hole conflicts with the archived CSV |

### Reserved resident space

| Piece | Bytes | Status |
|---|---:|---|
| Section-1 span `0x6031e920`–`0x6031eae4` | 452 | holds the 376 data bytes above, with holes |
| Helper hole `0x6031e9c0` for 48 | 48 | stock `0xFF`, free of the overlay CSV, occupied by the archived CSV |
| Other tail window of 48 bytes free of both CSVs | 0 found | section-1 tail, section-4 tail, section-2 tail near the end |

### Runtime destinations

| Piece | Bytes | Where |
|---|---:|---|
| Page pointer and count | 8 | `0x6158f0fc`, section 7 RAM |
| Source pointer and count | 8 | `0x61529cec`, section 7 RAM |
| Action pointer and count | 8 | `0x6150f5f0`, section 7 RAM |
| Binding record | 24 | home unresolved (section 1) |
| Bucket word | 4 | `0x62a84b2c` |

### Helper and installer code

| Piece | Bytes |
|---|---|
| Face helper body | 48, home unresolved |
| Installer body | unresolved |
| Getter stub body | unresolved. The 5-byte site is the branch coverage, not the stub |
| Setter stub body | unresolved. The 6-byte site is the branch coverage, not the stub |
| Node initialization and bucket publication | unresolved. The node itself is the 8 data bytes above |
| I-cache synchronization for a runtime store into section-7 code | unresolved |

These four tables are not a complete total. The face-site displacement and the helper home are open, and five code sizes are unresolved.

RECOMMENDATION. Budget 376 image data bytes inside the existing 452-byte span, then the 5-byte getter site and the 6-byte setter site, and keep the 6-byte face site and the 48-byte helper off the total until a home is established. Keep the three section-7 pointer stores and the bucket word as runtime destinations. Leave the binding-record store off the image budget until its home is established. Do not add the sizes marked unresolved.

## 4. Code that has no size yet

| Piece | Size |
|---|---|
| Installer | unresolved |
| Getter stub | unresolved |
| Setter stub | unresolved |
| Face helper | 48 bytes. Home unresolved (section 2) |
| Node initialization and publication of the bucket word | unresolved |
| Runtime synchronization of a section-7 code patch (I-cache) | unresolved |

An image edit of the six face-site bytes is copied by the loader before that code runs. A later store into those bytes, after the core has fetched them, needs the synchronization row, and that row has no size.

RECOMMENDATION. Do not publish a single payload total. Size the installer, the two stubs, the node publication, and any runtime code-patch synchronization before a layout pass adds them.

## 5. Checksum, decompression, and order

STATIC, limited to the listed instructions. `flash-entry-c1.txt` lists `0x600232d1` through its `ret` at `0x6002332c`. The mode is masked with `0x300`. Equal to `0x100` calls `0x60060c2d`. Equal to `0x300` calls `0x60060b2e`. Equal to `0x200` calls flash-read `0x60023389` with stack `0x2c` (the mode `0x10200` path). The function then returns `D2` zero-extended. Bytes at `0x6002332f` are the next function, which is the one the head copy calls.

`flash-read-c1.txt` lists `0x60023389` through its `ret` at `0x60023479`. On the `0x10200` path it calls `0x60021812`, then `0x60023042` when `D2` is 0 or `0x60023228` when `D2` is 1, then `0x600218ea`, then `0x600236ea` and `0x600236a2`, and returns. No byte-sum of the copied range appears in those two function bodies.

The direct callees were listed only in part: `callee-21812-c1` (50), `callee-23042-c1` (40), `callee-23228-c1` (40), `callee-236ea-c1` (50), plus `0x600213f0`, `0x600235b5`, `0x600235ff`, `0x6002347c`, and `0x60023653` for the neighboring calls. Those windows call further (`0x60075f73`, `0x6005cec3`, `0x60023210`, `0x600229c2`, and others). `0x600218ea` and `0x600236a2` have no listing of their own. Everything below the listed windows is unexamined.

INFERRED, and only for the listed bodies. The upper copy path for mode `0x10200` transfers the bytes and does not itself sum them. A checksum or a decompression step in an unexamined callee remains possible. The first-round absence of an `olycompress` magic is a statement about file bytes, not about those callees.

The loader at `0x60045ed5`, listed in the first pass, copies `end - dest` with mode `0x10200` and does not read the descriptor's third word. That listing stands. It does not settle the callees of flash-read.

### Order

STATIC. The only call to `FUN_60405865` (`0x60405865`–`0x604058bb`) is `0x6040476d`. That function is `call 0x60405865`, `clr D0`, `ret`, body `0x6040476d`–`0x60404775`. Its caller chain is `0x603f0e0f` in `FUN_603f0db6`, `0x6021a036` in `FUN_6021a029`, `0x602184c7` in `FUN_602182d0` (`0x602182d0`–`0x60218816`). `FUN_602182d0` has no direct call reference (`work/out/callers-c1.txt`). The hook `FUN_6017a5fc` has no direct call reference.

DATA. The only word equal to `0x602182d0` is at `0x6003954c`. The surrounding words are small integers (`0x29`, then the pointer, then `0x37` and `0x800`), the same shape as the neighboring records at `0x60039530` and `0x60039568` (`work/out/ctor-window-c1.txt`). The only word equal to `0x6017a5fc` is at `0x6017a5d8`, 0x24 bytes before the hook entry, inside the preceding bytes.

INFERRED. The record at `0x6003954c` has the shape of a static task entry. This run did not identify that table from a firmware fact, and the chain does not order the task against the hook or against the first directory read.

OBSERVED-EMU. Probes on `0x60405865`, `0x6040476d`, and `0x6017a5fc` were armed after `open_session` returned. In the window after that, each count is 0. The first directory read in that window is walk-1 at the menu key, at `0x6124f4fc`.

The order of `FUN_60405865`, the key-port hook at `0x6017a5fc`, and the first menu access to the binding directory is unresolved.

RECOMMENDATION. Keep the post-build link as a proposal whose installation point is unresolved. Do not state that the key-port hook runs after the builder. Limit every checksum and decompression sentence to the functions listed above, and label the rest unexamined.

## 6. Wording, head copy, and listing bounds

No qualifying region of 10,008 bytes was established. The longest `0xFF` runs inside loaded sections remain 1,912 bytes (section 4) and 1,776 bytes (section 1). `0x60320000` for 10,008 bytes is `0xFF` and lies in the unloaded gap `0x6031f000`–`0x603ba800`. Q6 stays open: the twelve pointer hits in the three tails were not re-tested for a secondary CPU or DMA. The archived-placement conflict stays open: 349 of the 368 overlay addresses are in `proposed-changed-bytes.csv`, the section-4 tail leaves 43 bytes, and the helper hole at `0x6031e9c0` is 48 of those archived bytes.

STATIC. The head-copy call is at `0x60021187` (`call 0x6002332f`). The end word `0x60387094` is stored at `0x60021105`. The instruction at `0x60021169` is `mov (0x62960798),D0`, which is setup, not the copy. `work/out/listings/head.txt`. The face table `0x6037bedc` lies inside that copy.

STATIC. `section-init-c1.txt` starts at `0x60045f44`. At `0x60045f6e` the instruction is `mov sp,A0` (`3c`); at `0x60045f6f` it is `add 0x14,A0` (`20 14`). Address `0x60045f70` is the second byte of that add. At `0x6004603b` the instruction is `call 0x60215425` (`dd ea f3 1c 00 a0 0c`), seven bytes through `0x60046041`. Address `0x60046040` is inside that call. Bytes at `0x60045f6e` are `3c 20 14 00`. Bytes at `0x6004603b` are `dd ea f3 1c 00 a0 0c`. `work/out/listings/section-init-b.txt` and `section-init-c.txt` start inside those instructions and are not used as listings of those addresses.

RECOMMENDATION. Say that no qualifying region was established. Leave Q6 and the archived placement open. Cite the head copy at `0x60021187`, and cite section init from `section-init-c1.txt` or from `section-init.txt`, both of which start at `0x60045f44`.
