# T12 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The retained tests exercise the final module versions, and all manifest and freeze hashes match. However, the closed checklist remains incomplete: setup mutations are grouped under one comparison, display setup omits frame comparisons, commit approval occurs after delivery, inventory coverage is incomplete, and recorder integration remains defective.

   No tests, OM-Emu, Ghidra or Java were run during this review. No files were changed.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md` and `work/harness.md` completely.

   Research checked: the T11 decision and both specified T11 reviews; T11 brief §1.2 and correction requirements; the accepted T11 hook, predicates, state and table; identity-v10 records and seal. Inspected the final harness, tests, retained outputs, T13 runners, freeze, manifest/seal, command records and audit. Read relevant emulator/session APIs as source only.

   Independently verified that all 279 declared operation rows reproduce their cited T11 source values.

3. **Hash verification:** Zero-based ranges identify every manifest and freeze entry recomputed, including recorded byte lengths:

   - Manifest `inputs[0–6]` — **MATCH**, each entry.
   - Manifest `sources[0–4]` — **MATCH**, each entry.
   - Manifest `outputs[0–50]` — **MATCH**, each entry.
   - `brief_sha256` — **MATCH**.
   - Manifest seal — **MATCH**: 15,718 bytes, SHA-256 `a9343ae0bc03755911ffb49fd65d4b75cd9d6d7eb3a317c80fa6e7e3bfcdcb30`.
   - Freeze `files[0–31]` — **MATCH**, each entry.
   - Both inventory JSONL files: all 21 file records — **MATCH**.
   - Both exit inventories: all 21 file records — **MATCH**.
   - External audit harvest: all 53 entries — **MATCH**.
   - Inherited identity-v10 seal — **MATCH**: 9,165 bytes, SHA-256 `1865a575c63ee414f387a16d2db586653f6324e967f1a790c87e6a23a48dc24d`.
   - Accepted hook, predicates, state and table copies — **MATCH**, byte-for-byte.
   - Normalized emulator diff — **MATCH** inherited digest `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   Hash agreement establishes integrity of listed files, not completeness of the lists.

4. **Claim-by-claim:** Numbered claims in `result.md`:

   - **§1 — CONFIRMED** for task identification and absence of prohibited commands in retained records. Absolute absence of unrecorded processes is **SUPPORTED-NOT-INDEPENDENT**; the audit is not a process trace.
   - **§2 — CONFIRMED** for baseline paths, image/resource hashes and unchanged emulator diff. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** for the retained implementation files and test source. Execution history and reported PASS are **SUPPORTED-NOT-INDEPENDENT**. The statement that `check_ids_v1.mjs` checks every driver ID is **WRONG**: it checks a hand-selected list.
   - **§4 — CONFIRMED** for the source-oriented scope and absence of new disassembly.
   - **§5 — OVERSTATED**: the manifest covers current outputs, and the freeze contains 32 matching entries, but it omits files T13 imports dynamically.
   - **§6.1 — CONFIRMED**: the complete combined hook is byte-identical to the accepted T11 file. `bank()`, `initMirror()`, writer self-arming, pose latch and display substitution are unchanged.
   - **§6.2 — CONFIRMED** for the three planted comparison failures and declared coverage of `candidate-af-up`; **OVERSTATED** as universal full-state coverage.
   - **§6.3 — CONFIRMED** for removal of paired `press()` and the listed planted scanner checks; **OVERSTATED** as rejection of every bypass form.
   - **§6.4 — CONFIRMED** for classification of OK and post-key/post-settle identity capture. **OVERSTATED** as refusal before delivery: approval follows the mutation.
   - **§6.5 — CONFIRMED** for the three named coverage checks. This establishes those checks, not independent completeness of the entire operation plan.
   - **§6.6 — CONFIRMED** by unchanged predicate/hook source and the retained watch-toggle and judge checks.
   - **§6.7 — OVERSTATED**: the test demonstrates record storage and timestamp filtering, but not functioning recorder integration with the display runner.
   - **§6.8 — CONFIRMED** for probe command arguments, read inventory and retained throw-path exit report. Complete session inventory remains unestablished.
   - **§6.9 — CONFIRMED** for runner existence, matching hashes and no runner execution in retained records.
   - **§7 — CONFIRMED** as evidence pointers, subject to these qualifications.
   - **§8 — SUPPORTED-NOT-INDEPENDENT** for execution outcomes. Source confirms v4 adds the fake `passthrough()` missing from v3 and imports the final versions.
   - **§9 — OVERSTATED**: findings 2–8 do not close all assigned checklist requirements.
   - **§10 — CONFIRMED** as disclosure of unrun proofs and inherited uncertainties; incomplete concerning the defects below.
   - **§11 — UNSUPPORTED** as an immediately usable frozen handoff.
   - **§12 — WRONG**: checklist deviations remain.

   Closed checklist status:

   - **Item 1 — NOT DONE.** Value comparisons replace the previous seal/type checks, and individual ordinary key edges are gated. However, `setup_v1.mjs:3–12` performs bring-up, lever input and multiple native calls within one `gate.act()` comparison (`drive_v11.mjs:120`, `display_v3.mjs:150`). Intermediate setup mutations receive no individual comparison. Display setup/setter/seed operations supply no frame callback; `gate_v4.mjs:42` captures a null before-frame, and `state_v1.mjs:70` retains null without a supplied frame. Thus their frame preservation checks compare null with null. The scanner also misses direct forms such as `ctx.s.key('up', 'down')` and `ctx.l.sim.u8(address, value)`; its patterns cover neither form.

   - **Item 2 — NOT DONE.** Static, zone, custom and display identity specifications exist, release capture occurs after settle, and successful identity records retain expected/actual. But [gate_v4.mjs](C:/Dev/OM3-tasks/T12-afon-harness-completion/ws/work/harness/gate_v4.mjs:46) executes `fn()` before checking approval at line 59. A missing sealed row therefore rejects only after sending the commit. The unmarked-commit test uses a no-op action and a mocked refusal, so it does not verify withholding input.

   - **Item 3 — NOT DONE.** `argv` and `execArgv` are retained; `loadSealed()` inventories identity JSON and seal through `readListed()`. However, display reads the T6 overlay selected by `lib_valid_t9d.mjs:42`, while `NON_MODULE` lists only the T8 combined overlay. The session wrapper reads that T6 CSV directly, without registering it for the exit comparison. Emulator backing files read through `loadBlock()`/`loadNand()` likewise escape this inventory. Additionally, registrar exit handlers are installed after initial hashing and loader registration, so failures during that initialization bypass its exit check.

   - **Item 4 — NOT DONE.** Tests target the exact final gate, comparator, scanner, judge, predicates, recorder, inventory and coverage modules. Most requested negative cases exist. Recorder integration is still untested and defective: during `phase === 'edges'`, both category callbacks return null (`display_v3.mjs:116,120`), including for the gate’s own out-of-refresh `0x1e71` getter. Those legitimate assertion calls become rejected orphans. Frame samples are taken after synchronous idle slices, with no capture inside each native refresh. The unit test instead supplies retrospective timestamps after closing its fake windows (`test_harness_v4.mjs:247,254`). Its “passthrough return” is already populated before recording, and `hookGetter` is disabled, so actual return-hook capture is not tested.

   - **Item 5 — NOT DONE.** Result, documentation, manifest, external seal and six unrun runners exist; a retained static-check PASS exists. Freeze completeness fails: `write_freeze_v2.mjs:66` explicitly skips `om-emu/`, and its literal-import traversal misses computed imports. For example, T13 directly imports `om-emu/emu/src/fw/model.mjs`, menu/display modules and PNG helpers absent from the freeze. Documentation consequently overstates readiness and demonstrated recorder guarantees.

   **OUTSIDE-CHECKLIST:** The custom-zone driver calls `gate.mode()` at `drive_v11.mjs:374`, but no caller binds `bindMode()`. `bindWriterSetter()` binds only the setter. The gate therefore throws `mode is not bound` when that step is reached. **Would invalidate a T13 proof: yes**, by preventing completion. Reported separately for coordinator ruling; this finding does not determine the checklist verdict.

