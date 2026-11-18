# T3g review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   The evidence supports the descriptor decoding, Z1’s EMULATOR-ONLY commit of a zone-table value, and the negative image-rendering result. The persistence comparison is supported. Full acceptance is overstated: `_ORIGINALLY` getter values were not read, and assertions do not cover every step.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the manifest, descriptor report, design, overlay CSVs, scripts, JSONL records, command records and audit files.

   Research checked: T3f’s decision, Sol review, binding/design reports and B2/B4 implementation; T3a brief §§4/7 and design; T3c Phase A §§1–3; `AFON-MENU-RESEARCH.md`, “How a page-27 row opens its editor,” viewer iteration and storage-accessor sections; relevant descriptor and option-reader listings/decompilation.

   Independently checked **868 listing bytes across eleven files: zero mismatches**, using offset = address − `0x60021020`. Decoded both descriptors, value tables, UI 238’s name/key and English resource strings. Inspected all 23 distinct screenshot contents; other screenshots are hash-identical copies.

   Verification used PowerShell. No Ghidra, OM-Emu or Python was run. No files were written.

3. **Hash verification:** All **214 manifest file entries MATCH**: five inputs, twenty sources and 189 outputs. All 189 output sizes MATCH. The separate `brief_sha256` MATCHES.

   Every entry represented below was individually recomputed; braces and ranges denote separate entries.

   - **MATCH — inputs:** `inputs/{00_0100_50000020,02_0106_458c0020}.decoded.bin`.
   - **MATCH — emulator inputs:** `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.{blk00000000.OE.0100,blk02000000.OE.0101}.bin`.
   - **MATCH — input:** `ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv`.
   - **MATCH — sources:** `brief.md`; `TASK.md`; `templates/result.md`.
   - **MATCH — T3f sources:** `ref/tasks/T3f-afon-editor-binding/decision.md`; `run-20261118-104215-review/review.md`; `run-20261118-095558/work/out/design.md`.
   - **MATCH — T3a sources:** `ref/tasks/T3a-afon-zone-row/brief.md`; `run-20261118-053855/work/out/design.md`; `run-20261118-053855/work/scripts/build_overlay_v2.py`.
   - **MATCH — sources:** `ref/tasks/T3c-afon-editor-routing/run-20261118-073716/work/out/phaseA.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`.
   - **MATCH — decompilation sources under `ref/analysis/decompiled-main/functions/`:** `{60405865,604058bc,6040547b,604052d5,60405178,604050e5,604057c8,611c7785,611c782f}.c`.
   - **MATCH — command outputs under `work/out/cmd/`:** `01`–`13`, each `.cmd.txt`, `.out`, `.err`, `.exit`; also `14.cmd.txt`.
   - **MATCH — reports under `work/out/`:** `descriptors-g1.txt`; `descriptors.md`; `design.md`; `listing-check-g1.txt`; `ghidra-desc-g1.log`.
   - **MATCH — listings under `work/out/`:** `disasm-{50e5,5178,5252,52d5,547b,5736,57c8,5865,58bc,7785,782f}-g1.txt`.
   - **MATCH — logs under `work/out/`:** `exp-{base,z1,z2,z3}-g1.jsonl`; `accept-g{1,2,3,4}.jsonl`.
   - **MATCH — overlays under `work/out/`:** `overlay-changed-bytes.csv`; `overlay-exp-{base,z1,z2,z3}-g1.csv`.
   - **MATCH — stores under `work/out/`:** `nvram-accept-{control,c1,c2}.json`.
   - **MATCH — acceptance screenshots under `work/out/`, for each of `accept-c1` and `accept-c2`:** `-2154-{open,cancel}.png`; `-2155-{open,cancel}.png`; `-page{25,26,27}.png`; `-page27-return.png`; `-zone-{before,cancel,commit-1,commit-2}.png`.
   - **MATCH — control screenshots under `work/out/`:** `accept-control-2154-{open,cancel}.png`; `accept-control-2155-{open,cancel}.png`; `accept-control-page{25,26,27}.png`; `accept-control-page27-return.png`.
   - **MATCH — experiment screenshots under `work/out/`, for each of `exp-base-g1`, `exp-z1-g1`, `exp-z2-g1`, `exp-z3-g1`:** `-2154-{before,after,cancel}.png`; `-2155-{before,after,cancel}.png`; `-3d6f-{before,after,cancel,cancel-nav-0,confirm,reopen,nav-0}.png`.
   - **MATCH — additional experiment screenshots:** `work/out/exp-{z1,z2}-g1-3d6f-nav-{1,2}.png`.
   - **MATCH:** `work/result.md`.
   - **MATCH — scripts under `work/scripts/`:** `accept_g{1,2,3,4}.mjs`; `check_listings_g1.py`; `decode_descriptors_g1.py`; `DisasmRangesG1.java`; `exp_{base,z1,z2,z3}_g1.mjs`; `menu_session_g{1,2}.mjs`; `run_logged.mjs`; `write_manifest_g1.py`.

   Additional verification: all **193 harvested-file hashes** in `audit/run-log.json` MATCH. The emulator diff normalized to LF MATCHES its initial pin. The `.0101` resource-prefix hash MATCHES `119370d5…`.

   All fourteen commands have actual `.out`, `.err` and `.exit` files. Command 14’s final three files are explicitly excluded from the manifest’s self-record; they match the harvest audit. Its actual exit is 0. Recorded entry-script and wrapper execution hashes match surviving files. Imported session helpers lack execution-time hash records, so their historical immutability is not independently established.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED** for task identity and brief hash. Execution history is **SUPPORTED-NOT-INDEPENDENT**.
   - **§2 — CONFIRMED** for input hashes and established baseline. The previously omitted `.0101` resource is now identified and hashed.
   - **§3 — CONFIRMED** for commands, exits and retained versions. Commands 08–10 failed as described; command 11 succeeded. “No script was edited” is confirmed for recorded entry-script hashes, with the helper limitation above.
   - **§4 — CONFIRMED** for examined addresses and listing bytes.
   - **§5 — CONFIRMED** for surviving deliverables, subject to the disclosed final-command exclusions.

   Findings in §6:

   - **6.1 — CONFIRMED.** The hash initialization walks 1712 twenty-byte records; lookup matches the first halfword.
   - **6.2 — CONFIRMED.** 2154’s descriptor bytes, pointer, count, stride, type and values `[0,1]` agree with the input.
   - **6.3 — CONFIRMED.** UI 238’s descriptor and values `[0,1,2,3,5,10,6,7,8,9]` agree.
   - **6.4 — CONFIRMED.** The quotient and byte-read paths are present; the zero second pointer bypasses conversion. The index reader permits equality with the quotient, so it should not be described as a strict bounds check.
   - **6.5 — CONFIRMED** for the value-table interpretation and option-record decoding. **WRONG as written** for “the two lists hold the same set”: priority values are `{0,1}`; zone values are `{0,1,2,3,5,6,7,8,9,10}`. The matching sets are UI 238’s value table and the zone option list.
   - **6.6 — CONFIRMED.** Resource 0106 names UI 238 `MODE_AF_HOME_AREA_TYPE`; its map is key `0x9fa1`, index 0.
   - **6.7 — CONFIRMED.** Stock page-27 rows have null alternate lists; UI 238’s row has both lists pointing at the zone records.
   - **6.8 — CONFIRMED** for screenshots and recorded baseline results; **SUPPORTED-NOT-INDEPENDENT** dynamically. Confirm records `(15727,1)`, cancel retains 0, and sampled cells remain equal. Complete AF Home coverage is **OVERSTATED** because `_ORIGINALLY` getter values are absent.
   - **6.9 — CONFIRMED** for the descriptor replacement, negative image result, setter `(15727,3)` and profile/cache readback 3. Cancel records no setter and retains 0. The visible chooser contains priority faces and blank slots. “Every listed cell unchanged” requires the same `_ORIGINALLY` qualification.
   - **6.10 — CONFIRMED.** Action comparisons are `(2154,15727)`, `(2155,15727)`, then `(15727,15727)` at `0x6031ea30`; binding match is `(486,486)` at `0x60322700`, UI 15727. Independently checked all **4,204 conversion records**, with zero inconsistencies.
   - **6.11 — CONFIRMED.** Z2 changes only descriptor byte `0x6031e9ac`, `02→0a`. The grid expands, priority faces repeat, confirm stores 1 and cancel retains 0.
   - **6.12 — CONFIRMED.** Z3 changes only pointer bytes `0x6031e9a4–a5`, `b790→b178`. Count remains 2; the chooser retains two priority buttons and stores 1.
   - **6.13 — CONFIRMED as a bounded inference.** Count controls the tested slot expansion, and the table supplies committed values. The chooser’s face-source list remains unidentified. Untested slots and values were not exhaustively traversed.
   - **6.14 — OVERSTATED.** The final log contains 53 successful assertion records, two commits of 2 then 5 per candidate, and one cancel retaining 0 per candidate. The twelve reported control comparisons are valid. However, candidate chooser opening/navigation is bundled into unchecked key sequences; highlighted-row/title and exact readback assertions are not made after every step. `_ORIGINALLY` records contain mappings, not getter results. The control shares stock-row/page operations but omits candidate-only operations, as disclosed.
   - **6.15 — CONFIRMED** for persistence evidence; **SUPPORTED-NOT-INDEPENDENT** for execution. Independently compared decoded M and E bytes: zero differences, respectively 262144 and 196608 bytes. Reopen records show both stores loaded, profile 0 and `0x90a1=[1,1]`.
   - **6.16 — CONFIRMED.** Independently decoded English resource record 5 and obtained the three reported page titles.

   Remaining numbered sections:

   - **§7 — CONFIRMED** for evidence locations. Experiment groups separate opening, each navigation step, cancel, reopening and confirm. Required trace arrays report cap 100000 and zero dropped records. Each confirm records one own setter, zero `0x60063431` entries and 228 `0x60063380` entries.
   - **§8 — CONFIRMED** for individual experiment outcomes, page renders and persistence; **OVERSTATED** for complete acceptance and full-cell coverage.
   - **§9 — CONFIRMED** for the new descriptor/value findings; **OVERSTATED** where it says T3a’s acceptance procedure passes.
   - **§10 — CONFIRMED** as disclosed limitations.
   - **§11 — SUPPORTED-NOT-INDEPENDENT** as an untested proposal. Evidence does not establish that changing the row’s text list will supply chooser faces.
   - **§12 — CONFIRMED** for the combined Z1 change, control difference and failed harness attempts. The baseline plus Z1–Z3 are four runs; no Z4 was performed.

