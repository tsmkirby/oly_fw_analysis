# T3a review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\design.md`,
`work\out\overlay-changed-bytes.csv`, the JSONL logs and the audit copies in `audit\` (including
`om-emu.diff` against the pinned diff). Use PowerShell (Python is not on your PATH). Do not run
Ghidra or OM-Emu.

Check each acceptance item of brief §4:
- three rows rendered, with the label;
- the option list equals page 28's zone list (check the bytes at `0x6158ba1c`);
- the store and cancel behaviour, by native readback;
- stock rows unchanged against the control;
- the half-press target settings and AF Home cells unchanged;
- the stores byte-identical after a save and a new session;
- other viewer pages unchanged.

In both repeats, confirm that every step actually completed.

Verify every overlay byte's "old" value against `inputs\00_0100_50000020.decoded.bin`
(offset = address − `0x60021020`), and that no overlay byte lies in a compressed section (sections 6
and 7 are compressed). Check the UI ID's "unused" claim against the four UI-ID maps. Confirm every
emulator-side hook is labelled `EMULATOR-ONLY`, and that the result does not present hook-based
behaviour as native.

Recompute every manifest hash. Give the verdict in the structure of `templates\review.md`.