5. **Contradictions with established findings**:

   - Grouped setup comparisons and omitted display setup frames conflict with T12 brief §1 item 1 and T11 brief §1.2.
   - Post-delivery identity refusal conflicts with T11 brief §1.3’s requirement to refuse sending a commit without its expectation, carried into T12 §1 item 2.
   - Missing non-module inventory and incomplete initialization exit coverage conflict with T12 §1 item 3.
   - Recorder integration gaps conflict with T12 §1 item 4.
   - The incomplete freeze conflicts with T12 §1 item 5.

   No contradiction was found with the accepted hook behavior. Both inherited T9d mechanism uncertainties remain non-blocking.

6. **Alternative explanations** not excluded by the evidence.

   - An intermediate setup mutation could corrupt state and a later mutation restore it before the single comparison.
   - Null frame preservation could conceal display changes during setup.
   - A commit could execute before discovering that its identity row is absent.
   - Passing synthetic recorder tests could coexist with orphaned assertion getters and unstamped real refreshes.
   - Matching listed hashes cannot establish unchanged contents for omitted execution inputs or imports.

7. **Scope and safety:** No reviewer writes or executable tests were performed. Retained command records contain only pure-Node work and probes; no OM-Emu, Ghidra or Java launch appears. The T13 runners are unrun according to those records.

   Audit reports zero isolation violations, unchanged protected workspace/inputs and zero allowed external changes. The emulator diff matches the inherited baseline. No native image construction, storage decision or hardware recommendation was found. Relevant experimental changes retain `EMULATOR-ONLY` labels.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Compare state after each setup mutation; capture actual before/after frames for every display operation. Extend scanner coverage to remaining raw input/write forms.
   2. Validate required sealed-row presence before delivering a commit; retain post-key identity comparison. Test that missing rows result in zero delivered inputs.
   3. Inventory every non-module session input at read time and compare it at exit. Install exit handling before fallible initialization.
   4. Categorize assertion getters explicitly and capture a frame within each refresh window. Test actual return-hook completion and the display runner’s recorder integration using a fake emulator.
   5. Freeze the complete import set, including computed imports and emulator dependencies. Narrow documentation to demonstrated guarantees and regenerate manifest/seal after corrections.

   Optional improvements: generate operation-ID and identity coverage checks from the actual operation definitions rather than selected examples. Obtain the coordinator’s ruling on the separately reported unbound mode implementation before T13.