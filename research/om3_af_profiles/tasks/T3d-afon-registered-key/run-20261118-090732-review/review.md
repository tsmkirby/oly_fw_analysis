# T3d review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The action-table decision is established statically, and the supplied traces support K1 failing and K4 opening the stock chooser. Required evidence remains incomplete: K1’s saturated trace cannot establish the claimed absence of setter/store calls, the deciding instruction lacks the requested four-row operand trace, AF Home coverage is incomplete, and overlay labelling violates brief §0.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md` and `brief.md` completely; `work/result.md`, the complete manifest, decision-point report, design, overlay CSV, all six JSONL logs, command records and audit files. Inspected all seven distinct screenshot images; the 33 supplied screenshots fall into those seven hash-identical groups.

   Research checked: T3c and T3a decisions; T3c’s last Sol review, design, Phase A and E1/E4 construction; T3a brief §§4/7; `AFON-MENU-RESEARCH.md` §1 AF Home inventory and §8 storage/maps/registry sections; T2’s correction verdict and capacity table; T2b’s decision; `PROJECT-STATE.md` §6 Q7; relevant handler, getter, setter, store and trampoline decompilations.

   Independently checked input bytes, listing bytes, overlay construction, call-search arithmetic, hashes and recorded cell equality using PowerShell. No Ghidra, OM-Emu or Python execution; no files written.

