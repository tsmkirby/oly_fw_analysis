# T13 review (Codex Sol, read-only)

1. **Verdict:** REJECT-CODE

   V4 is not ready for another Grok run-only stage. The display preparation order is corrected, but the claimed passive sampling still advances emulator execution. Internal link getters also remain exposed to synthetic return-site recording. The retained tests do not exercise these paths faithfully.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the manifest, and `audit/previous-review.md` completely.

   Inspected all new v4 implementation modules and their differences from the previously accepted versions, affected reused modules, final test records, command records, fake/capture completions, freeze, and audit evidence.

   Compared preparation and hook behavior with T12 `drive_v12.mjs`, `display_v5.mjs`, `setup_v2.mjs`, accepted `afon_hooks_v7.mjs` and `refresh_v4.mjs`, and T9d `obs_seed_t9d.mjs` / `lib_valid_t9d.mjs`. Checked relevant emulator frame, composition, observer, scheduler, and native-call implementations. Read `design_v2.md` §§3–6 and the retained v3 acceptance.

   This was a static review using PowerShell reads, comparisons, parsing, and hashing. An optional read-only `node26` inspection could not start because that command was unavailable.

3. **Hash verification:** Using zero-based manifest indices:

   - `inputs[0]` through `inputs[416]`: each **MATCH**.
   - `sources[0]` through `sources[57]`: each **MATCH**.
   - `outputs[0]` through `outputs[468]`: each **MATCH**.
   - `brief_sha256`, `design_sha256`, `freeze_sha256`, and `result_sha256`: each **MATCH**.

   All **944 manifest file entries** match their hashes and declared byte lengths. All **466 frozen files** match. Each of the four frozen directories contains exactly its listed files.

   The freeze matches the external digest:

   `4975d34d3d96930a2f570d2988b9a6cea5e32b1e8e51cd74f787a166982c3b0e`

   All **58 test-start source fingerprints** match both submitted files and retained scratch copies. The two final test-result copies are identical. These checks establish artifact consistency, not test adequacy.

4. **Claim-by-claim:**

   - **Item 1 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** the trigger, partial completed-session counts, failure location, previous rejection, and preserved evidence agree with the retained review and records. Historical emulator execution was not independently repeated.

   - **Item 2.1 — CONFIRMED with qualification:** `plan_v2.mjs` places nine display setup operations before plants, links, seed, installation, preparation, and edges. Display lever/focus waits are 250/150 ms; T8d/zone retain 400/300 ms. Display setup frames are explicitly removed. However, the claimed passive plant/hold/seed samples are not passive.

   - **Item 2.2 — WRONG in material respects:**
     - `real_v3.mjs:106` calls `ctx.s.frame('now')`.
     - The pinned emulator’s `play.mjs:1748–1760` recognizes only `'boundary'` specially. Every other policy calls `lab.compose(dev, true, raw)`.
     - `display.mjs:1347–1350` implements that `true` argument by running to a frame and calling `kernel.deliver()`.

     Consequently, recorder callbacks still advance execution inside an observer. The label `'now'` supplies no passive-frame semantics. Moreover, `sampleFrame` timestamps **before** this advancement, so a later frame can be presented as an entry-time sample. Its broad catch can convert an execution exception into a placeholder.

     Assertion suppression is also incomplete. `real_v3.mjs:210` calls `hooks.refresh()` outside `assertRead`; the hook’s refresh function (`afon_hooks_v7.mjs:213–215`) makes native link-getter calls. Its passthrough recording branch retains `ret:null` and attempts a return hook at the native-call sentinel. V4 refuses that hook and records a failure, but does not prevent these harness reads from entering the recorder.

     Conversely, `identityNow` wraps `ctx.screen()` in `assertRead`. That screen path uses a boundary frame and can advance execution while getter recording is globally disabled. Genuine firmware getters reached during that interval can therefore be suppressed along with harness reads.

   - **Item 2.3 — CONFIRMED for versioning and artifacts; OVERSTATED for validation:** new versions, refreshed fingerprints, freeze, manifest, and retained failed-run evidence exist. The new tests verify selected policy strings and stub behavior, not the actual passive-frame or internal-refresh semantics.

   - **Item 3 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** retained records report 47/47 passing tests on the submitted fingerprints. Six fake runs have `ok:true`, `valid:false`; counts agree with the report: identity **436/1862**, proof **324/1096**, and display operation counts **30/30/29/23**. The real-proof refusal reports `identity mode fake != real`. These are retained pure-Node results, not real-emulator validation.

   - **Item 4 — CONFIRMED as limitations, with correction:** real success remains unconfirmed. Passive composition is not merely uncertain: the selected API statically advances execution.

   - **Item 5 — CONFIRMED as a proposed workflow; UNSUPPORTED as current readiness:** coordinator authorization and six successful real processes remain outstanding. Code corrections are required first.

   **Previous required corrections:**

   - **Correction 1 — DONE:** display native preparation is uninstrumented, setup-frame removal is declared, installation follows plants/seeding, and waits are reconciled with T9d. Evidence: `plan_v2.mjs`, `real_v3.mjs`; retained tests named “run review 1” cover plan ordering, construction, waits, and prepare-before-install refusal.
   - **Correction 2 — WRONG:** passive callbacks are not achieved, and internal link-getter handling remains incomplete. Evidence: emulator call chain and hook paths above. The corresponding tests pass because `test_v4.mjs:599` replaces frame behavior with a policy-recording stub, while `:620` replaces the combined hook’s `refresh()` with an empty function.
   - **Correction 3 — NOT DONE:** versioning, preservation, and regeneration are complete; effective validation of the required correction is not. No retained test detects the actual advancing frame path or exercises link refresh through the accepted getter instrumentation. Successful real proof remains outstanding, as expected at this stage.

   T8d/zone plan operations, payloads, waits, roles, overlays, pose installation, and hook selection remain unchanged by the plan diff. The launcher/child/inventory/freeze changes primarily update version references; no additional boundary defect was identified in those differences. The blockers are in the real display adapter and its validation.

