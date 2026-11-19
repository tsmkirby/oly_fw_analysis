# T7 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The correction establishes the raw-store traces and improves provenance. The ten-byte producer remains untriggered, its required static connection to pose-dependent bank selection is incomplete, and the asserted Off value contradicts the accepted `0x90a1` mapping.

2. **Baseline checked:** `TASK.md`, `review-brief.md`, and `brief.md` completely; `audit/previous-review.md`; updated `work/result.md`; the complete manifest and command-13 supplement; both deliverable reports; correction scripts, JSONL, listings, screenshots, command records, import inventories, and isolation audit.

   Research sections checked: `FEATURE-SPEC.md`, “Current evidence and limits”; `AFON-MENU-RESEARCH.md` §1, including the accepted T1 value mapping and orientation banks; T1 page-27 result §6; T3b findings and `stock-target-screen.md`; T5 `target-bytes.md`, including orientation and stock capture; relevant pose references in `PREHARDWARE-AF-AUDIT.md`; emulator `hle-gaps.md` §4.7.3 and E147 notes in `models.mjs`.

   Verification used PowerShell and image viewing. No files were written. Neither Ghidra nor OM-Emu was run.

3. **Hash verification:** All **400 manifest file entries MATCH**, including recorded byte lengths: **5 inputs, 161 sources, 234 outputs**. MATCH applies individually to every member identified below; ranges include every intervening member.

   **Inputs — each MATCH:**

   - `brief.md`, `TASK.md`.
   - `inputs/00_0100_50000020.decoded.bin`.
   - `inputs/02_0106_458c0020.decoded.bin`.
   - `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk00000000.OE.0100.bin`.

   **Sources under `work/scripts/` — each MATCH:**

   `bank_s5.mjs`, `bank_s6.mjs`, `check_listings_r1.py`, `check_listings_r1b.py`, `check_listings_s4.py`, `cmd13_supplement_r1.py`, `manifest_r1.py`, `manifest_s8.py`, `pose.mjs`, `record_r1.mjs`, `run_logged.mjs`, `scan_calls_s2.py`, `scan_index_r1.py`, `scan_keys_s1.py`, `scan_record_s5.py`, `scan_table_s3.py`, `scan_wrapper_r1.py`, `scan_xrefs_r1.py`, `summarize_r1.py`, `T7ListS2.java`, `trace_pose_s4.mjs`, `trace_stores_r1.mjs`.

   **Sources under `om-emu/emu/` — each MATCH:**

   - `checks/lib/`: `args.mjs`, `coverage.mjs`, `env.mjs`, `errors.mjs`, `png.mjs`.
   - `refs/`: `errors.mjs`.
   - `scenarios/`: `bind.mjs`, `session_replay.mjs`.
   - `src/`: `machine.mjs`.
   - `src/core/`: `cores.mjs`, `cpu.mjs`, `interp.mjs`, `mem.mjs`.
   - `src/core/m4/`: `boot.mjs`, `bus.mjs`, `cpu.mjs`, `dcache.mjs`, `decode.mjs`, `errors.mjs`, `sched.mjs`, `sys.mjs`.
   - `src/core/m4/periph/`: `adc.mjs`, `board.mjs`, `dma.mjs`, `exti.mjs`, `flash.mjs`, `gpio.mjs`, `i2c.mjs`, `pwr.mjs`, `rcc.mjs`, `regs.mjs`, `rtc.mjs`, `sched.mjs`, `spi.mjs`, `stm32l4.mjs`, `tim.mjs`, `usart.mjs`, `usb.mjs`.
   - `src/debug/`: `call.mjs`, `debugger.mjs`, `live.mjs`, `protocol.mjs`, `regs.mjs`, `snapshot.mjs`, `trace.mjs`.
   - `src/dev/`: `audio.mjs`, `bus.mjs`, `camfe.mjs`, `dml.mjs`, `dpc.mjs`, `ems1.mjs`, `engine.mjs`, `hdmi.mjs`, `imgpipe.mjs`, `imgpro.mjs`, `intc.mjs`, `lensssc.mjs`, `linkpins.mjs`, `pdt.mjs`, `scpu.mjs`, `stub.mjs`, `timer.mjs`, `vsc.mjs`, `vsccompose.mjs`, `vsccompose2.mjs`, `vscregs.mjs`.
   - `src/fw/`: `board.mjs`, `expand.mjs`, `facts.mjs`, `image.mjs`, `labfw.mjs`, `model.mjs`, `models.mjs`, `nand.mjs`, `olyfw.mjs`, `overrides-E122.mjs`, `overrides-E144.mjs`, `patch.mjs`, `ports.mjs`, `resprefix.mjs`, `sections.mjs`.
   - `src/lab/`: `acc.mjs`, `audio.mjs`, `audiohw.mjs`, `camapp.mjs`, `charger.mjs`, `cpu2.mjs`, `display.mjs`, `dispq.mjs`, `edid.mjs`, `errors.mjs`, `hle.mjs`, `irq.mjs`, `jpeg.mjs`, `kernel.mjs`, `lens.mjs`, `lensmcu.mjs`, `mdet.mjs`, `media.mjs`, `menu.mjs`, `menudata.mjs`, `menuwalk.mjs`, `nav.mjs`, `nvramdoc.mjs`, `osd.mjs`, `osdfmt.mjs`, `patchaudit.mjs`, `play.mjs`, `player.mjs`, `playmod.mjs`, `power.mjs`, `rec.mjs`, `resources.mjs`, `resnand.mjs`, `rtos.mjs`, `scene.mjs`, `scpudev.mjs`, `scpulink.mjs`, `scpum4.mjs`, `sdcard.mjs`, `settings_ids.mjs`, `shoe.mjs`, `shuttersnd.mjs`, `sim.mjs`, `sio.mjs`, `soundres.mjs`, `storage.mjs`, `subject.mjs`, `take.mjs`, `text.mjs`, `touchpanel.mjs`, `windows.mjs`, `wm8946.mjs`.
   - `src/util/`: `bytes.mjs`, `equal.mjs`, `hex.mjs`, `parse.mjs`, `show.mjs`, `tally.mjs`, `tracejson.mjs`.

   **Outputs — each MATCH:**

   - `work/result.md`.
   - Under `work/out/cmd/`: every `01`–`26` member with suffix `.cmd.txt`, `.err`, `.exit`, and `.out`; plus `27.cmd.txt`.
   - Under `work/out/`: `bank-s5-imports.json`, `bank-s5.jsonl`, `bank-s6-imports.json`, `bank-s6.jsonl`, `cmd13-supplement-r1.json`, `descriptors-r1.json`, `ghidra-r1.log`, `ghidra-r1b.log`, `ghidra-r1c.log`, `ghidra-r1d.log`, `ghidra-s2.log`, `ghidra-s3.log`, `ghidra-s5.log`, `listing-bytes-r1.txt`, `listing-bytes-r1b.txt`, `listing-bytes-s4.txt`, `orientation-producer.md`, `pose-injection.md`, `record-r1-imports.json`, `record-r1-summary.txt`, `record-r1.jsonl`, `scan-calls-s2.txt`, `scan-index-r1.txt`, `scan-keys-s1.txt`, `scan-record-s5.txt`, `scan-table-s3.txt`, `scan-wrapper-r1.txt`, `scan-xrefs-r1.txt`, `trace-pose-s4-imports.json`, `trace-pose-s4.jsonl`, `trace-stores-r1-imports.json`, `trace-stores-r1.jsonl`.
   - Under `work/out/listings/`: `acc-init-s3.txt`, `acc-main-s2.txt`, `accessor-r1.txt`, `bank-s3.txt`, `completion-s2.txt`, `copy-s3.txt`, `db1a-s2.txt`, `db1b-s2.txt`, `dc1-s2.txt`, `e91-s2.txt`, `editor-6041a1fb-r1.txt`, `editor-call-r1.txt`, `exif-6007819d-r1.txt`, `exif-6007df70-r1.txt`, `exif-603e8cf8-r1.txt`, `exif-60447d38-r1.txt`, `exif-6047d4ca-r1.txt`, `exif-6053138a-r1.txt`, `exif-60531638-r1.txt`, `exif-60875e9a-r1.txt`, `exif-61834a42-r1.txt`, `exif-6183c4b6-r1.txt`, `orient-caller-s3.txt`, `orient-cmp-r1.txt`, `probe-s2.txt`, `raw-6006aba6-r1.txt`, `raw-6006b7bb-r1.txt`, `raw-6007d6e0-r1.txt`, `raw-6007d7f1-r1.txt`, `raw-609c82ea-r1.txt`, `raw-61042d0e-r1.txt`, `readfn-s3.txt`, `refresh-r1.txt`, `regread-s2.txt`, `rotate-s2.txt`, `rotate-task-s3.txt`, `tenbyte-b-s5.txt`, `tenbyte-s5.txt`.
   - Every screenshot under `work/out/` in these complete numbered sets: `bank-s5-000`–`bank-s5-020`, `bank-s6-000`–`bank-s6-016`, and `record-r1-000`–`record-r1-019`.

   Additional recomputations:

   - Command-13 supplement: `13.cmd.txt`, `13.out`, `13.err`, `13.exit` — each **MATCH**.
   - All 26 embedded command script hashes and their wrapper hashes — **MATCH**; Java script names resolve under `work/scripts/`.
   - Import inventories — every entry **MATCH**: bank-s5 141, bank-s6 141, record-r1 141, trace-pose-s4 138, trace-stores-r1 139.
   - Audit harvested inventory — all 260 entries **MATCH**.

   The only files under `work/` omitted from the refreshed manifest are the manifest itself and command 27’s `.out`, `.err`, and `.exit`, as disclosed.

