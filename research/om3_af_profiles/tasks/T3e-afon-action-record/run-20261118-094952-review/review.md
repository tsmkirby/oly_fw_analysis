# T3e review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   The evidence supports the central negative result: the added `0x3D6F` action record opens 2154’s chooser, whose confirm calls the setter with UI 2154 and leaves the RAM profile unchanged. X4’s replacement dispatch word prevents the chooser from opening. Neither experiment establishes a working AF-ON commit.

   Required corrections concern semantic overstatement, mapping documentation, and command metadata.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the complete manifest, action-record report and design. Inspected both complete JSONL logs, all three overlay CSVs, scripts, command records, and audit files.

   Research checked: T3a/T3c/T3d decisions; T3d’s previous Sol review, decision-point report and design; T3a’s design and brief §§4/7; `AFON-MENU-RESEARCH.md` AF Home inventory and §8 storage/accessor discussion; setting-name candidates; relevant action-record, dispatch, getter, setter and typed-accessor decompilations. Checked the existing assembly around `0x61283bef` and `0x6127e750`.

   Independently compared all 316 supplied listing instruction records with the main image at `address − 0x60021020`: zero byte mismatches. Inspected all five distinct screenshot images; the 24 screenshots belong to those five hash-identical groups.

   Used PowerShell only for verification. No Ghidra, OM-Emu or Python execution; no files written.

