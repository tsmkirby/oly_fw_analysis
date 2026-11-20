# T8d decision (Opus)

**Verdict: CLOSED as PARTIAL.** The correction round failed on rigor, not on behaviour (loop rule → different
approach). Continued as T11, a shared acceptance harness that makes these checks structural. Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-185629` | `run-20261119-200258-review` (failed: Codex usage limit, empty) / `run-20261119-201846-review` | REJECT: record equal to the stock writer in two poses; pose-time leak into `0x5962[0]`; writer feed bypassed the bank |
| `run-20261119-202459` (correction, 6 versions) | `run-20261119-211040-review` | REJECT: `proof-t8d10` `ok:true`; writer arming depends on the runner; edge, identity and inventory coverage incomplete |

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **Writer rule.** The stock half-press writer `0x609b3c79` copies `0x9a41[0]`, `0x1dd1[0]`, `0x1dd1[1]`, `0x84d1[0]`,
  `0x88b2[0]`, `0x1df1[0]`, `0x1e01[0]`; forces position 526 for kind 2; clears priority for kinds 0, 2, and 3 with
  vertical 3. It does not read `0x99a1`. The T6 converter forced preset zones to 1×1; that was the divergence.
- **Zone names.** Stored values 0, 1, 2, 3, 5, 10, 6, 7, 8, 9 = All, Single, Small, Cross, Mid, Large, C1, C2, C3, C4.
- **The change** (`hook_t8d_writer9.mjs`): during the AF-ON press, the stock writer runs on the mirror's values, with
  `0x88b2[0]` from the saved-bank mirror cell; a pose-time gate stops the AF-ON position leaking into live
  `0x5962[0]` (traced; 0 live stores in the passing run).
- **Proof `proof-t8d10`, `ok:true`.** Landscape, EXIF 6 and return-to-landscape press/release equal K1e S1 and the
  candidate's own S1 (280 half-cell comparisons, no disagreement); the normal edit equals K2; seven zone press
  records including custom equal K1e; all 28 exits resolve to control sequences; `0x1e71[0]=0` after every key.
- ROM disagreement count corrected: 49 covered, 1 uncovered (`0x9a41[1]`), 13 all-zero.

## Not accepted (carried to T11)

1. `armPress` is set only by the runner; the installed hook alone never schedules the writer.
2. Full state (all banks, 71-byte mirror) is not asserted after every edge (only after down+up pairs) or after
   zone operations; zone release records not compared.
3. K1e zone-traversal and K2 AF-ON commits lack pre-hashed identity comparisons.
4. Execution-time import closure incomplete (`emu/src/lab/menu.mjs`, `emu/src/fw/models.mjs`, T8c baselines).
5. The pose gate is untested after a non-reset normal edit.

## Status

`CLOSED-PARTIAL`. Evidence stays in `tasks\T8d-afon-target-record-reconcile\run-20261119-202459\`.
