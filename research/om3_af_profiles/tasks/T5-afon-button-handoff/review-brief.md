# T5 correction review (Codex Sol, read-only)

Read `brief.md` §5 (the correction list, including the coordinator amendment on section 7), your previous
review in `audit\previous-review.md`, the updated `work\result.md`, `work\evidence-manifest.json`,
`work\out\design.md`, `work\out\overlay-changed-bytes-c1.csv`, the new runners, tables, JSONL logs,
screenshots, `work\out\cmd\` and `audit\`. For each of corrections 1–5 report DONE / NOT DONE / WRONG /
BLOCKED (honestly reported), with evidence.

In particular:
- verify every overlay row's section independently; only the three amended rows `0x610bf5e3`–`0x610bf5e5`
  may lie in section 6 or 7, and they must be labelled EMULATOR-ONLY;
- check that acceptance asserts after every key, edge, save and reopen; that the control performs the same
  navigation and edges with literal asserted targets; that screenshot errors are fatal; and that the run
  ends `ok:true`. Compare the stores yourself;
- check that the header assertion is independent of the help sentence;
- check P4's distinguishing legacy value, per-edge assertions and control, or the narrowed claim;
- check manifest completeness, and that no script was edited after running.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
