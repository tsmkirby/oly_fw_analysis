# T3l review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Hook-driven exit cleanup and separate C1/C2 mirror edits are supported. Completion is not established: initialization was not exercised, playback’s following edit and session-end coverage are absent, acceptance remains incomplete, and every exit-runner version ends `ok:false`. The result reports most limitations honestly.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, manifest, supplement, profile layout and design. Inspected scripts and embedded sequences, JSONL records, command artifacts, overlay rows, representative screenshots and audit records.

   Research checked: T3j brief §0; T5 brief §0 and §5; T3b brief, decision and complete last Sol review; T3b final design, profile layout and stock-screen measurements. Checked emulator accessor, state-log, hook and power-off implementations.

   Used PowerShell for independent verification. Did not run Ghidra or OM-Emu or write files.

3. **Hash verification:** Recomputed SHA-256 and byte lengths for every manifest file entry:

   - `inputs[0–4]`: **MATCH for each of all 5 entries**.
   - `sources[0–161]`: **MATCH for each of all 162 entries**.
   - `outputs[0–472]`: **MATCH for each of all 473 entries**.
   - `commands[0–12].files`: **MATCH for each of all 52 entries**.
   - Separately recorded brief hash: **MATCH**.
   - Supplement’s manifest hash, manifest length and script hash: **MATCH**.
   - Each of the 141 module entries in each inventory `l1` through `l6`: **MATCH**; 846 checks total.
   - All 14 executed-script hashes and all 14 wrapper hashes: **MATCH**.
   - All 493 audit harvest hashes: **MATCH**.

   No executed-script modification is evidenced. Matching hashes do not establish completeness:

   - The supplement identifies command 14 but contains no hashes for `14.out`, `14.err` or `14.exit`. Those files also lack main-manifest entries.
   - The consumed T3b `stock-gaps-f2.jsonl`, read by `show_calls_l1.py`, is absent.
   - The emulator actually loads resource **0101** through `loadBlock()`. Its file is absent from the manifest; hashing input resource **0106** does not cover it. Independently computed 0101 SHA-256: `6d2bef74b4b2fa089f271529482f96505a170b91e79ab9b1a13f3ce8f7918226`.
   - Dynamic `use(...)` dependency coverage has improved: the inventories now include 140 emulator modules per experiment, rather than only the runner.

4. **Claim-by-claim:**

   For `result.md` §6’s numbered findings:

   - **6.1 — CONFIRMED.** Independently derived section ranges from the image and checked all 3,262 rows against stock bytes, addresses and inherited source columns. Counts: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only `0x610bf5e3–0x610bf5e5` enter sections 6/7.
   - **6.2 — CONFIRMED for descriptor payloads.** Independently read every listed descriptor record from the image: keys/counts agree and payloads are zero. This does not establish usable initialized editor behavior. The extra mirror `0x9a41[1]` has no corresponding descriptor byte.
   - **6.3 — CONFIRMED.** Stock traces support the direct-screen exit events and the custom-size editor remaining in `0x0b02`. Custom-size setter writes precede the recorded OK state event.
   - **6.4 — CONFIRMED for reached exits.** `leave()` inside the hook clears both flag aliases and restores both zone aliases. Recorded OK, MENU, S1, custom-size OK and playback exits show cleanup. Every-exit coverage remains unproved.
   - **6.5 — SUPPORTED-NOT-INDEPENDENT as a general requirement.** Restoring entry snapshot 0 produces the recorded parity. All tested snapshots are 0; arbitrary prior zone values and initialization-enabled sessions were not tested.
   - **6.6 — CONFIRMED within recorded fields.** Independently compared each following Up, dial and OK after OK/MENU/S1 in `exit-l4.jsonl`: candidate half-press arrays equal K1 and K2, and candidate zone equals K2. Candidate mirror snapshots in this version are empty because of the field-name defect. Half-press `0x1df1[8]` is omitted.
   - **6.7 — CONFIRMED for separate entries; OVERSTATED if read as complete isolation.** C1 changes mirror `0x1dd1[2,3]` to `[5,1]` and `0x1df1[4]` to 1. C2 changes `[4,5]` to `[5,1]` and `0x1df1[5]` to 1. Recorded half-press arrays remain unchanged; changed values match K1. Complete mirror snapshots include `0x1de1` and `0x5a11`. However, half-press `0x1df1[8]` is unobserved, and re-engagement erases C1 before C2. Screenshots independently show C1 and C2 at size 5×1.
   - **6.8 — CONFIRMED cleanup and state; UNSUPPORTED warning diagnosis.** Playback clears the flag, restores zone 0 and reaches `ID_ST_WARNING`, state 261. Recovery keys remain there. The screenshot displays **“One Moment”**, so describing the observed frame as a “no-picture warning” exceeds the evidence.
   - **6.9 — CONFIRMED.** Entry uses the session flag. No visible menu entry was added.

   For the other numbered sections:

   - **§1 — CONFIRMED** task identifier and brief version.
   - **§2 — CONFIRMED** baseline identification and listed input hashes; dependency completeness is qualified above.
   - **§3 — CONFIRMED** recorded experiment history and failures. Commands 08, 09, 11 and 12 exit 1.
   - **§4 — CONFIRMED** cited implementation details; historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — CONFIRMED** retained script hashes and workspace scope; **OVERSTATED** manifest completeness.
   - **§7.1–7.9 — CONFIRMED as evidence pointers**, subject to the corresponding §6 qualifications.
   - **§8 — CONFIRMED** incomplete/unreached outcomes. “Half-press unchanged” applies only to emitted fields. Orientations were correctly withheld because acceptance failed.
   - **§9 — CONFIRMED** new partial exit/custom-size evidence. The snapshot restoration refines the earlier proposal; T3b’s design specifically proposed restoring half-press index 1, rather than the entry snapshot.
   - **§10 — CONFIRMED** reported uncertainties and loss of C1 on re-entry.
   - **§11 — SUPPORTED-NOT-INDEPENDENT.** Proposed next steps are untested and insufficient alone: the dormant acceptance code still checks posted saves rather than completion, lacks full coverage and omits exact assertions on many steps.
   - **§12 — CONFIRMED.** Six experiment versions were consumed and required work remains unfinished.
   - **Owner decision Q5 — CONFIRMED.** No entry-route or storage decision was made.

   Acceptance remains **NOT DONE**. Capturing a screenshot/hash and emitting `pass:true` is not an exact assertion. Many `check()` calls lack visual, mirror, zone and cell expectations. Session-end’s dormant follow-up does not perform the required normal-edit comparison, and its result can report `pass:true` despite `follow-blocked`.

