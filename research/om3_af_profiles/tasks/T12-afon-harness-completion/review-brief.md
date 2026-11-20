# T12 review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`; the T11 decision and your two T11 reviews (under `ref\tasks\T11-afon-acceptance-harness\`).
- `work\result.md`, `work\harness.md`, `work\harness\`, the unit tests and their outputs, `harness-freeze.json`,
  the unrun T13 runners, the manifest and seal, `work\out\cmd\` and `audit\`.

## Check

Review against the closed checklist in `brief.md` §1 only. For each of items 1–5 report DONE / NOT DONE / WRONG,
with the evidence. Confirm no OM-Emu, Ghidra or Java process ran. Confirm the accepted behaviour (`bank()`,
`initMirror()`, writer self-arming, pose latch, display substitution) is unchanged or that each change is required by
a checklist item. Recompute every manifest and freeze hash, and run nothing except reading (you may not run the tests;
judge them from source and retained outputs).

Findings outside the checklist: list them separately as **OUTSIDE-CHECKLIST**, each with whether it would invalidate a
T13 proof. They do not by themselves decide the verdict; the coordinator rules on them.

## Rules

Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu. Give the verdict in the structure of
`templates\review.md`.
