# T5 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The recorded P1–P3 handoffs support the core EMULATOR-ONLY result. The submission does not meet the review requirements: three overlay bytes are in section 7, acceptance lacks assertions after every key, the acceptance runner ends in failure, and the manifest omits consumed inputs.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, the complete manifest, `target-bytes.md`, `design.md`, and the complete overlay CSV. Inspected the scripts, tables, all JSONL logs, command records 01–41, and `audit/`. Visually inspected nine screenshots covering chooser navigation, commits, and both acceptance sessions’ zone changes.

   Research checked: T3j brief §0 and decision; promoted T3 README and T3i design; AFON-MENU-RESEARCH §8’s live input, native initialization, central dispatch, corrected C-AF selection, and limitations; PROJECT-STATE §3; central-edge metadata and CSV.

   Independent checks used PowerShell only. No Ghidra or OM-Emu execution and no filesystem writes.

3. **Hash verification:** The following uses one-based array indices in `work/evidence-manifest.json`; each entry in each stated range was individually recomputed.

   - `brief_sha256`: **MATCH**.
   - `inputs[2–160]`: **MATCH**, every entry.
   - `sources[1–33]`: **MATCH**, every entry.
   - `outputs[1–402]`: **MATCH**, every entry.
   - `inputs[1]`, `DisasmRangesK1.java`: **MISMATCH — unresolved manifest path**. The actual `work/scripts/DisasmRangesK1.java` matches its recorded execution hash.
   - All script and wrapper hashes in command records 01–41: **MATCH**. No execution-hash evidence of scripts being edited after running.
   - All 439 harvested-file hashes in `audit/run-log.json`: **MATCH**.
   - Audit input-image and brief pins: **MATCH**. The initial emulator-diff pin matches after normalizing the copied diff’s CRLF line endings to LF.

   Completeness defects remain despite matching hashes. The manifest omits the consumed T3j overlay CSV and acceptance table, and the promoted overlay CSV read by `static_overlay_k1.py`. It also omits final command `41.out`, `41.err`, and `41.exit`; its explanation incorrectly names two command-39 files. The 143-module inventory has no missing resolvable static relative imports.

4. **Claim-by-claim:**

   For numbered findings in `result.md` §6:

   1. **CONFIRMED, with qualification.** The field writes support position at +0, kind +2, size +3, vertical +4, horizontal +6, priority +8, and `0x1e01` at +9. Orientation selects banks rather than occupying a dedicated target byte. Independently checked all 314 listed instructions against stock bytes plus the central-edge CSV: zero mismatches. These are overlay listings; 901 listed bytes differ from raw stock. The builder must remain identified as overlay code.

   2. **CONFIRMED.** The legacy read’s twenty bytes match the reconstructed central-edge memory, including the stock-equal `FF` displacement byte. This is an overlay’s legacy-provider read, not a stock-native builder finding.

   3. **CONFIRMED, with a section violation.** The originals overlap at 349 addresses, with 182 conflicting values. All 368 Z bytes survive identically in the final CSV. The final 3,262 rows have correct stock values, correct offsets, and no duplicate addresses. However, three rows remain in compressed section 7:
      `0x610bf5e3: 98→9e`, `0x610bf5e4: 2c→f5`, `0x610bf5e5: fd→25`.
      Therefore the requirement that no overlay byte lie in sections 6 or 7 fails.

   4. **CONFIRMED.** Relative to the combined configuration, the swap changes exactly 15 bytes within the twenty-byte region `0x60a8f708–0x60a8f71b`, with no other byte changes. It reads `0xa031e920` and jumps to `0x60a8f71c`. The retained legacy sources and kind-2 position override are stated correctly. Custom-zone dimensions still depend on `0x1dd1`.

   5. **OVERSTATED.** All 140 recorded page-table assertions and 60 shared candidate/control comparisons check out. Commits are 2 and 9, and watched cells remain unchanged. However, the claimed header correction is incomplete: `pageTitle()` returns `"glyph-header"` merely because a recognized help sentence exists. It does not independently assert the header glyph’s identity. Screenshots show the expected appearance, but the executable assertion required by brief §0 is absent.

   6. **CONFIRMED as recorded EMULATOR-ONLY evidence.** P1, P2, and P3 each contain twelve passing edges with the stated target records and owners. P3 records both stored setting 289 and active setting 25 as 1, using converter `0x604050e5` and the Fn-lever setup.

   7. **CONFIRMED, bounded to these runs.** Both release orders restore the overlay’s captured half-press record and expected owner. AF-ON retains precedence while held. That restored record differs from the no-overlay control’s target.

   8. **CONFIRMED.** Both controls record `[14,2,2,0,27,0,39,0,0,0]` throughout their twelve edges. The C-AF control’s first target lacks an executable literal assertion; subsequent expectations derive from that first observation. The edge lists match, but candidate sessions additionally navigate the menu, and `controlSnaps` is unused.

   9. **CONFIRMED for the observations; OVERSTATED as isolation proof.** P4 records unchanged Single output after writing `0x9fa1=1`, then Small after setting the profile to 2. However, legacy value 1 also denotes Single, so the repress comparison does not distinguish the providers. P4 also lacks full per-edge invariant assertions and a matching no-overlay control.

   10. **CONFIRMED for stored bytes and reopen observation; acceptance OVERSTATED.** Independently decoded and compared both banks: candidate sessions match each other; both match the later page-27 control; the original control differs by 51 M bytes and zero E bytes. Reopen records profile 0 and asserts the All target with owner 2. Nevertheless, `accept-edges-k3.jsonl` ends `ok:false` at the first store comparison. The replacement control has no edge assertions and sets `fatalShots:false`.

   Additional numbered result sections: §§1–2 are broadly supported, including unchanged emulator sources relative to the supplied baseline. §3’s command summary is incomplete: records extend through 41. §5’s claim that everything is manifested is wrong. §8’s acceptance PASS wording overstates the evidence. §§9–12 appropriately retain emulator, RAM, packaging, and Subject Detect limitations, but omit the assertion and manifest defects above.

