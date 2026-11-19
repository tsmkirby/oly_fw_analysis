# T8 correction review (Codex Sol, read-only)

## Read

- `brief.md` §5, including the coordinator's change of method, and your previous review in
  `audit\previous-review.md`.
- The updated `work\result.md`, the manifest and its supplements, the table-checker output,
  `out\reference-v1.json`, the step tables, runners, JSONL logs, screenshots, stores, `work\out\cmd\` and
  `audit\`.

## Report

For each of §5 items 1–4, report DONE / NOT DONE / WRONG / BLOCKED (honestly reported), with evidence.

## Check in particular

- **Table check.**
  - The checker ran before the emulator runs.
  - The table is matched across roles.
  - C1 is coherent.
  - Bank 1 is preserved.
  - The S1 exit is real.
- **Reference run.**
  - Only the listed invariants were asserted.
  - `reference-v1.json` was hashed straight after the run.
  - Screenshot errors are fatal.
  - The save used identity-guided navigation, with the AF Target Mode row asserted first.
  - A fresh E and a fresh M after the baseline, each with a captured image and its own status-0 completion,
    including the posted M.
  - The K1 and K2 store comparison.
- **Candidates.**
  - Every field at every step is asserted against a same-step K1/K2 reference or a stated literal, and never
    against the candidate's own observation.
  - A missing reference fails.
  - Every acceptance item of §2.3.
  - Both reopens, with re-initialization.
  - `ok:true`.
  - Decode both candidates' stores and compare them with K2 yourself.
- **Behaviour.** State plainly whether each required behaviour in PROJECT-STATE §3 is demonstrated, not
  demonstrated, or out of scope (persistence is Q7; display is T9).
- **Records.**
  - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
  - Manifest completeness, including the final outputs.
  - No script edited after it ran.
  - `0x1e71[0]` read back.
  - Nothing presented as native or as a storage decision.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
