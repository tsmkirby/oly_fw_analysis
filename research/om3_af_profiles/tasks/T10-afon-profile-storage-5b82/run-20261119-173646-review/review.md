# T10-afon-profile-storage-5b82 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The saved record and its restricted store differences are independently supported. Acceptance remains incomplete: reset failed, corruption and art-filter tests never ran, the second candidate was not reached, and there is no overall `ok:true`.

   Additional defects require correction: the codec excludes accepted zero-initialized custom values, the profile getter always selects bank 1, navigation lacks the required per-key assertions, and the manifest omits transitive emulator modules.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md` including §5, `templates/review.md`, `audit/previous-review.md`, `work/result.md`, encoding, reader audit, codec, unit tests, acceptance runners and their differences, command records, JSONL evidence, stores, manifest, current seal, and audit records. Inspected representative candidate/control press and release screenshots.

   Research checked: T2 and T2b decisions and final reviews; `AFON-MENU-RESEARCH.md` §8’s settings, ownership, bank initialization and checksum findings; T3m’s profile layout; T3l’s initialization design; T4b’s boot-order README; inherited T3j/T5/T6 rules; T6’s field-source and orientation design; and T8’s amended save criterion.

   Independently checked 63 submitted byte assertions, 639 additional listing instructions, descriptor tables, table-B exclusion, registration defaults, overlay sections, and decoded store differences. Ran neither Ghidra nor OM-Emu. The codec suite was inspected against its recorded output; it was not rerun because `node26` is unavailable in this review environment.

3. **Hash verification:** Every recomputed entry below is **MATCH**, including byte lengths. Array ranges refer to every entry in the indicated manifest array.

   - `inputs[0–29]`: all **30 MATCH**, including both images, `all-functions.asm`, T2’s review, cited research, and the previous review.
   - `sources[0–18]`: all **19 MATCH**, including `codec.mjs`, its tests, acceptance versions c–h, audit scripts, wrapper, manifest builders and seal scripts.
   - `outputs[0–150]`: all **151 MATCH**, including `result.md`, encoding, audit JSON, command records, acceptance/session logs, NVRAM stores, 26 screenshots and the historical seal.
   - `emulator_modules[0–11]`: all **12 MATCH**.
   - `commands[0–14]`: all **75 nested script/file references MATCH**.
   - Current `seal-t10d.json`: all **86 nested references MATCH**, including the manifest, result, encoding, reader audit, seal script, completed commands 01–16 and command 17’s request.
   - All **179 host-harvest entries MATCH**, including the current seal and command 17’s completed outputs.
   - All 17 distinct execution-record helper/resource entries checked **MATCH**. All 17 command records’ recorded script hashes match current files.
   - Normalized OM-Emu diff **MATCHES** the pinned `61cd1327…877702`.

   The current manifest hashes to `e49e7ac2490192a71b170ed6ede91d65edae10b987ce32784097a0ba36f026f3`.

   Hash consistency does not establish completeness. Missing modules include directly imported `emu/src/lab/menu.mjs` and transitive `fw/facts.mjs`, `lab/rtos.mjs` and `src/machine.mjs`. Execution-hashed resource/overlay paths are also omitted from the primary manifest.

4. **Claim-by-claim:**

   The opening reader classifications are **CONFIRMED within their stated limits**. Table B contains no aligned `0x5b82` halfword across its 61 records. The +0x50/+0x52 index expressions have bounds `0..65535`; key exclusion, rather than restricted indices, makes these sites SAFE. The diagnostic and object-pointer explanations agree with the checked evidence.

   The five unidentified data occurrences and three singleton sites appropriately remain **UNRESOLVED**. Bulk settings load/save reads unnamed bytes and is correctly flagged **REACHES-UNNAMED**. The qualified inventory does not establish exhaustive ownership.

   Numbered findings:

   - **6.1 — CONFIRMED arithmetic; WRONG as unrestricted lossless coverage.** The implemented domains use `12 + 8 + 33 + 40 + 24 = 117` payload bits. Marker 16, version 8, padding 3 and CRC 16 give **160 bits**, leaving **48 spare bits**. However, `DIM_V`, `DIM_H`, `STEP_V` and `STEP_H` omit zero. The image’s registrations at `0x600e4f4c` and `0x600e4f5c` contain zero defaults, and accepted T3l initialization explicitly creates zero custom fields. `encode()` rejects those values. Thus “nothing was dropped” is false for accepted profile states, although all named fields are represented.
   - **6.2 — CONFIRMED.** Checked byte/halfword stores have no value clamp. UI 1803 maps to `0x9a41`, with no matching descriptor in the scanned table; retaining its full byte width is appropriate.
   - **6.3 — SUPPORTED-NOT-INDEPENDENT for the recorded test execution; CONFIRMED for source coverage.** The suite contains the reported round-trips, zero/FF/stock-like records, 208 bit flips, invalid zone code and bad version checks. Command 09 records exit 0. It omits accepted zero-initialized custom profiles and partially initialized preset/step arrays.
   - **6.4 — CONFIRMED from the records.** Subject Detect readbacks are zero on the recorded presses. K1’s target matches the stated stock bytes.
   - **6.5 — CONFIRMED narrowly.** Logs identify the AF tab/row and posted M status 0. Independent store decoding places the cells at M+1446, corresponding to live `0x62920ca6`. Most navigation keys are not individually asserted.
   - **6.6 — CONFIRMED for the recorded landscape trial.** c1 restores the stated 71-byte mirror, presses with `11 02 03 00 01 00 01 00 00 00`, owner 2/status 0/enabled 1, and releases with the same half-press target as K2. This does not establish per-pose correctness: `installRead().bank()` returns 1 on both branches, never reads the pose word, and its refresh function is unused.
   - **6.7 — CONFIRMED independently.** Both g and h store pairs have M differences exactly at **2, 3, 1446–1455 and 1458–1467**. Named indices remain `0x0c80`; E is byte-identical at 196,608 bytes. Candidate M’s complete halfword sum is zero. Extracted record:
     `0f a7 01 62 01 10 21 0a 89 06 04 c8 60 a2 94 d0 9e 01 08 e4 00 00 00 00 00 00`.
     Its marker/version and CRC `0xe408` validate. Independently unpacked zones, size, positions, dimensions and steps equal profile A.
   - **6.8 — CONFIRMED for unchanged cells; SUPPORTED-NOT-INDEPENDENT for completed native Assign/Recall.** The before/after arrays match. The runner attempts those operations, but optional confirmation handling and absent per-key state/completion witnesses weaken the claimed PASS.
   - **6.9 — CONFIRMED for the recorded failures and final implementation.** Commands 10/11 record overlay-hook and return-state failures. The final observer directly reads the matched live key image; initial publication after preparation uses the stock getter.
   - **6.10 — CONFIRMED.** Reset did not complete; corruption and art-filter tests were not reached.

   Remaining numbered sections:

   - **§1 — CONFIRMED** task/version and owner-selected storage scope.
   - **§2 — CONFIRMED** input identity and available research artifacts; historical reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** six recorded emulator command versions, 10–15, all exiting 1. Their execution history is **SUPPORTED-NOT-INDEPENDENT** beyond the supplied records.
   - **§4 — CONFIRMED** cited addresses and artifacts. Boot publication occurs after `prepare()`, following session opening; it is a harness action rather than an installed native boot hook.
   - **§5 — CONFIRMED** delivered files; **OVERSTATED** if interpreted as complete evidence coverage because transitive imports are missing.
   - **§7 — CONFIRMED** evidence references, subject to the limitations above.
   - **§8 — CONFIRMED** incomplete overall outcome. Save/reopen and store difference pass for the exercised c1 trial. Reset is unverified, corruption/art-filter behavior is untested, c2 is absent, and C1 completion evidence needs strengthening.
   - **§9 — CONFIRMED** withdrawal of the raw-width impossibility claim and restored singleton inventory. **OVERSTATED** if treated as preserving all T6 behavior: orientation selection regressed.
   - **§10 — CONFIRMED** disclosed test uncertainties and unknown Workspace backup behavior.
   - **§11 — SUPPORTED-NOT-INDEPENDENT** proposed reset navigation. Additional experiment allowance is necessary, but navigation fixes alone do not address the codec, orientation, assertion or manifest defects.
   - **§12 — CONFIRMED** listed deviations; **INCOMPLETE** because it omits those additional defects and the unreached second candidate.

   Correction-round §5 status:

   - **Item 1 — WRONG in domain completeness.** Descriptor tables match the image, unknown size retains full width, and arithmetic is correct. Editor-choice tables do not exclude accepted zero-initialized profile values.
   - **Item 2 — NOT DONE.** Encoding fits, so §2.2–2.5 remain required. Implementation is partial, six-test acceptance is incomplete, and there is no overall `ok:true`. Exhaustion of the six-version allowance is honestly reported.
   - **Item 3 — DONE.** Three singleton sites restored; normal-operation inventory qualified.
   - **Item 4 — NOT DONE overall.** Requested research inputs and refreshed seal are present, bounds are corrected, and the main observation is called a byte-pattern run. Complete transitive evidence coverage remains missing.

5. **Contradictions with established findings**:

   - T3l design, **“Initialization,”** establishes zero-initialized custom fields and preservation of mixed initialized values. The codec’s positive-only custom tables contradict those accepted states.
   - T6 design, **“What the AF-ON record must read instead,”** requires pose/link selection of banks 1/5/3. T10’s getter always chooses bank 1.
   - Inherited T3j brief **§0** requires every direct/transitive imported emulator module in the manifest. The submitted module inventory is incomplete.
   - T10 brief **§0**, inheriting T3j/T5/T6, requires assertions after every key and edge. `menuSave()`, navigation loops and `MenuWalk` operations execute keys without those assertions.

   No contradiction was found in the restored unresolved inventory, stock checksum interpretation or restricted store differences.

6. **Alternative explanations** not excluded by the evidence.

   - Unidentified data may have computed-offset consumers that interpret unnamed cells.
   - Profile A’s positive custom values and landscape-only press conceal the codec-domain and orientation defects.
   - Unchanged cells alone cannot demonstrate successful C1 assignment and recall.
   - Unexercised reset/art-filter paths may overwrite or interpret the record.
   - Missing transitive execution hashes prevent establishing that every imported script remained unchanged after execution.

7. **Scope and safety:** No prohibited source writes, new flash writer, packaged image construction or hardware recommendation was found. Artifact writes target `work/`; the isolation audit reports zero violations, and the OM-Emu diff matches the pre-existing pin.

   Store uses stock setter `0x60063431`, with getter readback, followed by stock menu save. Initial load uses getter `0x60063380` after session preparation. Behavior and setup changes are labelled; the AF-ON entry republish instead reads live memory directly, as disclosed.

   Independently computed overlay placement matches all 3,262 rows: section 1 **1,308**, section 2 **95**, section 4 **1,856**, and section 7 **3**. Only `0x610bf5e3`–`0x610bf5e5` occur in section 7; none occur in section 6.

   `0x1e71[0]` readbacks are recorded as zero. Workspace backup behavior is explicitly out of scope and unknown. This review performed no writes.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Include accepted zero-initialized and partially initialized custom values in the codec domain. Recompute packing and add round-trip tests; use full width wherever the complete legal range remains unestablished.
   2. Restore T6’s pose/link bank selection and verify persisted profiles in banks 1, 5 and 3.
   3. Add exact, uniquely identified assertions after every navigation key and edge, including confirmation/completion evidence for C1 operations.
   4. Under renewed experiment allowance, complete both candidates, native reset with invalidation/fallback, corruption reopen, and named-cell art-filter cursor comparisons. Require overall `ok:true`.
   5. Complete the manifest with all direct/transitive emulator imports and consumed resources, identifying execution-time versus later hashes; refresh the external seal.
   6. Update result/deviation wording to include the domain restriction, orientation regression, missing assertions, incomplete manifest and unreached second candidate.

   Optional improvements: retain the independently validated store-diff result as a separate check that remains reviewable when later UI tests fail.