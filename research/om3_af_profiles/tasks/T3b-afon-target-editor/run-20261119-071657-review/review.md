# T3b review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The correction round establishes stock custom-size editing, owned placement of the flag, and MENU parity for the tested sequence. Acceptance still fails, exit coverage is incomplete, AF-ON custom-size editing remains untested, and the manifest is incomplete. The updated result honestly reports most of these limitations.

2. **Baseline checked:** `TASK.md`, `review-brief.md`, the complete `brief.md`, `templates/review.md`, `audit/previous-review.md`, `work/result.md`, the manifest, stock-screen report, profile layout, design, overlay CSV, new runners and embedded tables, JSONL records, representative screenshots, command records and audit artifacts.

   Research checked: T3j §0; T5 §0 and §5; `PROJECT-STATE.md` §3 and §6/Q5; `FEATURE-SPEC.md`’s 10 November revision and target-editor requirement; `AFON-MENU-RESEARCH.md` §1’s target-cell mapping and §8’s page-27 editor findings; T5 readiness README, target-byte report, design and overlay; T2’s capacity findings; and `HARDWARE-STAGE0-RECORD.md`’s owned-RAM analysis.

   Used PowerShell for independent verification. Inspected the stock C1 direct screen, custom-size editor and failed candidate Single frame. Did not run Ghidra or OM-Emu or write files.

3. **Hash verification:** Recomputed SHA-256 and byte length for every manifest file entry:

   - `inputs[0–20]`: **MATCH for each of all 21 entries**.
   - `sources[0–28]`: **MATCH for each of all 29 entries**.
   - `outputs[0–520]`: **MATCH for each of all 521 entries**.
   - `commands[0–27].files`: **MATCH for each of all 112 entries**, covering commands 01–28.
   - Separately recorded brief hash: **MATCH**.
   - All 27 executed-script hash records across command exits 01–29: **MATCH**. All 29 wrapper hashes: **MATCH**. No executed-script modification is evidenced.
   - Additionally recomputed all 141 entries in retained `import-inventory-e3.json`: **MATCH for each**.

   Matching hashes do not establish completeness. `import-inventory-f3.json` contains only `accept_f3.mjs`: its scanner does not follow the dynamic `use(...)` imports. The current manifest consequently has no emulator-module source entries; 140 emulator-module entries remain recoverable from the older inventory but were dropped from the current source list. Command 29 is absent from `commands`, and `29.out`, `29.err` and `29.exit` lack manifest entries. Its `29.cmd.txt` is present.

4. **Claim-by-claim:**

   For `result.md` §6’s numbered findings:

   - **6.1 — CONFIRMED.** The recorded direct-screen route, immediate change-index updates and non-restoring MENU behavior agree with the stock logs and new control.
   - **6.2 — CONFIRMED.** Tracing begins before the opening/cancel key. `open-up` records 1,938 unique call targets and `cancel-menu` 2,657; neither hits the 20,000-target cap. These are deduplicated target lists, rather than complete ordered call histories.
   - **6.3 — CONFIRMED for C1; OVERSTATED if read as measuring all indices 2–9.** Stock `size-ok` changes `0x1dd1[0..3]` from `[3,3,3,3]` to `[5,1,5,1]`. Setter observations identify the additional `0x1de1` and `0x1df1` writes and return site `0x604193c7`. C2–C4 preset editing was not measured.
   - **6.4 — CONFIRMED.** The stock C1 screenshot visibly shows C1. The runner first enables custom slots through the native setter; this is a declared session setup, not an ordinary user navigation step.
   - **6.5 — CONFIRMED.** Independently checked all 72 bytes from `0x6031eeb0` through `0x6031eef7`: stock `FF`, absent from Z5 rows, inside the owned tail, and beyond the relocated block ending at `0x6031eeaf`. The 55-byte mirror, 16-byte extension and flag do not overlap.
   - **6.6 — CONFIRMED within the emitted fields.** Independently compared `p-up`, `p-dial`, `p-right`, `p-menu` and `p-shoot`: candidate profile fields match the control’s corresponding half-press fields, and tracked candidate half-press cells remain unchanged. MENU leaves zone 1 and position 529; the harness clears the flag. No AF-ON MENU rollback was added. Profile `0x5a11` is omitted from these comparisons and emitted profile snapshots.
   - **6.7 — CONFIRMED.** `h1-dial` fails against `p-dial`: candidate `0x5962[1]` and `0x88b2` are 529, while control values are 526. Other compared fields agree. The run ends `ok:false`; command 25 exits 1.
   - **6.8 — SUPPORTED-NOT-INDEPENDENT.** The stale zone byte is a plausible explanation. Neither the proposed restore nor its claimed sufficiency was tested. Z5-versus-stock differences remain a confounder.
   - **6.9 — CONFIRMED save activity; OVERSTATED completion.** The control logs another posted M save and a changed store file after edits. The runner accepts either another save-log entry or a file-hash change; it does not explicitly assert completed native save status or read persisted settings back. Power-down times out. Candidate save and reopen were not reached.
   - **6.10 — CONFIRMED failure; SUPPORTED-NOT-INDEPENDENT timing explanation.** `route-f2` stops at the first title mismatch with flag 1 and zone 1. Later acceptance passes the reached literal-title checks after waiting, but does not reproduce that exact failed sequence to isolate timing.
   - **6.11 — CONFIRMED raw defaults; UNSUPPORTED fallback semantics.** Image defaults and the flag’s off interpretation are supported. However, the getter hook returns raw mirror values whenever the flag is 1; it has no `FF` fallback. The runner explicitly initializes the mirror. “Uninitialised, use stock defaults” is therefore not implemented for an active AF-ON editor. The single-orientation limitation remains supported.

   For the other numbered result sections:

   - **§1 — CONFIRMED:** correction-round scope and cancel amendment are identified correctly.
   - **§2 — CONFIRMED listed research hashes; OVERSTATED dependency coverage:** emulator modules are missing from the current source inventory.
   - **§3 — CONFIRMED:** four new experiment versions, retained failures and matching executed-script hashes.
   - **§4 — CONFIRMED** addresses and static placement checks; historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — OVERSTATED:** “full list and hashes” excludes three final command artifacts and emulator dependencies.
   - **§7 — PARTLY CONFIRMED:** pointers support measured behavior, subject to the qualifications above.
   - **§8 — CONFIRMED failed/unreached outcomes; OVERSTATED** control save-completion wording.
   - **§9 — CONFIRMED:** new stock measurements and the normal-edit failure are distinguished from prior evidence.
   - **§10 — CONFIRMED** outstanding gaps.
   - **§11 — SUPPORTED-NOT-INDEPENDENT:** the proposed repair and altered control are untested.
   - **§12 — CONFIRMED** reported deviations; these do not satisfy acceptance.

   Correction-round status:

   - **Correction 1 — NOT DONE.** Placement is fixed. Only MENU clearing is reached, via explicit harness `disarm`; every-exit handling is not established, and the following normal edit fails.
   - **Correction 2 — BLOCKED, honestly reported.** Stock C1 editing and entry traces are established; candidate custom-size editing is unreached. Hook coverage alone does not prove routing.
   - **Correction 3 — DONE for the named gaps.** Open/cancel traces precede keys, caps are not hit, unwired routes are listed, and a stock C1 screenshot exists. The new stock snapshot still omits `0x1df1`, despite observing its setter writes.
   - **Correction 4 — NOT DONE.** Only one candidate starts and it fails. `size-open`, `shoot` and save contain multiple keys without intervening assertions. Many steps lack literal visual identity checks. `profHold` excludes `0x5a11` and the separate zone byte; expected zone checks inspect mirror `0x99a1[1]`, not that byte. Candidate save, full reopen and `ok:true` are absent.
   - **Correction 5 — NOT DONE.** Reporting improved, and command 17 is repaired, but module coverage and final command hashes remain incomplete.
   - **Cancel amendment — DONE for the tested sequence.** Same keys, same compared profile change, tracked half-press invariance, no rollback; the earlier failed `accept-e3` remains superseded rather than reclassified as passing.

