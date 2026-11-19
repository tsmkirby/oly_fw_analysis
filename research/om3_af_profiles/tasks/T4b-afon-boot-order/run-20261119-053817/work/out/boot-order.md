# T4b boot order and duplicate-record readers

Stock E147 session. Probes and watchpoints only. The image was not written.

The instruction counter is not a session clock. `sim.reset` sets it back to 0 between harness calls, so a later hit can show a smaller `insns` value than an earlier one. The order below is the order the probes fired, which is the order of the records in `work/out/watch-b1.jsonl`. Records were appended in that order and flushed on each step line. `labNs` is the lab clock and stays constant across the bring-up hits.

## Session and arming

`work/out/watch-b1.jsonl` line 1 records the image that was loaded:

- model E147
- file, loaded ROM, and model stock hash all `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, 33554368 bytes
- `OM_EMU_NVRAM` value `off`; no nvram object was passed in
- overlay `none`; loaded flag `on`

The armed record (line 3) is `PlayLab.preinit, after the machine exists and before OsdLab.mm_ctors`, with `insns` 0 and PC `1342177280` (`0x50000000`). That is the machine's reset PC. Guest code has not run. The lab does not execute the firmware reset vector; arming is at the first point the player has a machine, which is before `mm_ctors` and before `native_init`.

The `0x120b` lab key-matrix entry is recorded on line 2. It is an emulator table entry so the board variant accepts that code. The image is not written.

After `enter` (line 10): `bootStaged` true, `sectionsCopied` 10, nvram absent, patch absent, loaded flag `on`, camapp present. The session options in `work/scripts/watch_b1.mjs` are device `tft`, start shooting, `a15` on, idle off, png `none`, `open_menu` false, language `en`.

The run finished `ok` true, `timedOut` false, `stored` 2626, `dropped` 0, `wallMs` 99775. The per-id record cap was not hit.

## Item 1. What ran, with PC, counter, and caller

Caller is MDR, the return address, read when the probe fires.

Bring-up, before the `after-enter` step. Same `labNs` `202192013`. File order:

| Order | Id | PC | insns | Caller (MDR) | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | builder-call | `0x6040476d` | 166533763 | `0x603f0e16` | One execution. The listing is `call 0x60405865` then `clr D0` at `0x60404772`. |
| 2 | builder | `0x60405865` | 166533764 | `0x60404772` | One execution. MDR is the instruction after that call. |
| 3 | bucket write | `0x6040586e` | 166534434 | `0x60404772` | 4-byte write of 0 at `0x62a84b2c`. This is the clear loop in `FUN_60405865` (`mov D1,(A0)` with D1 cleared). |
| 4 | bucket write | `0x604058ac` | 166535145 | `0x60404772` | 4-byte write of `0x62a84c68` at `0x62a84b2c`. Listing: `mov A2,(A0)`. |
| 5 | hook | `0x6017a5fc` | 6735 | `0x60070a13` | The counter is smaller because a reset happened after the builder. The record is later in the log. |
| 6 | hook | `0x6017a5fc` | 2430 | `0x60070a13` | Second execution, still before `after-enter`. |

Counts for the whole session, from `work/out/watch-b1-hits.json`: builder-call 1, builder 1, bucket 2, hook 2, walk-1 32, walk-2 0, walk-3 0, dir 40, idx-walk-1 2528, first 8, page-ctor 12. A search of the JSONL for hit records found no `dup`, `dup-uncached`, `past151`, `past151-uncached`, `walk-2`, `walk-3`, `idx-walk-2`, or `idx-walk-3`.

Directory reads, all inside walk-1:

- `0x6124f4fc`, 32 times. First one: caller `0x61283ede`, insns 4597303, `labNs` 3672220400, value 8. The 12-byte read at the slot gave key 8, pointer `0x615c540c`, count 416.
- `0x6124f500`, 8 times. That instruction is the pointer load on the key-match path.

First `0x216` record `0x615c59dc`–`0x615c59f3`: 8 reads, every one a 4-byte read at `0x6124f522` (`mov (A2),D0` in walk-1), value 534 (`0x216`), caller `0x61283ede`. Index of that address in the key-8 array is 62.

Duplicate record `0x615c6234`–`0x615c624b`: no read. The following word at `0x615c624c` (index 152): no read. Cached and uncached aliases were both watched.

Bucket `0x62a84b2c`: the two writes above. No later write.

Walk-1 entry `0x6124f4e5`: 32 executions. First: caller `0x61283ede`, insns 4597292, `labNs` 3672220400, which is the menu key after `after-enter`. Walk-2 `0x6124f55e` and walk-3 `0x6124f63d`: no execution.

The page-constructor probe at `0x61203696` fired 12 times, caller MDR `0x61203693` on the first hit. A1 was 0 on every hit, so the halfword read was 0. That probe did not produce a page id. Pages below are identified by the drawn title.

## Item 2. Menus

Keys are the lab's native key names. After every key the log records title, highlight, cursor, rows, and texts. Title is the last drawn text; the `texts` array is the screen contents. Editors were left with Menu.

Pages 25, 26, and 27 are the screens whose titles match the menu research. The numeric page id was not observed (see the constructor probe above).

**Page 27, AF Button.** `page27-open`: title `@A02C@@A065@AF Button`, two rows both drawn `@A066@ Priority`, cursors 0 and 1. Both editors opened the help text "When a specified subject is detected at the selected AF target position…" plus `@A066@ Priority` / `@A02F@ Priority`, then Menu returned to the page. Each editor ran walk-1 and read the first `0x216` record (first-record count 1, then 2).

**Page 25, half-press.** `page25-open`: title `@A02C@AF by half-pressing @A052@`, rows S-AF and C-AF/C-AF+TR, values Yes/Yes. OK on each row added a Yes/No choice and Menu returned to the page. Walk-1 stayed at 5 across both OKs. These are inline value screens.

**Page 26, Release Priority.** `page26-open`: title `Release Priority`, same two rows, values Off/On. OK on each row duplicated Off/On in the text list and Menu returned. Walk-1 stayed at 6 across both OKs.

**Page 28.** No step shows a page-28 screen. The T3c construction (rewrite the constructor's page id and retarget the AF Button source record) was not applied. Section 0 forbids a hook that changes behaviour, and that construction is such a change. There was no native route in this session.

**AF target tab.** The tab `6. AF Target Settings & Operations` was opened. Its rows are AF Target Mode Settings, Orientation Linked, Set Home, Select Screen Settings, Loop Settings, and AF Targeting Pad.

- The dedicated goal for AF Target Mode Settings walked Left 32 times and stopped on `1. Basic Settings/Image Quality` (`af-mode-missing`). The row was on screen later (`af-home-done` highlight is that row). The page itself was not entered.
- Orientation Linked opened, rows AF Target Mode and AF Target Point. OK on the first row swapped which of those strings was the title. Further Downs left that short page and the later OKs of that goal opened Set Home, Select Screen Settings, and Loop Settings.
- Set Home opened with the same two rows. Its later Downs again left the page.
- Select Screen Settings opened, rows dial and button. The first editor showed Off / `@A03F@` / `@A03D@`. The second row's cursor was null and the same chooser text came back.
- Loop Settings opened both editors and cancelled them. Loop Selection help: "Stops after moving the AF target to the edge." Options Off, Loop 1, Loop 2. The other row's help is about wrapping the target, options Yes/No. These two OKs read the first `0x216` record (counts 3 and 4).
- AF Targeting Pad was the highlighted tab row. OK changed the drawn value between On and Off and stayed on the tab. Later steps of that goal have empty screen reads, while walk-1 continued to increment. A separate target-point editor was not shown.

**Button, Fn lever, and dial assignment.** Gear operations pages:

- Button Settings, three rows. The first two editors are button lists whose visible tail includes `@A035@REC` and AF-ON (highlight is a glyph). The shutter-function row stayed on the page with value `@A035@REC`. Menu restored the page.
- Fn Lever Settings, three rows, each cancelled. The first two editors offer Off, mode1, mode2, with the help text about switching AF mode, AF target mode, and AF target point from the Fn lever. The third editor is Fn versus ON/OFF versus OFF/ON, with the power-switch help. First-record count rose to 7.
- Dial Settings, four rows, each cancelled and the page restored. Editors: still-photo dial modes P/A/S/M/B, video dial modes P/A/S/M, the menu-tab loop Yes/No help, and Dial Direction with Exposure and Ps. First-record count rose to 8. Final counts at `dial-done`: walk-1 32, dir 40, idx-walk-1 2528, page-ctor 12, first 8, hook 2, bucket 2.

## Item 3. Order

Probe-fire order:

1. Descriptor call `0x6040476d`, then `FUN_60405865`, during bring-up, before `after-enter`.
2. Both bucket writes, inside that same builder execution.
3. Two executions of the key-port hook `0x6017a5fc`, still before `after-enter`, caller `0x60070a13`.
4. First directory read and first walk-1, together, on the menu key after `after-enter`. Caller `0x61283ede`. The directory read is `mov (A1),D1` at `0x6124f4fc`.

A runtime installer placed at `0x6017a5fc` would, on the two executions this session actually performed, run after the descriptor build and after the bucket publication, and before the first menu lookup.

The menu keys of this session did not enter `0x6017a5fc`. The hook count is 2 at `after-enter` and still 2 at `dial-done`. Those keys were injected through the lab key path, above that hook. This session shows the hook's place in bring-up. It does not show the hook running on every key.

## Item 4. Duplicate record

**Readers of `0x615c6234`–`0x615c624b`.** None. The watch covered 24 bytes at the cached address and at the uncached alias `0xa15c6234`. Both counts are zero, and the JSONL has no hit with those ids.

**Readers of the first `0x216` record.** One instruction: walk-1 `mov (A2),D0` at `0x6124f522`, eight times, value `0x216`, caller `0x61283ede`.

**Directory readers.** Walk-1 only: `0x6124f4fc` (32) and `0x6124f500` (8).

**Scans and index 151.** The index probe is the `udfu01 0x18` at `0x6124f51c`, which is the inner-loop index before it is multiplied by 24. The load of the record is the next `mov (A2),D0` at `0x6124f522`. That load is what fired the first-record watch, so a load at the duplicate address would have fired the duplicate watch.

- 30 walk-1 invocations, caller `0x61283ede`. Largest index 139. None reached 151. These are the invocations that read the first record.
- 2 walk-1 invocations, caller `0x6125617f`, insns 458597 and 458425. Each sampled indexes 0 through 170 (171 samples, 20 of them at or above 151). They did not read `0x615c59dc` and did not read `0x615c6234`. The base they indexed was not the key-8 array at `0x615c540c`. An index of 170 in another key's array is not a scan of key 8 past index 151.

No key-8 scan passed index 151. Walk-2 and walk-3 did not run, so they contributed no scan.

**Static computed index.** `work/out/static-index-b1.txt`, over the whole decoded image:

- The immediate `0x615c540c` occurs once, at `0x615cc938`, the pointer word inside the directory slot (bytes `0c545c61`). It is not an instruction operand beside a multiply.
- The immediate `0x615cc934` occurs three times: `0x6124f4f8`, `0x6124f579`, `0x6124f650`. Those are the three walkers.
- Immediates of the first record, the duplicate, and index 152's address: none.
- `udfu01` of 24: 454 sites (D0 314, D1 83, D2 47, D3 10).
- Window used: a `*24` site whose 192 bytes before it, or 48 after it, contain the array-base immediate, the directory immediate, or the directory-slot immediate. Three sites, and they are the three walker multiplies: `0x6124f51c` (D0), `0x6124f5c0` (D0), `0x6124f684` (D1).
- The constant `0xe28` (151×24) occurs four times (`0x60257658`, `0x602580a0`, `0x6035b660`, `0x606a8b58`), none in a walker window.

The 454 other `*24` sites were not each shown to use some other base. The computed-index claim is the window above.

**Reuse hypothesis.** On the paths this session exercised, the duplicate record had no reader. That supports the hypothesis on those paths. It is not a finding that the record is unused. Walk-2 and walk-3 never ran. No key-8 search whose match sits at index 151 or later was observed. Page 28 was not opened. The grade is: supported on the exercised paths, and unresolved as a general claim of unused.