3. **Hash verification:** All **159 manifest file entries MATCH**: two inputs, 29 sources and 128 outputs. All 128 recorded output sizes MATCH. The separate `brief_sha256` MATCHES.

   Every entry represented below was individually recomputed. Ranges and grouped suffixes represent separate entries.

   - **MATCH — inputs:** `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - **MATCH — sources:** `brief.md`; `TASK.md`; `templates/result.md`.
   - **MATCH — sources under `ref/tasks/T3d-afon-registered-key/`:** `decision.md`; `run-20261118-090732-review/review.md`; `run-20261118-081316/work/out/decision-point.md`; `run-20261118-081316/work/out/design.md`; `run-20261118-081316/work/scripts/run_logged.mjs`.
   - **MATCH — sources under `ref/tasks/T3a-afon-zone-row/`:** `decision.md`; `brief.md`; `run-20261118-053855/work/out/design.md`; `run-20261118-053855/work/out/overlay-changed-bytes.csv`.
   - **MATCH — sources:** `ref/tasks/T3c-afon-editor-routing/decision.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`; `ref/analysis/review/setting-name-candidates.json`.
   - **MATCH — sources under `ref/analysis/decompiled-main/functions/`:** `611a2631.c`, `6119a177.c`, `6119a162.c`, `6124f82b.c`, `611a3655.c`, `61283b1c.c`, `61283f10.c`, `6127e750.c`, `60419446.c`, `60419696.c`, `60063a20.c`, `60419368.c`, `6041937f.c`, `60419c7d.c`.
   - **MATCH — outputs under `work/out/cmd/`:** `01` through `16`, each with `.cmd.txt`, `.out`, `.err` and `.exit`; also `17.cmd.txt`.
   - **MATCH — outputs under `work/out/`:** `action-records.md`, `design.md`, `static-records-e1.txt`, `home-map-e1.json`, `listing-check-e1.txt`, `ghidra-records-e1.log`, `overlay-changed-bytes.csv`, `overlay-x1-e1.csv`, `overlay-x4-e1.csv`.
   - **MATCH — outputs under `work/out/`:** `disasm-{12a5,2631,36a0,3d90,3f10,a162,a177,f7c0,f82b}-e1.txt`.
   - **MATCH — outputs under `work/out/`:** `exp-x1-e1.jsonl`, `exp-x4-e1.jsonl`, `exp-x1-e1-summary.txt`.
   - **MATCH — screenshots under `work/out/`, for each of `exp-x1-e1` and `exp-x4-e1`:** `-2154-{before,after,cancel}.png`; `-2155-{before,after,cancel}.png`; `-3d6f-{before,after,cancel,chosen,confirm,reopen}.png`.
   - **MATCH:** `work/result.md`.
   - **MATCH — outputs under `work/scripts/`:** `check_listings_e1.py`, `copy_overlay_csv_e1.py`, `DisasmRangesE1.java`, `exp_x1_e1.mjs`, `exp_x4_e1.mjs`, `make_x4_e1.py`, `print_version_e1.py`, `run_logged.mjs`, `static_editor_id_e1.py`, `static_records_e1.py`, `static_second_words_e1.py`, `static_second_words_e2.py`, `summarise_cells_e1.py`, `summarise_x1_cmp_e1.py`, `summarise_x1_e1.py`, `summarise_x4_cmp_e1.py`, `write_manifest_e1.py`.

   Additional verification: every harvested-file hash in `audit/run-log.json` MATCHES. The emulator diff, normalized to LF, MATCHES initial pin `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   `17.out`, `17.err` and `17.exit` exist outside the manifest, as disclosed. The manifest itself is also necessarily excluded from its output list.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED for identity and audited isolation; SUPPORTED-NOT-INDEPENDENT for execution history.** Audit records report unchanged inputs/workspace and zero isolation violations. The supplied commands use the prescribed launcher and runtime. No persistence run appears.
   - **§2 — CONFIRMED for cited baseline content; SUPPORTED-NOT-INDEPENDENT for historical reading.** Input hashes match. No resource modification or new string decoding was found.
   - **§3 — SUPPORTED-NOT-INDEPENDENT.** All 17 supplied commands have wrapper `.cmd.txt`, `.out`, `.err` and `.exit` records. Recorded wrapper hashes and script hashes match surviving files. Command 01 executes an inline version expression and correctly records no script. Command 10 genuinely records exit 1 and its traceback; the corrected helper has a distinct filename.
   - **§4 — CONFIRMED for supplied listings and cited material.** All 316 listing records match image bytes. The virtual-call argument loading is additionally supported by existing assembly at `0x61283bea`–`0x61283bef`.
   - **§5 — CONFIRMED with a minor omission.** Surviving files agree with the manifest apart from its disclosed final-command outputs and the manifest itself.

   Findings in §6:

   - **6.1 — CONFIRMED.** The 24-byte layout, matching fields, handler, pair fields and callback follow the listing and decompilation.
   - **6.2 — CONFIRMED.** Both page-27 records and the C-AF Area record match the stated image bytes exactly.
   - **6.3 — CONFIRMED for storage and sentinel handling; OVERSTATED for the name “keep value.”** The pair is stored at `0x60379d44/46`; `0x23` triggers the shown discard condition. This establishes that 8 is a dispatch value that passes that condition, rather than fully defining 8’s semantic role.
   - **6.4 — CONFIRMED.** The trampoline preserves D0/D1 and invokes vtable slot `+4`. The image word at `0x61513470` is `0x611a01e8`. The cited `disasm-3d90-e1.txt` does not itself show the trampoline; the existing assembly and independently checked 13 image bytes do.
   - **6.5 — CONFIRMED within the decoded layout.** Independently counted 36 kind-8 entries among the 71 dispatch-table records, with no relevant `0x1e0`–`0x1e4` match. No decoded action-record field directly supplies an option-list, text or help pointer.
   - **6.6 — CONFIRMED as bounded byte-pattern findings.** The stated owners occur in the scanned region, `0x0e3d` has no qualifying owner there, and the packed u16/u32 sequences are absent. These searches do not establish global semantic uniqueness.
   - **6.7 — CONFIRMED for the mapping gap.** IDs 2274–2279 fall outside the getters’ applicable ranges, and runtime records report key/index zero. The typed accessor was not called. This establishes no backing cell **through this UI-map route**, not the absence of all possible internal backing state.
   - **6.8 — SUPPORTED-NOT-INDEPENDENT.** The live-table observation records pointer `0x6031ea00`, count 3, and no execution of the fallback live-object write.
   - **6.9 — CONFIRMED for recorded operands and bytes; SUPPORTED-NOT-INDEPENDENT for execution.** Initial OKs record the expected 2154, 2155 and `0x3D6F` comparisons. X1’s reopen also records the matching third record.
   - **6.10 — CONFIRMED for rendering.** The screenshots show the highlighted third row before OK and the stock two-option chooser afterward.
   - **6.11 — CONFIRMED for recorded calls and endpoint equality; SUPPORTED-NOT-INDEPENDENT dynamically.** Confirm records setter `(2154,1)`, the two stated store calls, profile zero and `0x90a1=[1,1]`. Cancel also leaves the profile zero. This is a failed `0x3D6F` commit and a same-value stock-setting write.
   - **6.12 — CONFIRMED for construction and supplied rendering; SUPPORTED-NOT-INDEPENDENT dynamically.** X4 differs at exactly two bytes representing the single word change `0x1e3 → 0x0e3d`. Its initial OK matches the third record but opens no chooser. Later events named “cancel” and “confirm” are not chooser cancel/confirm tests because no chooser opened.
   - **6.13 — CONFIRMED with terminology correction.** Arrays are capped at 100000; explicit cumulative dropped counters remain zero. Thus the recorded intervals are untruncated, although collection is not literally uncapped.
   - **6.14 — CONFIRMED for recorded endpoint equality.** Independently compared every supplied snapshot’s complete `cells` object: all equal their experiment’s first pre-OK snapshot. The ordinary AF Home map slots match image bytes. The `ORIGINALLY` entries contain mapping results, not backing-cell values. No control comparison was performed.
   - **6.15 — SUPPORTED-NOT-INDEPENDENT as a bounded inference; OVERSTATED in its general wording.** X1 supports `0x1e3` routing to 2154’s chooser. X4 establishes failure for `0x0e3d` in this configuration. It does not establish that every second word without a stock owner fails, or prove the proposed reverse-lookup mechanism.
   - **6.16 — CONFIRMED.** X1 did not commit `0x3D6F`; X2, X3 and acceptance were correctly skipped under the brief’s gates.

   Remaining numbered sections:

   - **§7 — CONFIRMED as evidence references**, subject to the qualifications above.
   - **§8 — CONFIRMED as qualified outcomes.** Harness exit zero is not successful commit acceptance. “Uncapped” should read “capped, zero dropped.”
   - **§9 — OVERSTATED where it promotes “keep value” and “editor id” to fully established static meanings.** The new routing observations are supported; the exact conversion inside `0x611a01e8` remains unresolved.
   - **§10 — CONFIRMED as disclosed limitations.**
   - **§11 — CONFIRMED as a reasonable proposed next investigation.**
   - **§12 — CONFIRMED**, with the same trace terminology and mapping qualifications.

   Experiment requirements: X1 adds the relocated table and redirect against its stated E1-plus-value-hooks baseline. Its first 48 relocated bytes independently match the stock table exactly; the third record differs from 2154 only in UI ID. X4 changes only the second dispatch word. Explanations precede the experiments. Before-OK, after-OK, cancel and confirm observations have separate groups. Required trace counters are present and zero. Both experiments fail the requested value-changing `0x3D6F` confirm, as reported.

   Command metadata defect: manifest `commands[].cmd` contains the last metadata line, such as `script_bytes: 20315`, instead of the actual command. The `.cmd.txt` and `.exit` files preserve the real commands.

