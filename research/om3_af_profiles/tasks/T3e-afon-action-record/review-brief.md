# T3e review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\action-records.md`,
`work\out\design.md`, `work\out\overlay-changed-bytes.csv`, the JSONL logs, the screenshots,
`work\out\cmd\` and `audit\`.

**Item 1: the record decoding.** Verify the record decoding and the meaning of the halfword pair from the
listings. Check the listings against `inputs\00_0100_50000020.decoded.bin`
(offset = address − `0x60021020`).

**Item 2: the relocated table.** Verify that the relocated table's first two records are byte-exact
copies of the stock records. Check that the third record's fields are justified, and that the pointer and
count redirect is labelled `EMULATOR-ONLY` (`role: behaviour`).

**X1–X4.** For each experiment:
- Check that it changed exactly one thing against its stated baseline.
- Check that D0/D1/A2 at `0x611a26e1` were recorded for each OK.
- Check that the traces are uncapped, or that their truncation counters are reported.
- Check that before-OK, after-OK, confirm and cancel are separate event groups.
- Check that the setter received `0x3D6F`, that the RAM byte changed on confirm (to a different value)
  and not on cancel, and that `0x90a1` and every listed cell were unchanged. This includes the
  `*_ORIGINALLY` backing cells; verify their mapping.
- If X3 ran, verify each text ID against its cited stock record.

**Acceptance (if run).** Check that both sessions passed every assertion, that the control used the same key
sequence, and the full-cell comparisons and page renders. Check that the stores are byte-identical, and that
the profile byte returned to its default.

**Records.**
- Check that every command has real `.out`, `.err` and `.exit` records, and a script hash, from the
  wrapper.
- Check every overlay byte's old value and section; none may be in section 6 or 7.
- Check that nothing is presented as native or as a storage decision.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
