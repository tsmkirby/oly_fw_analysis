# T4b review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   Accepted as bounded emulator observations and byte-verified static listings. Menu coverage remains incomplete, the stated callee-depth guarantee is inaccurate, and the “length word” interpretation is unsupported.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, `work/evidence-manifest.json`, `work/out/boot-order.md`, and `work/out/flash-callees.md`. Examined the watch JSONL and summary, scripts, command records, call tree, listings, import inventory, and audit records.

   Research checked: T4 packaging README; `packaging-c1.md` §1 and §§5–6; `callers-c1.txt` and the earlier watch’s arming/initial records; T4 decision’s Established and Consequences sections; `HARDWARE-STAGE0-RECORD.md`, Owned RAM analysis, Finding 2, and runtime-hook discussion; `AFON-MENU-RESEARCH.md` §6’s page definitions and title mapping. Inspected emulator initialization, probe interfaces, and key-layout handling.

   Review used read-only PowerShell checks. Ghidra and OM-Emu were not run.

3. **Hash verification:** Individually recomputed all **283 file entries**: 2 inputs, 148 sources, and 133 outputs. **Every entry MATCH; no MISMATCH.** The following groups enumerate those entries; each named file has status **MATCH**. Directory prefixes and filename suffixes apply to every name in their group.

   - Inputs: `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - Root/template sources: `brief.md`; `TASK.md`; `templates/result.md`; `review-brief.md`.
   - Research sources: `ref/HARDWARE-STAGE0-RECORD.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`; `ref/analysis/button-af/readiness/t4-afon-packaging/README.md`; its `out/packaging-c1.md`; `ref/tasks/T4-afon-packaging/decision.md`.
   - Sources under `om-emu/emu/checks/lib/`, all `.mjs`: `args`, `coverage`, `env`, `errors`.
   - Source `om-emu/emu/refs/errors.mjs`.
   - Sources under `om-emu/emu/scenarios/`, all `.mjs`: `bind`, `session_replay`.
   - Sources under `om-emu/emu/src/core/`, all `.mjs`: `cores`, `cpu`, `interp`, `mem`.
   - Sources under `om-emu/emu/src/core/m4/`, all `.mjs`: `boot`, `bus`, `cpu`, `dcache`, `decode`, `errors`, `sys`.
   - Sources under `om-emu/emu/src/core/m4/periph/`, all `.mjs`: `adc`, `dma`, `exti`, `flash`, `gpio`, `i2c`, `rcc`, `regs`, `rtc`, `sched`, `spi`, `stm32l4`, `tim`, `usart`, `usb`.
   - Sources under `om-emu/emu/src/debug/`, all `.mjs`: `call`, `debugger`, `live`, `protocol`, `regs`, `snapshot`, `trace`.
   - Sources under `om-emu/emu/src/dev/`, all `.mjs`: `audio`, `bus`, `camfe`, `dml`, `dpc`, `ems1`, `engine`, `hdmi`, `imgpipe`, `imgpro`, `intc`, `lensssc`, `linkpins`, `pdt`, `scpu`, `stub`, `timer`, `vsc`, `vsccompose`, `vsccompose2`, `vscregs`.
   - Sources under `om-emu/emu/src/fw/`, all `.mjs`: `board`, `expand`, `facts`, `image`, `labfw`, `model`, `models`, `nand`, `olyfw`, `overrides-E122`, `overrides-E144`, `patch`, `ports`, `resprefix`, `sections`.
   - Sources under `om-emu/emu/src/lab/`, all `.mjs`: `acc`, `audio`, `audiohw`, `camapp`, `charger`, `cpu2`, `display`, `dispq`, `edid`, `errors`, `hle`, `irq`, `jpeg`, `kernel`, `lens`, `lensmcu`, `mdet`, `media`, `menu`, `menudata`, `menuwalk`, `nav`, `nvramdoc`, `osd`, `osdfmt`, `patchaudit`, `play`, `player`, `playmod`, `power`, `rec`, `resnand`, `resources`, `rtos`, `scene`, `scpudev`, `scpulink`, `scpum4`, `sdcard`, `settings_ids`, `shoe`, `shuttersnd`, `sim`, `sio`, `sound`, `take`, `text`, `uiin`, `video`, `windows`, `wm8946`.
   - Source `om-emu/emu/src/machine.mjs`.
   - Sources under `om-emu/emu/src/util/`, all `.mjs`: `bytes`, `equal`, `hex`, `parse`, `show`, `tally`, `tracejson`.
   - Source `work/scripts/watch_b1.mjs`.
   - Outputs: `work/result.md`; under `work/out/`: `boot-order.md`, `flash-callees.md`, `flash-calls-b2.txt`, `flash-roots-b1.txt`, `ghidra-b1.log`, `ghidra-b2.log`, `import-inventory-b1.json`, `static-index-b1.txt`, `watch-b1-hits.json`, `watch-b1.jsonl`.
   - Command outputs under `work/out/cmd/`: each of `01`, `02`, `03`, `05`, `06`, `07`, `08`, `09`, `10`, `11` with each suffix `.cmd.txt`, `.err`, `.exit`, `.out`; also `12.cmd.txt`.
   - Listings under `work/out/listings/`, each with suffix `.txt`: `d0-builder-60405865`, `d0-builder-call-6040476d`, `d0-flash-21812-60021812`, `d0-flash-218ea-600218ea`, `d0-flash-23042-60023042`, `d0-flash-23228-60023228`, `d0-flash-236a2-600236a2`, `d0-flash-236ea-600236ea`, `d0-hook-6017a5fc`, `d0-walk-1-6124f4e5`, `d0-walk-2-6124f55e`, `d0-walk-3-6124f63d`.
   - Listings under `work/out/listings/`, each named `d1-callee-<address>.txt`: `6002172b`, `60021d89`, `60022087`, `6002269f`, `600226c0`, `600229c2`, `60022f49`, `60023208`, `60023210`, `60023218`, `600232a9`, `60023deb`, `6004d43f`, `6005cec3`, `6005d00e`, `60075f73`, `60075fbc`.
   - Listings under `work/out/listings/`, each named `d2-callee-<address>.txt`: `600213f3`, `600219ed`, `60021b30`, `600225b2`, `600225fa`, `60022640`, `60022696`, `600226a8`, `600226ae`, `60022c32`, `60022f1f`, `60022f52`, `60023c05`, `60023d0a`, `60023d5f`, `60023f80`, `60024953`, `60024d0e`, `60031521`, `60031609`, `6003193e`, `60035feb`, `600364b7`, `60038b8a`, `6004d4e8`, `6004d705`, `6004d7b1`, `6004ddd7`, `6004dfd0`, `6004e2d5`, `6004f63f`, `6004f660`, `6004f667`, `6005ceb3`, `6005cebd`, `60060835`, `60068a54`, `60076082`, `60076096`, `600760c7`, `600760d2`, `6008200e`.
   - Script outputs under `work/scripts/`: `check_listings_b1.py`, `hash_inputs_b1.py`, `run_logged.mjs`, `static_index_b1.py`, `summarize_b1.py`, `T4bListB1.java`, `T4bListB2.java`, `watch_b1.mjs`, `write_manifest_b1.py`, `write_manifest_b2.py`.

   The manifest’s separate `brief_sha256` field also **MATCH**. All embedded command-script and wrapper hashes **MATCH**, resolving the Java script names under `work/scripts/`. Command 12’s script hash also matches its separately recorded exit metadata.

   Additionally, all 137 audit harvested-file hashes **MATCH**. The audit’s baseline diff hash matches after CRLF-to-LF normalization; its raw copied representation has different line endings. `12.out`, `12.err`, and `12.exit` are explicitly outside the evidence manifest.

4. **Claim-by-claim:** Findings below refer to the fifteen numbered findings in `result.md` §6.

   - **Finding 1 — CONFIRMED.** `armed` precedes every hit, at instruction count 0 and PC `0x50000000`. `OsdLab` invokes `preinit` before memory-manager constructors and native initialization. This establishes arming before the player’s first guest instruction, not execution of the physical firmware reset chain.
   - **Finding 2 — CONFIRMED, bounded to this harness.** Independently hashed main and resource inputs. The logged loaded-ROM/main/model hashes agree; actual recorded `OM_EMU_NVRAM` is `off`. No NVRAM object or session patch is supplied. Staged boot and ten copied sections are logged. The disclosed `0x120b` host key-matrix adjustment does not write image bytes.
   - **Finding 3 — CONFIRMED.** JSONL order is builder call `0x6040476d`, builder entry `0x60405865`, bucket writes at `0x6040586e` and `0x604058ac`, then two hook entries `0x6017a5fc`. Builder call/entry counts are 166533763/166533764; bucket counts 166534434/166535145. Builder MDR is `0x60404772`; hook MDR is `0x60070a13`, with reset instruction counts 6735 and 2430. Later, walker entry occurs at count 4597292, followed by directory read at 4597303, both with MDR `0x61283ede`. Thus walker entry precedes its directory read.
   - **Finding 4 — CONFIRMED.** Hook count remains two through the menu exercises. Recomputed all hit totals directly from JSONL.
   - **Finding 5 — CONFIRMED as a conditional inference.** The two observed hook executions follow builder publication and precede the first observed menu lookup. This does not establish physical reset ordering or hook execution on the injected menu keys.
   - **Finding 6 — CONFIRMED.** No logged duplicate or following-word reads at either watched alias. Eight first-record reads occur at `0x6124f522`, value `0x216`. Independently confirmed that both 24-byte records are identical.
   - **Finding 7 — CONFIRMED.** Walk-1 executes 32 times; walks 2/3 never appear. Directory read PCs/counts are `0x6124f4fc`: 32 and `0x6124f500`: 8. The logged slot contains key 8, pointer `0x615c540c`, count 416.
   - **Finding 8 — CONFIRMED.** Independently reconstructed invocation boundaries and index maxima. Two calls from `0x6125617f`, starting at instruction counts 458597 and 458425, each sample indices 0–170. Neither reads either watched record. The other thirty invocations have maximum index 139. Together with the walker’s actual record-load instruction and absent duplicate hits, this supports no observed key-8 scan through index 151.
   - **Finding 9 — CONFIRMED only for the stated byte-pattern heuristic.** Independently reproduced 454 multiply-pattern hits, register totals 314/83/47/10, the three nearby walker sites, immediate locations, and four `0xe28` occurrences. This is not an exhaustive data-flow search for computed key-8 indexing in all loaded code. The remaining count is **451**, not “454 other” sites.
   - **Finding 10 — SUPPORTED-NOT-INDEPENDENT as a hypothesis.** The independently checked observation is “no reader on the exercised stock paths.” General unused status and safe reuse remain unresolved. No changed-record experiment demonstrates preserved behavior.
   - **Finding 11 — CONFIRMED within the reported identification limits.** Titles and cursor rows support pages 25/26/27; both rows on each receive OK and subsequent Menu. Half-press rows show Yes/No choices; Release Priority rows show Off/On choices. Page 28 is absent, neither natively reached nor constructed. Twelve constructor hits all have A1/pageId zero, so numeric page identification relies on the research title mapping.
   - **Finding 12 — CONFIRMED as partial coverage.** The AF target tab and named subordinate pages appear. AF Target Mode Settings is highlighted but never entered. Orientation/Set Home navigation subsequently operates on other tab rows; Select Screen Settings loses cursor identification; AF Targeting Pad remains on the tab and later screen reads are empty. Button/Fn/Dial pages and their reported row operations are present. This does not satisfy opening the requested AF target selection screen.
   - **Finding 13 — OVERSTATED regarding depth; CONFIRMED regarding bytes.** Independently compared all **71 files / 2,323 instruction rows: zero mismatches**. Caps and three truncated bodies agree with the files. However, `listed` is global and first-encounter-based: a function first reached at depth 2 is skipped when later reached at depth 1. For example, root `0x600218ea` directly calls `0x60023c05`, but its callee `0x60023c0d` remains unlisted. Likewise `0x6008200e → 0x60082243`, and root `0x60021812 → 0x60023f80 → 0x6002481d`. Therefore uniform two-level coverage from every root is not established.
   - **Finding 14 — CONFIRMED.** The named controller-register stores appear in the byte-verified listings for `0x60022c32` and `0x60021d89`. `0x60022087` also contains related controller programming.
   - **Finding 15 — CONFIRMED for the bounded instruction observations; UNSUPPORTED for “length word.”** Listed copy loops forward loaded values; the fixed `0xbeef` comparison is present. No listed payload checksum or decompressor was identified. However, `0x60021812` initializes descriptor `+0x10` from `0x60023c05`, and `0x600218ea` replaces it with a difference involving another call result and a wrap path. The listings establish a counter difference, not a payload length. The short load/add pattern scan alone is not a general checksum detector.

   For the remaining numbered result sections: identifier/version and artifact contents are **CONFIRMED**; recorded commands and claimed examination history are **SUPPORTED-NOT-INDEPENDENT** as historical completeness assertions. Command 03’s compile failure, replacement script, preserved script hashes, and reported command outcomes are **CONFIRMED** from records. §4’s “139 emulator modules” is **WRONG**: the inventory contains **138 emulator modules plus the watch script**. §§8–12 generally disclose the coverage and inference limits correctly, subject to the depth and counter-word corrections above.

5. **Contradictions with established findings:** No new contradiction with accepted T4 findings when conclusions remain bounded.

   - T4 `packaging-c1.md` §1 and decision Established Q2 retain duplicate reuse as a hypothesis; these observations do not close it.
   - T4 `packaging-c1.md` §5 and decision Established Q4 leave ordering unresolved. T4b adds ordering evidence for staged player initialization, without establishing physical reset ordering.
   - The existing conflict between `HARDWARE-STAGE0-RECORD.md`, Finding 2, and T4 decision Established Q1 concerning section-7 compression remains open. Bounded flash listings do not settle it.
   - The stage-0 runtime-hook discussion observes raw-key execution through `0x6017a5fc`; its absence on this run’s injected menu keys is consistent with a different injection path.

6. **Alternative explanations** not excluded by the evidence.

   - Unvisited editors, walks 2/3, later key-8 searches, another mode/core, or code outside the watched execution paths may read the duplicate.
   - Computed readers may obtain the array pointer indirectly, use different arithmetic, or keep constants outside the heuristic window.
   - Player-selected initialization and host staging may order functions differently from physical reset and task scheduling.
   - Changed text does not always prove a distinct editor transition; stale draw content and lost cursor identification limit some coverage assertions.
   - Unlisted callees, truncated instructions, or controller behavior may perform integrity checks or decompression. Absence of a load/add pattern excludes neither CRC-style checks nor hardware processing.

7. **Scope and safety:** No image construction, installer construction, storage selection, or hardware recommendation was found in the submitted work/scripts. Output-writing paths are under `work/`; the audit reports zero isolation violations and unchanged inputs/workspace.

   `om-emu` contains four disclosed pre-existing local modifications: path handling in `env.mjs`/`blobs.mjs`, optional research callback support in `camapp.mjs`, and IRQ-table observation in `rtos.mjs`. The baseline audit records these; no task-created emulator change is evidenced. Thus “OM-Emu was not modified” should mean unchanged from the supplied baseline. The session also expressly adjusts the host `0x120b` key-matrix entry.

   This review made no file changes and launched neither Ghidra nor OM-Emu.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Describe actual flash coverage as capped, first-encounter traversal; withdraw the uniform depth-two guarantee and identify the shallower-path omissions above. Clarify that `not-listed` marks an unexpanded edge at that traversal point: its target can be listed elsewhere.
   2. Replace “length word” for `FUN_600218ea` with “descriptor `+0x10` counter-difference word; semantic role not established by these listings.”
   3. Mark brief item 2 incomplete: page 28 and the AF target selection screen were not opened. Preserve the justified section-0 prohibition on constructing page 28. A failed navigation attempt does not prove that no native route exists.
   4. Keep reuse unresolved beyond the exact observation “no duplicate reader on the exercised stock paths,” and explicitly state that the computed-index search is a proximity heuristic rather than exhaustive reader analysis.
   5. Correct the inventory to 138 emulator modules plus one watch script, and the multiply-pattern remainder to 451.

   Optional improvements: capture the selected array base/key alongside each invocation; use a monotonic event sequence number; validate navigation against the intended parent page after each cancellation; seal post-manifest command records separately; track minimum traversal depth when deduplicating callees.