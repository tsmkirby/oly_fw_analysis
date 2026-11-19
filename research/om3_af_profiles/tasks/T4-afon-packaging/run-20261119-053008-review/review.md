# T4 review (Codex Sol, read-only)

1. **Verdict:** ACCEPT

   The six requested corrections are addressed. Acceptance covers the corrected, bounded analysis; binding placement, installation ordering, helper placement, complete code sizing and Q6 remain unresolved.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `audit/previous-review.md`, `work/result.md`, `work/out/packaging-c1.md` and the evidence manifest completely. Inspected first-round packaging, new listings, scripts, watchpoint logs, command records and audit records.

   Research checked: `HARDWARE-STAGE0-RECORD.md` §4, Owned RAM analysis, Alignment and access audit and runtime-installer findings; `PROJECT-STATE.md` §6; `AFON-MENU-RESEARCH.md` §8 storage discussion; T3 README and designs T3f–T3i; `CONTAINERS.md`; `CODE_SPACE.md`.

   Independently compared **2,305 listing rows**, including all **976 correction-round rows in 14 files**, against `inputs/00_0100_50000020.decoded.bin`, using offset = address − `0x60021020`: **zero mismatches**. No Ghidra or OM-Emu execution.

3. **Hash verification:** Recomputed all **175 file entries** in `work/evidence-manifest.json` with PowerShell SHA-256: **175 MATCH, zero MISMATCH**. All 155 recorded output lengths match.

   Each entry identified below is **MATCH**:

   - Inputs: `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - Sources: `brief.md`; `TASK.md`; `templates/result.md`; `audit/previous-review.md`; `ref/HARDWARE-STAGE0-RECORD.md`; `ref/PROJECT-STATE.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`.
   - Under `ref/analysis/button-af/readiness/t3-afon-zone-row/`: `README.md`; `design/T3f-binding.md`; `design/T3g-descriptors.md`; `design/T3h-faces.md`; `design/T3i-design.md`; `t3j/overlay-changed-bytes.csv`.
   - Other sources: `ref/analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv`; `ref/contribution/docs/format/CONTAINERS.md`; `ref/contribution/docs/safety/CODE_SPACE.md`; `ref/tooling/om-emu/docs/model-survey.md`; `ref/tasks/T3j-afon-acceptance-assertions/run-20261118-132500/work/evidence-manifest.json`.
   - Under `work/out/cmd/`: every `.cmd.txt`, `.err`, `.exit` and `.out` entry for commands `01`, `02`, `03`, `04`, `05`, `06`, `07`, `08`, `09`, `10`, `11`, `12`, `13`, `14`, `15`, `16`, `17` and `18`; also `19.cmd.txt`.
   - Under `work/out/`: `callers-c1.txt`; `ctor-ptrs-c1.txt`; `ctor-window-c1.txt`; `disasm-ranges-c.txt`; `disasm-ranges-c1.txt`; `disasm-ranges-full.txt`; `disasm-ranges.txt`; `face-helper-c1.txt`; `face-patch-bytes-c1.txt`; `face-site-c1.txt`; `gaps-c1.txt`; `ghidra-t4-c1.log`; `ghidra-t4.log`; `ghidra-t4c.log`; `packaging-c1.md`; `packaging.md`; `static-c1.txt`; `static-t4.txt`; `static-t4b.txt`; `watch-c1-hits.json`; `watch-c1.jsonl`; `xrefs-t4-c1.txt`; `xrefs-t4.txt`; `xrefs-t4c.txt`.
   - Under `work/out/listings/`: `alias.txt`; `binding-next.txt`; `binding-scan.txt`; `binding-third.txt`; `binding.txt`; `boot-task.txt`; `builder.txt`; `call-site-c1.txt`; `callee-213f0-c1.txt`; `callee-21812-c1.txt`; `callee-23042-c1.txt`; `callee-23228-c1.txt`; `callee-2347c-c1.txt`; `callee-235b5-c1.txt`; `callee-235ff-c1.txt`; `callee-23653-c1.txt`; `callee-236ea-c1.txt`; `default-writer.txt`; `desc-end-a.txt`; `desc-end-b.txt`; `end-selector.txt`; `face-c1.txt`; `face-tail.txt`; `face.txt`; `flash-entry-c1.txt`; `flash-entry.txt`; `flash-read-c1.txt`; `flash-read.txt`; `getter.txt`; `head.txt`; `hook.txt`; `index.txt`; `loader.txt`; `lookup.txt`; `mapped.txt`; `scratch-ptr.txt`; `section-init-b.txt`; `section-init-c.txt`; `section-init-c1.txt`; `section-init.txt`; `setter.txt`.
   - `work/result.md`.
   - Under `work/scripts/`: `append_ranges_t4.py`; `check_listings_c1.py`; `check_listings_t4.py`; `ctor_window_c1.py`; `find_gap_c1.py`; `hash_inputs_t4.py`; `pack_more_t4.py`; `pack_static_t4.py`; `run_logged.mjs`; `search_ctor_c1.py`; `static_c1.py`; `T4List.java`; `T4ListC1.java`; `watch_c1.mjs`; `write_manifest_c1.py`; `write_manifest_t4.py`.

   The separate `brief_sha256` and embedded command script/wrapper hashes also **MATCH**, resolving Java script names through `work/scripts/`.

   All **159 harvested-file hashes and lengths** in `audit/run-log.json` also **MATCH**: the 155 outputs above, `work/evidence-manifest.json`, and command 19’s `.err`, `.exit` and `.out`. Command 19’s completion files are outside the evidence manifest because the wrapper creates them after manifest generation; this is disclosed.

   Historical audit metadata differs: `audit/manifest-in.json`’s earlier brief hash is **MISMATCH** against the revised brief, and its local-diff digest is **MISMATCH** against the supplied `audit/om-emu.diff`. The correction-run audit’s brief hash matches the current brief.

4. **Claim-by-claim:**

   For `result.md` §6:

   - **6.1 — CONFIRMED.** The listed loader requests `end − destination` bytes with mode `0x10200` and does not read descriptor word three.
   - **6.2 — CONFIRMED.** Descriptor bytes and end selector support section 7’s stated source, destination, third word and 6,340,608-byte length.
   - **6.3 — CONFIRMED.** Independently searched both inputs: no `olycompress` magic.
   - **6.4 — CONFIRMED**, within the listed bodies. Flash-entry dispatch and flash-read calls agree with the listings. The callee coverage is explicitly partial.
   - **6.5 — CONFIRMED** as a bounded inference. The universal checksum claim is withdrawn; unexamined integrity or decompression processing remains possible.
   - **6.6 — CONFIRMED.** Independently checked the 416-record array, identical `0x216` records and absence of a literal pointer to `0x615c6234`. Editor `0x1e6` is absent.
   - **6.7 — CONFIRMED**, for the three inspected walkers. They stop at the first matching record; later scans can nevertheless read the duplicate’s bytes.
   - **6.8 — SUPPORTED-NOT-INDEPENDENT.** Script and logs support zero duplicate-range reads during the recorded window, six walk-1 entries and no walk-2/3 entries. Watches were armed after boot.
   - **6.9 — CONFIRMED** as a conditional conclusion from first-match behavior. Binding placement remains unresolved; unused-record status is not claimed.
   - **6.10 — CONFIRMED.** Independently recomputed loaded-section FF maxima: none reaches 10,008 bytes. The largest are 1,912 and 1,776 bytes. No qualifying home was established.
   - **6.11 — CONFIRMED.** Face-base/count instructions and head-copy setup agree with the image. The copy call is at `0x60021187`.
   - **6.12 — CONFIRMED** for the proposed match/miss control flow and displacement arithmetic. The six-byte replacement covers `bne`, store and `bra`, leaving `0x611f7f44` intact. The helper’s first branch tests the original comparison; its miss path jumps to `0x611f7f44`, and its match path rejoins at `0x611f7f4a`. The helper is 48 bytes. Independently confirmed its candidate hole has no overlay rows and 48 archived rows. Ghidra’s candidate decoding and the bounded gap-search result are **SUPPORTED-NOT-INDEPENDENT**.
   - **6.13 — CONFIRMED.** Independently counted 368 overlay bytes, zero overlay bytes at the node and a 452-byte enclosing span. The separate eight-byte node gives 376 data bytes.
   - **6.14 — CONFIRMED.** Listed whole-instruction coverage is 5/6/7 bytes. Additional code quantities are explicitly unresolved.
   - **6.15 — SUPPORTED-NOT-INDEPENDENT** for the Ghidra caller graph. Independently confirmed the stored-word hits at `0x6003954c` and `0x6017a5d8`. This does not establish execution order.
   - **6.16 — SUPPORTED-NOT-INDEPENDENT.** The step log supports page 27 and the same editor twice. The page-25/26-labelled attempts remained on the AF tab; page 28 was not opened. Builder/hook probes stayed zero after arming.
   - **6.17 — CONFIRMED** as an accurate statement that ordering is unresolved.
   - **6.18 — CONFIRMED.** The corrected stream places `0x60045f70` inside the add and `0x60046040` inside the seven-byte call.
   - **6.19 — CONFIRMED** for 349 shared CSV addresses, the helper’s 48 archived bytes and the stated placement conflict. The complete twelve-hit interpretation is **SUPPORTED-NOT-INDEPENDENT**; Q6 remains open.

   Other numbered result sections:

   - **§§1–5 — CONFIRMED** for task identity, recorded files, hashes and command records. Universal wrapper use and absence of historical script edits are **SUPPORTED-NOT-INDEPENDENT**.
   - **§7 — CONFIRMED** for evidence references and listing-byte agreement; agreement does not establish exhaustive analysis.
   - **§8 — CONFIRMED** for all 19 recorded successful exits and repeated byte/hash checks. Emulator behavior is **SUPPORTED-NOT-INDEPENDENT** and correctly bounded.
   - **§9, items 1–19 — CONFIRMED** as the stated correction history, subject to the evidence classifications above.
   - **§10 — CONFIRMED.** The principal unresolved questions are retained.
   - **§11 — CONFIRMED** as a conditional recommendation, with placement and code quantities open.
   - **§12 — SUPPORTED-NOT-INDEPENDENT.** The correction brief permits explicitly unresolved outcomes, and the corrected report uses that option.

   Corrections in brief §5:

   1. **DONE.** Unconditional duplicate reuse is withdrawn. The limited watch window supports only “no reader on exercised paths.” Boot, walk-2/3, scans past index 151, page 28 and distinct page-25/26 editors were not covered.
   2. **DONE.** Replacement site bytes are `dc826a12ffcb` at `0x611f7f3e`; the incoming miss continuation at `0x611f7f44` is preserved through the helper.
   3. **DONE.** Four budget categories are separated; the eight-byte node is additional to 368 bytes.
   4. **DONE.** The face helper is sized at 48 bytes; installer, getter/setter stubs, node publication and runtime code synchronization remain explicitly unresolved. No complete total is claimed.
   5. **DONE.** Checksum/decompression wording is bounded to inspected code. The caller-chain and post-boot probes do not establish ordering, which is honestly reported.
   6. **DONE.** Ownership wording, head-copy address and current listing references are corrected. Invalid historical fragments are explicitly superseded. Q6 and archived-placement conflicts remain open; manifest hashes match.

   Re-grading brief §2:

   - **Q1 — PARTIAL, honestly unresolved.** Upper loading behavior is supported; complete decompression/integrity behavior and installation timing remain open.
   - **Q2 — UNRESOLVED, honestly reported.** Neither safe duplicate reuse nor a qualifying relocation home is established.
   - **Q3 — ANSWERED statically; placement unresolved.** Relocation controls and the corrected alternative’s control flow are supported.
   - **Q4 — PARTIAL, honestly unresolved.** Post-build linking fits the hash structure; publication timing remains unproved.
   - **Q5 — ANSWERED for routing sites; code sizing unresolved.** Site coverage is established without choosing storage.
   - **Q6 — PARTIAL, honestly incomplete.** Categories and known sizes are corrected; ownership, conflicts and additional code prevent a complete payload total.

5. **Contradictions with established findings:**

   - `HARDWARE-STAGE0-RECORD.md`, Alignment and access audit Finding 2, and T3 README’s Open section describe section 7 as compressed. The corrected report appropriately leaves lower-level decompression unresolved; its evidence does not settle that disagreement.
   - T3i’s Binding record and Face record sections misidentify the loaded extent around `0x60320000` and the face table. The loader and head-copy listings support the corrected distinction.
   - No new contradiction with `PROJECT-STATE.md` §6 Q6/Q7 was found.

6. **Alternative explanations** not excluded by the evidence:

   - Computed, indirect, cached or unexercised readers could access the duplicate record.
   - Boot-time menu reads or later descriptor rebuilds could invalidate the proposed installation timing.
   - Unexamined flash-reader callees could perform integrity or decompression processing.
   - Secondary CPUs, DMA and physical cache behavior could invalidate candidate-tail ownership or runtime code-patch assumptions.

7. **Scope and safety:** No image construction, firmware patch application, storage selection or hardware recommendation was found in the corrected work. Candidate instruction blobs are analytical outputs.

   The watch script uses stock-hash-checked firmware without an overlay and supplies no NVRAM object/file. Its lab key-matrix override is disclosed. The literal `OM_EMU_NVRAM=off` environment value was not recorded, but the inspected session construction supports NVRAM being disabled.

   Audit records report zero isolation violations and unchanged workspace/input baselines. Existing OM-Emu modifications are disclosed; no task-induced change is demonstrated. This review made no filesystem writes.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections: none.

   Optional improvements:

   - Record the actual NVRAM environment value and session configuration in future watch logs.
   - Label historical `audit/manifest-in.json` pins explicitly as superseded, including the differing local-diff digest.
   - Make the corrected budget self-contained by repeating alignment rules and clarifying that the helper-hole reservation lies within the existing 452-byte span.