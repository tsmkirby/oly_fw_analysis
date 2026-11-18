# T3c review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The evidence supports four failed R1 prototypes and correctly skipping acceptance. However, the mandatory editor-selection decision point remains unidentified. The proposed hook rests on a misinterpretation of `FUN_611c7894`, settings-write coverage is incomplete, and command/evidence preservation requirements were violated.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, the manifest, Phase A report, design, complete overlay CSV, JSONL logs, screenshots, command records and audit copies.

   Research checked: T3a `decision.md`, both Sol reviews, T3a brief §§4/7, `design.md` and `design-v12.md`; `AFON-MENU-RESEARCH.md` §6; `PROJECT-STATE.md` §§1–3; relevant viewer, option-decoder, activation and refresh decompilations, plus assembly for `FUN_611c7894`.

   Independently checked input bytes, listing bytes, overlay placement and hashes using PowerShell. Did not run Ghidra, OM-Emu or Python, or write files.

3. **Hash verification:** All **169 manifest file entries MATCH**: two inputs, thirteen sources and 154 outputs. All **154 output sizes MATCH**. The separate `brief_sha256` field also MATCHES.

   Each entry represented below was individually recomputed. Ranges are inclusive; paired extensions identify separate entries.

   - **MATCH — inputs:** `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - **MATCH — sources:** `brief.md`; `TASK.md`; `templates/result.md`; `ref/tasks/T3a-afon-zone-row/decision.md`; `ref/tasks/T3a-afon-zone-row/brief.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`.
   - **MATCH — under `ref/analysis/decompiled-main/functions/`:** `611c7785.c`, `61204065.c`, `61203816.c`, `610cdebf.c`, `610cdf05.c`, `611f703b.c`, `611f6e4b.c`.
   - **MATCH — under `work/out/cmd/`, both `.out` and `.err` for every stem:** `04-trace`, `05-callers`, `06-decision`, `07-kind`, `08-page28`, `09-ghidra`, `10-ghidra-tail`, `11-slot`, `12-page28`, `13-page29`, `14-slot`, `15-proto-v1`, `16-callers`, `17-act`, `18-open`, `19-ghidra-caller`, `20-slots`, `21-build`, `22-refresh`, `23-make-v2`, `24-proto-v2`, `25-copy-png`, `26-link`, `27-who`, `28-make-v3`, `29-proto-v3`, `30-make-v4`, `31-proto-v4`, `32-manifest`, `33-node-version`.
   - **MATCH:** `work/out/cmd/node-check.out`.
   - **MATCH — under `work/out/`:** `design.md`, `phaseA.md`, `overlay-changed-bytes.csv`; `disasm-activate-a3.txt`, `disasm-activate-tail-a3.txt`, `disasm-kind-a3.txt`, `disasm-refresh-caller-a4.txt`; `ghidra-activate-tail-a3.log`, `ghidra-decision-a3.log`, `ghidra-refresh-caller-a4.log`.
   - **MATCH — under `work/out/`:** `static-callers-a3.txt`, `static-callers-a4.txt`, `static-dispatch-a2.txt`, `static-refresh-a6.txt`, `static-route-a1.json`, `static-route-a1.txt`.
   - **MATCH — under `work/out/`:** `page28-a2.jsonl`, `page28-a3.jsonl`, `page29-a3.jsonl`; each corresponding `-open.png` and `-ok.png`.
   - **MATCH — under `work/out/`:** `proto-r1-v1.jsonl` through `proto-r1-v4.jsonl`; `proto-r1-v1-page.png` through `proto-r1-v4-page.png`; `proto-r1-v1-open.png` through `proto-r1-v4-open.png`.
   - **MATCH — under `work/out/`:** `trace-a1.jsonl`, `trace-act-a6.jsonl`, `trace-build-a8.jsonl`, `trace-decision-a2.jsonl`, `trace-kind-a3.jsonl`, `trace-open-a7.jsonl`, `trace-slot-a4.jsonl`, `trace-slot-a5.jsonl`, `trace-who-a10.jsonl`, `link-diag-a9.jsonl`.
   - **MATCH — under `work/out/`:** `trace-a1-2154.png`, `trace-a1-2155.png`, `trace-a1-3d6f.png`, `trace-a1-page.png`; `trace-a2-2154.png`, `trace-a2-2155.png`, `trace-a2-3d6f.png`, `trace-a2-caf.png`, `trace-a2-page.png`; `trace-a3-2154.png`, `trace-a3-2155.png`, `trace-a3-3d6f.png`; `trace-a4-caf.png`; `trace-a5-2154.png`, `trace-a5-2155.png`, `trace-a5-3d6f.png`.
   - **MATCH:** `work/result.md`.
   - **MATCH — under `work/scripts/`:** `copy_v2_png.py`, `DisasmRangesA3.java`, `link_diag_a9.mjs`; `make_proto_v2.py`, `make_proto_v3.py`, `make_proto_v4.py`; `proto_r1_v1.mjs` through `proto_r1_v4.mjs`.
   - **MATCH — under `work/scripts/`:** `route_act_a6.mjs`, `route_build_a8.mjs`, `route_decision_a2.mjs`, `route_kind_a3.mjs`, `route_open_a7.mjs`, `route_page_a2.mjs`, `route_page_a3.mjs`, `route_slot_a4.mjs`, `route_slot_a5.mjs`, `route_trace_a1.mjs`, `route_who_a10.mjs`.
   - **MATCH — under `work/scripts/`:** `run_logged_a1.py`, `static_callers_a3.py`, `static_callers_a4.py`, `static_dispatch_a2.py`, `static_refresh_a6.py`, `static_route_a1.py`, `static_slots_a5.py`, `write_manifest_a11.py`.

   Additional audit checks: all **155 harvested-file hashes MATCH**. The emulator diff, after CRLF-to-LF normalization, MATCHES the initial pin `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`. Hash agreement does not restore overwritten evidence or authenticate hard-coded subprocess exits.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED.** Task identity, brief version and producer match the supplied records.
   - **§2 — CONFIRMED for baseline content / SUPPORTED-NOT-INDEPENDENT for historical execution.** Research supports the reused layout. The normalized emulator diff matches the pre-existing pin. The assertion that brief §0 was followed is **WRONG** for command recording and unique screenshot preservation.
   - **§3 — SUPPORTED-NOT-INDEPENDENT, with incomplete records.** Artifacts support the listed investigations, separate reference sessions and four distinct prototype configurations. No acceptance was run. Individual exits appear as constants in the manifest generator; they are not preserved execution records under `work/out/cmd/`.
   - **§4 — CONFIRMED for the cited locations.** Independently compared **113 listing instructions** with input bytes using address minus `0x60021020`: zero mismatches. Calling these locations the editor “decision code” is **OVERSTATED**: the measured gate does not distinguish the three AF Button rows.
   - **§5 — CONFIRMED for surviving outputs.** Output deliverables exist under `work/`. Manifest inputs and sources are referenced material, not newly created outputs. The v1 screenshots were overwritten.

   Findings in §6:

   - **6.1 — CONFIRMED for screenshots / SUPPORTED-NOT-INDEPENDENT for execution.** Both priority choosers visibly contain two options. Logs record `0x610e2536` from `0x610cdf98`.
   - **6.2 — SUPPORTED-NOT-INDEPENDENT.** `trace-open-a7.jsonl` records no `FUN_610cdebf` entries for `0x3D6F`; screenshots show the AF Button page remaining visible.
   - **6.3 — SUPPORTED-NOT-INDEPENDENT.** `trace-build-a8.jsonl` records D0 `15727`, D1 `10`, A1 `0x6158ba1c`. This occurs during a page refresh that also rebuilds the stock rows; it does not establish chooser dispatch.
   - **6.4 — CONFIRMED statically / SUPPORTED-NOT-INDEPENDENT dynamically.** Listing bytes confirm comparisons at `0x611f7074`, `0x611f7078` and `0x611f707c`. Logs report `+0x34 = 0` and return 0 for 2154, 2155 and `0x3D6F`. This excludes that comparison as their split. An equivalent decision-value measurement for C-AF Area is missing.
   - **6.5 — SUPPORTED-NOT-INDEPENDENT for the tested combinations.** Four logs end `opened:false`, with empty setter arrays and profile 0. Changes are cumulative combinations, not four isolated causal tests. The v3 count and v4 descriptor writes appear in source but lack corresponding value readbacks in JSONL. Original v1 screenshots no longer survive.
   - **6.6 — SUPPORTED-NOT-INDEPENDENT.** The diagnostic records A0 `0x6031e9a0`, while D0 remains `0x3d6f`.
   - **6.7 — CONFIRMED for rendering / SUPPORTED-NOT-INDEPENDENT for execution.** Page 28 shows three AF Target Mode rows with All grids. Before/after screenshots match. The script loads stock firmware without the task overlay and labels its source/page redirects `EMULATOR-ONLY reference construction`.
   - **6.8 — CONFIRMED for rendering / SUPPORTED-NOT-INDEPENDENT for execution.** Page 29 similarly shows three AF Target Point rows and remains visible after OK. It runs in a separate stock session with labelled reference construction.
   - **6.9 — CONFIRMED as recorded snapshot differences; OVERSTATED as write coverage.** Both logs show only `0x1dd1` indices 0 and 1 changing, `3,3 → 27,39`, across the entire navigation interval. AF Home snapshots match. There is no settings-write trace or immediately-before-OK snapshot, so “no AF Home write” and exhaustive write isolation are unproved. The `ORIGINALLY` IDs have UI getter readbacks without demonstrated backing-cell coverage.
   - **6.10 — CONFIRMED for handler keys; OVERSTATED for route absence.** Input bytes confirm no page-specific handler key for 27, 28 or 29. Pointer searches and the direct-call scan support “no native route found in these searches.” They do not exclude computed IDs, indirect callers or context-dependent routes. The script’s “title-label search” prints page title records rather than searching the complete first-level menu for matching routes.
   - **6.11 — CONFIRMED for the screen / SUPPORTED-NOT-INDEPENDENT for execution.** C-AF Area opens a two-option chooser and enters the recorded refresh path.
   - **6.12 — CONFIRMED literally; its proposed interpretation is WRONG.** The listed kinds match `611c7785.c`; all ten option records independently decode as kind 12. However, `FUN_611c7785` searches for one matching value and decodes that record. `FUN_611c7894` is a 26-byte byte-to-halfword buffer-copy routine, confirmed by decompilation, assembly and input bytes. It contains no editor construction, key handling or setter call.
   - **6.13 — SUPPORTED-NOT-INDEPENDENT for BLOCKED; UNSUPPORTED for demonstrated code feasibility.** Four failed configurations justify stopping Phase B. “Possible with code” remains a qualified design hypothesis, not an established route. The proposed buffer-copy branch does not supply evidence for it.
   - **6.14 — SUPPORTED-NOT-INDEPENDENT within the measured context.** Native OK on the first row of the constructed page 29 does not open the target editor. Its reads/writes and zone-type selection remain unmeasured. This does not establish general impossibility.

   Remaining numbered sections:

   - **§7 — CONFIRMED for most artifact references; OVERSTATED for conclusions 9, 10 and 13.** Those references support snapshots, bounded searches and failed trials, respectively.
   - **§8 — CONFIRMED for failed prototypes and skipped acceptance; UNSUPPORTED for “No AF Home write.”** No ten-option chooser opened, so confirm/store and cancel behavior were not exercised. No qualifying acceptance pair, equivalent control sequence, paired regression renders, native-save stores or byte-by-byte persistence comparison exists. Skipping acceptance follows brief §4.
   - **§9 — OVERSTATED in parts.** Item 2’s broad statement that `0x3D6F` does not enter the `0x610e` family is **WRONG**: `trace-a1.jsonl` records entries including `0x610e5fe1` and `0x610e615c`. The supported distinction concerns the specific chooser/refresh path. Items 9, 10 and 13 inherit the qualifications above.
   - **§10 — CONFIRMED as disclosure of missing dispatch analysis; WRONG about the remaining question for `FUN_611c7894`.** Its supplied implementation already shows buffer conversion, not a ten-option editor. The actual chooser creation/selection decision remains unidentified.
   - **§11 — UNSUPPORTED as the proposed editor solution.** Labelling the hook experimental is appropriate, but routing kind 12 into a character-copy routine has no demonstrated connection to opening a chooser or committing `0x3D6F`.
   - **§12 — CONFIRMED for the disclosed overwrite and skipped acceptance; incomplete as a deviation list.** It omits missing command exit records, incomplete decision-point identification, incomplete write tracing and inconsistent emulator-only labelling.

5. **Contradictions with established findings**:

   Core row layout, option values and section placement agree with T3a `decision.md`, “Established,” and `AFON-MENU-RESEARCH.md` §6.

   Result §9(2)’s blanket absence from the `0x610e` family conflicts with its own trace. The proposed spawning interpretation conflicts with the supplied `611c7785.c` and `611c7894.c` implementations. `PROJECT-STATE.md` §2 requires partial observations to remain distinguished from complete proof; code feasibility remains a hypothesis here.

6. **Alternative explanations** not excluded by the evidence.

   - Stock chooser selection may depend on registration, input routing or context upstream of the observed refresh functions.
   - `FUN_61204065` receiving the ten-record list may merely explain rendering the row’s current value.
   - Constructing pages 28/29 through page 27’s surrounding context may omit configuration supplied by another route.
   - Equal endpoint snapshots permit transient writes and changes to unverified backing cells.
   - Four failed data combinations do not exclude other data/model configurations or establish a particular code solution.

7. **Scope and safety:** No task-specific writes outside `work/` or emulator-source modifications are evidenced. Isolation audit reports zero violations; the emulator diff matches its initial pin after normalization.

   All **140 distinct overlay bytes** have correct offsets and stock values `FF`. Every address lies in uncompressed section 1, `0x6031e920`–`0x6031e9b3`; none lies in sections 6 or 7. Section descriptors independently identify only sections 6 and 7 as compressed. Runtime redirects are separate from the overlay.

   Behavior-changing value hooks carry `EMULATOR-ONLY` code labels, and page reference construction is labelled appropriately. Labelling is nevertheless incomplete across records: several modified-session logs use only `"hook":"observe"`; `link-diag-a9.jsonl` lacks emulator-only labels on its descriptor-link writes. Observer return hooks use `obs-ret-*` names.

   Command recording fails brief §0: no `.exit` files exist under `work/out/cmd/`; the first two static commands lack required stdout/stderr records there. `write_manifest_a11.py` hard-codes subprocess exits. Copying v2 frames under new names does not recover overwritten v1 frames.

   No firmware image, component or SD-file construction, persistence run or hardware recommendation was found. This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Mark Phase A’s editor-selection decision point incomplete. Supply the actual distinguishing decision and values for all four cases before treating dispatch analysis as complete; preserve the four-prototype limit.
   2. Withdraw the spawning interpretation of `FUN_611c7894` and revise the proposed hook accordingly. Keep R1 code feasibility qualified and BLOCKED.
   3. Replace categorical route-absence and no-write statements with bounded-search and endpoint-readback statements. Explicitly identify missing write tracing and unresolved backing cells.
   4. Correct result §9(2) to name the specific chooser path rather than the entire `0x610e` family.
   5. Mark command recording and v1 screenshot preservation incomplete. Do not reconstruct lost output or exits. Preserve actual stdout, stderr and subprocess exits for future commands, and retain the overwrite disclosure.
   6. Provide file-specific labelling errata for modified-session logs and descriptor-link writes; distinguish observation hooks from behavior-changing hooks.

   Optional improvements: Record immediate pre/post-OK snapshots, every settings write, and explicit prototype-change readbacks. Distinguish row refresh, chooser construction, input focus and commit in subsequent instrumentation.