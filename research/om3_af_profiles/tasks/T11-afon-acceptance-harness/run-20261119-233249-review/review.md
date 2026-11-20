# T11 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The correction improves inventory registration, writer self-arming, pose protection and zone comparisons. Acceptance remains incomplete: `proof-t11-v2.jsonl` ends `ok:false` at `candidate-af-up`; display A, B, K2 and K1 never started.

   Structural requirements also remain unmet independently of that failure: some state checks validate only shape or type, identity completeness excludes dynamic operations, and the final acceptance gate and scanner lack the required unit coverage.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md` including §6, `templates/review.md`, `audit/previous-review.md`, `work/result.md` and `work/harness.md` completely.

   Research checked: T8d and T9d decisions and their four substantive Sol reviews; T8b’s generated-table decision; the specified T8d proof, writer hook, generator and checker; the specified T9d validation library, seeded runner and reference generator; T8c’s bank/initialization decision and hook; T4’s section-loader and end-selector evidence.

   Inspected current harness implementations, tests, runners, generated table/checker, identity table/seal, import and exit inventories, command records, JSONL logs, selected screenshots, manifest/seal and audit records. Independently checked hashes, image-derived section ranges, numerical comparisons and identity coverage using PowerShell. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Zero-based ranges identify every current manifest entry recomputed, including byte lengths:

   - `inputs[0–149]` — **MATCH**, each entry.
   - `sources[0–49]` — **MATCH**, each entry.
   - `outputs[0–882]` — **MATCH**, each entry.
   - `brief_sha256` — **MATCH**.
   - Manifest seal — **MATCH**: 247,608 bytes, SHA-256 `0eb3e5735fe9cd0cab5847411f4b7d04a5da809550a3d84f5f10b5b2618bf6cc`.
   - Identity seal — **MATCH**: 9,165 bytes, SHA-256 `1865a575c63ee414f387a16d2db586653f6324e967f1a790c87e6a23a48dc24d`.
   - Import-time inventories: 1,751 records — **MATCH**; one historical unit fixture — **MISMATCH**, intentionally modified by its test and correctly reported failed.
   - Exit inventories: all 1,758 file records — **MATCH**.
   - External audit harvest: all 885 entries — **MATCH**.
   - Normalized emulator diff — **MATCH** inherited digest `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   Every current `work/` file is represented, apart from the manifest and its intentionally excluded seal. Hash agreement does not establish complete execution-time coverage: the acceptance inventory omits the identity JSON and seal read by `loadSealed()`.

4. **Claim-by-claim:** Numbered sections in `result.md`:

   - **§1 — CONFIRMED:** task identification, correction-round brief and recorded environment. Runtime-version claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§2 — CONFIRMED** for the named baseline and emulator-only scope. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** for five correction experiment tags, ordering and reported stopping points. Pure-Node PASS claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§4 — CONFIRMED** as source/address identification and the inherited section-7 allowance.
   - **§5 — CONFIRMED:** retained files and current manifest coverage.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications below.
   - **§8 — CONFIRMED** for recorded experiment outcomes and unreached display jobs. **OVERSTATED** if the unit PASS is taken to validate the final acceptance implementation.
   - **§9 — OVERSTATED:** the new mechanisms exist, but universal full-state, identity and inventory guarantees remain incomplete. Recorded Subject Detect values support the narrower exercised-operation claim.
   - **§10 — CONFIRMED** as disclosure of the failed release check and absent display measurements; incomplete concerning structural defects.
   - **§11 — UNSUPPORTED** as a sufficient repair plan. Correcting the release identity alone leaves the structural defects below.
   - **§12 — CONFIRMED** for five processes, stop-on-failure and omitted optional custom test. **OVERSTATED** as a complete deviations account.

   Findings under §6:

   - **6.1 — CONFIRMED:** identity v10 ends `ok:true`, has 55 rows and includes all four previously missing K1e edges. All 13 distinct generated-table identity references exist. This does not establish completeness for dynamic zone/display operations.
   - **6.2 — CONFIRMED as retained observations:** three writer calls, four refusals, and three `fire:true` records associated with owner 0→2. The installed writer has no runner arming flag.
   - **6.3 — CONFIRMED numerically:** independently checked all 14 zone press/release equalities, including centre and custom. Seven zone writer calls are recorded.
   - **6.4 — CONFIRMED:** the proof reaches candidate AF-ON down, then rejects AF-ON up before delivering it because the title differs.
   - **6.5 — CONFIRMED:** no new A/B/K2/K1 display proof exists.
   - **6.6 — OVERSTATED:** comparisons now occur inside the gate, and pose refusal no longer reads `watchArmed`. They do not universally compare every required field against one declared expectation.
   - **6.7 — CONFIRMED:** all five correction-process inventory exits and the registrar probe report `ok:true`.
   - **6.8 — SUPPORTED-NOT-INDEPENDENT** as the explanation for the title difference. The capture points differ as described; post-release behavior was not observed in acceptance.

   Correction-round `brief.md` §6 status:

   - **Item 1 — NOT DONE in full.** Setup cell writes and flag clearing now use the gate, and individual key edges receive comparisons. However, [compare_v3.mjs](/C:/Dev/OM3-tasks/T11-afon-acceptance-harness/ws/work/harness/compare_v3.mjs:59) accepts `seal` fields through length/type checks. `k1eMenuExpect()` permits arbitrary changes to all 63 slots. `stepExpect()` exempts moving position cells without declaring their expected values; control-role `judgeDown()` returns after structural checks. Thus K1e/K2 down-edge position changes need not equal a declared source. Native setup API calls also remain outside the gate. The exposed `press()` method combines input delivery into one comparison.
   - **Item 2 — NOT DONE in full.** The sealed-table check executes before acceptance, and all 16 successful proof identity comparisons retain expected/actual rows. However, `coverageProblems()` traverses only `table.steps`; zone/custom commits are constructed separately in `drive_v10.mjs`. Zone AF-ON releases have no identity approval. [gate_v3.mjs](/C:/Dev/OM3-tasks/T11-afon-acceptance-harness/ws/work/harness/gate_v3.mjs:24) trusts caller-supplied `commitClass`, so an unmarked OK/MENU/AF-ON commit is not refused structurally. Display uses unconditional approval.
   - **Item 3 — DONE for the requested instrumentation separation.** Native issue/publish observers set the pose latch; `decide()` does not read watch state. The unit source tests watch toggles. Independently checked normal-edit half-cell parity and the non-reset post-edit pose snapshot against K2 in identity mode. Sealed acceptance of that case remains unreached.
   - **Item 4 — NOT DONE in full.** Registration precedes task imports, hashing errors propagate, exit handling covers the recorded failures, and image/overlay/reference inputs plus command records were added. The identity table and seal remain outside the execution inventory. Command records omit Node execution arguments, including `--import`, because they retain `process.argv` without `process.execArgv`.
   - **Item 5 — NOT DONE in full.** Shared getter records retain later returns, substitutions are recorded, the 500-call cap is removed, and null/unclosed records fail. However, [test_harness_v2.mjs](/C:/Dev/OM3-tasks/T11-afon-acceptance-harness/ws/work/harness/test_harness_v2.mjs:7) imports `gate_v2`, `compare_v2` and `static_check_v6`; acceptance uses v3/v3/v7. `test_allow_v3` does not exercise the final gate or planted bypasses. Recorder integration remains unexecuted: setup/assertion getter calls enter `orphans`, which are all rejected, and `stamp()` assigns one later sample signature to every unstamped refresh rather than capturing each refresh’s frame.
   - **Item 6 — NOT DONE, honestly reported.** A new identity pass was sealed before acceptance. The T8d proof failed, and all four display proofs are absent. Five new experiment processes were used.
   - **Item 7 — NOT DONE in full.** The failure, absent display jobs and supplemental seal are recorded accurately. `result.md` and `harness.md` still overstate full-state comparison, identity completeness and execution-inventory guarantees.

   Independently confirmed `bank()` and `initMirror()` are textually unchanged from T8c, reader/writer/display share `bank()`, and all 28 declared exit matches retain matching ordered control sequences.

