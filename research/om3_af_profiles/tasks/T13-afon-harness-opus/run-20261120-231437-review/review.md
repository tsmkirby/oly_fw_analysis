# T13 review (Codex Sol, read-only)

1. **Verdict:** REJECT-RUN

   The identity process failed; no valid identity seal or six-process proof exists. Grok followed the stop rule. The completed T8d and zone sessions provide useful partial evidence, but do not establish acceptance.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, and the manifest completely.

   Inspected both identity output directories, audit records, the accepted round-5 review, relevant earlier reviews, `design_v2.md` §§3–6, and the implementation paths for planning, setup, execution, capture, hooks, recording, completion, and exit verification.

   Compared display construction with T12 `display_v5.mjs` / `setup_v2.mjs`, and T9d `obs_seed_t9d.mjs` / `lib_valid_t9d.mjs::prepare`. Read T9d result §§3, 6–12 and relevant emulator frame, observer, scheduler, trampoline, and SCPU implementations.

3. **Hash verification:** Using zero-based manifest indices:

   - `inputs[0]`: **MATCH**.
   - `outputs[0]` through `outputs[77]`: each **MATCH**, including byte lengths.
   - `sources`: empty.
   - `brief_sha256` and `freeze_sha256`: **MATCH**.

   All **79 manifest file entries** match. All **456 frozen files** match their declared hashes and lengths; the harness directory contains exactly its frozen files.

   The freeze matches the externally recorded digest:

   `819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b`

   All **71 exit-listed output fingerprints** match. The inventory’s **654-entry chain** matches its terminator and `exit.json`. Recorded load/read/open/preread fingerprints agree with the freeze or nonce/freeze extension. The retained implementation report and manifest match their audit fingerprints.

4. **Claim-by-claim:**

   - **Item 1 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** task, brief hash, accepted-code reference, preserved implementation report, and emulator-only scope agree with the records. Historical execution is supported by retained evidence.
   - **Item 2 — CONFIRMED with qualification:** runtime and freeze identities match. “Not re-hashed” should mean no separate manual check by Grok: the launcher/session machinery did hash frozen inputs, and session records include main/resource hashes.
   - **Item 3 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** the recorded identity command, child exit 1, launcher duration **158257 ms**, `ok:false`, `valid:false`, `mode:"real"`, problems list, and incomplete completion summary agree. Shell elapsed time is reported evidence, not independently reproduced.
   - **Item 4 — CONFIRMED:** cited files exist and support the reported failure analysis.
   - **Item 5 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** there are 71 child-output files and six launch files. Audit records report unchanged protected workspace/inputs and zero isolation violations. Their historical creation was not independently observed.
   - **Item 6.1 — CONFIRMED:** identity failed with the stated plan, tag, mode, and child exit.
   - **Item 6.2 — CONFIRMED:** completion contains the exception and empty `inventoryProblems`; stderr carries the same exception.
   - **Item 6.3 — CONFIRMED with a counting correction:** 332 JSONL rows comprise one plan row, **329 planned-operation rows**, and **two writer-count summaries**. Calling all remaining 331 rows operations is inaccurate. Every logged result passes.
   - **Item 6.4 — CONFIRMED:** both writer summaries pass with empty problems; five display setup operations subsequently pass.
   - **Item 6.5 — CONFIRMED as static inference:** the next planned operation is `disp-seed-a-lever`; its 400 ms idle matches the exception stack. There is no failing operation row.
   - **Item 6.6 — CONFIRMED:** quoted exception matches retained stderr.
   - **Item 6.7 — CONFIRMED:** missing completion fields produce the secondary exit-check problems. `executed:0` is the error-summary fallback, not the number of operations actually completed.
   - **Item 6.8 — CONFIRMED:** five session done records report success; `disp-seed-a` reports failure.
   - **Item 6.9 — CONFIRMED:** independently recomputed all 71 output hashes and lengths.
   - **Item 6.10 — CONFIRMED:** conclusions remain emulator-only.
   - **Item 7 — CONFIRMED:** evidence references support the findings with the qualifications above.
   - **Item 8 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** retained identity failure and stopping behavior agree with the report. No later real-process records were found.
   - **Item 9 — CONFIRMED:** fake success and this real failure concern different execution modes.
   - **Item 10 — CONFIRMED as limitations:** completion has no relation aggregate or identity seal; the failing operation is inferred.
   - **Item 11 — CONFIRMED:** stopping was required.
   - **Item 12 — SUPPORTED-NOT-INDEPENDENT:** audit and run evidence support compliance with the one-attempt stop rule and absence of edits.

   **Completed-session verification:** operation IDs match the retained execution list under the identical plan hash and the inspected plan construction:

   - `k1e`: **30/30** operations; 185 logged relation declarations.
   - `k2`: **36/36**; 248 declarations.
   - `candidate`: **50/50**; 435 declarations; writer check requires **3** and passes.
   - `zk1e`: **81/81**; 83 declarations.
   - `zcand`: **127/127**; 143 declarations; writer check requires **7** and passes.

   Thus all **324 operations** of these five roles completed, with no reported relation failure. Their operation rows declare **1094 relations**, plus two passing writer relations. The display session adds five completed operations before the lever exception. This confirms the recorded partial result, not an independent emulator rerun or proof of reproduction.

