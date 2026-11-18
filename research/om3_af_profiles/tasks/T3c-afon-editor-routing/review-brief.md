# T3c review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\phaseA.md`,
`work\out\design.md`, `work\out\overlay-changed-bytes.csv`, the JSONL logs, the screenshots, the command
records in `work\out\cmd\` and the audit copies in `audit\`.

**Phase A.**
- Verify the editor decision point from the static listing, checking it against the bytes of
  `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`) and against the dynamic trace.
- Check the stated decision values for 2154, 2155, C-AF Area and `0x3D6F`.
- Check the native-route search for pages 28 and 29. If they were constructed directly, confirm that the
  construction is labelled `EMULATOR-ONLY reference construction` and ran on a stock session.
- Check the R1 and R2 ratings against the evidence.

**Phase B.**
- Check that the 10-option editor opens from the new row, that confirm writes the RAM byte and that cancel
  does not.
- Check that no more than four prototype versions were made.
- If R1 is reported BLOCKED, judge whether the evidence supports that, and whether the proposal is stated
  as qualified.

**Acceptance (if run).**
- Check that both sessions passed every assertion and that the control used the same key sequence.
- Check the full-cell readbacks, the page renders and the byte-by-byte store comparison.

**Overlay and records.**
- Verify every overlay byte's old value and section; none may lie in sections 6 or 7.
- Check that every hook is labelled `EMULATOR-ONLY` and that none is presented as native.
- Check that every command has a real stdout, stderr and exit record under `work\out\cmd\`.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
