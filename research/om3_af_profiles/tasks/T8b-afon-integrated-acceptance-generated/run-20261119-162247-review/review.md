# T8b review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Integrated acceptance remains incomplete. Correction version 1 stops at `k1e-c-size-ok` with `0x1e71[0]=4` and terminal `ok:false`. Neither candidate starts. Candidate save, both reopens, factory reinitialization and completed-store equality remain untested.

   The failure is honestly reported. However, initialization violates the explicit ROM-default tie-break, and the revised checker still accepts unmatched exits and inconsistent bank/target expectations.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md` including §5, `templates/review.md`, `audit/previous-review.md`, `work/result.md`, manifest and supplement, sequences, generators, checkers, tables, runners, reference records, logs, stores, command records and audit evidence.

   Research checked: T8 brief and decision; both specified T8 reviews completely; inherited briefs’ §0 and correction requirements; T3l decision/layout; promoted T3m/T6 decisions, implementations and T6 design/save procedure; specified T3m/T6 reviews; T7 decision and `PROJECT-STATE` §3.

   Used PowerShell to recompute hashes, reproduce checker predicates, walk ROM registration tables, reconstruct image sections, compare reference records and decode stores. All 209 PNGs decode; visually inspected the final Subject Detection screenshot. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Every file-backed SHA-256 and recorded byte length in these groups was recomputed:

   - Manifest `inputs[0–30]`: **MATCH**.
   - Manifest `sources[0–173]`: **MATCH**.
   - Manifest `outputs[0–411]`: **MATCH**.
   - Manifest commands: all 176 script/file records **MATCH**.
   - Supplement: all 188 file-backed records **MATCH**.
   - Six historical import inventories: all 870 module records **MATCH**.
   - Correction import inventory: all 146 module records **MATCH**.
   - Command exit records: all 38 script records and 37 wrapper digests **MATCH**.
   - External audit harvest: all 451 records **MATCH**.
   - Initial audit input-image records: both **MATCH**.
   - Current manifest/audit brief digests: **MATCH**.
   - Reference sidecar: **MATCH**, `649fc573bc46437c55fa54085c52abc01f373b357e618c28e4bfd08264aef2d1`.
   - T7 pose module: **MATCH**, `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`.
   - Normalized emulator diff: **MATCH** to inherited baseline `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   The initial audit’s historical brief digest is **MISMATCH against the amended current brief**; the current manifest and correction audit agree. No current evidence-record mismatch was found.

   Static import inspection found no omitted resolvable transitive module across the seven inventories. The external audit seals the supplement and command 37’s final outputs. Baseline-input completeness remains imperfect: the expressly required T6/T3m reviews and inherited briefs are absent from the submitted inventory.