3. **Hash verification:** All **261 manifest file entries MATCH**: two inputs, 23 sources and 236 outputs. All **236 output sizes MATCH**. The separate `brief_sha256` field MATCHES.

   Each entry represented below was individually recomputed. Ranges are inclusive; grouped suffixes represent separate entries.

   - **MATCH — inputs:** `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - **MATCH — sources:** `brief.md`; `TASK.md`; `templates/result.md`; `ref/tasks/T3c-afon-editor-routing/decision.md`; `ref/tasks/T3c-afon-editor-routing/run-20261118-080617-review/review.md`; `ref/tasks/T3c-afon-editor-routing/run-20261118-073716/work/out/design.md`; `ref/tasks/T3a-afon-zone-row/decision.md`; `ref/tasks/T3a-afon-zone-row/brief.md`; `ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv`; `ref/tasks/T2b-cell-ownership-gaps/decision.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`.
   - **MATCH — sources under `ref/analysis/decompiled-main/functions/`:** `611a2631.c`, `611a1229.c`, `6119a177.c`, `6119a162.c`, `60419446.c`, `60419696.c`, `6041937f.c`, `60063431.c`, `60063380.c`, `61203082.c`, `6120308d.c`, `6119a2be.c`.
   - **MATCH — under `work/out/cmd/`:** `01` through `33`, each with `.cmd.txt`, `.out`, `.err` and `.exit`; also `34.cmd.txt`.
   - **MATCH — under `work/out/`:** `decision-point.md`, `design.md`, `overlay-changed-bytes.csv`, `overlay-check-d1.txt`; `callee-summary-d1.txt`, `decision-summary-d1.txt`, `match-summary-d1.txt`; `exp-k1-d1-summary.txt`, `exp-k1-d2-summary.txt`, `exp-k4-d1-summary.txt`.
   - **MATCH — under `work/out/`:** `disasm-{0da0,1229,13c0,1571,182e,1ab9,2631,2747,3082,308d,a2be,a2be-long,a773}-d1.txt`.
   - **MATCH — under `work/out/`:** `ghidra-{1229,13c0,2631,a2be-long,callee,chain,exit,returns}-d1.log`.
   - **MATCH — under `work/out/`:** `static-{1229,calls,decision,keytable,tableptr,vtable}-d1.txt`.
   - **MATCH — under `work/out/`:** `exp-k1-d1.jsonl`, `exp-k1-d2.jsonl`, `exp-k4-d1.jsonl`, `trace-callee-d1.jsonl`, `trace-decision-d1.jsonl`, `trace-match-d1.jsonl`.
   - **MATCH — under `work/out/`:** `exp-k1-d1-3d6f-{before,after}.png`; `exp-k1-d2-3d6f-{before,after}.png`; `exp-k4-d1-3d6f-{before,after,cancel,confirm}.png`.
   - **MATCH — under `work/out/`:** `trace-callee-d1-{2154,2155,3d6f,caf}-{before,after}.png`; `trace-callee-d1-page.png`.
   - **MATCH — under `work/out/`:** `trace-decision-d1-{2154,2155,3d6f}-{before,after}.png`; `trace-decision-d1-page.png`.
   - **MATCH — under `work/out/`:** `trace-match-d1-{2154,2155,3d6f,caf}-{before,after}.png`; `trace-match-d1-page.png`.
   - **MATCH:** `work/result.md`.
   - **MATCH — under `work/scripts/`:** `copy_k1_d1.py`, `copy_k1_d2.py`, `copy_k4_d1.py`, `copy_match_d1.py`, `copy_trace_d1.py`, `DisasmRangesD1.java`, `exp_k1_d1.mjs`, `exp_k1_d2.mjs`, `exp_k4_d1.mjs`, `run_logged.mjs`.
   - **MATCH — under `work/scripts/`:** `static_{1229,calls,decision,keytable,tableptr,vtable}_d1.py`; `summarise_{callee,decision,k1,k4,match}_d1.py`; `trace_{callee,decision,match}_d1.mjs`; `write_manifest_d1.py`, `write_overlay_d1.py`.

   Additional audit verification: all **240 harvested-file hashes MATCH**. The normalized emulator diff MATCHES initial pin `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   `34.out`, `34.err` and `34.exit` exist outside the manifest, as disclosed.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED.** Task identity and brief version match.
   - **§2 — CONFIRMED for baseline content; SUPPORTED-NOT-INDEPENDENT for historical execution.** Storage ownership remains unresolved.
   - **§3 — SUPPORTED-NOT-INDEPENDENT.** Artifacts support the reported experiments and static work. The corrected call-search arithmetic is independently confirmed.
   - **§4 — CONFIRMED for the cited material.** Independently compared all **1,192 listing instruction records** across the 13 disassembly files against the input image at `address − 0x60021020`: zero byte mismatches.
   - **§5 — CONFIRMED for surviving outputs and audited isolation.** Historical script preservation has a qualification described below.

   Findings in §6:

   - **6.1 — CONFIRMED statically; SUPPORTED-NOT-INDEPENDENT dynamically.** The `0x900C` handler calls `FUN_611a2631` at `0x611a12a5`; matching records produce 4, while the measured no-match handler result is 1. The missing trace at `0x611a182e` is disclosed.
   - **6.2 — CONFIRMED statically; OVERSTATED if treated as direct operand measurement.** `0x611a26de` loads the record’s halfword at `+4`; `0x611a26e1`, byte `a4`, compares it with the provider UI ID loaded into D1. The supplied four-row trace measures upstream IDs, table contents and outcomes, but does **not** record D0/D1/A2 at this compare.
   - **6.3 — SUPPORTED-NOT-INDEPENDENT.** Logs report IDs 2154, 2155, 2156 and 15727; matching records exist for the first three. Their outer returns are 4, 4, 4 and 1 respectively.
   - **6.4 — SUPPORTED-NOT-INDEPENDENT within the recorded decision window.** All four traces show mapped/index/descriptor arguments of 1448 and registry/store-read arguments of `0x5941`. The listing confirms that the distinguishing comparison reads the provider UI ID.
   - **6.5 — CONFIRMED.** The listing and image records support dispatch halfwords 8 and `0x1e3`, `0x1e4` or `0x1e0`; `FUN_6119a177` stores the two halfwords, and the matching path sets return value 4.
   - **6.6 — CONFIRMED.** The table and its sole literal image pointer, `0x6150f5f0`, are in compressed section 7. The pointer’s following count is 2. The UI map and getter are in uncompressed section 2; `0x3D6F` exceeds the supported map ranges.
   - **6.7 — CONFIRMED as a byte-pattern search.** Independently reproduced **604 new matches and zero old matches** using absolute targets. These are CALL-encoding candidates; scanning every byte does not establish 604 valid instruction-boundary calls.
   - **6.8 — SUPPORTED-NOT-INDEPENDENT for hooked returns and failed opening; UNSUPPORTED for categorical no-call coverage.** K1 d2 records both getter substitutions during OK, return 1, no chooser and equal recorded cells. However, `watchRead` stops collecting **all** entries at 80, including setters and `store-63431`; `parts.commit` reaches exactly 80. Later calls could be omitted.
   - **6.9 — CONFIRMED for rendering and recorded cell equality; SUPPORTED-NOT-INDEPENDENT for execution.** K4 opens the stock two-option chooser. Cancel and confirm snapshots equal the pre-OK recorded cells. Confirm records setter `(2154,1)` and a store call for `0x90a1`, index 0. It also records an earlier store call for `0x8b54`, index 2154. K4 preserves setter and `store-63431` entries beyond its general 80-entry limit, but continues truncating other observations. The same-value confirm does not demonstrate a changed cell.
   - **6.10 — CONFIRMED as a bounded inference.** Substituting the registered key and index through these two getters is insufficient to open this chooser on the tested E1 configuration. This does not establish every possible meaning of native registration.

   Experiment requirements:

   - **Isolation — CONFIRMED from construction.** Both experiments use the same 140-byte E1 overlay and redirects. The third row’s final 32 bytes exactly match stock 2154; its ID is `0x3D6F`. K1 adds only the two allowed getter hooks. K4 removes those hooks and adds one conditional compare hook. No descriptor link or value hook is installed.
   - **Immediate snapshots — CONFIRMED for supplied experimental OKs.** K1 and K4 have highlighted pre-OK screens and post-OK screens with recorded cell snapshots. K4 also has cancel and confirm screens/readbacks.
   - **Full requested cells — INCOMPLETE.** The snapshots include the specified primary arrays and four ordinary AF Home keys, but omit the `MODE_AF_HOME_*_ORIGINALLY` IDs 2274–2279 listed in `setting-name-candidates.json`. Their backing state is not resolved or read back.
   - **Separate events — PARTIALLY SUPPORTED.** Initial OK reports row-refresh, chooser-construction, focus and commit groups. Events generated during K4 cancel/reopen/confirm are accumulated but not emitted as equivalent separate event groups.
   - **K2/K3 and acceptance — CONFIRMED as correctly skipped.** K1 did not open a chooser. No zone-label test, acceptance session pair, control comparison, page regression or store-file comparison was required or performed.

   Remaining numbered sections:

   - **§7 — CONFIRMED as references**, subject to the coverage limits above.
   - **§8 — CONFIRMED as qualified outcomes.** K4 demonstrates stock chooser routing and same-value setter activity, rather than a `0x5b82` commit.
   - **§9 — CONFIRMED for the principal distinction.** The action-table explanation advances T3c and contradicts its explicitly tentative registered-key hypothesis.
   - **§10 — CONFIRMED as disclosure; incomplete.** It omits saturated traces, missing compare operands and incomplete AF Home coverage.
   - **§11 — SUPPORTED-NOT-INDEPENDENT as a proposal.** A new action record’s commit behaviour remains unmeasured.
   - **§12 — CONFIRMED for disclosed deviations; incomplete.** It omits the evidence and labelling gaps above and script-version preservation below.

   **Command records:** All 34 supplied commands have real-looking wrapper `.cmd.txt`, `.out`, `.err` and `.exit` records, all with status 0 and no spawn error or signal. Commands 01–33 agree with the manifest’s recorded spawn strings. The wrapper uses `spawnSync` results directly and correctly substitutes `process.execPath` for `node26`. This verifies the supplied command set, not an exhaustive execution history. Command 04’s JSONL contains a C-AF navigation boundary despite process status 0; command 18 supplies the later successful trace.

   **Script preservation:** Commands 26 and 29 invoke the same `summarise_k1_d1.py`, but their output refers to d1 and d2 respectively. The surviving script reads/writes only d2. Its earlier executed version was therefore not preserved under a unique name, contrary to brief §0.

