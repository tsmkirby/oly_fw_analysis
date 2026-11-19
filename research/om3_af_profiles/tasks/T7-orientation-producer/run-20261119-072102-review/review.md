# T7 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The evidence supports the accelerometer-to-pose computation and the direct editor’s orientation-dependent change indices. It does not establish which index supplies the ten-byte AF target, as required by brief §2.3. The injection also replaces multiple driver operations and supplies completion from the lab; compliance with the single permitted behaviour change is not demonstrated.

2. **Baseline checked:** `TASK.md`, `review-brief.md`, `brief.md` completely; `work/result.md`; the complete manifest; both deliverable reports; all experiment scripts; JSONL records; listings; command records; import inventories; relevant screenshots; and `audit/`.

   Research checked: `FEATURE-SPEC.md`, particularly the orientation-producer acceptance gate; `AFON-MENU-RESEARCH.md` §1; T3b findings and `out/stock-target-screen.md`; T5 `out/target-bytes.md`, including “Where orientation comes from”; the pose references in `PREHARDWARE-AF-AUDIT.md`; and emulator `hle-gaps.md` §4.7.3 and the E147 notes in `models.mjs`.

   Review checks used PowerShell and image viewing. No files were written, and neither Ghidra nor OM-Emu was run.

3. **Hash verification:** All **277 manifest file entries MATCH**, including recorded byte lengths: 5 inputs, 151 sources, 121 outputs. The following directory prefixes apply to every explicitly listed member; MATCH applies individually to each member.

   **Inputs — MATCH:**

   - `brief.md`
   - `TASK.md`
   - `inputs/00_0100_50000020.decoded.bin`
   - `inputs/02_0106_458c0020.decoded.bin`
   - `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk00000000.OE.0100.bin`

   **Sources under `work/scripts/` — each MATCH:**

   `bank_s5.mjs`, `bank_s6.mjs`, `check_listings_s4.py`, `manifest_s8.py`, `pose.mjs`, `run_logged.mjs`, `scan_calls_s2.py`, `scan_keys_s1.py`, `scan_record_s5.py`, `scan_table_s3.py`, `T7ListS2.java`, `trace_pose_s4.mjs`.

   **Sources under `om-emu/emu/` — each MATCH:**

   - `checks/lib/`: `args.mjs`, `coverage.mjs`, `env.mjs`, `errors.mjs`, `png.mjs`.
   - `refs/`: `errors.mjs`.
   - `scenarios/`: `bind.mjs`, `session_replay.mjs`.
   - `src/core/`: `cores.mjs`, `cpu.mjs`, `interp.mjs`.
   - `src/core/m4/`: `boot.mjs`, `bus.mjs`, `cpu.mjs`, `dcache.mjs`, `decode.mjs`, `errors.mjs`, `sched.mjs`, `sys.mjs`.
   - `src/core/m4/periph/`: `adc.mjs`, `board.mjs`, `dma.mjs`, `exti.mjs`, `flash.mjs`, `gpio.mjs`, `i2c.mjs`, `pwr.mjs`, `rcc.mjs`, `regs.mjs`, `rtc.mjs`, `sched.mjs`, `spi.mjs`, `stm32l4.mjs`, `tim.mjs`, `usart.mjs`, `usb.mjs`.
   - `src/`: `machine.mjs`.
   - `src/debug/`: `call.mjs`, `debugger.mjs`, `live.mjs`, `protocol.mjs`, `regs.mjs`, `snapshot.mjs`, `trace.mjs`.
   - `src/dev/`: `audio.mjs`, `bus.mjs`, `camfe.mjs`, `dml.mjs`, `dpc.mjs`, `ems1.mjs`, `engine.mjs`, `hdmi.mjs`, `imgpipe.mjs`, `imgpro.mjs`, `intc.mjs`, `lensssc.mjs`, `linkpins.mjs`, `pdt.mjs`, `scpu.mjs`, `stub.mjs`, `timer.mjs`, `vsc.mjs`, `vsccompose.mjs`, `vsccompose2.mjs`, `vscregs.mjs`.
   - `src/fw/`: `board.mjs`, `expand.mjs`, `facts.mjs`, `image.mjs`, `labfw.mjs`, `model.mjs`, `models.mjs`, `nand.mjs`, `olyfw.mjs`, `overrides-E122.mjs`, `overrides-E144.mjs`, `patch.mjs`, `ports.mjs`, `resprefix.mjs`, `sections.mjs`.
   - `src/lab/`: `acc.mjs`, `audio.mjs`, `audiohw.mjs`, `camapp.mjs`, `charger.mjs`, `cpu2.mjs`, `display.mjs`, `dispq.mjs`, `edid.mjs`, `errors.mjs`, `hle.mjs`, `irq.mjs`, `jpeg.mjs`, `kernel.mjs`, `lens.mjs`, `lensmcu.mjs`, `mdet.mjs`, `media.mjs`, `menu.mjs`, `menudata.mjs`, `menuwalk.mjs`, `nav.mjs`, `nvramdoc.mjs`, `osd.mjs`, `osdfmt.mjs`, `patchaudit.mjs`, `play.mjs`, `player.mjs`, `playmod.mjs`, `power.mjs`, `rec.mjs`, `resnand.mjs`, `resources.mjs`, `rtos.mjs`, `scene.mjs`, `scpudev.mjs`, `scpulink.mjs`, `scpum4.mjs`, `sdcard.mjs`, `settings_ids.mjs`, `shoe.mjs`, `shuttersnd.mjs`, `sim.mjs`, `sio.mjs`, `soundres.mjs`, `storage.mjs`, `subject.mjs`, `take.mjs`, `text.mjs`, `touchpanel.mjs`, `windows.mjs`, `wm8946.mjs`.
   - `src/util/`: `bytes.mjs`, `equal.mjs`, `hex.mjs`, `parse.mjs`, `show.mjs`, `tally.mjs`, `tracejson.mjs`.

   **Outputs — each MATCH:**

   - `work/result.md`.
   - Under `work/out/`: `bank-s5-imports.json`, `bank-s5.jsonl`, `bank-s6-imports.json`, `bank-s6.jsonl`, `ghidra-s2.log`, `ghidra-s3.log`, `ghidra-s5.log`, `listing-bytes-s4.txt`, `orientation-producer.md`, `pose-injection.md`, `scan-calls-s2.txt`, `scan-keys-s1.txt`, `scan-record-s5.txt`, `scan-table-s3.txt`, `trace-pose-s4-imports.json`, `trace-pose-s4.jsonl`.
   - Under `work/out/listings/`: `acc-init-s3.txt`, `acc-main-s2.txt`, `bank-s3.txt`, `completion-s2.txt`, `copy-s3.txt`, `db1a-s2.txt`, `db1b-s2.txt`, `dc1-s2.txt`, `e91-s2.txt`, `orient-caller-s3.txt`, `probe-s2.txt`, `readfn-s3.txt`, `regread-s2.txt`, `rotate-s2.txt`, `rotate-task-s3.txt`, `tenbyte-b-s5.txt`, `tenbyte-s5.txt`.
   - Under `work/out/cmd/`: `01.cmd.txt`, `01.err`, `01.exit`, `01.out`; `02.cmd.txt`, `02.err`, `02.exit`, `02.out`; `03.cmd.txt`, `03.err`, `03.exit`, `03.out`; `04.cmd.txt`, `04.err`, `04.exit`, `04.out`; `05.cmd.txt`, `05.err`, `05.exit`, `05.out`; `06.cmd.txt`, `06.err`, `06.exit`, `06.out`; `07.cmd.txt`, `07.err`, `07.exit`, `07.out`; `08.cmd.txt`, `08.err`, `08.exit`, `08.out`; `09.cmd.txt`, `09.err`, `09.exit`, `09.out`; `10.cmd.txt`, `10.err`, `10.exit`, `10.out`; `11.cmd.txt`, `11.err`, `11.exit`, `11.out`; `12.cmd.txt`, `12.err`, `12.exit`, `12.out`; `13.cmd.txt`.
   - Screenshots under `work/out/`: `bank-s5-000-orient-page.png`, `bank-s5-001-row-0-right.png`, `bank-s5-002-row-0-ok.png`, `bank-s5-003-row-0-down-ok.png`, `bank-s5-004-row-1-right.png`, `bank-s5-005-row-1-ok.png`, `bank-s5-006-row-1-down-ok.png`, `bank-s5-007-linked-state.png`, `bank-s5-008-on-landscape-open.png`, `bank-s5-009-on-landscape-right.png`, `bank-s5-010-on-exif6-open.png`, `bank-s5-011-on-exif6-right.png`, `bank-s5-012-on-exif8-open.png`, `bank-s5-013-on-exif8-right.png`, `bank-s5-014-linked-off.png`, `bank-s5-015-off-landscape-open.png`, `bank-s5-016-off-landscape-right.png`, `bank-s5-017-off-exif6-open.png`, `bank-s5-018-off-exif6-right.png`, `bank-s5-019-off-exif8-open.png`, `bank-s5-020-off-exif8-right.png`.
   - Screenshots under `work/out/`: `bank-s6-000-linked-on.png`, `bank-s6-001-on-landscape-open.png`, `bank-s6-002-on-landscape-dial-1.png`, `bank-s6-003-on-landscape-move.png`, `bank-s6-004-on-exif6-open.png`, `bank-s6-005-on-exif6-dial-1.png`, `bank-s6-006-on-exif6-move.png`, `bank-s6-007-on-exif8-open.png`, `bank-s6-008-on-exif8-dial-1.png`, `bank-s6-009-on-exif8-move.png`, `bank-s6-010-linked-off.png`, `bank-s6-011-off-landscape-open.png`, `bank-s6-012-off-landscape-move.png`, `bank-s6-013-off-exif6-open.png`, `bank-s6-014-off-exif6-move.png`, `bank-s6-015-off-exif8-open.png`, `bank-s6-016-off-exif8-move.png`.

   All embedded command script hashes and wrapper hashes for commands 01–12 MATCH; command 13’s separately available record also MATCHES. All import-time hashes MATCH: bank-s5 141 entries, bank-s6 141, trace-pose-s4 138. The audit’s 137 harvested files also MATCH.

   Manifest completeness needs correction: `13.err`, `13.exit`, and `13.out` exist but are omitted, as is command 13 from `commands`. The manifest explains the timing limitation, but the claim that every file is included is inaccurate. Excluding the manifest’s own hash is reasonable.

