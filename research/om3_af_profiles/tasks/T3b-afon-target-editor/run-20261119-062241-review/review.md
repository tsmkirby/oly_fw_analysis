# T3b review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The evidence supports a useful partial emulator prototype. It does not establish completion: cancel fails, custom-preset editing remains unimplemented, the mode flag lacks owned-RAM justification, and acceptance and manifest completeness are overstated.

2. **Baseline checked:** `TASK.md`, `brief.md`, `review-brief.md`, `templates/review.md`, `work/result.md`, the complete manifest, stock-screen report, profile layout, design, overlay CSV, scripts, embedded step tables, JSONL records, command records and `audit/`.

   Research checked: T3i §0; T3j §0; T5 §0 and §5; `PROJECT-STATE.md` §3 and §6/Q5; `FEATURE-SPEC.md`’s 10 November revision and target-editor requirement; `AFON-MENU-RESEARCH.md` §1 and §8’s page-27 editor findings; T5 readiness README, target-byte report, design and overlay; T2’s capacity findings; and `HARDWARE-STAGE0-RECORD.md`’s owned-RAM analysis.

   Independently inspected representative Single, Small, C1 and cancel screenshots. Used PowerShell for verification. Did not run Ghidra or OM-Emu.

3. **Hash verification:** Recomputed SHA-256 and byte length for **every manifest entry**:

   - `inputs[0–9]`: **MATCH for each of all 10 entries**.
   - `sources[0–157]`: **MATCH for each of all 158 entries**, including imported modules and scripts.
   - `outputs[0–320]`: **MATCH for each of all 321 entries**.
   - Total: **489 MATCH; zero MISMATCH or missing files**.
   - The separately recorded brief hash also matches.
   - All 16 script-hash records in command exits match the current scripts, including resolution of `DisasmStockM2.java` under `work/scripts/`. All 17 command records’ wrapper hashes match. No executed-script modification is evidenced.

   Matching hashes do **not** establish manifest completeness. Missing records include command 17 and the hashes of `16.err`, `16.exit`, `16.out`, and all four command-17 files. Consumed research documents and the T5 runner identified in `result.md` are also absent from the input/source inventory.

4. **Claim-by-claim:**

   For the numbered findings in `result.md` §6:

   - **6.1 — CONFIRMED, with a qualification.** The stock logs show four shooting-screen arrow routes to `direct`, OK opening the color-profile SCP, and a separate AF Target Settings menu editor. The cited `open-up-down/left/right` records are actions within an already-open screen; the actual opener records are `open-down`, `open-left` and `open-right`. These measurements do not prove every native route was found. AF/metering was unwired, rather than successfully tested and found ineffective.
   - **6.2 — CONFIRMED for the recorded sequences.** Full readbacks show changes to `0x99a1[1]`, `0x5962[1]`, current dimensions and associated working cells. OK leaves saved index 0 unchanged; MENU leaves edited change indices intact. `0x9a41`, `0x99d2` and `0xdfa1` remain unchanged in those sequences.
   - **6.3 — CONFIRMED.** Setter observations and stock listings agree: mapped setter `0x6041937f` preserves the UI value and passes it in A1 to `0x60063431`. For example, the first right move records A1=`0x211` for `0x5962[1]`.
   - **6.4 — CONFIRMED.** Independently compared all 188 listed instruction byte strings with the decoded image at `address − 0x60021020`: zero mismatches. This verifies listing bytes, not completeness of the requested entry trace.
   - **6.5 — CONFIRMED for the observed pose; limitation supported.** Orientation-enable cells and pose remain zero in the records. E147’s model explicitly lacks accelerometer support, supporting the single-orientation boundary. The `rotate` switch is monitor rotation, so that switch alone would not establish body-orientation capability.
   - **6.6 — PARTLY CONFIRMED / UNSUPPORTED ownership implication.** The 55-byte mirror at `0xa031eeb0–0xa031eee6` is stock `FF`, avoids all Z5 rows and the relocated block, and lies inside the documented owned section-1 tail. The mode flag at `0xa031e91f` is also `FF` and avoids Z5, but lies **below** that tail’s documented start, `0xa031e920`. Its ownership is unproved. The entire reported 12,624-byte FF run must not be treated as owned RAM.
   - **6.7 — CONFIRMED within measured coverage; OVERSTATED as complete acceptance.** AF-ON-mode records preserve the listed half-press cells while profile values change. The normal candidate matches the stock control’s recorded cells and screen states. However, normal-edit assertions check only the zone byte and `ext0` for profile preservation. Logged profile values remain unchanged, but the emitted profile snapshot omits `0x9a41` and `0x5a11`; complete mirror invariance is not independently recoverable from that JSONL.
   - **6.8 — CONFIRMED for the tested keys.** C1 selection copies the session-seeded 4×6 preset into current dimensions. INFO and the recorded dial actions do not edit preset slots. This establishes preset consumption, not user editing of custom dimensions.
   - **6.9 — CONFIRMED store equality; SUPPORTED-NOT-INDEPENDENT reopen observation; OVERSTATED save coverage.** Independently decoded and compared all six acceptance stores. Every M bank is 262,144 bytes and every E bank 196,608 bytes; all corresponding banks are byte-identical, including confirm, stock, Z5 idle and normal-edit control. The reopen log reports zone byte 0. However, the runner’s `save` action only idles for 800 ms and records no save-post/completion evidence after editing. Reopen asserts only the zone byte, not usable defaults for the whole profile.
   - **6.10 — CONFIRMED.** Cancel leaves zone 6, position 427 and current size 4×6 in the profile instead of restoring initial zone 1, position 500 and size 1×1. The listed half-press cells remain unchanged. The runner stops with `ok:false`, and command 14 exits 1.

   For the remaining numbered result sections:

   - **§1 — CONFIRMED.** Scope labels and permitted inherited section-7 bytes are consistent with the artifacts.
   - **§2 — CONFIRMED input hashes; incomplete manifest coverage** of the stated research baseline.
   - **§3 — OVERSTATED command accounting.** Commands 01–15 and the manifest operation are described, but command 17 exists and is omitted from the manifest.
   - **§4 — SUPPORTED-NOT-INDEPENDENT** as an account of files the author read; several lack manifest hashes.
   - **§5 — WRONG completeness statement.** Not everything created under `work/` is listed.
   - **§7 — PARTLY CONFIRMED.** Most evidence pointers resolve; route citations and acceptance qualifications require the corrections above.
   - **§8 — OVERSTATED PASS wording.** Only one candidate completes confirm/save/reopen; the second candidate fails cancel. Exact visual title/glyph assertions are absent. Custom dimensions are seeded by the harness.
   - **§9 — PARTLY CONFIRMED.** New accessor measurements and mirror routing are supported; placement confirmation must exclude the mode flag.
   - **§10 — CONFIRMED uncertainties; UNSUPPORTED equivalence claim.** The tested global cell-accessor hook does not establish that branching at the mapped setter has identical effects.
   - **§11 — CONFIRMED.** Entry choices are explicitly Q5 options. The prototype adds no visible entry, and T6 remains separate.
   - **§12 — WRONG “No other deviation” statement.** Besides cancel, the work lacks the complete open/cancel entry trace, stock custom-zone screenshot, custom-preset editing, complete acceptance assertions and complete manifest.

