# T3a correction review (Codex Sol, read-only)

Read `brief.md` §7 (the correction list), your previous review in `audit\previous-review.md`, the
updated `work\result.md`, `work\evidence-manifest.json`, `work\out\design.md` and
`work\out\overlay-changed-bytes.csv`, the new JSONL logs and screenshots, and the audit copies in
`audit\`. For each of corrections 1–5, report DONE / NOT DONE / WRONG / BLOCKED (honestly reported),
with evidence.

In particular:
- check that the page-28 reference measurement was made on a stock session;
- if the editor opens from the new row, confirm from the screenshots and logs that it shows the
  10 zone options, that confirm writes the RAM byte, and that cancel does not;
- check that both acceptance sessions passed every assertion and that the control used the same
  key sequence;
- verify the full-cell readbacks, the page 25/26/28 renders and the byte-by-byte store comparison;
- re-verify every new or changed overlay byte against `inputs\00_0100_50000020.decoded.bin`
  (offset = address − `0x60021020`), and that none lies in sections 6 or 7;
- confirm that every emulator-side hook is labelled `EMULATOR-ONLY` and that none is presented as
  native;
- if item 2 is reported BLOCKED, judge whether the evidence supports that, and whether the stated
  smallest native change follows from it.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or
OM-Emu. Give the verdict in the structure of `templates\review.md`.
