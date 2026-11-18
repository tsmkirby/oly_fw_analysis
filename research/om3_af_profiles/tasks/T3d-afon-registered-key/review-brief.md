# T3d review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\decision-point.md`,
`work\out\design.md`, `work\out\overlay-changed-bytes.csv`, the JSONL logs, the screenshots,
`work\out\cmd\` and `audit\`.

- **Item 1.** Verify the decision instruction and what it reads, from the listing. Check the listing
  against `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`). Check it against the
  traced values for 2154, 2155, C-AF Area and `0x3D6F`. Check the corrected direct-call search.
- **K1–K4.**
  - Check that each experiment changed exactly one thing against its stated baseline (verify the bytes
    or the hook it installed).
  - Check that the immediate before and after snapshots exist.
  - Check that the OK, confirm and cancel outcomes, the setter and store traces and the cell readbacks
    support the stated result.
  - If K3 ran, verify each text ID against its cited stock zone-name record.
- **Acceptance, if run.**
  - Check that both sessions passed every assertion, and that the control used the same key sequence.
  - Check the full-cell comparisons and the page renders.
  - Check the store diff: does it differ **only** in the expected `0x5b82` cell?
- **Labelling.**
  - Check that every behaviour-changing write or hook is labelled `role: behaviour` and `EMULATOR-ONLY`.
  - Check that nothing is presented as native, or as a storage decision.
- **Command records.** Check that every command has real `.out`, `.err` and `.exit` records produced by the
  wrapper.
- **Overlay bytes.** Check every overlay byte's old value and its section. None may be in section 6 or 7.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