5. **Contradictions with established findings:** No demonstrated contradiction with PROJECT-STATE §3 or AFON-MENU-RESEARCH §8’s bounded handoff findings. AF Home is correctly treated as superseded, and Subject Detect On remains outside the evidence.

   The section-7 edit is acknowledged in `design.md` and consistent with the older central-edge limitation, but violates this review brief’s explicit section restriction. The page-header assertion also remains inconsistent with T5 brief §0’s required runner correction.

6. **Alternative explanations** not excluded by the evidence:

   - Control/candidate differences include menu activity and candidate runtime hooks. Identical button edges alone do not isolate every setup difference.
   - The focus writer changes `0x1dd1` before measured edges. Subsequent invariance establishes preservation from that prepared state.
   - P4’s legacy write selects the same Single zone as the profile, weakening its negative control.
   - Matching final stores and the separate reopen support RAM-only behavior, but do not constitute the required fully asserted save/reopen acceptance sequence.
   - These records establish routing and target handoff under the modeled setup, not sensor/lens focus acquisition.

7. **Scope and safety:** No writes outside the permitted task areas or new emulator changes were found. The audit reports zero isolation violations; the four modified emulator files belong to the supplied baseline, whose diff pin matches after line-ending normalization.

   No firmware container, installable image, storage decision, or hardware recommendation was found. Behavior changes are labeled EMULATOR-ONLY through the harness records. No result is presented as Subject Detect On evidence. The three section-7 overlay bytes remain a concrete review-requirement failure.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Resolve the section-7 overlay violation. Either use a compliant runtime mechanism or obtain an explicit amendment permitting these three bytes; a packaging caveat alone does not satisfy the restriction.
   2. Complete acceptance with literal assertions after every navigation key, edge, save, and reopen step. Use a matched control, assert its targets, retain fatal screenshot handling, and require a successful final result.
   3. Assert the chooser header glyph independently of its help sentence.
   4. Give P4 a distinguishing legacy value, complete per-edge owner/invariant checks, and a matching control; otherwise narrow its claim.
   5. Repair the manifest paths and missing consumed inputs, account accurately for command 41, and correct the acceptance PASS and completeness wording.

   Optional improvements: Separate stock-native findings from injected overlay listings more explicitly, and retain an executable audit for every overlay byte’s section membership.