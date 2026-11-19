# T3m correction review (Codex Sol, read-only)

## Read

- `brief.md` §5 (the correction list and the authorization).
- Your previous review in `audit\previous-review.md`.
- The updated `work\result.md`, `work\evidence-manifest.json` and its supplements, `work\out\leak.md`,
  `work\out\design.md`, `work\out\accept-lib.md`, and the new `accept_lib` version.
- The new runners, step tables, JSONL logs, screenshots, stores, `work\out\cmd\` and `audit\`.
- The T6 save procedure the brief points to:
  `ref\analysis\button-af\readiness\t6-afon-target-size-position\scripts\save_v3.mjs`.

## Report

For each of corrections 1–5, report DONE / NOT DONE / WRONG / BLOCKED (honestly reported), with evidence.

## Check in particular

- **Persistence route.**
  - The chronological, unaggregated write trace identifies the RAM the save serialises for M +211472…+211516.
  - It also identifies the writer, and why the T3l routing missed it.
  - K2 is traced at matched steps, or the "first difference" claim is qualified.
- **Fix.**
  - It is one labelled change on top of p3.
  - On the minimal sequence, the custom sizes stay in the mirror, and `compareStores(K2, candidate)` has zero
    differing offsets.
- **Save.**
  - The final save is caused by the final call: a new E and a new M after the recorded baseline, each with a
    captured image and status 0, including the posted M callback.
  - Earlier saves cannot satisfy the check.
  - The persisted cells are asserted against explicit expectations.
- **Acceptance.**
  - A complete step table, asserted after every individual key: visual identity, every mirror field, the zone
    byte, the flag and every half-press cell.
  - No expectation is copied from candidate observations.
  - Two candidates, K1 and K2.
  - On reopen: the mirror at `FF`, the zone byte at 0, and the next entry initializes.
  - The run ends `ok:true`.
  - Decode both candidates' stores and compare them with K2 yourself.
- **Records.**
  - Every overlay row's section, computed from the image; only the three amended section-7 bytes may lie in
    section 7.
  - Manifest completeness, including command 23, the final outputs, the per-version import inventories and
    the consumed measurements.
  - No script edited after it ran.
  - `0x1e71[0]` read back.
  - No visible menu entry.
  - Nothing presented as native or as a storage decision.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
