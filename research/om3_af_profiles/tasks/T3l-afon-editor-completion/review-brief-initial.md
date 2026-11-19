# T3l review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json` and its sealed supplement,
`work\out\profile-layout.md`, `work\out\design.md` and `work\out\overlay-changed-bytes.csv`. Then read the
scripts, tables, JSONL logs, screenshots, `work\out\cmd\` and `audit\`. Compare against the T3b decision and
your last T3b review (`ref\tasks\T3b-afon-target-editor\`).

1. **Exit handling.** Check that the hook (not the harness) clears the flag and restores the zone byte on
   every exit the trace identifies. Check that the following normal edit is asserted against K2 for each exit.
2. **Initialization.** Check that the defaults come from the firmware's default table or descriptor, not from
   session values, and that initialization happens only for `FF` fields on entry.
3. **Controls.** Check that K1 is stock without an overlay, and that K2 is Z5 with the flag off. Check that
   the comparisons use the right control.
4. **Custom sizes.** Check the AF-ON edits of C1 and a second slot, the complete mirror and half-press
   readbacks (`0x1dd1`, `0x1de1`, `0x1df1`, `0x5a11`), and the flag-off parity with K1.
5. **Acceptance.** Check the assertions after every individual key: visual identity, every mirror field, the
   zone byte, the flag, and every half-press cell. Check both candidate sessions, the save completion after
   the edits, the reopen state, and `ok:true`. Compare the stores with K2 yourself.
6. **Orientations, if run.** Check that `pose.mjs` is imported unchanged (by hash). Check the per-pose index
   for AF-ON and normal moves.
7. **Records.** Check:
   - each overlay row's section (only the three amended section-7 bytes are allowed);
   - that every behaviour change is labelled;
   - that the manifest is complete, including dynamic imports and final command outputs;
   - that no script was edited after it ran;
   - that no visible menu entry was added;
   - that nothing is presented as native, as a storage decision, or as Subject Detect On evidence.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