5. **Contradictions with established findings:** None in the core action-table result.

   T3c `decision.md`, “Leading hypothesis,” explicitly leaves registered-key causality unproven; rejecting that hypothesis is new evidence. T3a’s established overlay placement and T2/T2b’s unresolved storage ownership remain consistent with this result. The overlay’s `observe` classification contradicts the current brief’s labelling requirement, rather than an established firmware finding.

6. **Alternative explanations** not excluded by the evidence.

   - Setter/store calls after K1’s 80-entry cutoff could leave the same endpoint values.
   - Unrecorded AF Home backing state could change without appearing in the supplied snapshots.
   - A genuine `0x3D6F` action record could route differently from K4’s forced match against the unchanged 2154 record.
   - Same-value setter activity does not establish successful value-changing commit behaviour.
   - Correcting address arithmetic does not eliminate false CALL-pattern matches in data or instruction interiors.

7. **Scope and safety:** No task-specific writes outside `work/`, new emulator-source changes, firmware image/component/SD-file construction or hardware recommendation were found. Isolation reports zero violations; the emulator diff matches its initial pin.

   All **140 distinct overlay bytes** have correct stock values `FF`, correct address/offset correspondence and placement in uncompressed section 1. None lies in sections 6 or 7.

   Runtime redirects and experimental hook installations carry `role: behaviour` and `EMULATOR-ONLY`. However, **all six JSONL files classify the applied behaviour-changing overlay as `role:"observe", hook:"observe"`**; their source emitters do likewise. This fails brief §0. Pure observation entries may retain observation labels.

   The result clearly treats hooks as emulator experiments and the native changes as proposals. It does not choose storage or claim a persistence design. This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Narrow K1’s no-setter/no-store statement to the retained trace prefix. Disclose the saturated 80-entry buffer; complete interval coverage requires uncapped write observations under any authorized follow-up.
   2. Distinguish static reconstruction from direct measurement at `0x611a26e1`. Mark the requested four-row operand trace incomplete unless it is captured.
   3. Mark AF Home coverage incomplete for IDs 2274–2279; resolve their backing state before claiming every requested cell was checked.
   4. Correct overlay labelling in future scripts to `role: behaviour` and `EMULATOR-ONLY`; provide a file-specific erratum for existing logs without rewriting historical evidence.
   5. Disclose the overwritten summarizer version and the missing separate cancel/confirm event groups. Preserve future script versions under new names.
   6. Add these limitations to result §§10/12. Describe 604 as byte-pattern candidates and K4 confirm as same-value setter/store activity; retain the qualified negative K1 conclusion and skipped acceptance.

   Optional improvements: Record script hashes with each command, report explicit truncation counters, and emit D0/D1/A2 plus record bytes at every deciding comparison.