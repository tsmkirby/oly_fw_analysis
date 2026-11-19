# T6 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The new evidence closes the substantive save, reopen and distinguishing-size gaps. Both candidates end successfully, and their decoded stores match K2. However, the correction is not complete: acceptance retains assertion/readback exceptions, the half-press size-source attribution is wrong, and the final manifest remains incomplete.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md` completely, `audit/previous-review.md`, updated `work/result.md`, manifest, both supplements and seal, design, target-field table, overlay CSV, correction runners, generated tables, JSONL logs, command records and audit records.

   Research checked: T3j brief §0; T5 brief §§0 and 5, decision, promoted README, design, target-byte documentation, acceptance runner/table, session and observation helpers, home/converter listings; T3b profile layout, “Placement”; T7 decision, orientation-producer documentation, stock-writer listing and `pose.mjs`. Inspected representative Subject Detection, size, profile-B, save/reopen and release screenshots.

   Used PowerShell for independent hashing, image/listing comparisons, section reconstruction and decoded-store comparisons. Did not run Ghidra or OM-Emu. Made no file changes.

3. **Hash verification:** Zero-based manifest indices:

   - `inputs[0–149]`: **MATCH**.
   - `inputs[150]`, `review-brief.md`: **MISMATCH**. Recorded SHA-256 `4636e42852700dba77ff99f3127647264421a9dd78377ad85f2c129254f1bacc`, 2,158 bytes; current SHA-256 `04160c4cc80ff5cdc8680a2069c5c52ead6510ea1121cf3b1a5bd7f441471e08`, 1,827 bytes. The evidence does not establish who changed this reviewer-facing file.
   - `inputs[151–164]`: **MATCH**.
   - `sources[0–33]`: **MATCH**.
   - `outputs[0–764]`: **MATCH**.
   - Every additional recorded execution/later digest and byte length: **MATCH**, except the input mismatch above.
   - All recorded command-file hashes in manifest commands 01–29: **MATCH**.
   - Every hash in both supplements and `manifest-seal-t6v1.json`: **MATCH**.
   - All 808 `audit/run-log.json` harvested entries: **MATCH**.
   - Executed-script and wrapper hashes in command records 01–30: **MATCH** against current files.
   - `brief_sha256`: **MATCH**.
   - Unchanged T7 `pose.mjs`: **MATCH**, `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`.

   Canonicalized manifest paths have no duplicates. The manifest/seal combination nevertheless omits command 30’s four files and does not inventory the seal itself. The coordinator’s audit independently hashes those files, which preserves their integrity but does not make the submitted manifest complete.