4. **Claim-by-claim:**

   Correction status under brief §5:

   - **1 — WRONG.** Independently walked all five registration tables. Mirror-key ROM payloads are zero; bank 7 contains 1,215 records and terminates at `0x6011fe20`. Confirmed the reported 50 layout-slot disagreements with K1’s fresh state. `initMirror()` nevertheless uses K1 runtime values instead of ROM defaults, contrary to the explicit tie-break. It retains the `FF`/`FFFF` guards. The combined hook block is otherwise unchanged.
   - **2 — NOT DONE.** K1e is stock without overlay/hooks and shares the declared editor keys with candidates. The mapping is static, but it copies cell indices directly rather than resolving the measured editor/consumer bank difference. The checker recognizes map names; it does not validate their field/bank semantics. K1e fails before producing its reference file/hash.
   - **3 — NOT DONE.** Individual keys, source declarations, citations and candidate flag expectations improve. Exit matching remains nominal, and bank labels are not checked against mapped cells or target contents. Small and C1 `[5,7]` postconditions are not established.
   - **4 — NOT DONE, honestly reported.** One of six newly authorized emulator processes ran: command 34. It stops at the first failed assertion. Neither candidate, save, reopen, reinitialization nor completed-store comparison runs. Terminal result is `ok:false`.
   - **5 — NOT DONE in full.** Previously omitted promoted READMEs and save artifacts were added, and the final evidence is sealed. Required baseline documents remain omitted, and result §§6.7/9.7 misidentify the EXIF array index.

   Numbered sections in `result.md`:

   - **§1 — CONFIRMED.** Task and correction identification agree.
   - **§2 — CONFIRMED** for hashes, overlay sections and permitted section-7 bytes. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED.** Six historical emulator processes and one correction process are recorded. Static inventory/summary commands are not emulator experiments.
   - **§4 — CONFIRMED** for registration addresses, table counts and implementation references.
   - **§5 — OVERSTATED** as complete inventory coverage; final sealing works, but required baseline inputs remain absent.
   - **§7 — CONFIRMED** as evidence pointers, subject to the claim corrections below.
   - **§8 — CONFIRMED** for failures and unreached acceptance. Checker PASS is structural evidence only.
   - **§9 — CONFIRMED** for items 1–4, 6 and 8; item 5 is **OVERSTATED** if read as completed exit/bank validation. **Item 7 is WRONG:** EXIF editing changes array index 4, not 5. Item 9 correctly identifies the wrong-page commit.
   - **§10 — CONFIRMED** for disclosed uncertainties, except the repeated index-5 attribution.
   - **§11 — SUPPORTED-NOT-INDEPENDENT** as a proposed next approach; page identity is a necessary guard, but initialization and expectation contradictions also require resolution.
   - **§12 — CONFIRMED.** The failed run, initialization deviation and absent K1e hash are disclosed accurately.

   Findings under §6:

   - **6.1 — CONFIRMED.** All 134 reference rows match their JSONL records. The permitted Subject Detect, mirror, flag and K1 edge invariants hold.
   - **6.2 — CONFIRMED.** K2 adds one fresh posted M from `0x60061268`, with its own callback status 0, a captured 262,144-byte image and no new E. Independently decoded M hashes to `d678d295d730a876188c46b890834158a21bc9a492adab976a9ebda696754b90`.
   - **6.3 — CONFIRMED independently.** K1/K2 differ at exactly 65 M offsets and zero E offsets.
   - **6.4 — CONFIRMED.** ROM payloads, fresh-state disagreements and the unexecuted initialization deviation agree with independent inspection.
   - **6.5 — CONFIRMED for table syntax; OVERSTATED as semantic validation.** Independent PowerShell reproduction returns zero checker problems: 145 steps, 68 editor steps and 36 save steps. Required base fields and ordinary edge fields have sources; no direct candidate source occurs.
   - **6.6 — CONFIRMED.** The logged initial edit writes index 0, position 412, type 3 and the stated custom-size cells, with Subject Detect remaining 0.
   - **6.7 — WRONG in index attribution.** The recorded array is `[412,526,526,526,412,526]`: index **4** is 412; index **5** remains 526. Index 1 also remains 526.
   - **6.8 — CONFIRMED as buffer observations.** The first S1 sample remains the image record; later samples contain position 412 and kind 3. This does not establish a synchronized target reference for each edit.
   - **6.9 — CONFIRMED for the failure and unreached work.** The final screenshot shows Subject Detection with the bird icon, and readback is 4. The “Detects birds” highlight belongs to later `c-size-right`/`c-size-h` records, not `c-down-4`.

   Remaining table defects:

   - **Exits are not matched sequences.** `e-ok` points to the earlier `zone-ok`; `p-menu` points to future `save-open`; `p-back` and `c-tab-leave` reuse `save-leave-0`. `c-s1`, a complete key press, points to `edge-0`, an S1-down edge. The checker compares only key names.
   - **Bank/target consistency is unvalidated.** `half-to-mirror` preserves indices 0/4 from the measured edits, while the accepted consumer reads 1/5. Declaring `bank:1` or `bank:5` does not repair that difference.
   - **The first owned target is inconsistent.** `edge-2` sources the stale K1e image target with dimensions 27×39. Its mapped bank-1 type remains 0, for which the accepted T6 builder produces All with 1×1 dimensions.
   - **Required edit outcomes are missing.** Measuring whatever K1e produces does not assert that the selected zone is Small or that C1 becomes `[5,7]`.
   - **Literal citations are broad.** They are present, but the checker only matches citation strings; it does not verify that each cited decision/claim supports the exact value.

   Independently decoded every available store without truncating comparisons. M/E lengths are 262,144/196,608 bytes. Each historical `nvram-t8b2-c1.json` through `nvram-t8b6-c1.json` differs from K2 at **65 M offsets and zero E offsets**. The stopped K1e store differs at **24 M offsets and zero E offsets**. These are incomplete sessions. **No c2 store or correction-round candidate store exists; neither required completed-candidate equality is demonstrated.**

   Required `PROJECT-STATE` §3 behaviours:

   - **Stock half-press preservation — NOT DEMONSTRATED** after an integrated candidate edit; control/prefix evidence exists.
   - **Independent AF-ON type, size and position per orientation — NOT DEMONSTRATED.**
   - **AF-ON menu row — DEMONSTRATED** for the inherited emulator configuration and K2 commit.
   - **AF-ON Subject Detect policy — NOT DEMONSTRATED** functionally. Off readbacks hold until the accidental value-4 commit; Subject Detect On testing is **OUT OF SCOPE**.
   - **Shared S-AF/C-AF behaviour — NOT DEMONSTRATED** by integrated acceptance.
   - **AF-ON precedence and release restoration — NOT DEMONSTRATED** for integrated candidates.
   - **Persistence — OUT OF SCOPE**, Q7.
   - **Display — OUT OF SCOPE**, T9b.

