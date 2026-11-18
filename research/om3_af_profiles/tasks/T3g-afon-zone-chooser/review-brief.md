# T3g review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\descriptors.md`,
`work\out\design.md`, `work\out\overlay-changed-bytes.csv`, the JSONL logs, the screenshots,
`work\out\cmd\` and `audit\`.

**Item 1: descriptor decoding.** Verify the decoding of both descriptors and their templates from the
listings. Check the listings against `inputs\00_0100_50000020.decoded.bin`
(offset = address − `0x60021020`). Verify UI 238's name and key.

**Z1–Z4.** For each experiment:
- Check that exactly one thing changed against the stated baseline. Verify the bytes or hooks it
  installed.
- Check the operands at `0x611a26e1` and `0x6124f523`, and the capped/dropped counters.
- Check the separate event groups and the per-step screenshots.
- If zones are claimed:
  - confirm from the screenshots that the ten zone images are shown;
  - check that confirm calls the setter with `(0x3D6F, value)`, that the RAM byte takes that value, and
    that cancel does not change it;
  - check that 2154, 2155 and every listed cell are unchanged.
- If a text list ran, verify each text ID against its cited stock resource record and its hash.

**Acceptance, if run.**
- Check that both sessions passed every assertion.
- Check that at least two zone values were committed and read back in each session, and that one cancel
  was made.
- Check that the control used the same key sequence.
- Check the full-cell comparisons and the page renders.
- Check that the stores are byte-identical, and that the profile byte is back at its default.

**Records.**
- Check that no script was edited after it ran.
- Check that every input is in the manifest, including emulator resources.
- Check that every command has real `.out`, `.err` and `.exit` files, plus the script hash and the real
  command text.
- Check every overlay byte's old value and section; none may be in section 6 or 7.
- Check that every behaviour-changing write or hook is labelled.
- Check that nothing is presented as native or as a storage decision.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
