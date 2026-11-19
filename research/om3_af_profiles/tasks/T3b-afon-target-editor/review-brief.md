# T3b correction review (Codex Sol, read-only)

Read `brief.md` §5 (the correction list and the coordinator amendment on cancel), your previous review in
`audit\previous-review.md`, the updated `work\result.md`, `work\evidence-manifest.json`,
`work\out\stock-target-screen.md`, `work\out\profile-layout.md`, `work\out\design.md`,
`work\out\overlay-changed-bytes.csv`, the new runners, tables, JSONL logs, screenshots, `work\out\cmd\` and
`audit\`. For each of corrections 1–5 and the amendment report DONE / NOT DONE / WRONG / BLOCKED (honestly
reported), with evidence.

In particular:
- check that the flag lies in verified free bytes inside `0x6031e920`–`0x6031f000` (Z5 CSV and the relocated
  block), and that every exit clears it, with the following normal edit asserted;
- check the custom-size editor's stock measurement (stock session, entry trace) and its AF-ON routing, or
  the evidence for BLOCKED;
- check MENU parity against the stock control (same keys, same change, half-press cells unchanged), and that
  no rollback was added;
- check that acceptance asserts after every key the visual identity, the complete mirror, the zone byte, the
  flag and every half-press cell; that the save follows the edits with completion read back; the reopen
  state; and that the run ends `ok:true`. Compare the stores yourself;
- check every overlay row's section (only the three amended section-7 bytes allowed), manifest completeness,
  and that no script was edited after running.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