5. **Contradictions with established findings**:

   - Shape-only checks and unconstrained position exceptions conflict with T11 brief §6 item 1 and T8d decision, “Not accepted,” item 2.
   - Partial identity completeness and caller-selected enforcement conflict with T11 §6 item 2 and T8d decision, “Not accepted,” item 3.
   - Omitted execution inputs conflict with T11 §1.1 and §6 item 4.
   - Missing final-version tests conflict with T11 §6 item 5.
   - Failed T8d acceptance and absent display proofs leave T11 §3 and §6 item 6 unmet.
   - Every-refresh seeded evidence remains required by T9d decision, “Coordinator ruling.”

   No contradiction was found with accepted saved-bank mapping, initialization or the authorized overlay-backed K1e definition. The two unresolved T9d mechanism traces remain non-blocking under its ruling.

6. **Alternative explanations** not excluded by the evidence.

   - Exempted or shape-only fields could change incorrectly and still pass.
   - Identity-mode success can include commits that sealed proof mode rejects, as the release failure demonstrates.
   - Custom release equality can follow from planting matching live inputs; a distinct live profile was not tested.
   - The title mismatch may reflect capture timing, but the failed acceptance does not establish the correct post-release identity.
   - Later frame stamping can conceal differences between refreshes.
   - Passing inventory exits cannot establish unchanged contents for omitted non-module inputs.

7. **Scope and safety:** No reviewer writes were made. Audit reports zero isolation violations, unchanged protected workspace/inputs and zero allowed task-time external changes. The emulator diff matches the inherited baseline.

   Independently reconstructed all ten section ranges from image descriptors and the end-selector jump table. All 3,262 overlay rows match image stock bytes, offsets and section labels: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only `0x610bf5e3–0x610bf5e5` occupy section 7; none occupy section 6.

   Actual `0x1e71[0]` getter readbacks are present; all 279 retained identity-v10 state records with that field report zero. No executed-module drift was detected in recorded hashes. Changes are labelled `EMULATOR-ONLY`; no native image construction, storage decision or hardware recommendation was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Replace shape/type-only acceptance and unconstrained slot exceptions with per-operation expected values or explicit preservation. Gate remaining setup mutations and prevent paired delivery from bypassing individual-edge assertions.
   2. Include dynamic zone/custom/display operations in pre-session identity completeness. Enforce commit classification inside the gate and retain every required successful comparison.
   3. Inventory the identity table/seal and all execution inputs; retain Node execution arguments in command records.
   4. Test the exact final gate, comparator, scanner, judge, predicates and integrated recorder. Resolve legitimate out-of-refresh getters and link refresh records to appropriately timed frame samples.
   5. Obtain coordinator authorization before further emulator experiments; the five-version correction allowance is exhausted. Preserve existing versions, resolve the release identity capture, then complete T8d and A/B/K2/K1 proofs with terminal `ok:true`.
   6. Narrow documented guarantees to demonstrated coverage and refresh the manifest/seal after correction.

   Optional improvements: exercise custom release with a distinct live profile, and retain complete mirror bytes and resolved expectation sources in operation records.