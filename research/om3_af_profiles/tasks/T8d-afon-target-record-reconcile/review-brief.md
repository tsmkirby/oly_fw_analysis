# T8d review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T8c decision and your two T8c reviews (under `ref\tasks\T8c-afon-bank-and-init-reconcile\`).
- `work\result.md`, listings, the zone-sweep table, runners, generated tables and checker, JSONL logs,
  screenshots, the manifest and seal, `work\out\cmd\` and `audit\`.

## Check

1. **Writer rule.** The listings of `0x609b3c79` and of the T6 converter match the image; the divergence point is
   stated correctly; the zone-code names are supported by the descriptor and label evidence.
2. **Zone sweep.** K1e rows hashed before comparison; every reached zone and the custom size are covered; the
   difference table matches the logs.
3. **The change.** One labelled change limited to the bytes that differed; the T8c bank mapping and
   `initMirror()` unchanged; prefer reuse of the stock computation.
4. **Short proof.** Exits matched to real control sequences; identity before every commit; press expectations
   from K1e's S1 after the same keys; release expectations from the candidate's own S1, cross-checked with K2;
   both poses; normal edit equals K2; `0x1e71[0]=0` after every key; `ok:true`.
5. **Records.** No script overwritten after it ran; sections computed from the image (only the three amended
   section-7 bytes); per-slot table with uncovered ROM slots marked; complete manifest and seal.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.

## Correction round

Also read `brief.md` §5 and your previous review in `audit\previous-review.md`. For each §5 item, report DONE /
NOT DONE / WRONG / BLOCKED (honestly reported).

Check in particular: the writer feed uses the saved bank and runs from the installed hook; the pose-time leak is
traced to an instruction and fixed without changing expectations; all banks and the full 71-byte mirror are
checked after every key; identity expectations were hashed before use; the full proof ends `ok:true`.
