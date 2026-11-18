# T3f review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\binding.md`,
`work\out\design.md`, `work\out\overlay-changed-bytes.csv`, the JSONL logs, the screenshots,
`work\out\cmd\` and `audit\`.

- **Item 1 (the binding).**
  - Verify the binding table or code: address, section, layout, bounds and the entries near
    `0x1e0`–`0x1e4`.
  - Check the listings against `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`).
  - Check the traced conversion for 2154, 2155, C-AF Area and `0x3D6F`.
- **B1–B4.**
  - Check that each experiment changed exactly one thing against its stated baseline. Verify the bytes or
    hooks it installed.
  - Check the operands at `0x611a26e1` and at the conversion, and the capped/dropped counters.
  - Check that before-OK, after-OK, confirm and cancel are separate groups.
  - For the commit, check:
    - the setter received UI `0x3D6F`;
    - the RAM byte changed to a different value on confirm, and did not change on cancel;
    - `0x90a1` and every listed cell are unchanged.
  - If B3 ran, verify each text ID against its cited stock record.
- **Acceptance, if run.**
  - Check that both sessions passed every assertion, and that the control used the same key sequence.
  - Check the full-cell comparisons and the page renders.
  - Check that the stores are byte-identical and that the profile byte is back at its default.
- **Records.**
  - Check that every command has real `.out`, `.err` and `.exit` records, plus the script hash.
  - Check that the manifest takes each command from the actual spawned command.
  - Check every overlay byte's old value and section; none may be in section 6 or 7.
  - Check that every behaviour-changing write or hook is labelled `EMULATOR-ONLY` / `role: behaviour`.
  - Check that nothing is presented as native or as a storage decision.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