4. **Claim-by-claim:** Numbering refers to findings in `result.md` §6.

   - **1 — CONFIRMED.** Byte-checked probe and sample-issue listings support channel 6, device `0x6b`, identity `0x70`, register `0x20`, length 14, and buffer `0x6298d7c0`.
   - **2 — CONFIRMED.** Completion and copy listings show the stated unpacked halfwords and cache destinations.
   - **3 — CONFIRMED.** The four raw-store instructions and reported-index branches agree with the stated encoding.
   - **4 — CONFIRMED.** Independently read table bytes `0b 00 01 00 06 00 03 00 08 00`; getter indexing and override flag agree.
   - **5 — SUPPORTED-NOT-INDEPENDENT.** `trace-stores-r1.jsonl` records all four store sites, copy entries, matching samples/cache, and one completion per sample. Positive branches bypass `0x6007805e`; opposite signs reach it after provisional stores. Command 19 correctly exits 1 and records `ok:false`.
   - **6 — SUPPORTED-NOT-INDEPENDENT.** All twelve descriptor-backed `0xe91` cells are zero after each recorded axis sample. This is properly separated from the RAM pose variable. The required onward connection to the bank selector remains missing.
   - **7 — SUPPORTED-NOT-INDEPENDENT.** Menu navigation and readbacks support both link cells on, then off. Viewed correction screenshots independently confirm checked and unchecked states. Descriptor counts are one.
   - **8 — SUPPORTED-NOT-INDEPENDENT.** Recorded linked-on moves select indices 1, 5, and 3 for landscape, EXIF 6, and EXIF 8 respectively. Caller `0x6041a1fb` is recorded. These are direct-editor accesses.
   - **9 — SUPPORTED-NOT-INDEPENDENT.** All three off-control moves use index 1; portrait change indices retain their earlier values.
   - **10 — CONFIRMED.** The triple reader selects three indices together under the stated conditions. The three listed direct converter calls agree with the listings. This does not identify a current-pose selector.
   - **11 — OVERSTATED.** Zero snapshots and an unentered watched store are supported for `record-r1`. `bank-s6` reads only the consumer ten bytes; it does not record the capture buffer, dirty byte, or store entries. Therefore the combined claim covering both runs is unsupported. “Overlay addresses are absent” must mean their literal byte sequences were not found, rather than excluding computed references.
   - **12 — CONFIRMED.** Independently compared all **3,780 listing hex rows** against the decoded input using offset = address − `0x60021020`: **zero mismatches**, including all 1,650 correction rows. This verifies hex columns, not every arbitrary disassembly start.
   - **13 — CONFIRMED for direct static accesses; SUPPORTED-NOT-INDEPENDENT for execution.** The writer directly reads `0x9a41[0]` and `0x1dd1[0,1]`. Six S1 windows show zero entries into writer, store, converter, and triple reader, with zero record snapshots. Absence of a direct pose load does not establish the missing upstream selection path.

   Correction-round dispositions:

   - **Correction 1 — WRONG overall; producer execution BLOCKED (honestly reported).** All six S1 attempts, caller records, and record bytes are present and kept separate from editor evidence. The static fallback stops before connecting pose to index selection. More seriously, `record_r1.mjs` asserts `[1,1]` as Off. Accepted T1 evidence establishes 1 as detected-subject priority and 0 as always the selected target. T3b’s unchanged `[1,1]` observation does not establish the claimed meaning.
   - **Correction 2 — DONE.** All raw-store sites and copy entry are observed, with corrected sign-dependent claims and the failed run preserved.
   - **Correction 3 — NOT DONE.** Descriptor lengths and finding 6 are corrected. Producer-to-bank-selector xrefs remain absent, explicitly acknowledged in `orientation-producer.md` §4. Finding 11 still extends beyond its recorded evidence.
   - **Correction 4 — NOT DONE.** Pose mismatches, missing sensor completion, operational exceptions, and record-run deadlines produce failure. However, `record_r1.mjs:351` and `:368` accept any watched-cell difference as a successful move; they do not assert movement of the expected target cell/index. The observed six moves succeeded, but the claimed assertion is weaker than required.
   - **Correction 5 — DONE.** Separate command-13 provenance is complete, the “every file” statement is corrected, and manifest refresh is last.
   - **Coordinator amendment — DONE.** The intervention table includes pin skipping, bus success returns, synchronous identity, sample read, lab issue/completion, task activation, native initialization, observation, and getter calls. Inspection of `pose.mjs` confirms only the register-read hook supplies pose samples; the synchronous hook supplies probe identity. The native completion body runs after the permitted lab call.

   Additional reporting error: `summarize_r1.py:20` labels `pose.enable` as `completion-in-read`. That field is the enable flag, not a completion count.