5. **Contradictions with established findings:** None in the central descriptor or commit result.

   The blanket acceptance statements conflict with T3a brief §7 item 3’s per-step assertions and complete AF Home readback requirements. T3c Phase A §2 distinguishes `_ORIGINALLY` getter reads from map-key readbacks; this task records only the latter.

   Within the deliverables, `design.md`, “T3a’s fields,” incorrectly says the cached byte at `0x6031e920` stays 0. The setter writes both aliases, and Z1’s confirm reads both as 3. The original input and initial overlay default remain 0.

6. **Alternative explanations** not excluded by the evidence.

   - Copied binding metadata, including the unvaried `0x2d` word, or another editor-owned list may select the priority faces.
   - A complete text list might work, but changing the row’s primary list alone has not been shown to affect chooser faces.
   - Repeated values in Z2 leave its initial cursor/index mapping uncertain.
   - Endpoint equality does not establish unchanged `_ORIGINALLY` values or exclude transient changes outside observed trace sites.
   - No native implementation, final binding-array placement or hardware behavior is established.

7. **Scope and safety:** No task-specific writes outside `work/`, new emulator-source changes, firmware image/component/SD-file construction, storage decision or hardware recommendation were found. Isolation reports zero violations; the pre-existing emulator diff matches its initial pin.

   Every overlay old byte and offset/address relationship checks. All five CSVs contain 212 rows within uncompressed section 1, `0x6031e920–0x6031ea47`; none is in section 6 or 7. Z1 changes three bytes in two fields, Z2 one count byte, and Z3 two pointer bytes. Registration, binding and value hooks remain common prerequisites.

   Firmware interventions and prerequisite overlays are labelled `EMULATOR-ONLY` / `role: behaviour`. The explicit harness `UIIN_ENTRIES.set(...)` override for code `0x120b` lacks a corresponding behaviour label.

   This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Downgrade §§6.14, 8 and 9 to partial acceptance. Preserve the successful commits and persistence result, but state that per-step assertions and complete AF Home getter coverage remain unfinished.
   2. State explicitly that IDs 2274–2279 were checked for key/index mappings only. Read their actual getter values in a new script version before claiming all listed cells unchanged.
   3. Correct §6.5’s matching-set statement and `design.md`’s cached-byte statement. Qualify “same kind split” for `FUN_611c782f`: its supported kind sets are narrower than `FUN_611c7785`’s.
   4. Label the explicit `0x120b` harness override as EMULATOR-ONLY behaviour. Preserve historical scripts unchanged.
   5. Describe the proposed text-list change as a hypothesis whose connection to the chooser’s unidentified face source remains unproven.

   Optional improvements: Record execution-time hashes for imported session helpers, use distinct screenshot names for failed acceptance attempts, and trace the chooser’s actual face-list source before choosing the next intervention.