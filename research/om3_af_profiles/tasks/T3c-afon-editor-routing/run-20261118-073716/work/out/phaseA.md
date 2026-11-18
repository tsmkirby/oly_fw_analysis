# Phase A — editor route

Corrected after Sol's review `run-20261118-073208-review`. The measurements below are the original traces plus the correction-round experiments E1, E3 and E4. E2 was not run.

## 1. How OK chooses an editor

Page 27's stock rows are kind 12. Row 2154 at `0x6158dc44` and row 2155 at `0x6158dc68` each point at the two-record list `0x6158ba04` (option-record kind 4, text ids `0x127b` and `0x124f`) and have a null alternate list. The T3a overlay row at `0x6031e978` is kind 4, label `0x0DD2`, with both option pointers at `0x6158ba1c` (option-record kind 12) and count 10. Page 28's rows at `0x6158dc8c` match that shape. Page 29's rows at `0x6158dcf8` are kind 4 with count 0. (`work/out/static-route-a1.txt`, `work/out/static-rows-c1.txt`)

OK on 2154 and OK on 2155 each open a two-option chooser (`work/out/trace-a1-2154.png`, `work/out/trace-a1-2155.png`, and again `work/out/exp-e1-c1-2154.png`). The chooser path that those OKs enter is `FUN_610cdebf` → `FUN_610cdf05` → `FUN_610e2536`. `FUN_610e2536` is called from `FUN_610cdf05` at `0x610cdf91` (return address `0x610cdf98`). The same path runs for C-AF Area (`work/out/exp-e3-c1-caf.png`).

`0x3D6F` does not enter that path. `trace-a1.jsonl` does record other entries inside the `0x610e` address range, including `FUN_610e5fe1` and `FUN_610e615c`. Those are not the chooser path.

### Decision point

The earlier compare in `FUN_611f703b` (`0x611f7074`, `0x611f7078`, `0x611f707c`) is not this split. On 2154, 2155 and `0x3D6F` it saw 0 (`work/out/trace-kind-a3.jsonl`). C-AF Area was not measured at that compare.

The split that the correction traces measured is in `FUN_6124f6c7`, which `FUN_61283b1c` calls for the OK key `0x900C` (36876). At `0x6124f7be` it calls `FUN_6119a2be` on the page object. That call returns to `0x6124f7c0`. The branch is the next compare:

- `0x6124f7d4`: `cmp 1, D0`
- `0x6124f7d8`: `cmp 0, D2`

`FUN_6119a2be` reaches `FUN_61203082` (slot `+0x68` of vtable `0x6158ae0c`). `FUN_61203082` is an 11-byte trampoline to the pointer at the page object `+0x50`, which is `FUN_6120308d` for both 2154 and `0x3D6F` (`work/out/trace-method-c1.jsonl`). `FUN_6120308d` calls vtable[0] of the object at `+0x58`. The value that differs is the D0 that comes back to `0x6124f7c0`.

D2 is 0 for this key. It is not the value that distinguishes the rows.

| Case | D0 at `0x6124f7d4` | D2 | What follows |
| --- | --- | --- | --- |
| 2154 | 4 | 0 | `FUN_6124f6c7` returns 3. `FUN_61283b1c` calls `FUN_6127e750`. The chooser path runs. |
| 2155 | 4 | 0 | Same. |
| C-AF Area | 4 | 0 | Same. The child vtable is `0x6157c834`. |
| `0x3D6F`, T3a row | 1 | 0 | D0 is 1 and D2 is 0, so `0x6124f7e2` calls the child vtable[0], `FUN_61203816`. The function returns 0. No chooser. |
| E1, 2154's 36 bytes with id `0x3D6F` | 1 | 0 | Same as the T3a row. |
| E4, row and provider id both 2154 | 4 | 0 | Chooser opens. |

A second event, key `0x900D`, returns 0 in every one of these traces. The listing is `work/out/disasm-ok-dispatch-c1.txt`.

E1 kept the provider id list at `2154, 2155, 0x3D6F` and copied row 2154's other 32 bytes. The third row drew `@A02F@ Priority` (the text for value 0 on `0x6158ba04`). OK still returned 1. So row kind 12, a kind-4 text list, a null alternate and a count of 2 do not by themselves make this chain return 4.

E3 copied all 36 bytes, including setting id 2154, and left the provider id at `0x3D6F`. The page drew two rows, not three. OK after two Down presses returned 1 and did not open a chooser.