5. **Contradictions with established findings:**

   - `HARDWARE-STAGE0-RECORD.md`, “Owned RAM analysis,” bounds the section-1 owned tail at `0x6031e920–0x6031f000`. Placing the session flag at cached equivalent `0x6031e91f` falls outside that established ownership argument.
   - `FEATURE-SPEC.md`, 10 November revision, item 2 requires editing custom target sizes. Selecting a harness-seeded preset does not satisfy that requirement.
   - No contradiction found with the Q5 decision boundary: visible-entry alternatives remain explicitly undecided.

6. **Alternative explanations** not excluded by the evidence:

   - Store equality may reflect unchanged persisted fields or saves occurring before the edit; the artifacts do not demonstrate a post-edit native save completion.
   - Reopening with an `FF` mirror may indicate uninitialized profile fields rather than restoration of usable defaults.
   - `screen === "direct"` can pass despite an incorrect visible zone title, glyph or target rendering; those visual identities are not asserted.
   - Leaving the session flag set after OK or MENU can redirect later accesses outside the editor. The global hooks are not restricted by caller or editor lifetime.
   - Stock working-index behavior explains the observed MENU result but does not prove rollback is impossible. A staged profile or entry snapshot could provide the required cancel behavior.

7. **Scope and safety:** No task-time writes outside `work/` are evidenced. The isolation audit reports zero violations, unchanged inputs and unchanged workspace. The four OM-Emu modifications are supplied baseline changes, not evidenced task additions.

   Independently checked all 3,262 overlay rows: stock-byte values and address offsets match the image; original columns match Z5. Section counts are 1,308 in section 1, 95 in section 2, 1,856 in section 4, and exactly the three permitted section-7 bytes. Their labels are retained; the section checker is present.

   Runtime routing is labelled `EMULATOR-ONLY` and combined. No firmware-image construction, SD output, storage decision, hardware recommendation or Subject Detect On claim was found. The mode-flag ownership gap remains material despite filesystem isolation.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Move the mode flag into verified free, owned RAM, or supply an ownership argument covering its present address. Bound the layout discussion to the documented owned range.
   2. Mark the deliverable as partial/BLOCKED pending cancel rollback and custom-preset editing. Preserve the failed run and remove “No other deviation.”
   3. Complete the stock measurements or explicitly list their gaps: open/cancel entry traces, untested/unwired routes, trace-discovered cells, and a stock custom-zone screenshot. Opening currently has zero call entries because tracing begins afterward; call lists during tours also reach the 500-entry cap.
   4. In a new runner version, assert visible title/glyph identity and full profile preservation after every key; retain complete snapshots. Demonstrate custom-dimension editing, post-edit native save completion, full-profile initialization on reopen, and the required two-session acceptance. Keep the supported orientation limitation.
   5. Repair the manifest with consumed research inputs, baseline helpers, command 17 and missing command-output hashes; refresh it last.

   Optional improvements: scope routing to the editor’s lifetime, document mode clearing on exits, and distinguish verified accessor behavior from unproved equivalence of alternative native hook sites.