5. **Contradictions with established findings**:

   None in Grok’s substantive failure report. T9d result §6.7 established successful seeded-A edges using a different setup/instrumentation sequence; this run fails before reaching those edges.

   The earlier code acceptance explicitly left successful real proof outstanding. This failure resolves that uncertainty adversely for the current harness execution.

   A correction that simply removes setup frames or excludes boot refreshes would change `design_v2.md` §4’s display-frame coverage and §4.3’s recorder coverage. Those changes must be explicit and reviewed.

6. **Alternative explanations** not excluded by the evidence.

   **The strongest static explanation is intrusive display instrumentation.**

   - `refresh_v4.mjs` calls `sampleNow` inside its refresh-entry observer. `real_v2.mjs` implements that callback using `frame('boundary')`.
   - `PlaySession.frame` calls `to_boundary`, which can enter `idle_slice` and the scheduler. This is execution, not passive framebuffer inspection.
   - `menu.mjs::observe` subsequently calls `passthrough`, whose implementation single-steps the simulator’s current PC. Nested execution can therefore disturb the context that the observer expected to resume.
   - The trap address **`0xa2100007` is `HLE.call`’s synthetic return sentinel**, where the trampoline contains `0xff`. This is consistent with disturbed harness execution, although the retained records do not establish the complete causal chain.

   Early getter-return instrumentation is another plausible contributor. The combined hook adds return hooks for passthrough getters before bring-up, including getters invoked by assertion captures. Unlike the recorder’s refresh-return branch, this path does not restrict return sites to firmware addresses. Synthetic return sites and nested calls deserve explicit treatment.

   Boundary sampling around each setup operation also changes execution timing. T8d/zone sessions omit that sampling and the display recorder; their success does not isolate overlay, hook, or sampling effects.

   T6 overlay/help settings and absence of pose setup are weaker explanations: successful T9d runs used those choices too. T9d additionally used **250/150 ms** lever/focus waits; T13 uses **400/300 ms**. Their equivalence is unproved.

   Finally, the SCPU line is not itself evidence of an unsupported-command fault: `scpu.mjs` logs that command and returns normally. Likewise, nearby VSC and initialization messages do not establish causation.

7. **Scope and safety:** This review made no writes and ran no test suite, launcher, freeze maker, Ghidra, or OM-Emu.

   Audit evidence reports zero isolation violations and unchanged protected workspace/inputs. Frozen harness files match. No new packaged image, physical-camera action, hardware recommendation, or unapproved emulator modification was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. **Separate display preparation from display instrumentation.** Keep native setup individually gated, but perform it without combined/refresh hooks or advancing frame samples. Follow successful T9d preparation order; explicitly reconcile its 250/150 ms waits with T12’s 400/300 ms. Install display instrumentation after preparation, preferably at T9d’s post-plant/post-seed point. Declare and review any resulting change to setup-frame coverage.
   2. **Make recorder callbacks passive.** Do not run boundary advancement, scheduler operations, or native calls from refresh observers. Preserve timestamped in-window frame evidence through a safe sampling mechanism. Handle assertion getters and synthetic return sites explicitly; do not leave unresolved return records or silently discard required refresh coverage. Merely delaying the existing unsafe callback is insufficient.
   3. **Version and validate the correction before another run.** Add tests covering actual setup ordering, absence of advancing observer calls, and getter-return handling. Regenerate fingerprints, freeze, manifest, and external digest. Preserve this failed run; obtain the coordinator’s written authorization before any further emulator process. A corrected identity and the remaining five processes must succeed before accepting the proof.

   Optional improvements: retain the active operation ID and partial counters on exception; persist partial recorder evidence on failure; correct the report’s 331-operation wording to 329 operations plus two writer summaries.