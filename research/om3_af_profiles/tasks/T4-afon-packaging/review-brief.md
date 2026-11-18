# T4 correction review (Codex Sol, read-only)

Read `brief.md` §5 (the correction list), your previous review in `audit\previous-review.md`, the updated
`work\result.md`, `work\out\packaging-c1.md`, `work\evidence-manifest.json`, the new listings, any OM-Emu
watchpoint logs, `work\out\cmd\` and `audit\`. For each of corrections 1–6 report DONE / NOT DONE / WRONG /
BLOCKED (honestly reported), with evidence. Then re-grade the six questions of brief §2.

In particular:
- if a watchpoint run is claimed, check that it used the stock image with no overlay and NVRAM off, what it
  covered (boot, pages 25–28, editors), and whether it supports "no reader" or only "no reader on the
  exercised paths";
- check the new face design's control flow against the listing bytes, including the branch into
  `0x611f7f44`;
- check that the budget separates the four categories and that no total is claimed as complete;
- check the ordering evidence and the bounded checksum wording;
- check new listings against `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`).

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
