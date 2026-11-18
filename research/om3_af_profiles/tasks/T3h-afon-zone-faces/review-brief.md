# T3h review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\faces.md`,
`work\out\design.md`, `work\out\overlay-changed-bytes.csv`, the JSONL logs, the screenshots,
`work\out\cmd\` and `audit\`.

**Item 1: the face source.**
- Verify it from the listings. Check the listings against `inputs\00_0100_50000020.decoded.bin`
  (offset = address − `0x60021020`), and against the per-slot dynamic trace.
- Verify the explanation for the priority faces of values 0 and 1, and which kind-set reader is used.

**Experiments.**
- Check that each experiment changed exactly one thing against the Z1 configuration. Verify the bytes it
  wrote.
- Check from the screenshots, step by step, whether the ten zone faces of `0x6158ba1c` render in the
  chooser.
- Check that confirm commits the chosen value to the RAM byte, that cancel does not, and that the stock
  rows and cells are unchanged.

**Acceptance, if run.**
- Check that every step has an assertion and that all of them passed.
- Check that each session committed two different zone values with readback and made one cancel.
- Check that the control used the same shared key sequence.
- Check the full-cell comparisons, including the actual getter values of the `*_ORIGINALLY` IDs.
- Check the page renders.
- Check that the stores are byte-identical and that the profile was back at its default.
- State whether T3a brief §4 is now met in full. If it is not, list exactly what is missing.

**Records.**
- Check that no script was edited after it ran.
- Check that every input is in the manifest, with execution-time hashes for helpers.
- Check that every command has real `.out`, `.err` and `.exit` files, the command text and the script
  hash.
- Check every overlay byte's old value and section. None may be in section 6 or 7.
- Check that every behaviour-changing write, override or hook is labelled.
- Check that nothing is presented as native, or as a storage decision.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
