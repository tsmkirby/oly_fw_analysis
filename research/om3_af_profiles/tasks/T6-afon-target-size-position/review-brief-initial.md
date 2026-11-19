# T6 review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json` and its supplement,
`work\out\design.md`, `work\out\target-fields.md` and `work\out\overlay-changed-bytes.csv`, then the scripts,
tables, JSONL logs, screenshots, `work\out\cmd\` and `audit\`.

1. **Design.** Check the field-source table against the home-builder listings. Check those listings against
   `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`), and against the Z5 CSV where they are
   overlay code.
2. **Change.** Check that it is one change on top of Z5, that every hook and every piece of seeding is labelled,
   and that the half-press record is still built as stock builds it.
3. **Q1–Q4.**
   - Check every edge assertion: the target, the owner, the half-press cells and the mirror.
   - Check that the AF-ON target follows the mirror's type, size, position and custom dimensions.
   - Check the per-pose bank selection, with Orientation Linked on and off, and that `pose.mjs` is unchanged
     (by hash).
   - Check that C-AF was really selected.
   - Check that the K1 and K2 controls are fair.
4. **Acceptance, if run.**
   - Check that every step is asserted.
   - Check the profile change and the pose change.
   - Check the save completion after the edits.
   - Check the reopen fallback and the **asserted reopen AF-ON press and release**.
   - Check `ok:true`.
   - Compare the stores with K2 yourself.
5. **Subject Detect.** Check that no claim rests on `0x90a1`, and that `0x1e71[0]` is read back and its Off
   meaning established from the stock menu.
6. **Records.**
   - Check the section of every overlay row; only the three amended section-7 bytes are allowed.
   - Check that the manifest is complete, including dynamic imports and the final command outputs.
   - Check that no script was edited after it ran.
   - Check that nothing is presented as native, as a storage decision, or as Subject Detect On evidence.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
