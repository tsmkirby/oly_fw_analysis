# T4 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The evidence supports many measurements, but it does not establish that the duplicate binding record is unused. The proposed face patch breaks an existing branch target, and the payload budget is incomplete.

2. **Baseline checked:** Read `TASK.md` and `review-brief.md` completely, then `brief.md`, `work/result.md`, `work/evidence-manifest.json`, `work/out/packaging.md`, the bounded listings, command records, scripts and audit records.

   Research checked: `HARDWARE-STAGE0-RECORD.md` §4, Owned RAM analysis, Alignment and access audit Finding 2, runtime redirect, hook task/core and task-context placement findings; `PROJECT-STATE.md` §6; `AFON-MENU-RESEARCH.md` §8 storage and archived routing findings; T3 README and designs T3f–T3i; `CONTAINERS.md`; `CODE_SPACE.md`. Also inspected OM-Emu’s `expand.mjs` as source text.

   Independently compared all 1,329 listing rows against the decoded main image using address minus `0x60021020`: **zero mismatched bytes**. No Ghidra or OM-Emu execution.

3. **Hash verification:** Recomputed all **106 file entries** with PowerShell SHA-256: **106 MATCH, zero MISMATCH**. All 87 recorded output lengths also match.

   Each entry below is **MATCH**:

   - Inputs: `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - Sources: `brief.md`; `TASK.md`; `templates/result.md`; `ref/HARDWARE-STAGE0-RECORD.md`; `ref/PROJECT-STATE.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`.
   - Under `ref/analysis/button-af/readiness/t3-afon-zone-row/`: `README.md`; `design/T3f-binding.md`; `design/T3g-descriptors.md`; `design/T3h-faces.md`; `design/T3i-design.md`; `t3j/overlay-changed-bytes.csv`.
   - Other sources: `ref/analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv`; `ref/contribution/docs/format/CONTAINERS.md`; `ref/contribution/docs/safety/CODE_SPACE.md`; `ref/tooling/om-emu/docs/model-survey.md`; `ref/tasks/T3j-afon-acceptance-assertions/run-20261118-132500/work/evidence-manifest.json`.
   - Under `work/out/cmd/`: `01.cmd.txt`, `01.err`, `01.exit`, `01.out`; `02.cmd.txt`, `02.err`, `02.exit`, `02.out`; `03.cmd.txt`, `03.err`, `03.exit`, `03.out`; `04.cmd.txt`, `04.err`, `04.exit`, `04.out`; `05.cmd.txt`, `05.err`, `05.exit`, `05.out`.
   - Under `work/out/cmd/`: `06.cmd.txt`, `06.err`, `06.exit`, `06.out`; `07.cmd.txt`, `07.err`, `07.exit`, `07.out`; `08.cmd.txt`, `08.err`, `08.exit`, `08.out`; `09.cmd.txt`, `09.err`, `09.exit`, `09.out`; `10.cmd.txt`, `10.err`, `10.exit`, `10.out`; `11.cmd.txt`.
   - Under `work/out/`: `disasm-ranges-c.txt`; `disasm-ranges-full.txt`; `disasm-ranges.txt`; `ghidra-t4.log`; `ghidra-t4c.log`; `packaging.md`; `static-t4.txt`; `static-t4b.txt`; `xrefs-t4.txt`; `xrefs-t4c.txt`.
   - Under `work/out/listings/`: `alias.txt`; `binding-next.txt`; `binding-scan.txt`; `binding-third.txt`; `binding.txt`; `boot-task.txt`; `builder.txt`; `default-writer.txt`; `desc-end-a.txt`; `desc-end-b.txt`; `end-selector.txt`; `face-tail.txt`; `face.txt`; `flash-entry.txt`; `flash-read.txt`; `getter.txt`; `head.txt`; `hook.txt`; `index.txt`; `loader.txt`; `lookup.txt`; `mapped.txt`; `scratch-ptr.txt`; `section-init-b.txt`; `section-init-c.txt`; `section-init.txt`; `setter.txt`.
   - `work/result.md`.
   - Under `work/scripts/`: `append_ranges_t4.py`; `check_listings_t4.py`; `hash_inputs_t4.py`; `pack_more_t4.py`; `pack_static_t4.py`; `run_logged.mjs`; `T4List.java`; `write_manifest_t4.py`.

   The separate `brief_sha256` and all embedded command wrapper/script hashes also **MATCH**. Command 11’s completion files are absent from the manifest; its command and script are included.

4. **Claim-by-claim:**

   For `result.md` §6’s numbered findings:

   - **6.1 — CONFIRMED**, bounded to `0x60045ed5`: it requests `end − destination` bytes with mode `0x10200`, does not read descriptor word three, logs nonzero status and contains no byte-sum loop. Calling this proof of the complete lower-level copy/integrity algorithm is **OVERSTATED**.
   - **6.2 — CONFIRMED.** Independently checked section-7 descriptor bytes, source/destination mapping and end selector: `[0x6103f000, 0x6164b000)`, 6,340,608 bytes, third word 1.
   - **6.3 — CONFIRMED.** Independent scans found no `olycompress` magic in either input; `0x6124f4e5` contains `f8972004`.
   - **6.4 — OVERSTATED.** Plain section bytes and an upper loader without decompression are supported. “No section checksum to repair” requires more evidence than these bounded listings. `flash-entry.txt` stops at `0x6002330d`, before the mode-`0x200` call; `flash-read.txt` also omits callees and its remaining body. Correct class: **INFERRED**, limited to the inspected path. The decoded payload’s lack of an OE envelope is consistent with `CONTAINERS.md`.
   - **6.5 — CONFIRMED.** Independently checked directory bounds, absence of editor `0x1e6`, identical 24-byte `0x216` records and literal-pointer scan results. These facts do not prove the later record is unused.
   - **6.6 — CONFIRMED**, for the three inspected walkers. Their matching loops stop at the first editor match. Reader completeness is **UNSUPPORTED**: three directory-base immediates do not exclude computed or indirect readers.
   - **6.7 — CONFIRMED.** Independently recomputed loaded-section FF maxima; none reaches 10,008 bytes. `0x60320000` lies outside the ten section loads. “No owned region exists” is **OVERSTATED**; the defensible conclusion is “none was established.”
   - **6.8 — CONFIRMED.** Independently checked 96 unique face keys, each selected by a binding word. The following bytes contain the stated function pointers; `face-tail.txt` shows consumers of that table.
   - **6.9 — CONFIRMED.** Face-base immediate bytes start at `0x611f7f37`; count byte is `0x611f7f48`. The reset-head copy contains the table. The copy call itself is at `0x60021187`; `0x60021169` begins its setup.
   - **6.10 — CONFIRMED.** Independently checked descriptor count, stride, end and absence of `0x3D6F`. `0x606216ec` is consumed as another structure’s base, blocking an in-place append.
   - **6.11 — CONFIRMED.** Builder/lookup instructions support 128 buckets and bucket address `0x62a84b2c`. Installation after the builder, before first lookup, remains **UNSUPPORTED** as a demonstrated ordering.
   - **6.12 — CONFIRMED.** Mapped/index paths reject `0x3D6F`. Whole-instruction patch coverage is 5 bytes for getter, 6 for setter and 7 for default writer. These are patch-site sizes, not complete routing-code sizes.
   - **6.13 — CONFIRMED.** Independently counted 368 overlay rows, 3,612 archived rows and 349 shared addresses. The archived section-4 high-water mark leaves 43 bytes.
   - **6.14 — SUPPORTED-NOT-INDEPENDENT** for the complete 12-hit classification and constructor interpretation. Stock tail bytes and cited findings support candidate placement only; exclusive ownership remains open under Q6.

   Other numbered result sections:

   - **§§1–5 — CONFIRMED** for task identity, recorded files, hashes and logged commands; the assertion that every command was wrapped is **SUPPORTED-NOT-INDEPENDENT** beyond those records.
   - **§7 — CONFIRMED** for listing-byte agreement; byte agreement alone does not validate instruction boundaries or exhaustiveness.
   - **§8 — CONFIRMED** for recorded successful exits and independently repeated byte/hash comparisons. These passes do not validate the proposed native layout.
   - **§9 — OVERSTATED** where duplicate-record reuse, complete routing sizing or universal checksum absence are presented as settled new findings.
   - **§10 — CONFIRMED** as an accurate statement of important remaining uncertainties.
   - **§11 — UNSUPPORTED** for safe duplicate-record reuse and **WRONG** for the proposed five-byte face patch.
   - **§12 — WRONG.** “No deviations” overlooks the incomplete total budget and unresolved proof required for unused-record reuse.

   For the six questions in brief §2:

   - **Q1 — ANSWERED (overstated).** Raw-byte evidence challenges the established compression claim, but complete lower-level loading/integrity behavior and before-first-menu timing are not established.
   - **Q2 — ANSWERED (overstated).** First-match behavior is proved for three readers; unused-record status is not. No qualifying 10,008-byte home was established.
   - **Q3 — ANSWERED (overstated).** Relocation mechanism and immediate locations are supported. The recommended alternative patch is **WRONG**: `bne` at `0x611f7f3e` targets `0x611f7f44`, inside the proposed five-byte replacement at `0x611f7f42`. Merely replaying displaced instructions cannot preserve that incoming path.
   - **Q4 — ANSWERED (overstated).** Post-build insertion matches the lookup structure, but builder-before-installer ordering remains unproved.
   - **Q5 — ANSWERED (supported).** Getter/setter sites and minimum whole-instruction coverage are correct. Stub sizes remain unknown.
   - **Q6 — WRONG.** The eight-byte hash node is listed as “inside the 368,” although the overlay CSV contains no node bytes at `0x6031e9b8`. The report’s own sum excludes it. Installer, routing stubs, face helper, runtime bucket publication and code-patch maintenance are not fully budgeted.

5. **Contradictions with established findings:**

   - `HARDWARE-STAGE0-RECORD.md`, Alignment and access audit Finding 2, describes section 7 as compressed. T4’s raw-byte evidence legitimately challenges that interpretation; the third-word value alone does not establish compression.
   - T3i’s Binding record and Face record sections place `0x60320000` and the face table in section 1. T4 correctly distinguishes the actual section-1 end from the separate reset-head copy.
   - T4’s claim that no owned region “exists” exceeds `HARDWARE-STAGE0-RECORD.md`’s Owned RAM analysis and `PROJECT-STATE.md` §6 Q6: ownership remains partly established, with secondary-CPU/DMA questions open.

6. **Alternative explanations** not excluded by the evidence:

   - Another reader could reach the duplicate binding through a computed address, directory pointer or cached pointer.
   - Boot initialization could read menu fields before the proposed key-port installation.
   - Descriptor construction could occur after installation or rebuild buckets later.
   - Lower-level storage routines could perform integrity processing absent from the upper loader listing.
   - Runtime replacement of section-7 instructions could require instruction-cache synchronization; the prior same-core argument concerns data-field stores.

7. **Scope and safety:** No image construction, firmware modification or hardware recommendation was found. Reviewed scripts direct their outputs under `work/`; the isolation audit reports zero violations and unchanged workspace/input baselines. The OM-Emu working-tree diff is present as inherited context; the audit reports no task-induced workspace changes.

   Recommendations are explicitly labelled. Q7 storage is expressly deferred. This review made no filesystem writes.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Withdraw unconditional reuse of `0x615c6234`. Prove reader completeness or retain it as a conditional hypothesis with binding placement unresolved.
   2. Replace the face-patch proposal with a control-flow-preserving design that handles the incoming branch to `0x611f7f44`; update its byte budget.
   3. Separate changed image bytes, reserved resident space, runtime destinations and helper code. Budget the eight-byte node separately: **376 bytes including the node**, within the existing 452-byte span, before additional code.
   4. Include installer, getter/setter stubs, face helper, node initialization/bucket publication and runtime code-patch synchronization as sized areas or explicitly unresolved quantities. Do not claim a complete total.
   5. Bound checksum/decompression conclusions to demonstrated code, and establish installation ordering relative to descriptor construction and first menu access.
   6. Replace “no owned region exists” with “no qualifying region was established”; retain Q6 and the archived-placement conflict.

   Optional improvements: correct the head-copy call address and remove listing ranges that start inside existing instructions, including `0x60045f70` and `0x60046040`.