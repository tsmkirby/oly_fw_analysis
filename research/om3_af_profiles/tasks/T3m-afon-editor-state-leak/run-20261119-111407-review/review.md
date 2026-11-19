# T3m review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The focused position-leak reproduction and p3 repair are supported. Acceptance remains incomplete: c1’s store differs from K2, c2 and reopen were not run, and the final run ends `ok:false`. Save and per-key assertions also remain insufficient.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, manifest, supplement, leak/design/layout/harness write-ups and `accept_lib.mjs`.

   Inspected the experiment runners, embedded sequences, harness revisions, generators, disassembly, JSONL logs, command records, import inventories, persisted stores, representative screenshots and `audit/`.

   Research checked: complete T3l decision and last Sol review; T3l hook and acceptance baseline; T3j assertion requirements; T5 brief §0 and §5; T3b brief §0 and §5; T3l brief and correction requirements. Checked emulator save implementation and section-table parsing.

   Used PowerShell for independent verification. Did not modify files or run Ghidra or OM-Emu.

3. **Hash verification:** Recomputed SHA-256 and recorded byte lengths:

   - `inputs[0–4]`: **MATCH for each of all 5 entries**.
   - `research[0–10]`: **MATCH for each of all 11 entries**.
   - `resources[0–1]`: **MATCH for both entries**.
   - `sources[0–21]`: **MATCH for each of all 22 entries**.
   - `dynamic_imports[0–146]`: **MATCH for each of all 147 entries**.
   - `outputs[0–379]`: **MATCH for each of all 380 entries**.
   - `commands[0–20].files`: **MATCH for each of all 84 entries**.
   - Separate brief hash: **MATCH**.
   - Supplement’s manifest hash/length and four command-22 file records: **MATCH**.
   - All **707 module records** across the five import inventories: **MATCH**.
   - All **23 executed-script records** and **23 wrapper records**: **MATCH**. Resolved `DisasmLeak.java` through the wrapper’s `work/scripts/` search rule.
   - All **411 audit harvest records**: **MATCH**.
   - Audit diff after newline normalization: **MATCH** to the initial emulator-diff hash.

   No executed-script modification is evidenced. Completeness still fails:

   - All four command-23 files lack manifest/supplement hashes.
   - `leak_p3.mjs` writes `import-inventory-p2.json`, overwriting p2’s inventory.
   - The stock measurements identified as consumed in `result.md` §2 are not individually inventoried.

4. **Claim-by-claim:**

   For `result.md` §6’s numbered findings:

   - **6.1 — CONFIRMED.** p1 records the following normal dial/OK at `0x5962[1]=994` and `0x88b2[0]=994`; the control records 526. The minimal reproduction retains the accepted T3l routing and exit behavior.

   - **6.2 — CONFIRMED observed read; OVERSTATED exhaustive “first” claim.** The trace records `0x6119de25` reading 994 from `0x62473182`, consistent with object `0x62473140` plus `0x42`. However, K2 watches only `WATCH_POS`, excluding this object field. Candidate watches selected addresses found by scanning for 994. This establishes an early differing value among watched reads, not the first difference across every position-feeding read on both paths.

   - **6.3 — CONFIRMED copies and restore omission; OVERSTATED classification and writer completeness.** The trace identifies the shadow writer at `0x60063519` and global-record writer at `0x6119af20`. The copy listing confirms eight halfwords from object+`0x42`. The inherited restore touches flag/zone aliases, leaving these copies untouched. These findings combine dynamic observation and static evidence. The object writer is insufficiently documented: its aggregate records `0x6119ddb8`, two writes, retaining only the first value, 0. The final 994 is visible, but the complete write sequence is lost.

   - **6.4 — CONFIRMED for the focused sequence.** The labelled `EMULATOR-ONLY` change restores the global record and shadow snapshot and replaces the object’s position halfword. Independently compared recorded common normal-key snapshots against K1/K2: parity holds, including position 526 after the dial. AF-ON edits retain their mirror values while listed half-press cells remain unchanged. Subject Detect reads 0. This does not establish general exit isolation beyond demonstrated cases.

   - **6.5 — CONFIRMED recorded normal-key parity; OVERSTATED acceptance/save coverage.** K1/K2 normal-key snapshots and titles match, and their stores are identical. c1’s n1–n3 snapshots/titles also match them. However, c1 has missing exact expectations on 21 of 59 screenshot rows. C1/C2 Right/main/sub steps assert flag and half-press invariance but omit visual identity, zone and complete mirror expectations. Several later mirror expectations are copied from candidate observations. The save pass uses weakened session-wide checks.

   - **6.6 — CONFIRMED independently.** Decoded both banks and compared every byte. K1/K2 have zero differences. K2/c1 have exactly nine M differences and zero E differences:
     `2:199→121`; `211472:3→1`; `211476:3→33`; `211480:3→1`; `211484:3→33`; `211504:1→5`; `211508:1→8`; `211512:1→5`; `211516:1→8`.
     Both M banks are 262,144 bytes; E banks are 196,608 bytes. The run stops at this comparison with `ok:false`; c2/reopen are absent.

   - **6.7 — SUPPORTED-NOT-INDEPENDENT for the precise persistence route.** The eight payload values match the recorded C1/C2 mirror values and differ from unchanged live half-press values. Whether saving copied the mirror directly or consumed another editor/settings record remains unresolved. **M+2 is explained:** the eight payload changes increase the word sum by 78; the checksum word at +2 decreases by 78. Independently computed both complete M-bank 16-bit word sums as zero, consistent with `menu.mjs`’s store-format description.

   - **6.8 — CONFIRMED actual overlay; OVERSTATED checker strength.** Independently derived section starts from the image and checked all 3,262 rows, offsets and stock bytes. Counts are section 1: 1,308; section 2: 95; section 4: 1,856; section 7: 3. Only `0x610bf5e3–0x610bf5e5` enter sections 6/7. The CSV is byte-identical to T3l’s. However, the runner trusts the CSV section column; `Number(section)` also becomes `NaN` for its descriptive section-7 label. It does not independently determine sections.

   For the remaining numbered sections:

   - **§1 — CONFIRMED** task/version identification.
   - **§2 — CONFIRMED** baseline/resource distinction; historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** six-version chronology and recorded command outcomes. Wrapper records cover the listed commands.
   - **§4 — CONFIRMED** named implementation sites and matching instruction bytes: all 260 listed instructions match the input image. Range sizes are **WRONG as byte counts**: `DisasmLeak.java` interprets them as decimal instruction counts.
   - **§5 — OVERSTATED** complete file inventory; command 23 and consumed measurements remain unsealed/unlisted.
   - **§7.1–7.8 — CONFIRMED as evidence pointers**, subject to the qualifications above.
   - **§8 — CONFIRMED** failures and unreached sessions. The r3 `nativeSave` pass does not prove the required post-edit save.
   - **§9 — CONFIRMED** distinction between inherited behavior and the new focused repair/store observations.
   - **§10 — CONFIRMED** missing second candidate/reopen and unresolved persistence route. M+2 uncertainty is now resolved as checksum compensation.
   - **§11 — UNSUPPORTED as a sufficient completion plan.** Explaining candidate-store differences alone does not satisfy required K2 equality; the harness and save checks also need repair.
   - **§12 — CONFIRMED** experiment exhaustion and incomplete acceptance; **OVERSTATED** “values stayed in RAM,” given the saved custom-size payload.
   - **Owner decision Q5 — CONFIRMED.** Session-flag entry remains; no visible menu entry or storage decision was added.

   Harness findings:

   - `waitTitle` throws on timeout and retains expected/last hashes.
   - `compareStores` enumerates every differing offset. The acceptance runner subsequently truncates candidate differences to 80 when logging; all nine happen to fit here.
   - Original `nativeSave` fails honestly when its call produces no saves.
   - r2/r3 substitute whole-session saves/callbacks for post-call evidence. r3 additionally accepts E without a captured saved image. Earlier saves and unrelated zero callbacks can therefore satisfy the check.
   - Reading bank buffers/hashes does not assert persisted cells against explicit post-edit expectations.
   - Some assertions retain explicit expected/actual values; `halfFrozen`, custom-size checks and several error messages do not.
   - The procedural sequences do not supply the required complete acceptance step table.

