# T3l review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Entry initialization, profile retention, nonzero snapshot restoration, and the Subject Detect erratum are supported. Acceptance remains incomplete and reveals a half-press position mismatch beyond the reported blank title. Records remain incomplete. The result honestly reports most unfinished work.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md`, `audit/previous-review.md`, `templates/review.md`, updated `work/result.md`, manifest, supplement, profile layout and design.

   Inspected correction runners and embedded sequences, JSONL records, representative screenshots, overlay rows, command records and audit artifacts. Research read: T3j brief §0 and assertion requirements; T5 brief §0 and §5; T3b brief, decision, complete last Sol review and final design. Checked emulator initialization, accessor routing, save logging, shutdown and Subject Detect definitions.

   Used PowerShell for independent verification. Did not run Ghidra or OM-Emu or modify files.

3. **Hash verification:** Recomputed SHA-256 and byte lengths for every manifest file entry:

   - `inputs[0–4]`: **MATCH for each of all 5 entries**.
   - `research[0–1]`: **MATCH for each of both entries**.
   - `resources[0–1]`: **MATCH for each of both entries**, including actual emulator resources 0100 and 0101.
   - `sources[0–178]`: **MATCH for each of all 179 entries**.
   - `outputs[0–799]`: **MATCH for each of all 800 entries**.
   - `commands[0–29].files`: **MATCH for each of all 120 entries**, covering commands 01–30.
   - Separate brief hash: **MATCH**.
   - Supplement’s manifest hash, manifest length and script hash: **MATCH**.
   - Each of 141 module records in each inventory `l1–l6` and `m1–m6`: **MATCH**, 1,692 checks.
   - All 27 executed-script hash records and all 31 wrapper hashes: **MATCH**.
   - All 831 audit harvest records: **MATCH**.

   No executed-script modification is evidenced. Matching hashes do not establish completeness:

   - `31.out`, `31.err` and `31.exit` lack hashes in both manifest and supplement. The supplement describes their omission without sealing them.
   - Consumed `stock-gaps-f2.jsonl`, explicitly read by executed `show_calls_l1.py`, remains absent.
   - Baselines identified as consumed—including the T3b decision, last Sol review, `accept_f3.mjs` and design—are absent.

4. **Claim-by-claim:**

   For `result.md` §6’s numbered findings:

   - **6.1 — CONFIRMED.** Independently derived section boundaries from the image and checked all 3,262 overlay rows against stock bytes, address offsets and inherited source columns. Counts: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only `0x610bf5e3–0x610bf5e5` enter sections 6/7.
   - **6.2 — CONFIRMED for descriptor-backed fields.** Independently read the listed descriptor keys, counts, widths and zero payloads. The mirror’s second `0x9a41` byte has no corresponding descriptor byte; zero there is an implementation choice, correctly disclosed in the layout.
   - **6.3 — CONFIRMED within its historical qualification.** Earlier OK/MENU/S1 cleanup and following-edit results concern `exit_l4`, whose entry recopied half-press values. They do not establish parity with the corrected initialization. Playback’s “One Moment” description is corrected; session-end flag coverage remains absent.
   - **6.4 — CONFIRMED.** `initMirror()` writes only byte `FF` or word `FFFF` fields to zero. Independently compared complete recorded mirrors: all-`FF` initialization, mixed values retained, C1 retained through C2 entry/edit, and survival through a normal edit and re-entry. C1 writes `[1,33]`, `[5,8]` and `0x1df1[4]=1`; C2 retains those and adds corresponding C2 values. Listed half-press fields, including nine `0x1df1` bytes, remain unchanged during these AF-ON edits. The Single screenshot draws, its expected title hash is asserted, and m3 ends `ok:true`.
   - **6.5 — CONFIRMED.** `snap-preset → snap-open → snap-ok` records zone `4 → 1 → 4`, with both flag aliases cleared and both zone aliases restored by the exit hook.
   - **6.6 — CONFIRMED.** `detect-read` records `0x1e71[0]=0`; the stock screenshot visibly shows “Subject Detection — Off.” The model also identifies 0 as OFF. No setting change is evidenced, and current claims do not rely on `0x90a1`.
   - **6.7 — CONFIRMED failure; OVERSTATED stopping point and incomplete diagnosis.** K1/K2 half-press arrays and titles match through n1–n3. Candidate’s first normal Up matches their cells but has the reported blank title. However, `normalKeys()` executes the subsequent dial and OK before comparing that Up. Independently checked those later records: both `n1-dial` and `n1-ok` have candidate `0x5962[1]=994` and `0x88b2[0]=994`, versus **526 in both K1 and K2**. Thus a cell-parity failure also exists. Candidate c2, candidate save, store comparison and reopen are unreached.
   - **6.8 — CONFIRMED timeout; SUPPORTED-NOT-INDEPENDENT cause.** m4/m5 record the 10,000 ms shutdown timeout. The TRA 586/HLS explanation agrees with `power.mjs`; these runs do not independently isolate that wait.

   For the other numbered sections:

   - **§1 — CONFIRMED** task and correction-round identification.
   - **§2 — CONFIRMED** resource distinction and baseline identification; **OVERSTATED** consumed-input inventory completeness.
   - **§3 — CONFIRMED** experiment history and retained failures, subject to the delayed-comparison qualification above.
   - **§4 — CONFIRMED** inspected implementation details; historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — CONFIRMED** observed workspace scope and matching script hashes; **OVERSTATED** manifest completeness.
   - **§7.1–7.8 — CONFIRMED as evidence pointers**, with the corresponding qualifications above.
   - **§8 — CONFIRMED** reported failed/unreached outcomes. m3’s focused success does not satisfy acceptance.
   - **§9 — CONFIRMED** distinction between new entry/restore evidence and historical exit evidence.
   - **§10 — SUPPORTED-NOT-INDEPENDENT** timing hypothesis; it omits the independently observed subsequent position mismatch.
   - **§11 — UNSUPPORTED as a sufficient repair.** Waiting for a title does not establish resolution of the recorded cell mismatch or missing assertions.
   - **§12 — CONFIRMED** six-version exhaustion and conditional omissions; **WRONG** save-log ordering description. `menu.mjs:879–880` appends the save record before returning/calling back with status 0. The runner checks `posted` and bank lengths, not an explicit completion status or persisted-cell expectations.
   - **Owner decision Q5 — CONFIRMED.** Session-flag entry remains; no visible menu entry or storage decision was added.

   Correction-round status:

   - **Correction 1 — DONE** for the requested entry, mixed-mirror, retention and drawing demonstrations.
   - **Correction 2 — NOT DONE.** Only one candidate starts; acceptance ends `ok:false`. Session/step pairs are unique, and nine half-press `0x1df1` bytes are included. Nevertheless, many steps lack exact visual, mirror or half-press expectations. Control `normalKeys(...,{})` provides no such assertions; custom-size steps omit mirror/title/zone expectations. Control comparisons occur after three keys rather than immediately. Candidate save, reopen and matched-store acceptance are absent.
   - **Correction 3 — DONE** for the demonstrated nonzero snapshot 4.
   - **Correction 4 — BLOCKED, honestly reported.** Acceptance prerequisite failed; playback’s following normal edit and direct-screen session-end flag readings were not run. Warning wording is corrected.
   - **Correction 5 — BLOCKED, honestly reported.** Acceptance prerequisite failed; orientations were not run. The unused required `pose.mjs` hash matches `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`.
   - **Correction 6 — NOT DONE.** Resource coverage and invariance wording improved; final command sealing and consumed-research coverage remain incomplete.
   - **Erratum — DONE.** Correct key, readback, stock Off text and corrected interpretation are supplied.

