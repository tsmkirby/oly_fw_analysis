# T8 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Static integration is confirmed. Integrated acceptance remains unproven: the reference run ends `ok:false`, the final commit produces no fresh E, and neither candidate runs. The result honestly reports those boundaries. The table checker and candidate harness also retain defects that must be corrected before acceptance.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `audit/previous-review.md`, `templates/review.md`, updated `work/result.md`, manifest, supplement, configuration, checker, tables, runners, reference record, diagnostic records, JSONL logs, command records, stores and audit artifacts.

   Research checked: inherited briefs’ §0 and applicable correction requirements; T6 and T3m promoted decisions, T6 design and save implementation, T3m profile layout and restore implementation, T3l decision, both specified previous Sol reviews, and `PROJECT-STATE` §3.

   Used PowerShell for independent hashing, image-section reconstruction, store decoding and reference/log comparisons. All 566 PNGs decode successfully; visually inspected stock page 27, the highlighted AF Target Mode row and its Single chooser. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Every file-backed SHA-256 and recorded byte length in these groups was recomputed:

   - Manifest `inputs[0–4]`: **MATCH**.
   - Manifest `sources[0–14]`: **MATCH**.
   - Manifest `outputs[0–777]`: **MATCH**.
   - Manifest `commands`: all 142 script/file records **MATCH**.
   - Manifest `dynamic_imports`: all 1,600 inventory/module records **MATCH**.
   - Manifest `reference_v1`: **MATCH**.
   - Supplement: all 152 file-backed records **MATCH**.
   - Eleven standalone import inventories: all 1,589 module records **MATCH**.
   - Command exit records: all 28 executed-script records and all 31 wrapper digests **MATCH**.
   - External audit harvest: all 788 records **MATCH**, including the supplement and final command outputs.
   - Current manifest’s separate brief digest: **MATCH**, `4bef84b2…`.
   - Reference sidecar and manifest digest: **MATCH**, `16a103fb5acbd0757b1c405ce2d0c0148d1b242b194753ccd504457d566449c8`.
   - T7 `pose.mjs`: **MATCH**, `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`.
   - Normalized emulator diff: **MATCH** to inherited baseline `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.
   - Initial `audit/manifest-in.json` input-image records: **MATCH**. Its historical brief digest `148d9149…` is **MISMATCH against the current correction brief**; the current manifest and run audit agree on `4bef84b2…`.

   Integrity passes for the submitted evidence. Inventory completeness does not: consumed historical JSONL inputs and required research documents remain omitted. The submitted manifest/supplement omit `31.out`, `31.err` and `31.exit`; the external audit independently seals them, satisfying the external-final-seal portion of §5.4.

4. **Claim-by-claim:**

   Correction status under brief §5:

   - **1 — NOT DONE.** Command 19 finishes before command 20 and reports 51 unique steps, zero problems. C1 literals now use type 6 and `[5,7]`; bank-1 literals survive the EXIF-6 edit; `c-s1` dispatches a real S1 key following an editor step. However, the checker requires only top-level metadata, not the complete expected state. No table step contains an explicit title expectation. It does not validate matched exits: `e-ok`, `p-menu` and `c-s1` are candidate-only. Repeated dial and save-navigation keys remain hidden inside procedural steps.
   - **2 — BLOCKED (honestly reported), with harness deviations.** Both controls reach their recorded reopens in t8r5. All 70 reference rows match their JSONL observations, and the listed Subject Detect/mirror/flag/K1-edge invariants independently hold. Screenshot errors are fatal without fallback. Save navigation uses bounded identity checks and asserts AF Target Mode before commit. The baseline is store log 2, witness events 2, queue 0. Only one fresh posted M follows: 262,144 bytes, captured hash matching the store, callback status 0. No fresh E exists. K1 skips the unavailable AF Target Mode commit. Additional pose assertions exceed the restricted reference-invariant list, and r5 continues after the failed save assertion. The reference is hashed immediately after writing; its manifest entry is added by command 30.
   - **3 — NOT DONE (honestly reported).** Neither candidate, candidate reopen/reinitialization, nor candidate store comparison executes. No terminal acceptance `ok:true` exists. Independent decoding of either candidate’s store is impossible because neither file exists.
   - **4 — NOT DONE.** Executed script contents match their execution hashes; misleading preset naming is corrected; numerical sections and external final sealing pass. Consumed-input inventory remains incomplete. Version accounting is unsupported: commands 27 and 28 are two additional emulator experiments using distinct diagnostic scripts. The brief grants no diagnostic exemption, so five reference versions plus these two programs do not establish “one version remains.”

   Numbered sections in `result.md`:

   - **§1 — CONFIRMED.** Correct task and correction-round identification.
   - **§2 — CONFIRMED** for named baselines and hashes; historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** for command outcomes and unreached candidates; **OVERSTATED** for excluding both diagnostics from the version budget.
   - **§4 — CONFIRMED** as implementation references.
   - **§5 — OVERSTATED.** The reference hash is correct, but everything under `work/` is not listed in the manifest.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications here.
   - **§8 — CONFIRMED** for failed outcomes and unexecuted acceptance; checker PASS establishes only its limited checks.
   - **§9 — CONFIRMED** for the narrowed observations; exhaustive novelty claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§10 — CONFIRMED** for the disclosed experimental gaps.
   - **§11 — CONFIRMED** that the fresh-E requirement needs reconciliation; **UNSUPPORTED** that one experiment version remains.
   - **§12 — CONFIRMED** for save failure, K1’s missing commit and unreached candidates; incomplete concerning assertion and version-accounting deviations.

   Findings under §6:

   - **6.1 — CONFIRMED independently.** All 3,262 rows have correct image offsets, stock bytes and numeric sections. Counts are 1,308/95/1,856/3 in sections 1/2/4/7. Combined proposed bytes equal T6’s; T3m differs at exactly 15 `profile-read` bytes. Only `0x610bf5e3–0x610bf5e5` enter section 7; none enter section 6.
   - **6.2 — CONFIRMED** as recorded emulator observations.
   - **6.3 — CONFIRMED.** Positions are 526 → 409 → 292; OK retains the position.
   - **6.4 — CONFIRMED.** Recorded Cross cells agree.
   - **6.5 — CONFIRMED.** Shooting-title hash and retained cells agree.
   - **6.6 — CONFIRMED.** All twelve ordinary K1 edges retain the stated target and 255 ownership/status/enabled values.
   - **6.7 — CONFIRMED.** K2 setup has the stated mirror, zone, flag, Subject Detect and ownership readbacks.
   - **6.8 — CONFIRMED for this recorded path.** Twenty Left presses reach the stated AF page. The recorded header hash is shared by other main-menu pages, so it identifies the AF tab only together with page title/highlight.
   - **6.9 — CONFIRMED.** Screenshots and session-helper source distinguish the stock two-row page from the inherited overlay’s third row.
   - **6.10 — CONFIRMED.** The commit sets zone 1 and produces the fresh posted M with status 0, without fresh E.
   - **6.11 — CONFIRMED** for the two save-log entries already present at `drive()` entry and no additional unposted pair during the measured commit. An exhaustive claim about function calls is **SUPPORTED-NOT-INDEPENDENT**; the diagnostic records saves rather than every call.
   - **6.12 — CONFIRMED independently.** Decoded M banks differ at exactly 65 offsets; E banks differ at zero. Both complete difference lists agree.
   - **6.13 — CONFIRMED as an observation.** K2’s reopened press has owner 2 and target `[14,2,3,0,1,0,1,0,1,0]`; it is not candidate acceptance.

   Remaining candidate-harness defects:

   - `acceptProblems()` skips absent expectations. Its implicit K2 comparison also skips missing rows and null/missing fields; `refField()` fails only for explicitly requested references.
   - Editor steps receive no implicit reference comparison. Their title hash, full half-press state, zone, focus/status and sometimes full mirror are unchecked.
   - Shared-step defaults omit some required fields, including enabled and initial flag/mirror checks.
   - C1 selection and dimension literals are internally improved, but their native editing path is unexecuted. `c-dims` alternates dials on the direct screen rather than demonstrating the accepted custom-size editor route.
   - Save-loop and dial-loop actions lack separate complete assertions after every individual key.
   - Persisted cells are recorded in reference mode, rather than asserted against explicit post-edit expectations.
   - No candidate-derived expected value was found in the revised comparison logic; incomplete and skipped comparisons remain the problem.

   Required behaviors in `PROJECT-STATE` §3:

   - **Stock half-press preservation:** **NOT DEMONSTRATED** for the integrated candidates.
   - **Independent AF-ON type, size and position per orientation:** **NOT DEMONSTRATED**.
   - **AF-ON menu row:** **DEMONSTRATED** for the inherited emulator configuration; integrated editor behavior remains unproven.
   - **AF-ON Subject Detect policy:** **NOT DEMONSTRATED** functionally. Off readback is demonstrated; On is **OUT OF SCOPE**.
   - **Shared S-AF/C-AF behavior:** **NOT DEMONSTRATED** by T8.
   - **AF-ON precedence and release restoration:** **NOT DEMONSTRATED** for the integrated candidates.
   - **Persistence:** **OUT OF SCOPE**, Q7.
   - **Display:** **OUT OF SCOPE**, T9.

5. **Contradictions with established findings:** T6’s promoted README, “Accepted — Save,” describes E/M witnessed at status 0. The new evidence qualifies its timing: `save_v3.mjs` judges the whole log, while T8’s baseline excludes the session-open E/unposted M pair. This supports the correction in result §9.11 without disproving T6’s recorded statuses.

   Continuing after the save failure conflicts with brief §0’s immediate-stop rule. Incomplete assertions conflict with §2.3 and §5.1–3. The diagnostic version exemption has no basis in §0 or §5’s six-version authorization.

6. **Alternative explanations** not excluded by the evidence:

   - Earlier session saves explain E’s presence without a fresh E caused by the final commit.
   - Different K1/K2 navigation and save behavior can explain store differences; those differences do not establish candidate leakage.
   - Accepted components can work separately while their combined getter routing and editor restores interact incorrectly.
   - Literal consistency cannot establish the unexecuted C1, orientation, size or exit paths.
   - K2’s hookless reopened target does not establish the combined candidate’s fallback behavior.

7. **Scope and safety:** Audit reports zero isolation violations and zero allowed checkout changes. The normalized emulator diff matches the inherited baseline. No executed-script content drift is evidenced.

   Behavior changes and setup writes are labelled `EMULATOR-ONLY`. The visible third row is inherited. No firmware-image construction, native-implementation claim, storage decision or hardware recommendation was found. `0x1e71[0]` is read back and asserted as zero throughout the retained reference steps.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Reconcile the fresh-E requirement with the measured session-open save timing before acceptance. Preserve the failed runs and accepted components.
   2. Resolve version accounting with the coordinator before further emulator experiments; include both diagnostic programs.
   3. Complete the static checker and table: require every field, matched exits and an independently expected row after every individual key, including loops and custom-size navigation.
   4. Make missing references/fields fatal throughout candidate comparison. Assert the complete editor state and persisted expectations, and stop immediately on failed assertions.
   5. Complete successful controls, both fresh candidates, every §2.3 item, both reopens with reinitialization, independent full decoded-store comparisons against K2, and terminal `ok:true`.
   6. Inventory omitted consumed inputs and revise result §§3, 5, 11 and 12. Explicitly identify the external audit as the final seal.

   Optional improvements: distinguish structural table checks from complete acceptance checks, and report save-log counts separately from witness-event and callback-completion counts.