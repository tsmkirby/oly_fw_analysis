# T6 correction review (Codex Sol, read-only)

## Read

- `brief.md` §5 (the correction list and the authorization).
- Your previous review in `audit\previous-review.md`.
- The updated `work\result.md`, `work\evidence-manifest.json` and its supplement, `work\out\design.md`,
  `work\out\target-fields.md` and `work\out\overlay-changed-bytes.csv`.
- The new runners, tables, JSONL logs, screenshots, `work\out\cmd\` and `audit\`.

## Report

For each of corrections 1–5, report DONE / NOT DONE / WRONG / BLOCKED (honestly reported), with evidence.

## Check in particular

- **Save.** It reproduces T5's procedure. The M **and** E saves are asserted with status 0, and the persisted
  cells are read back.
- **Acceptance.**
  - Two candidates, K1 and K2, with K2 matched on keys and exits.
  - Exact assertions after every key and edge, with no unconditional checks.
  - The complete mirror on every edge.
  - The profile and pose changes.
  - On reopen: the mirror at `FF`, the fallback, and the **asserted AF-ON press and release**.
  - The run ends `ok:true`.
  - Decode and compare the stores with K2 yourself.
- **Size.** The distinguishing trial uses a mirror size that differs from the legacy one. The AF-ON target and
  the half-press target each use the size claimed.
- **Wording.** The narrowed wording for Q1–Q3 and the corrected descriptor count.
- **Records.**
  - Every overlay row's section; only the three amended section-7 bytes may lie in section 7.
  - Manifest completeness, including the final outputs.
  - No script edited after it ran.
  - `0x1e71[0]` read back.
  - Nothing presented as native or as a storage decision.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