5. **Contradictions with established findings:**

   - No remaining flag-placement contradiction with `HARDWARE-STAGE0-RECORD.md`, “Owned RAM analysis.”
   - `FEATURE-SPEC.md`, 10 November revision, item 2 remains unmet for AF-ON custom-size editing; the result acknowledges this.
   - The fallback description in `profile-layout.md` and finding 6.11 exceeds the implemented getter behavior.
   - No contradiction with the amended stock MENU requirement or Q5 decision boundary.

6. **Alternative explanations** not excluded by the evidence:

   - The extra normal-edit position step may involve other Z5 behavior, not solely the retained zone byte. Restoring it remains an untested hypothesis.
   - Clearing the flag in the harness after selected keys does not establish automatic editor-lifetime handling for other exits or exceptions.
   - Store equality cannot substitute for demonstrated post-edit saving. Independently decoded all eight acceptance stores: the six older stores match; the new candidate and control E banks match, but their M banks differ in **22 bytes**, first at offset **2**. M banks are 262,144 bytes; E banks are 196,608 bytes. Their unequal completed sequences prevent attributing this difference to profile persistence.
   - A raw `FF` mirror on reopen establishes uninitialized RAM, not usable AF-ON defaults upon entering the editor.

7. **Scope and safety:** No task-time writes outside `work/` are evidenced. The isolation audit reports zero violations, unchanged workspace and unchanged inputs. The four OM-Emu modifications are supplied baseline changes.

   Independently derived section ranges from the image and checked every overlay row: all 3,262 rows retain Z5’s original columns, match stock bytes and address offsets, and have correct section labels. Counts are section 1: 1,308; section 2: 95; section 4: 1,856; section 7: exactly the three permitted addresses `0x610bf5e3–0x610bf5e5`. No other section-6/7 row exists; the checker is retained.

   Runtime behavior is labelled `EMULATOR-ONLY`. No firmware-image output, SD output, hardware recommendation, storage decision or Subject Detect On change was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Complete exit handling and verify the following normal edit against controls after MENU, OK, S1 and session end. Treat zone restoration as a proposed fix until tested.
   2. Demonstrate AF-ON custom-size editing with complete profile and half-press readbacks, including `0x1df1`.
   3. Assert after every individual key: visual identity, every mirror field including `0x5a11`, the separate zone byte, flag and half-press cells. Complete two candidate sessions, post-edit save completion, store comparison and full reopen, ending `ok:true`.
   4. Implement and test first-entry initialization/fallback, or narrow the `FF` default claim.
   5. Repair dynamic import inventory and final command coverage; refresh the manifest with every consumed dependency and command-output hash.
   6. Obtain coordinator authorization before further experiments beyond the exhausted four-version cap; retain all existing failures.

   Optional improvements: preserve ordered call-entry traces alongside unique-target lists, and use an additional Z5 control with the flag off to isolate the normal-edit disagreement.