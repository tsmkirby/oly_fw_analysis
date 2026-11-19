# T4b result

1. **Task identifier and brief version used:** T4b-afon-boot-order. Brief version 2026-11-19. Brief SHA-256 `2a7cf5220ebe28e998b164fc2cd201fb610635d69d8874c431d9e2298aef4e2c`.

2. **Research baseline used:** T4 packaging README and `out/packaging-c1.md`; `ref/tasks/T4-afon-packaging/decision.md` (accepted bounded analysis; the duplicate-reuse claim was withdrawn to a hypothesis, the watch had been armed after boot, and the flash callees below the partial windows were open); `ref/HARDWARE-STAGE0-RECORD.md` (key-port point `0x6017a5fc`); `ref/analysis/button-af/AFON-MENU-RESEARCH.md` for the page titles. Input hashes, command 01: decoded main `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes), resource 0106 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059` (143523776 bytes). The watch loaded that same main hash and the model stock hash matched it. No OM-Emu patch. `OM_EMU_NVRAM` was `off`.

3. **Work performed:** Every command went through `work/scripts/run_logged.mjs`. Records are `work/out/cmd/NN.*`. Command 04 was not used.

- 01 `python -I work/scripts/hash_inputs_b1.py`
- 02 `python -I work/scripts/static_index_b1.py`
- 03 `tools\bin\run-ghidra.cmd -postScript T4bListB1.java work/out/flash-roots-b1.txt work/out/listings work/out/flash-calls-b1.txt -log work/out/ghidra-b1.log` — the script did not compile (`T4bListB1.java:92: error: cannot find symbol`). The launcher still exited 0. No listings.
- 05 `node26 work/scripts/watch_b1.mjs om-emu` — stock watch, exit 0, `done` ok.
- 06 `tools\bin\run-ghidra.cmd -postScript T4bListB2.java work/out/flash-roots-b1.txt work/out/listings work/out/flash-calls-b2.txt -log work/out/ghidra-b2.log` — stdout `listed 71`.
- 07 `python -I work/scripts/summarize_b1.py`
- 08 `python -I work/scripts/check_listings_b1.py` — `files 71 rows 2323 mismatches 0`
- 09 `node26 -p process.version` — `v26.12.1`
- 10 `java -version` — `openjdk version "25.0.5" 2026-10-20 LTS`
- 11 `python -I work/scripts/write_manifest_b1.py` — first write of the manifest, before this result's note on the wrapper files was corrected.
- 12 `python -I work/scripts/write_manifest_b2.py` — writes `work/evidence-manifest.json`. The wrapper writes `12.cmd.txt` before the script starts, and that file is in the manifest. It writes `12.out`, `12.err`, and `12.exit` after the script exits, so those three files are not entries.

4. **Files examined:** `brief.md`, `TASK.md`, `templates/result.md`, `review-brief.md`, the T4 README, `packaging-c1.md`, `decision.md`, `HARDWARE-STAGE0-RECORD.md`, `AFON-MENU-RESEARCH.md`. Decoded main at the addresses in the two out documents. Ghidra listings under `work/out/listings` (71 files). The watch loaded 139 emulator modules; `work/out/import-inventory-b1.json` lists each path and hash, and the manifest repeats them as sources. OM-Emu was not modified.

5. **Files created:** Everything under `work/` except `work/evidence-manifest.json` itself, and except `work/out/cmd/12.out`, `12.err`, and `12.exit`, which the wrapper creates after the manifest is sealed. The manifest lists the rest.

6. **Findings:**

