# T14 review brief (Codex Sol, read-only)

## Read

`TASK.md`, `brief.md`, `work\result.md`, all listings and notes under `work\`, the per-zone table, manifest and seal,
`audit\`. Prior: the T8d decision (writer rule), the T1 result (page-27 mapping), T7 and T9d K1 records as cited.

## Check

1. Every listing matches the image bytes at its stated addresses (recompute from `inputs\00_0100_50000020.decoded.bin`,
   offset = address − `0x60021020`).
2. The half-press and AF-ON call chains are supported by the listings; no branch that depends on the AF Button setting,
   button identity or owner is missed on the cited paths.
3. The per-zone, per-byte prediction follows from the listed code; each claimed difference names its instruction.
4. The conclusion (a/b/c) is justified, and labels (`STATIC`/`INFERRED`/`PRIOR`) are honest.
5. No emulator run, no change proposal, no hardware recommendation.

## Rules

Read-only. Use PowerShell. Do not run Ghidra or OM-Emu. Give the verdict in the structure of `templates\review.md`.

## Correction round

Also read `brief.md` §4 and your previous review in `audit\previous-review.md`. For each §4 item report DONE / NOT
DONE / WRONG / BLOCKED (honestly reported), and judge whether the conclusion letter follows.
