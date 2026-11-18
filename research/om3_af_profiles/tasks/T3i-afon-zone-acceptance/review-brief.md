# T3i review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\help.md`,
`work\out\crash.md`, `work\out\design.md` and `work\out\overlay-changed-bytes.csv`, then the JSONL logs,
the screenshots, `work\out\cmd\` and `audit\`.

**Help list (item 1).** Check:
- the decoded format and the indexing, from the listings, checked against
  `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`);
- every help record's text ID and its justification;
- that the change was one change against H.

**The C4 crash (item 2).** Check:
- that C-a and C-b used the same key sequence;
- whether the crash reproduced, and what was recorded;
- whether the stated cause is supported, or honestly left open.

**Row label (item 3).** Confirm from the screenshots that the row shows "AF Target Mode" and the current
zone glyph, and that the chooser still opens and commits.

**Page 28 (item 4).** Check that the render is labelled as a reference construction and appears in both
the candidate and the control.

**Acceptance (item 5).** Check:
- that every key press has an exact assertion, and that all of them passed;
- that each session committed the two specified values, one of them C4, with exact readback, and
  cancelled from C4;
- that the full-cell invariance checks run around every AF-ON action and against the control at every
  shared step;
- the page 25–28 renders;
- that the stores are byte-identical and the profile byte is back at its default.

Then state whether **T3a brief §4 is now met in full**, as an EMULATOR-ONLY prototype. If it is not, list
exactly what is missing.

**Records.** Check:
- that the manifest lists every input, including helpers, resources and research files, with the hash
  timing marked;
- that no script was edited after it ran;
- that every command has real `.out`, `.err` and `.exit` files, the command text and the script hash;
- every overlay byte's old value and section (none may be in section 6 or 7);
- that every behaviour-changing write or hook is labelled;
- that nothing is presented as native, or as a storage decision.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