4. **Claim-by-claim:** Numbering below refers to the twelve findings in `result.md` §6.

   - **1 — CONFIRMED.** Checked probe and issue listings against input bytes. Channel 6, device `0x6b`, WHO_AM_I acceptance `0x70`, register `0x20`, length 14, and buffer `0x6298d7c0` agree.
   - **2 — CONFIRMED.** Native completion unpacks offsets 8/10/12 into the stated halfwords. The copy moves them into the stated cache; ACC_MAIN’s enable check is visible in its listing.
   - **3 — CONFIRMED.** Raw encoding and reported-index mapping agree with the listings. There are multiple raw-store sites: `0x60077ff6`, `0x60078025`, `0x60078052`, and `0x6007805e`.
   - **4 — CONFIRMED.** Independently read table bytes `0b 00 01 00 06 00 03 00 08 00`; getter and flag behaviour agree with the listing.
   - **5 — OVERSTATED.** The six sample/readback mappings are supported by recorded emulator evidence. The claim that every sample passes the store at `0x6007805e` is wrong: positive branches store elsewhere. The trace script observes completion and task entry, but does not observe that store or copy entry. In bank-s6, landscape and EXIF 6 have empty `publishes`; EXIF 8 records raw 3. Correct class: **SUPPORTED-NOT-INDEPENDENT** for the native-body execution and readback sequence under the declared stand-ins, with completion explicitly invoked by the lab.
   - **6 — OVERSTATED.** Bank-session snapshots show `0xe91[0..7]` remaining zero while landscape/EXIF 6/EXIF 8 change the RAM pose. The six-axis trace does not read `0xe91`, so “every pose” is not established for all six axes. The direct bank results support orientation dependence, but a bounded producer-to-bank-selector call chain is still missing.
   - **7 — SUPPORTED-NOT-INDEPENDENT.** Script inspection shows native menu keys, with no direct settings writes. Bank-s5 documents the second-OK reversal; bank-s6 records both enables on and then off. Checked screenshots independently confirm both checked and unchecked states.
   - **8 — SUPPORTED-NOT-INDEPENDENT.** Full recorded snapshots show `0x99a1` changing 0→1 and `0x5962` changing 526→529 at index 1 for landscape, 5 for EXIF 6, and 3 for EXIF 8. `0x88b2[0]` follows position. Getter records agree. These establish direct-editor accesses, not ten-byte-consumer accesses.
   - **9 — SUPPORTED-NOT-INDEPENDENT.** Off-control snapshots show position changes at index 1 for all three poses, with getters reading index 1. Portrait change indices retain their linked-run values.
   - **10 — CONFIRMED.** Listings support the simultaneous three-index reader and its stated conditions. It does not resolve the required current-pose selection for the ten-byte record.
   - **11 — OVERSTATED.** Recorded snapshots support ten zero bytes at each observation. That does not prove the buffer was never written between snapshots. The pointer load is byte-verified. The scan establishes absence of the three literal address byte sequences, not absence of allocated or computed addresses. T5 identifies these as overlay banks.
   - **12 — CONFIRMED.** Independently compared all **2,130 listing hex rows** with the decoded image using address minus `0x60021020`: **zero mismatches**. This validates hex columns; it does not validate instruction alignment at every arbitrary listing start.

   Additional deliverable checks: `pose.mjs` imports nothing, exports the documented interface, and is imported unchanged by both bank scripts. Recorded import hashes corroborate that use; it was not executed during this review. Its hooks are labelled `EMULATOR-ONLY`. The “only behaviour change” requirement remains unresolved: it skips pin setup, replaces open/close/write and synchronous/asynchronous reads, supplies probe identity, enables tasks, and calls issue/completion from the lab.

   The claimed complete bank deliverable is **UNSUPPORTED** for the ten-byte consumer’s selected index with linking on and off. All-zero snapshots do not answer that requirement.