4. **Claim-by-claim:**

   Correction status under brief §5:

   - **1 — DONE.** `save_v3.mjs` uses the same T5 menu-key/action sequence, including commits and menu exits. `save-v3-completion` asserts E and M status 0, including the posted M callback. `save-v3-persisted` records loaded M/E, file-to-store-mirror equality and reopened cell values. Independently decoded file lengths, hashes and headers agree.
   - **2 — NOT DONE in full.** Two fresh candidates, K1 and K2 exist. K2 matches both candidates’ 45 menu records and both 12-edge sequences. Candidate target, owner, status, focus, half-press and complete mirror comparisons pass independently. Reopen press and release are asserted, and terminal `ok:true` is present. Exceptions remain: `accept_v1.mjs:431` still calls `check(..., [], ...)`; its setup is protected by earlier throwing comparisons, so this is not evidence of an unchecked setup failure, but it does not implement the requested explicit comparison at that record. K1’s 12 ordinary edge records omit status readbacks, and reopened focus values are emitted without comparison.
   - **3 — WRONG in source attribution; distinguishing trial completed.** Mirror size 4 differs from both legacy `0xdfa1=0` and live `0x9a41[0]=0`. AF-ON uses size 4; shutter/release records retain size 0. Calling the latter’s source “legacy `0xdfa1`” is wrong: the stock half-press writer reads `0x9a41[0]`.
   - **4 — DONE.** Q1 identifies five Small edges and seven All edges. Q3 discloses reduced controls. Q2 discloses unmatched navigation and 49 M-byte differences. Descriptor count is corrected to two. “No other deviation” is removed.
   - **5 — NOT DONE.** Previously omitted principal inputs were added and paths canonicalized. Command 29 is sealed. Command 30/final-seal inventory remains outside the submitted manifest, the current review brief mismatches, and the T7 `orientation-producer.md` cited by design is absent.

   Numbered claims in `result.md`:

   - **§1 — CONFIRMED.** Correct task/version and emulator-only scope.
   - **§2 — CONFIRMED.** Research baseline and file-backed NVRAM description agree with source and audit evidence.
   - **§3 — OVERSTATED in part.** Command statuses and retained failures agree. The maker scripts transform runner text; “only copied” is incomplete. Final sealing limitations are accurately disclosed.
   - **§4 — CONFIRMED.** Checked addresses, listings and field sources; builder remains overlay code.
   - **§5 — OVERSTATED.** Isolation supports writes confined to `work/`; “the manifest lists them” excludes final seal/command artifacts.

   Findings under **§6**:

   - **6.1 — CONFIRMED.** Stock swap window is twenty `FF` bytes; 45 converter instructions match image bytes.
   - **6.2 — CONFIRMED.** The 71-instruction home listing has only the three stated relocated-pointer mismatches outside the swap.
   - **6.3 — CONFIRMED.** Independently reconstructed sections and checked all 3,262 rows. Counts: section 1 = 1,308; 2 = 95; 4 = 1,856; 7 = 3. Exactly 15 proposed bytes differ from Z5, all section-4 `profile-read` rows. Only `0x610bf5e3–0x610bf5e5` occupy section 7; none occupy section 6.
   - **6.4 — CONFIRMED** as recorded emulator observations.
   - **6.5 — CONFIRMED.** `0x1e71[0]=0` readbacks agree. Screenshot explicitly places **Off** beside **Subject Detection**; **On** belongs to Eye Detection Frame.
   - **6.6 — CONFIRMED.** Narrowed Q1 targets and owner sequence agree.
   - **6.7 — CONFIRMED.** Hook passes unrelated callers through; recorded shutter targets remain stock-built.
   - **6.8 — CONFIRMED** for C1 target, dimensions and disclosed store differences. Unemitted per-edge mirror invariance remains **SUPPORTED-NOT-INDEPENDENT**.
   - **6.9 — CONFIRMED.** Failed pose run records the stated half-press rewrite.
   - **6.10 — CONFIRMED** within explicitly reduced control coverage.
   - **6.11 — CONFIRMED** for recorded C-AF focus/target behavior.
   - **6.12 — CONFIRMED.** Earlier acceptance fails and does not reach reopen.
   - **6.13 — CONFIRMED.** Save witness distinguishes immediate returns from posted callback completion, all status 0.
   - **6.14 — CONFIRMED** for executed sequences and successful termination; **OVERSTATED** if interpreted as complete assertion/readback compliance, for the exceptions above.
   - **6.15 — CONFIRMED.** Both candidates reopen with 55 `FF` mirror bytes, asserted All press/owner 2 and stock half-press release/owner 0.
   - **6.16 — CONFIRMED.** Independently decoded and compared every M/E byte for both candidates against K2: no differing offsets. M is 262,144 bytes, SHA-256 `7ac3baeae47473ad4eebca572365fa3828fc89d948bf00fece522b1354b1a394`; E is 196,608 bytes, SHA-256 `0f47f7d2e52c925a1bd3076cc4e58530da2f40eba8797321d22ca6a3c0adba9f`.
   - **6.17 — WRONG in part.** Numeric size behavior is confirmed. Half-press retaining zero does not establish `0xdfa1` as its source.
   - **6.18 — CONFIRMED.** T3b specifies count 2, width 1.
   - **6.19 — CONFIRMED** within its stated fallback limitation.

   Remaining sections:

   - **§7 — OVERSTATED** as a complete inventory.
   - **§8 — CONFIRMED** for reported outcomes, with acceptance-compliance and size-attribution qualifications above.
   - **§9 — CONFIRMED** within emulator scope and disclosed coverage.
   - **§10 — CONFIRMED.** Remaining experimental limitations are accurately listed.
   - **§11 — CONFIRMED** for five correction experiment versions and no sixth run; recommendation is judgment.
   - **§12 — CONFIRMED but incomplete.** It omits the remaining acceptance assertion/readback exceptions and size-source error.

5. **Contradictions with established findings:** `result.md` §6.17, the size runner’s `sizeSource`, and its generated summary attribute half-press size to `0xdfa1`. T7 decision, “Accepted,” and `orientation-producer.md` §4, “Ten-byte producer,” identify `0x9a41[0]`. Independently checked all 200 instructions in `refresh-r1.txt` against the stock image: zero mismatches; `0x609b3c7a` loads `0x9a41`.

   The descriptor-count contradiction from the previous review is corrected.

6. **Alternative explanations** not excluded by the evidence:

   - Half-press size zero cannot distinguish two sources that both contain zero.
   - Reapplying half-press setup after pose publication proves behavior under that setup, not uninterrupted preservation across pose changes.
   - Q2’s extra menu navigation remains a confound for its independently confirmed 49 M-byte differences; E is identical.
   - Earlier Q2–Q4 logs do not independently expose every mirror invariant.
   - Store equality concerns these emulator sessions and establishes no native storage behavior.
   - The nonzero-legacy-size fallback and additional custom-zone/pose combinations remain untested.

7. **Scope and safety:** Isolation audit reports zero violations and zero allowed checkout changes. Existing `om-emu` modifications are inherited baseline changes. Execution hashes show no current script-content difference from its recorded execution version.

   Scripts patch emulator buffers in memory. No installable firmware output, hardware recommendation, native-implementation claim or storage decision was found. Behavior changes and test seeding are identified as emulator-only.

8. **Required corrections:**

   1. Complete the acceptance assertion/readback contract in a new runner version: replace the empty-problem setup call with explicit comparisons, record K1 status readbacks or explicitly resolve their applicability, and compare reopened focus readbacks.
   2. Correct half-press size-source wording to live `0x9a41[0]`. Preserve the established numeric result: AF-ON size 4, half-press size 0. Do not edit executed scripts or historical logs.
   3. Complete final manifest/supplement coverage for command 30 and the seal, add the cited T7 document, and reconcile the review-brief mismatch while preserving its historical digest.

   **Optional improvements:** Emit half-press cell snapshots on reopened edges and retain a concise distinction between successful functional acceptance and complete evidence-contract compliance.