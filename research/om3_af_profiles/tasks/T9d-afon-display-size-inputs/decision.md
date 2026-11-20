# T9d decision (Opus)

**Verdict: CLOSED as PARTIAL.** The correction round failed (loop rule → different approach). Behaviour continues in
T11. Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-185629` | `run-20261119-194955-review` | REJECT: A, B, K2, K1 `ok:true`; clipped mark inventory; mode producer not found; partial refresh records |
| `run-20261119-202459` (correction, 3 of 4 versions) | `run-20261119-211721-review` | REJECT: inventory corrected; mode copy/store chain found but the selecting getter input untraced; seeded refresh records absent; Cross attribution wrong |

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **Display change** (`lib_valid_t9d.mjs` `installDisplay`): while the owner is 2, `0x6041935b` returns the
  saved-bank mirror position and zone, and `0x6041a1fb` returns the mirror `0x1dd1` values; `FF`/`FFFF` pass through;
  the kind branch is removed.
- **Validation.** Seeded A (Small, four 19×21 marks) and seeded B (Single, four 8×9 marks, non-centre) match their
  hashed K1e references on all 12 edges; full K2 and K1 stay stock; all `ok:true`. Changing edges redraw within
  K1e's stock latency plus one idle period (599.6 ms bound); unchanged edges stay unchanged.
- **Stock mark inventory** (full frame): Large and Custom each four 19×21 marks; All draws none.
- **Mode chain, partial.** The mode word at object+`0x374` is written by the memcpy at `0x610cd71c` from a template
  word stored by `mov D0,(A0)` at `0x611c7746`. The size switch reads it.

## Coordinator ruling (scope)

The display requirement is behavioural: the frame shown while AF-ON owns the target must equal the stock frame for
the AF-ON settings, on press and release, within stock latency. Two mechanism traces are therefore **non-blocking
unresolved items**, kept in the record: the getter input that selects the mode template, and the producer that
schedules `0x610c8b66`. Every-refresh getter records for the seeded candidates remain **required**, and move into the
T11 harness.

## Corrections to the record (Sol)

- Cross's branch attribution in `display-addendum-r3.md` is wrong: the image's mode-4 jump-table destination
  governs; describe routing as static and execution as observed separately.
- The supplemental inventory omits `samples-r2.json`, the correction session logs, `mode-copies-r4.jsonl`, the
  correction screenshots and listings.

## Status

`CLOSED-PARTIAL`. Evidence stays in `tasks\T9d-afon-display-size-inputs\run-20261119-202459\`.