5. **Contradictions with established findings:**

   No contradiction with T3l’s accepted initialization, Q5 entry choice, Subject Detect erratum or reported position defect.

   Acceptance remains contrary to T3m brief §0 and §2.3–4, and inherited T3l correction §5.2. The saved C1/C2 payload contradicts unrestricted RAM-only wording. Counting earlier session saves does not resolve the save-completion limitation established in the T3l decision’s “Not established” section.

6. **Alternative explanations** not excluded by the evidence:

   - The three-location repair is tested together; evidence does not isolate which restoration is necessary or whether other cached editor fields remain relevant.
   - Selected watchpoints and aggregated writes do not establish an exhaustive chronological first divergence.
   - Custom-size values may reach persistence through a separate editor/settings record while listed live half-press cells remain unchanged.
   - Earlier saves/callbacks can explain r3’s save pass without a completed save caused by the final `nativeSave` call.
   - Reopen behavior and a second fresh candidate remain untested.

7. **Scope and safety:** No task-time writes outside `work/` or new unapproved emulator changes are evidenced. Isolation reports zero violations and unchanged workspace/inputs; the supplied emulator diff matches the initial baseline after newline normalization.

   Behavior changes are labelled `EMULATOR-ONLY`. No firmware-image or SD-file construction, hardware recommendation, visible menu addition or storage decision was found. Native-site prose is a proposed change list, not demonstrated native implementation. The saved custom-size values prevent accepting the RAM-only behavior claim.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Obtain coordinator authorization before additional experiments; all six versions are exhausted.
   2. Qualify the “first differing read” claim or capture matched chronological K2/candidate reads and the complete object-write sequence.
   3. Supply complete table-driven expectations immediately after every key: visual identity, every mirror field, zone, flag and every half-press cell, with explicit expected/actual values and unresolved control references treated as failures.
   4. Repair save verification without weakening expectations: prove post-edit M/E saves and associated completion, then assert persisted cells against explicit expectations.
   5. Resolve custom-size persistence, obtain candidate stores equal to K2, and complete both fresh candidates and reopen/next-entry initialization, ending `ok:true`.
   6. Seal command 23, inventory consumed measurements, preserve separate per-version inventories, compute overlay sections from the image, and correct the result’s RAM-only/completeness wording.

   Optional improvements: retain chronological raw trace events and dropped-event counts; remove candidate-difference logging truncation; document M+2 checksum compensation and correct disassembly range units.