1. OBSERVED-EMU. Probes were armed in `PlayLab.preinit` after the machine existed and before `OsdLab.mm_ctors`, at insns 0 and PC `0x50000000`. That is before the first guest instruction.
2. OBSERVED-EMU. The session loaded the stock E147 image. `OM_EMU_NVRAM` was `off`, no nvram object and no patch were present, the loaded flag was `on`, camapp was present, boot was staged, and 10 sections were copied.
3. OBSERVED-EMU. Probe-fire order during bring-up: call at `0x6040476d` (caller `0x603f0e16`), `FUN_60405865` (caller `0x60404772`), bucket write of 0 at `0x6040586e`, bucket write of `0x62a84c68` at `0x604058ac`, then two executions of `0x6017a5fc` (caller `0x60070a13`). The first directory read and the first walk-1 are later, on the menu key, caller `0x61283ede`.
4. OBSERVED-EMU. The hook count is 2 for the whole session, including every menu key. Those keys did not enter `0x6017a5fc`.
5. INFERRED. On the two hook executions this session performed, code at `0x6017a5fc` runs after the descriptor build and the bucket writes, and before the first menu lookup.
6. OBSERVED-EMU. The duplicate range `0x615c6234`–`0x615c624b` and the index-152 word `0x615c624c` were not read, at the cached address or the uncached alias. The first `0x216` record was read 8 times, all by `mov (A2),D0` at `0x6124f522`, value `0x216`.
7. OBSERVED-EMU. Walk-1 (`0x6124f4e5`) ran 32 times. Walk-2 and walk-3 did not run. Directory reads were `0x6124f4fc` (32, first value key 8, pointer `0x615c540c`, count 416) and `0x6124f500` (8).
8. OBSERVED-EMU. Two walk-1 invocations from caller `0x6125617f` carried the inner index from 0 through 170. They did not read `0x615c59dc` or `0x615c6234`. The 30 invocations from `0x61283ede` reached at most index 139. No key-8 scan passed index 151.
9. STATIC. In the whole decoded image, the only `udfu01 *24` sites within 192 bytes before or 48 bytes after the directory immediate are the three walker multiplies. The array-base immediate occurs once, as data in the directory slot at `0x615cc938`.
10. HYPOTHESIS. Reuse of the duplicate record is supported on the exercised paths: those paths did not read it. The claim that the record is unused is unresolved. Walk-2, walk-3, a key-8 match at index 151 or later, and page 28 were not exercised.
11. OBSERVED-EMU. The AF Button page, the half-press page, and Release Priority were opened, and each of their two rows was OK'd and cancelled. Page 28 was not opened. The constructor probe at `0x61203696` fired 12 times with A1 equal to 0, so it did not yield a page id. Pages are identified by title.
12. OBSERVED-EMU. The AF target tab was opened. Orientation Linked, Set Home, Select Screen Settings, and Loop Settings were entered, with the coverage limits in the tests section. AF Target Mode Settings was highlighted and was not entered. Button Settings, Fn Lever Settings, and Dial Settings were opened and each listed row was OK'd and cancelled.
13. STATIC. The six flash functions and their callees were listed to the depth in `work/out/flash-callees.md`. The listing bytes match the image (0 mismatches).
14. STATIC. Listed controller-register writes are in `FUN_60022c32` (`0x98d00200` and the registers named in the flash note) and `FUN_60021d89` (`0x98d01108`, `0x98d011c0`, `0x98d01800`, `0x98d01804`).
15. STATIC. No listed instruction sums a byte or word loaded from the copy, and no listed instruction tests a compressed header or inflates a buffer. The listed copies store the byte they load (`FUN_600226c0`, `FUN_60023deb`) or program the controller. `FUN_600218ea` updates a length word. `FUN_6004d7b1` compares the halfword at `0x60357008` with `0xbeef`. Three level-2 listings are truncated, and calls below level 2 are not listed. A checksum or a decompressor there is outside this finding.

7. **Evidence for each claim:** Findings 1–8 and 11–12: `work/out/watch-b1.jsonl`, `work/out/watch-b1-hits.json`, and the reduction in `work/out/cmd/07.out`. Finding 3's instruction identities: `work/out/listings/d0-builder-60405865.txt`, `d0-builder-call-6040476d.txt`. Finding 9: `work/out/static-index-b1.txt`. Finding 10 is the grade of findings 6–9. Findings 13–15: `work/out/flash-callees.md`, `work/out/flash-calls-b2.txt`, `work/out/listings/`, `work/out/cmd/08.out`. Image offset for every listing row is `address - 0x60021020`.

8. **Tests and outcomes:**