5. **Contradictions with established findings:**

   `AFON-MENU-RESEARCH.md` §1, “Stored value meaning: settled,” and T1 result §6 findings 4–7 establish **1 = detected-subject priority; 0 = always the selected target**. The correction’s assertion that `[1,1]` means Off contradicts that mapping. Independently inspected option bytes at `0x6158ba04` agree with T1’s value/string mapping.

   This does not prove that the separate SCP Subject Detect setting was enabled; it means this assertion cannot establish it was Off.

   T5 `target-bytes.md`, “Where orientation comes from,” remains explicitly overlay-specific. The stock T7 observations do not establish that overlay reconciliation follows the newly identified pose producer.

6. **Alternative explanations** not excluded by the evidence:

   - The emulator lacks the capture context or dirtying event needed to invoke the ten-byte writer. S1’s failure to enter it does not establish hardware behavior.
   - Pose-dependent selection may occur through mapped settings, cached state, events, or indirect calls beyond the scanned literal references.
   - The writer’s fixed direct getters may consume state selected earlier; they do not exclude upstream orientation dependence.
   - Zero snapshots do not exclude other writes between observations. Watching one store excludes that instruction only.
   - Sequential linked-on/off measurements reuse bank contents and do not establish every transition order or persistence.

7. **Scope and safety:** No image construction, storage decision, or hardware recommendation found. Experiment outputs target `work/`; NVRAM is off. The correction uses two new emulator experiment scripts, within the four-version limit.

   The isolation audit reports zero violations, unchanged inputs, and no checkout changes. The recorded dirty emulator files are baseline local changes, not evidence of new T7 modifications. The amendment resolves the previously identified injection-scope issue.

   The requested Off control remains unverified because of the incorrect `0x90a1` interpretation.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Correct the `0x90a1` interpretation using accepted T1 evidence. Establish the requested control through native menu actions and assert its verified value; distinguish per-button priority from SCP Subject Detect.
   2. Complete the static connection from pose production to change-index selection. If execution remains blocked, preserve that boundary and provide the required static path rather than substituting editor getter observations.
   3. Bound finding 11 separately by run: consumer snapshots for `bank-s6`; capture/consumer/dirty snapshots and watched-store evidence for `record-r1`. Describe literal-address scan limits explicitly.
   4. Assert movement of the expected target cell/index, and explicitly require all six measurement combinations before success. Preserve existing scripts and logs.
   5. Correct the summary’s `completion-in-read` label or record an actual completion count. Refresh provenance after corrections.

   Optional improvements: distinguish Single, value 1, from Small, value 2; capture the wrapper’s upstream callers to help resolve the missing selector; assert copy-entry execution alongside sensor completion.