5. **Contradictions with established findings:** None in the central result.

   T3d `decision.md`, “Accepted” and “Consequences for the design,” establishes the action-table gate and compressed section-7 redirect requirement. T3e is consistent with both. Its stock-2154 confirm also agrees with T3d’s K4 observation.

   The range inventory in `action-records.md`, “UI map for the ORIGINALLY ids,” is incomplete: `FUN_60419446` additionally handles 4000–4022 and 4500–4521, as T3a’s design, “UI id,” already states. This does not change the conclusion for 2274–2279.

6. **Alternative explanations** not excluded by the evidence.

   - `0x1e3` may select a fixed editor or another dispatch structure; a reverse lookup through the copied action table was not demonstrated.
   - X4 may fail because its dispatch value is invalid for this path. Its bounded owner search does not establish a universal stock-owner requirement.
   - Same endpoint values do not exclude transient or same-value native writes. X1 explicitly records a stock-key write.
   - An unmapped `ORIGINALLY` UI ID does not prove that equivalent state has no separate internal representation.
   - These two experiments do not establish native firmware behavior, a successful zone commit, regression acceptance or persistence behavior.

7. **Scope and safety:** No task-specific writes outside `work/`, new emulator-source modifications, firmware image/component/SD-file construction, storage decision or hardware recommendation were found. Audit isolation reports zero violations; the emulator diff matches its initial pin.

   Independently checked all 212 rows in each overlay CSV: correct old bytes, correct offset/address correspondence, and placement in uncompressed section 1. None is in section 6 or 7. The first two relocated records are byte-exact stock copies.

   Behaviour-changing overlay, hook and redirect event groups carry `role: behaviour` and `EMULATOR-ONLY`; observations carry `role: observe`. The native design is explicitly a proposal and acknowledges its missing editor routing.

   This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Replace categorical “8 is the keep value” with the demonstrated dispatch/sentinel behavior. Retain the unresolved semantic and editor-conversion boundary.
   2. Restrict the no-stock-owner conclusion to `0x0e3d` in X4’s tested configuration. Label the reverse-lookup explanation as an unproven hypothesis.
   3. Describe traces as capped at 100000 with zero dropped entries. Describe X4’s later cancel/confirm labels as attempted key phases, not chooser operations.
   4. Correct the mapped-getter range inventory and retain “no backing cell through this UI-map route” wording for the `ORIGINALLY` IDs.
   5. Correct the manifest generator’s command extraction to use the actual requested/spawn command. Preserve existing records and use a new script/output version if refreshed.
   6. Correct claim 6.4’s evidence citation to the trampoline and caller assembly; explicitly acknowledge the manifest’s self-exclusion.

   Optional improvements: In a separately authorized follow-up, trace `0x611a01e8` to identify the exact conversion to UI 2154 before attempting another routing change. Preserve the failed-commit classification and acceptance gates.