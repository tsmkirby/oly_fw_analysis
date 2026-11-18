# T5 review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\target-bytes.md`,
`work\out\design.md` and `work\out\overlay-changed-bytes.csv`. Then read the tables, JSONL logs,
screenshots, `work\out\cmd\` and `audit\`.

**Item 1: the ten-byte target.** Verify the decoding and the reading of the legacy provider. Check the
listings against `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`).

**Item 2: Z plus central-edge.**
- Check that the Z bytes are byte-identical to T3j's.
- Check for any overlap or conflict between the overlays.
- Check that the page-27 menu-row steps still pass.

**Item 3: the profile swap.**
- Check that the swap is one change.
- Check which target bytes come from the profile and which stay interim from the legacy provider.

**P1–P4.** For each run, check:
- every edge's assertion, covering the ten-byte target, the owner and the invariant cells;
- that AF-ON applies the zone selected in the menu and the release restores the stock target, in both
  release orders;
- that the control comparison is fair, using the same edges;
- for P3, that C-AF was really selected (stored setting 289, active setting 25).

**Acceptance, if run.**
- Check that every step is asserted and passed.
- Check the zone change between the two 12-edge sequences.
- Check that the stores are identical and that the default is applied after the reopen.

**Records.**
- Check the manifest completeness, the command records and the script hashes.
- Check that no script was edited after it ran.
- Check every overlay byte's old value and section; none may be in sections 6 or 7.
- Check that every behaviour change is labelled.
- Check that nothing is presented as native, as a storage decision, or as Subject Detect On evidence.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
