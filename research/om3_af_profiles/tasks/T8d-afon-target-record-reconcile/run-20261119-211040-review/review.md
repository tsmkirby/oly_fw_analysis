# T8d review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The writer rule, saved-bank feed, leak trace, three integrated press/release comparisons, normal-edit parity and seven zone press records are supported. `proof-t8d10.jsonl` ends `ok:true`.

   Required checks remain incomplete. Writer activation still depends on runner arming; full state assertions do not run after every key edge; zone-control commits lack independent identity checks; execution-time inventories omit imported modules and required baselines.

2. **Baseline checked:** Read `TASK.md`, `brief.md`, `review-brief.md`, `templates/review.md`, `audit/previous-review.md`, `work/result.md`, manifest and seal completely. Inspected listings, hooks, runners, generator, checker, generated tables, JSONL logs, screenshots, command inventories and audit records.

   Research checked: T8c decision and both specified reviews completely; T6 design completely; T8c correction runner, hook, `proof6.jsonl` and slot evidence; T3h face mapping; T4 image-section reconstruction method.

   Used PowerShell for independent hashes, image-byte checks, section reconstruction and record comparisons. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Recomputed every file-backed manifest entry and recorded byte length:

   - `inputs[0–3]`: **MATCH**, each entry.
   - `sources[0–35]`: **MATCH**, each entry.
   - `outputs[0–540]`: **MATCH**, each entry.
   - Separate `brief_sha256`: **MATCH**.
   - Manifest against `seal-t8d.json`: **MATCH**, digest `57e80e5ededa2d1600a3e8c23c408ed837433b2bce2b6b8d7494b21e2c854b7d`, length 103,915.
   - Import and command inventories: all 120 file-hash records **MATCH**.
   - Session logs: all 527 embedded file-hash records **MATCH**.
   - External audit harvest: all 543 entries **MATCH**.
   - Final proof record seals: all 240 **MATCH**.
   - Sweep and final zone record seals: all 21 **MATCH**.
   - Initial audit input-image hashes: both **MATCH**.
   - Normalized emulator diff: **MATCH** to inherited digest `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   The initial audit brief digest differs from the amended brief; the current manifest and correction audit agree. No content-hash mismatch was found. Matching retained hashes does not establish complete execution-time coverage.

4. **Claim-by-claim:**

   Correction status under brief §5:

   - **Item 1 — DONE.** The writer’s `0x88b2[0]` feed reads mirror `0x5962[bank()]`. `bank()` and `initMirror()` are textually unchanged from the accepted T8c hook.
   - **Item 2 — NOT DONE in full.** The runner no longer calls `applyWriter()` directly, and the installed settle wrapper invokes it. However, `armPress` starts false and only the runner sets it. The reconcile observer requires `armPress && builderThisEntry`; installing the hook alone therefore never schedules the writer. See `hook_t8d_writer9.mjs:89,401,458` and `proof_t8d10.mjs:216–218`.
   - **Item 3 — DONE for the exercised sequence.** The trace captures value 292 written to live `0x5962[0]` at `0x60063534`, with alias store `0x60063536`, setter return `0x604193c7` and caller-chain evidence. The labelled gate prevents the observed pose leak without changing the 526 expectation. Both final pose checks retain zero live stores.
   - **Item 4 — NOT DONE in full.** All banks and all 71 mirror bytes are checked at integrated candidate snapshots. For nine candidate `action:"key"` rows, snapshots occur only after both down and up; the intermediate edge checks only Subject Detect. Zone operations do not perform the complete half-press/mirror assertions.
   - **Item 5 — NOT DONE in full.** Integrated declared commits use the pre-session hashed identity table, including K1e’s editor commits. Final K1e zone traversal captures identity and immediately commits without comparing it with an earlier expectation. K2’s six AF-ON edges also omit identity comparisons.
   - **Item 6 — DONE for the listed numerical outcomes.** Custom press comparison, seven-row zone table, return-to-landscape press/release, normal-edit parity and terminal `ok:true` are present. Zone releases are executed but lack retained record comparisons.
   - **Item 7 — NOT DONE in full.** Complete writer/converter listings, corrected 49-slot count and refreshed seal are present. Import/baseline and command inventories remain incomplete. No correction-round script drift was detected in recorded hashes.

   Numbered claims in `result.md`:

   - **§1 — CONFIRMED** for identification, reference definition, environment settings and unchanged named functions; **OVERSTATED** for complete §0 compliance.
   - **§2 — CONFIRMED** for image hashes and pre-session identity hashing. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**. “3262 bytes” should identify 3,262 changed-byte rows; the CSV file is 267,706 bytes.
   - **§3 — SUPPORTED-NOT-INDEPENDENT** for six new experiment versions. Six distinct correction experiment tags are retained; command inventories do not cover every listed operation.
   - **§4 — CONFIRMED** as evidence locations. All 845 submitted disassembly instructions independently match image bytes, including complete writer and converter windows.
   - **§5 — CONFIRMED** for retained files and unchanged `bank()`/`initMirror()`; **OVERSTATED** as a complete installed behavior.
   - **§7 — CONFIRMED** as evidence pointers, subject to the invocation and assertion limitations above.
   - **§8 — CONFIRMED** for recorded numerical outcomes and terminal success; **OVERSTATED** for universal after-every-key coverage.
   - **§9 — CONFIRMED** for the new measurements. The writer/converter divergence corrects T6’s proposed equivalence; it does not confirm that equivalence.
   - **§10 — WRONG.** Required invocation, assertion, identity and inventory checks remain open.
   - **§11 — UNSUPPORTED** as a completion recommendation.
   - **§12 — WRONG** in claiming no deviations.

   Findings under §6:

   - **6.1 — CONFIRMED**, conditional on the shadow-adjust branch not replacing inputs. The writer reads the seven reported cells, forces position for kind 2 and clears priority as stated. Swept rows record `flagBe=0`, `adjustDelta=0`.
   - **6.2 — CONFIRMED.** Descriptor, value-table and face bytes match the image and agree with established T3h glyph mapping.
   - **6.3 — CONFIRMED as harness observations.** Independently reproduced all three press equalities and all three release equalities to the candidate’s preceding S1, cross-checked with K2. Autonomous invocation remains unestablished.
   - **6.4 — CONFIRMED for the captured leak and final exercised poses.** Broader correctness of the reset-sensitive refusal rule is **SUPPORTED-NOT-INDEPENDENT**.
   - **6.5 — CONFIRMED numerically.** Independently checked 280 candidate half-cell array comparisons and seven zone press comparisons; no disagreement.
   - **6.6 — CONFIRMED.** There are 49 covered ROM disagreements, one uncovered slot and 13 all-zero slots.
   - **6.7 — OVERSTATED.** Full state checks cover retained integrated snapshots, rather than every edge and zone operation. Identity checks cover declared integrated commits, rather than every control commit.

   All 28 declared exit matches independently resolve to control-role sequences with identical ordered edge semantics. The six pre-change difference lists also independently match the logs.

5. **Contradictions with established findings:**

   - Runner-dependent writer activation falls short of T8d brief §5 item 2’s installed invocation requirement.
   - Incomplete edge assertions conflict with T8d brief §5 item 4.
   - Unchecked zone-control commits conflict with T8d brief §5 item 5 and inherited T8c “Identity before commit.”
   - Incomplete execution-time inventories conflict with T8d §§0, 1.5 and §5 item 7.

   Saved-bank mapping and reset initialization agree with the T8c decision. Overlay-backed K1e is authorized by its coordinator ruling 1.

6. **Alternative explanations** not excluded by the evidence:

   - The successful writer records depend on runner arming and the settle-wrapper consumer replacement.
   - State could change after key-down and be restored by key-up without failing the retained snapshot.
   - Seeded zone inputs establish writer parity but do not establish editor-driven mirror updates for every zone.
   - The pose gate may suppress legitimate copier activity in untested non-reset states.
   - Matching retained hashes cannot establish the execution contents of omitted modules or commands.

7. **Scope and safety:** Audit reports zero isolation violations and zero task-time checkout changes. The emulator diff matches the inherited baseline.

   Independently reconstructed section ranges from the image and checked all 3,262 overlay rows, stock bytes, offsets and section labels: counts are 1,308/95/1,856/3 in sections 1/2/4/7. Only `0x610bf5e3–0x610bf5e5` occupy section 7; none occupy section 6.

   Changes are labelled `EMULATOR-ONLY`. No firmware-image construction, storage decision or hardware recommendation was found. Recorded execution hashes show no demonstrated correction-round overwrite; incomplete inventories prevent full certification.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Derive writer activation from the installed AF-ON path itself, eliminating runner-only `armPress` dependence.
   2. Check all half-press banks and the full 71-byte mirror after every required key edge, including zone operations. Retain zone release comparisons and assert Subject Detect after custom release.
   3. Compare independently hashed identity expectations before every control and candidate commit, including K1e zone traversal; retain expected/actual success evidence.
   4. Complete execution-time import closure and baseline inventories. Current records omit directly imported `emu/src/lab/menu.mjs`, transitive modules such as `emu/src/fw/models.mjs`, and required T8c runner/hook/`proof6.jsonl` baselines. Inventory the remaining commands.
   5. Correct completion claims and CSV terminology, preserve new versions under new filenames, and refresh the manifest and seal. Obtain coordinator authorization before further emulator experiments; the six new versions are spent.

   Optional improvements: retain writer scheduling and saved-bank feed values in final success rows, and test the pose gate after a non-reset normal edit.