5. **Contradictions with established findings**:

   - The passive-frame claim contradicts the pinned emulator’s `PlaySession.frame` and `DisplayLab._compose` implementations.
   - Timestamping before an advancing sample does not satisfy `design_v2.md` §4.3’s requirement that the frame sample be taken inside its refresh window.
   - Global suppression around an advancing screen read can omit firmware getter evidence required by §4.3.
   - Previous results-review correction 2 explicitly prohibited scheduler advancement from refresh observers. V4 retains that behavior through a different API branch.

   The declared setup-frame reduction and T9d wait reconciliation are acceptable changes in principle.

6. **Alternative explanations** not excluded by the evidence.

   The earlier trap’s complete causal chain remains unproved. Deferring instrumentation may avoid its original occurrence, but advancing observer callbacks can still disturb execution after installation.

   Fake success cannot establish real-frame timing, native return-site behavior, permission compatibility, or identity/proof determinism. Matching placeholder signatures could also reproduce a sampling failure without establishing real framebuffer coverage.

7. **Scope and safety:** This review made no writes and ran no test suite, launcher, freeze maker, Ghidra, or OM-Emu. The attempted read-only Node inspection did not start.

   Audit evidence reports zero isolation violations. Frozen files match, including the existing emulator checkout changes. No new hardware action, installable-image construction, or hardware recommendation was found. Test and evidence destinations remain under `work/`.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. **Implement an actually passive display sample against the pinned emulator.** Do not use `frame('now')`. Audit the complete sampling path for scheduler/native execution, timestamp the actual sample, and fail on execution faults rather than converting them into framebuffer placeholders. Preserve real, timestamped in-window recorder evidence.
   2. **Complete harness-getter separation.** Cover internal `hooks.refresh()` link reads as well as explicit assertion reads. Keep synthetic return refusals fatal, but prevent harness getters from creating those records. Avoid disabling firmware-getter recording across an advancing `ctx.screen()` call.
   3. **Validate and regenerate before another run.** Add tests exercising the actual frame-policy/composition semantics and accepted hook’s link-refresh path, including sentinel handling and firmware getter coverage during identity capture. Retain the ordering/wait tests. Version the correction, regenerate fingerprints/freeze/manifest/external digest, and obtain coordinator authorization before the new six-process run-only stage.

   Optional improvements: retain partial refresh evidence on exceptions; correct the claim that every frame read outside the settle loop is passive, since `prepare` also calls the boundary-based `shoot`.