5. **Contradictions with established findings:**

   No contradiction with T3b decision’s accepted MENU behavior, owned placement or Q5 boundary.

   Complete acceptance remains contrary to the requirements of T3l brief §5 item 2 and inherited T3j assertion rules. Earlier `exit_l4` parity cannot establish corrected-entry parity: the new m6 position records differ from both controls.

   The save-log ordering claim contradicts the inspected `_s_nand_write()` implementation.

6. **Alternative explanations** not excluded by the evidence:

   - Display timing may explain the blank title, but does not establish an explanation or repair for the later position mismatch.
   - Editor state outside the restored zone byte may affect subsequent normal edits.
   - Unequal completed sequences and saves prevent attributing store differences specifically to profile persistence.

   Independently decoded available correction-round acceptance stores against each version’s K2:

   - m4/m5 K1: M differs by **65 bytes**, first at offset **2**; E matches. Neither candidate store exists.
   - m6 K1 and c1: each M differs by **65 bytes**, first at offset **2**; E matches. c2’s store is absent.

   M banks contain 262,144 bytes and E banks 196,608 bytes. These are not successful matched acceptance-store comparisons.

7. **Scope and safety:** No task-time writes outside `work/` or unapproved emulator changes are evidenced. Isolation reports zero violations and unchanged workspace/inputs. The four emulator modifications match the supplied baseline diff after newline normalization.

   Behavior hooks are labelled `EMULATOR-ONLY`. Overlay section labels and the checker are retained. No firmware-image file construction, SD output, hardware recommendation, storage decision, visible menu entry or Subject Detect enablement was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Obtain coordinator authorization before further experiments; all six correction versions are exhausted.
   2. Investigate and resolve the corrected-entry normal-edit position mismatch against K1/K2; update the result’s diagnosis and stopping chronology.
   3. Complete table-driven exact assertions immediately after every individual key, including navigation and custom-size steps. Cover two candidates, completed post-edit saves, persisted-state checks, reopen and K2 store equality, ending `ok:true`.
   4. After prerequisites pass, complete playback’s following normal edit, direct-screen session-end flag readings and orientations using unchanged `pose.mjs`.
   5. Seal command 31’s final output hashes, inventory every consumed research input, and correct save-completion wording/assertions.

   Optional improvements: preserve explicit expected and actual values in each assertion record, and add a mixed-mirror case retaining a nonzero word field.