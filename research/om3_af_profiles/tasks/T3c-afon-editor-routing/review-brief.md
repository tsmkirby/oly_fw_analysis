# T3c correction review (Codex Sol, read-only)

Read `brief.md` §7, your previous review `audit\previous-review.md`, and the updated
`work\result.md`, `work\evidence-manifest.json`, `work\out\phaseA.md` and `work\out\design.md`. Also read
the full `work\out\overlay-changed-bytes.csv`, the new JSONL logs and screenshots, the command records in
`work\out\cmd\`, and `audit\`.

Report on the following:

- **E1–E4.** Check that each experiment changed exactly one thing against its stated baseline (verify the
  row and list bytes it wrote). Check that its OK outcome, setter calls, RAM-byte readback, and the
  before-and-after-OK snapshots support the stated result.
- **E2, if run.**
  - Verify every new option record against the input bytes: value, kind and text ID.
  - Check that each text ID really is the cited stock zone-name label.
  - Check that the chooser screenshot shows those options, that confirm writes the byte and that cancel
    does not.
- **The decision point.** Verify the first divergence and the values for 2154, 2155, C-AF Area and
  `0x3D6F` against the traces and the listing bytes (offset = address − `0x60021020`).
- **Acceptance, if run.** Check that both sessions passed every assertion and that the control used the
  same key sequence. Check the full-cell readbacks, the page renders and the byte-by-byte store
  comparison.
- **Your corrections 2–6.** Report DONE, NOT DONE or WRONG for each. Check that every command after the
  correction has real `.out`, `.err` and `.exit` records produced by `run_logged.mjs`, and that the earlier
  records are not reconstructed.
- **Overlay bytes.** Check the old value and section of every overlay byte; none may lie in sections 6 or
  7. Check that every behaviour-changing hook is labelled `EMULATOR-ONLY`.

Recompute every manifest hash. Use PowerShell; Python is not on your PATH. Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