5. **Contradictions with established findings:** Initialization conflicts with T8b brief §5.1’s explicit ROM-default tie-break and T3l `profile-layout.md`’s distinction between descriptor defaults and runtime values.

   The mapped bank expectations conflict with T6 design, “What the AF-ON record must read instead,” and T7 decision, “Direct editor banks,” which specify consumer banks 1/5/3. The current harness measurements expose an unresolved difference; they do not establish index 5 being written.

   Reused key-name exits do not satisfy T8b §2.3’s matched-exit requirement. The amended posted-M save finding agrees with the T8 decision.

6. **Alternative explanations** not excluded by the evidence:

   - Harness setup, menu context or pose delivery may explain the observed editor-index difference without invalidating the accepted components.
   - The K1e half-target buffer may be stale or updated asynchronously; its S1 sample need not represent the latest edited cells.
   - The size path navigates into Subject Detection, so its failure does not test custom-size routing.
   - Aborted-store differences may reflect session-open contents and unequal commits; they do not establish candidate leakage.
   - Hook-free controls cannot establish candidate restoration, fallback or repeatability.

7. **Scope and safety:** Audit reports zero isolation violations and zero checkout changes during the correction. The emulator diff matches the inherited baseline. Recorded execution hashes show no retained script-content drift.

   Independently reconstructed section boundaries from the image and checked all 3,262 overlay rows, offsets and stock bytes. Counts are 1,308/95/1,856/3 in sections 1/2/4/7. Only `0x610bf5e3`–`0x610bf5e5` occupy section 7; none occupy section 6. Combined proposed bytes equal T6’s and differ from T3m’s at exactly the 15 profile-read bytes.

   The only combined-hook change is initialization, labelled `EMULATOR-ONLY`; its chosen values violate the amendment. It was not exercised by K1e. `0x1e71[0]` is read after each retained step, and the first nonzero readback terminates execution. The accidental Subject Detection commit breaches the Off condition, but no subsequent emulator action occurs.

   No firmware-image construction, added visible menu entry, native-implementation claim, storage decision or hardware recommendation was found. Playback and session-end exits remain untested.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Follow the ROM-default tie-break, or obtain an explicit coordinator amendment before substituting K1 runtime values.
   2. Repair exit matching to compare actual action sequences, including press/release semantics and ordering.
   3. Resolve the measured indices 0/4 versus consumer banks 1/5. Validate mapped cells against target contents, reject stale target references, and assert Small and C1 `[5,7]` explicitly.
   4. Replace the wrong-page size sequence with an identity-checked path that preserves `0x1e71[0]=0`. Preserve the failed evidence.
   5. Complete the K1e reference and immediate hash, both candidates, every required sequence item, save, both reopens and reinitializations, full decoded M/E equality and terminal `ok:true`, within explicit run authorization.
   6. Correct the index/highlight wording and complete the required baseline-input inventory.

   Optional improvements: validate literal provenance against exact claims and add checker cases that reject reused exits, incorrect bank mappings and stale target records.