E4 made one further change: the provider list's third id became 2154. The page drew three `@A066@ Priority` rows, and OK opened the two-option chooser. `0x90a1` stayed `[1, 1]`. That chooser is 2154's editor, not an editor for `0x3D6F`.

Native registration, read before the value hooks (`work/out/exp-e4-c1.jsonl`):

- `FUN_604058bc(2154)` returns descriptor `0x6062132c`: template `0x606190b7`, count 2. `FUN_60419446(2154)` returns `0x90A1`. `FUN_60419696(2154)` returns 0.
- `FUN_604058bc(0x3D6F)` returns `0x6031e9a0` only after the EMULATOR-ONLY bucket link. That descriptor's template is `0x606178b1` and its count is 10. `FUN_60419446(0x3D6F)` returns 0. `FUN_60419696(0x3D6F)` returns 0.

The stock setter `FUN_6041937f` calls the store `FUN_60063431` only when the mapped getter returns non-zero. For `0x3D6F` that native return is 0. The session's EMULATOR-ONLY setter is what would store the profile byte, and it was not called on any of these OKs.

`FUN_611c7894` is not part of this decision. It is a 26-byte copy of bytes into halfwords (`ref/analysis/decompiled-main/functions/611c7894.c`). `FUN_611c7785` calls it only while decoding one option record whose kind is 1, 2, 5, 6, 7, 8, 9, 10 or 11. The records at `0x6158ba1c` are kind 12, so that call is skipped. It does not build a chooser.

## 2. What pages 28 and 29 open

Searches that did not find a native route to page 28 or page 29: the 26 handler-table entries at `0x6158f3b4` (no key 27, 28 or 29), the u32 references to each page's row pointer (only the pointer field inside that page's own descriptor), and the direct `CALL` sites of the viewer constructor `0x61203696` (one direct caller, the type-`0x40` wrapper `0x61203676`). The script's title walk prints each page's state record; it does not search every menu item for a matching route. Computed ids and indirect callers were not exhausted. (`work/out/static-route-a1.txt`)

Each page was then built in its own stock session by an EMULATOR-ONLY reference construction: the AF Button source record at `0x61529cec` was pointed at that page's id list, and the ushort at the constructor argument plus 4 was rewritten from 27 to the target page id. (`work/out/page28-a3.jsonl`, `work/out/page29-a3.jsonl`)

Page 28 shows the title "AF Target Mode" and three rows of that name. Each row's value is a full grid, the first record of `0x6158ba1c`. OK on the first row leaves that screen in place. List type returns 1. The object at the model plus `0x58` has kind 11. `FUN_61203e81` is entered and returns 0. `FUN_610cdf05` is not entered.

Page 29 shows the title "AF Target Point" and three rows of that name. OK on the first row leaves it in place. The same list type, kind, and `FUN_61203e81` return were recorded. The target-selection editor was not entered on this OK, so the settings that editor would read and write were not observed.

Endpoint readback, both pages, before the menu and after OK. Unchanged in that pair of snapshots: `0x9fa1` `[0,0,0]`, `0x99d2` `[526,526,526]`, `0xdfa1` `0`, `0x1ea1` `0`, `0x99a1` `[2,0,2,0,2,0,5,5]`, `0x9a41` `0`, `0x5962` `[526,526,526,526,526,526]`. UI ids 238, 517, 1692, 1693, 1713 and 2273 through 2279 read 0 through `s.get`. UI ids 165, 1694 and 1695 read 526. `0x1dd1` changed from `[3,3,3,3,3,3,3,3,3,3]` to `[27,39,3,3,3,3,3,3,3,3]`. Those runs have no settings-write trace and no snapshot taken at the OK key itself, so a write that was restored before the endpoint would not appear. The `ORIGINALLY` ids were read with `s.get` and have no map0 key in the readback. Nothing was saved.

## 3. Route ratings

R1. Not established. The four Phase B data trials and E1 did not put `0x3D6F` on `FUN_610cdebf` → `FUN_610cdf05` → `FUN_610e2536`, and none of them showed the 10 records of `0x6158ba1c` in a chooser. E4 shows that a third slot whose provider id is 2154 can open 2154's two-option chooser. That is not the `0x3D6F` editor. A code change that made `FUN_6119a2be` return 4 for `0x3D6F` is a hypothesis. See `work/out/design.md`.

R2. Not measured as a general impossibility. On the OK that was pressed on the first row of the reference-constructed page 29, the target editor was not entered. Its reads, writes, and whether it selects a zone type were not observed. The endpoint cells in section 2 changed only in the menu-entry pair `0x1dd1[0]` and `0x1dd1[1]`.