5. **Contradictions with established findings:**

   No contradiction with T3b’s accepted stock MENU behavior, placement or session-flag entry boundary. T3b decision’s “Not established” initialization and acceptance items remain unresolved.

   `profile-layout.md` documents nine descriptor bytes for `0x1df1`, while candidate runners read only eight half-press bytes. Thus complete half-press invariance required by T3l brief §2 items 4–5 is not established.

6. **Alternative explanations** not excluded by the evidence:

   - Snapshot restoration is supported for tested zero snapshots; other starting states may behave differently.
   - Seeding the mirror from current session values can conceal initialization and retained-profile defects.
   - The generic warning state and “One Moment” frame do not establish why playback stalls.
   - Store equality alone cannot establish completed post-edit saving.

   Independently decoded available stores against each version’s K2. All E banks match. Candidate M banks differ by **57 bytes in l4** and **59 bytes in l6**, first difference at offset 2. Candidate l3/l5 banks match K2; all K1 banks match K2. These runs have unequal completed sequences and do not constitute the required matched acceptance-store comparison.

7. **Scope and safety:** No task-time writes outside `work/` or new emulator modifications are evidenced. Isolation reports zero violations; workspace and inputs are unchanged. The four emulator modifications are supplied baseline changes.

   Behavior hooks are labelled `EMULATOR-ONLY`; l6 is labelled combined. No firmware-image construction, hardware recommendation, storage decision, added visible menu entry or Subject Detect On evidence was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Obtain coordinator authorization before further experiments: the six-version limit is exhausted.
   2. Complete playback’s following normal edit, session-end coverage and other identified exits; compare following edits against K2 and K1 as specified.
   3. Exercise descriptor-based initialization on entry, including mixed initialized/`FF` fields, and preserve existing mirror values across entries.
   4. Include half-press `0x1df1[8]`; retain C1 while editing C2 and assert all mirror and half-press fields.
   5. Complete exact assertions after every individual key, two fresh candidates, completed post-edit saves, full reopen checks and matched K2 store comparisons, ending `ok:true`. Fix dormant save and session-end assertions before reuse.
   6. Seal final command-output hashes; inventory consumed research and actual emulator resource files. Correct the playback warning description and qualify complete-invariance wording.

   Optional improvements: use unique step IDs—the l6 log reuses `size-compare`—and test restoration with a nonzero entry snapshot.