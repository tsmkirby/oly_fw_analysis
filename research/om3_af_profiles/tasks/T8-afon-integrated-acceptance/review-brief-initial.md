# T8 review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- `work\result.md`, `work\evidence-manifest.json` and its supplements.
- `work\out\config.md`, the step tables, the runners, JSONL logs, screenshots, stores, `work\out\cmd\` and
  `audit\`.
- The components in `ref\analysis\button-af\readiness\t6-afon-target-size-position\` and
  `ref\analysis\button-af\readiness\t3m-afon-editor-state-leak\`, and your last T6 and T3m reviews.

## Check

1. **Integration.**
   - The configuration consists only of accepted components.
   - The two overlays differ only in the 15 profile-read bytes.
   - No new behaviour change was made.
2. **Controls first.** The K1/K2-only version ends `ok:true`, including the save and the reopen. K2 is matched
   on keys, edges, exits and the save, and the AF-ON editor keys it skips are stated.
3. **Save.**
   - Navigation is identity-guided, and the AF Target Mode row is asserted before the commit.
   - A new E and a new M arrive after the recorded baseline, each with a captured image and its own status-0
     completion, including the posted M.
   - Earlier saves cannot satisfy the check.
   - The persisted cells are asserted against explicit expectations.
4. **Acceptance.** Every item of §2.3:
   - Initialization.
   - The editor-made Small at the edited position, on the AF-ON-owned edges.
   - The stock half-press elsewhere.
   - The EXIF-6 bank-5 edit, and its use, with bank 1 unchanged.
   - C1 `[5,7]` in the AF-ON target, with the half-press C1 and the `0x62954108` record equal to K2.
   - The size check.
   - For each candidate: the reopen, with the `FF` mirror, the All press and the stock release, the focus
     comparison, and re-initialization.
   - Zero store differences against K2. **Decode both candidates' stores and compare them with K2 yourself.**
   - `ok:true`.
5. **Step table.**
   - Complete: every key and every edge.
   - Explicit expected values for every listed field.
   - Each expectation is a literal or a K1/K2 row with the same step ID, never a candidate's own observation.
   - A missing reference fails, and there is no `check(id, [])`.
6. **Records.**
   - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
   - The manifest is complete, including the final outputs.
   - No script was edited after it ran.
   - `0x1e71[0]` was read back.
   - No visible menu entry.
   - Nothing is presented as native or as a storage decision.

This task is the candidate proof for completion condition A, except for persistence (Q7) and display (T9).
State plainly whether each required behaviour in PROJECT-STATE §3 is demonstrated, not demonstrated, or out of
scope.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
