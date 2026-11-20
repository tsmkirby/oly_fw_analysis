# T11 review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T8d and T9d decisions and your four reviews of them (under `ref\tasks\`).
- `work\result.md`, `work\harness.md`, `work\harness\` and its unit tests, the combined hook set, runners, generated
  tables and checker, identity table and seal, JSONL logs, screenshots, the generated manifest and seal,
  `work\out\cmd\` and `audit\`.

## Check

1. **Inventory.** The loader hook records every import with hashes at import time and re-hashes at exit; every
   emulator session loads it first; the manifest is generated from those records and is complete.
2. **Gated input.** No raw key/edge/setter/pose call outside the gated function in any runner; full state asserted
   after every down and every up separately, and after zone operations.
3. **Identity.** The table was sealed before every acceptance session; every commit of every role compared against
   it; successes retained.
4. **Hooks.** One labelled combined change limited to the accepted parts; the writer feed self-arms from the
   installed AF-ON path with no runner flag; `bank()` shared by reader, writer feed and display; `initMirror()`
   unchanged.
5. **Proofs.** The T8d sequence plus the non-reset pose-gate case `ok:true`; zone press and release compared; the
   display runs for A, B, K2, K1 `ok:true` with every-refresh getter records.
6. **Records.** Sections from the image (only the three amended section-7 bytes); no script edited after it ran;
   `0x1e71[0]` read back; nothing presented as native or as a storage decision.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