- PASS. Command 01: loaded image hash equals the model stock hash.
- FAIL. Command 03: `T4bListB1.java` did not compile. No listings from that run. The launcher exit status was 0.
- PASS. Command 05: `done` ok, timedOut false, dropped 0, stored 2626.
- PASS. Command 06: `listed 71`.
- PASS. Command 08: 71 files, 2323 rows, 0 mismatches.
- PASS. `T4bListB1.java` on disk hashes to the SHA-256 recorded in `work/out/cmd/03.cmd.txt` (`482c84f6f07e1b0777d5fde3707215d2f91d532c5524083d81415e955a709b8d`, 4984 bytes).
- BOUNDARY. Page 28 was not opened. The reference construction changes behaviour and was not applied.
- BOUNDARY. AF Target Mode Settings was visible and was not entered. The orientation and Set Home goals walked off their short pages onto later tab rows. Select Screen Settings' second row came back with a null cursor. AF Targeting Pad stayed on the tab row, and later steps of that goal have empty screen reads.
- BOUNDARY. The constructor probe did not return a page id.
- BOUNDARY. Walk-2 and walk-3 did not execute.
- BOUNDARY. Menu keys did not enter `0x6017a5fc`.
- PASS, inside the stated depth. No listed body sums the copied bytes or inflates them. BOUNDARY for the three truncated listings and every `not-listed` call.

9. **New versus previously established:**

- Finding 1 is new. T4 armed the watch after `open_session`.
- Findings 3 and 5 are new. T4's order was unresolved because the builder and the hook had already run before the watch was armed.
- Findings 6 and 7 confirm T4 on a session that includes bring-up and the pages above: the duplicate was not read, and walk-2 and walk-3 did not run.
- Finding 8 is new: two walk-1 calls indexed to 170, and those indexes were not indexes into the key-8 array. The key-8 scans that did run stopped by index 139.
- Finding 9 confirms the three walker sites and bounds the search that found no other computed index in the stated window.
- Finding 10 confirms the T4 decision: the reuse claim stays a hypothesis. The exercised paths now include bring-up and the editors above.
- Finding 11 is new for the half-press and Release Priority rows: OK changed the drawn text (Yes/No, Off/On) and Menu returned. Those OKs did not run walk-1. T4 had not reached those editors. Page 28 remains unopened, as in T4.
- Findings 13–15 are new. T4 had not listed these callees through to the controller writes, and had not closed the checksum question even for the windows it did list.

10. **Remaining uncertainties.** Walk-2 and walk-3 did not run. A key-8 search that matches at index 151 or later was not observed. Page 28 was not opened, and this brief forbids the construction that would open it. AF Target Mode Settings was not entered. The page-id probe did not read a page number, so the titles are the identification. The injected menu keys did not enter `0x6017a5fc`, so the hook's place on a key that does enter it is the two bring-up executions only. The instruction counter resets, so `insns` is not a single timeline; the JSONL order is. Three flash listings are truncated at 80 instructions, and the calls marked `not-listed` were not disassembled, so a checksum or a decompressor there is not answered. The 454 `*24` sites outside the 192/48 window were not each tied to a base.

11. **Recommended next actions.** Extend the flash listings through the three truncated tails and the `not-listed` calls if the checksum question has to cover the whole tree. A session whose keys enter `0x6017a5fc` would show whether that hook runs on a menu key; this session's keys were injected above it. Walk-2 and walk-3 still have no execution. Page 28 stays unopened for as long as a behaviour-changing construction is out of bounds. None of these is an image, an installer, a storage layout, or a hardware change.

12. **Deviations from the brief.** Item 2 says to open page 28 by the T3c reference construction when there is no native route. Section 0 forbids a hook that changes behaviour, and that construction rewrites the live page id. It was not applied. No native route appeared. Page 28 was not opened. Command 03's listing script failed to compile; command 06 is a new file that produced the listings, and the failed file was left at the bytes command 03 recorded. `work/out/cmd/12.out`, `12.err`, and `12.exit` are created after the manifest is written and are not hashed in it. `12.cmd.txt` is written first and is in the manifest. The AF Target Mode Settings page was not entered; that is incomplete coverage of item 2 and is recorded as a boundary in section 8.
