# T3b review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\stock-target-screen.md`,
`work\out\profile-layout.md`, `work\out\design.md` and `work\out\overlay-changed-bytes.csv`. Then read the
scripts, tables, JSONL logs, screenshots, `work\out\cmd\` and `audit\`.

**Item 1, stock screen.** Check that it was measured on a stock session (no overlay). Check the routes, the
cells read and written (full-cell readbacks), the orientation bank selection and the entry trace. Check the
listings against `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`).

**Item 2, layout.** Check that every proposed profile byte is free in the Z5 configuration (the T5 CSV and the
relocated block) and lies in owned RAM as described in `HARDWARE-STAGE0-RECORD.md`.

**Item 3, routing.** Check that the change from Z5 is one change and that every hook is labelled
`EMULATOR-ONLY`. Check that an AF-ON-mode edit leaves every half-press cell unchanged, and a normal edit leaves
the profile unchanged. If BLOCKED, judge whether the evidence supports that.

**Item 4, acceptance, if run.** Check assertions after every key; confirm, cancel, the normal-edit control,
the orientations (or the stated limit), the store comparison and the reset to defaults. Compare the stores
yourself.

**§0 menu design.** Check whether the entry route changes the visible menu, and that any such change is
reported as a Q5 option, not presented as settled.

**Records.** Manifest completeness, command records, script hashes, no script edited after running, overlay
rows' old values and sections (only the three amended section-7 bytes allowed), and nothing presented as
native, as a storage decision, or as Subject Detect On evidence.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
