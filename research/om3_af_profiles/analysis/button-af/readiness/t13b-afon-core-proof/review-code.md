# T13b review (Codex Sol, read-only)

1. **Verdict:** ACCEPT — **ACCEPT-CODE** for the staged two-process core run-only stage.

   No blocking defect was found in the staging changes. Successful real-emulator reproduction remains outstanding; display validation remains a separate required stage.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, the manifest, harness files, freeze, output records, and `work/test-scratch/b-final/`.

   Compared all seven new versioned files with their accepted T13 v3 predecessors and verified unchanged-file fingerprints. Read the three specified T13 reviews, `audit/t13-decision.md`, and T13 `design_v2.md` §§0–9, particularly §§4.1–4.3, 5, and 7. Applied §0’s mistakes-only threat model.

3. **Hash verification:** Using zero-based manifest indices:

   - `inputs[0]` through `inputs[416]`: each **MATCH**.
   - `sources[0]` through `sources[54]`: each **MATCH**.
   - `outputs[0]` through `outputs[287]`: each **MATCH**.
   - `brief_sha256`, `result_sha256`, and `freeze_sha256`: each **MATCH**.

   All **760 manifest file entries** match, including declared lengths. All **463 frozen files** match; the four frozen directories contain exactly their listed files, without internal links.

   External freeze digest **MATCH**:

   `03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92`

   Every file from the accepted T13 v3 freeze remains unchanged; seven files were added. All 48 declared reused harness files match T13, and the six T12 modules match their original copies.

   All 55 test-source fingerprints match both submitted files and scratch copies. Both fixture fingerprints and both test-result copies match. Independently verified nine completed-run inventory chains, 36 exit-listed output fingerprints, and six identity seals.

4. **Claim-by-claim:**

   - **Item 1 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** task, emulator-only scope, accepted harness basis, and historical core-session success agree with the retained acceptance, run review, and decision. Historical execution was not repeated.
   - **Item 2 — CONFIRMED with wording qualification:** only staging-related changes were found. Core identity and proof use the same five unchanged session constructions. Full T8d/zone relations, writer checks, and §4.1 reproduction remain active. Display construction and acceptance checks remain unchanged. Coverage refuses display plans before any session starts; `common_v1.PLANS` excludes `identity-all`. “Renamed only” is imprecise: tests are adapted and freeze capture is filtered, as described elsewhere in the result.
   - **Item 3 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** retained records report 43/43 passing tests on matching submitted fingerprints. Fake identity and proof each execute 324 operations and evaluate 1096 relations; proof reproduces 324 operations. Both have `ok:true`, `valid:false`. Real proof with fake identity is refused. These runs were not independently repeated.
   - **Item 4 — CONFIRMED as inference:** unchanged construction supports the expected core behavior. Counts remain 30/36/50/81/127 operations and 1094 operation relations plus two writer checks. Exact reproduction across real processes remains unproved.
   - **Item 5 — CONFIRMED as code readiness:** the proposed identity-then-proof commands consistently select the staged versions and external digest. Both real processes must succeed under the stop-at-first-failure rule before accepting the core proof.

5. **Contradictions with established findings:** none newly introduced.

   The approved staging supersedes the combined identity and six-process sequence in `design_v2.md` §§5 and 7. It preserves §§4.1–4.2 for the core and defers §4.3 display validation. The previously identified display defects remain unresolved but are outside the launchable core sessions.

6. **Alternative explanations** not excluded by the evidence.

   Fake success does not establish real-process determinism or runtime compatibility. Reproduction can repeat deterministic errors in fields without independent behavior relations. Earlier core-session success does not prove sealed reproduction or display correctness.

7. **Scope and safety:** This review made no writes and ran no harness test, launcher, freeze maker, or OM-Emu.

   Frozen emulator files match the accepted baseline. Reviewed evidence destinations remain under `work/`. Inherited firmware construction is in-memory and emulator-only. No new installable image, hardware recommendation, or unapproved emulator change was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections: none.

   Optional improvements:

   1. Correct stale “six capture runs” descriptions to two in a future version.
   2. Replace the duplicate `zoneWriter` fault test with one reaching the zone writer check; its retained failure currently occurs at the earlier candidate writer check.
   3. Clarify “renamed only” to acknowledge the documented test adaptations and capture filtering.