5. **Contradictions with established findings:** No contradiction in the measured direct-editor bank indices or sensor encoding.

   T5 `target-bytes.md`, “Where orientation comes from,” describes overlay reconciliation reading `0xe91[3]`. T7 demonstrates a different stock orientation producer. These scopes must remain explicit; T7 does not establish that the T5 overlay now follows that producer.

   `FEATURE-SPEC.md`, “Current evidence and limits,” requires establishing the orientation producer and exercising the actual target paths. T7 advances that evidence but does not close the ten-byte consumer path. T3b finding 5 and `stock-target-screen.md`, “Orientation,” remain consistent with T7.

6. **Alternative explanations** not excluded by the evidence:

   - The ten-byte target remains uninitialized or its producing path never runs in these sessions; zero snapshots cannot identify its selected bank.
   - Manual completion and driver success stand-ins can produce correct downstream values without establishing native data-ready, transfer, or callback delivery.
   - Getter counts identify keys and indices, but bank-s6 omits caller addresses, preventing attribution of those reads to the ten-byte builder.
   - Sequential on/off measurements reuse prior bank contents; they establish observed edits, not persistence or every transition order.
   - Subject Detect was not opened or enabled by these scripts, but its initial Off state is not explicitly read back.

7. **Scope and safety:** No image construction, storage decision, or hardware recommendation found. Scripts direct their output writes under `work/`; NVRAM is explicitly off. The isolation audit reports zero violations and unchanged inputs/workspace.

   The recorded `om-emu` diff contains existing Windows-path, CPU3-handler, and IRQ-table changes. The audit supports no new T7 checkout modifications; a dirty checkout alone is not evidence of unauthorized T7 edits.

   The substantive scope issue is runtime intervention: multiple driver replacements and lab-supplied completion exceed the narrowly described sample-read injection unless explicitly accepted as part of that session model. They are disclosed, but disclosure does not establish compliance with brief §0.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Establish the ten-byte producer/consumer’s selected indices for each of the three poses with Orientation Linked on and off. Keep direct-editor getter evidence separate from that result.
   2. Resolve the injection-scope deviation: provide the permitted peripheral ingress and native completion delivery, or obtain an explicit brief revision covering the additional stand-ins. Document every intervention, including synchronous probe identity and lab-triggered issue/completion.
   3. Correct finding 5 and the store-trace description. Instrument all relevant raw stores and copy entry in a new, immutable experiment if claiming per-sample entry/store traces.
   4. Bound findings 6 and 11 to the observations actually recorded; add the missing producer-to-bank-selector xrefs and explicitly verify Subject Detect Off.
   5. Complete command-13 provenance through a separate final inventory or supplement, and correct the “every file” statement. Preserve already-run scripts.

   Optional improvements: use descriptor-backed cell lengths rather than reading adjacent data as extra indices; retain getter caller addresses; distinguish Single from Small in the dial description; and add assertions so missing poses, failed moves, or incomplete runs cannot still exit successfully.