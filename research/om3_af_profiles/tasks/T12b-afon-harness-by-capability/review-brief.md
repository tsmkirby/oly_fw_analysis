# T12b review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`; the T12 decision and your two T12 reviews (under `ref\tasks\T12-afon-harness-completion\`).
- `work\result.md`, `work\harness.md`, `work\harness\`, the unit tests and their outputs, the operation-definition
  module, `harness-freeze.json` and the fake runs that produced it, the unrun T13 runners, manifest and seal,
  `work\out\cmd\` and `audit\`.

## Check

Review against the closed checklist in `brief.md` §1 only. For each of items 1–6 report DONE / NOT DONE / WRONG, with
evidence. Confirm no OM-Emu, Ghidra or Java process ran, and that accepted behaviour (T12 decision, "Accepted") is
unchanged or each change is required by an item. Recompute every manifest and freeze hash. Do not run tests; judge
from source and retained outputs.

Findings outside the checklist: list them as **OUTSIDE-CHECKLIST**, each with whether it would invalidate a T13 proof.
They do not by themselves decide the verdict; the coordinator rules on them.

## Rules

Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu. Give the verdict in the structure of
`templates\review.md`.

## Correction round

Also read `brief.md` §3 and your previous review in `audit\previous-review.md`. For each §3 item (the restored real
implementation and items 1–4) report DONE / NOT DONE / WRONG. Check in particular that the fake runs execute the same
code paths as the real runners (hook installation, full state capture, recorder, real expectations and settling), and
confirm still no OM-Emu, Ghidra or Java process ran.
