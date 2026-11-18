# T3j decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS. The AF-ON zone row's functional acceptance (T3a brief §4) is met in
full as an EMULATOR-ONLY prototype.** Date: 2026-11-18.

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-132500` | 281 table-driven steps; 0 failures; configuration byte-identical to T3i | `run-20261118-135353-review`: **ACCEPT-WITH-CORRECTIONS**. "T3a brief §4's functional criteria are now met in full as an EMULATOR-ONLY prototype." |

## Confirmed by Sol

Sol confirmed that:
- the configuration is byte-identical to T3i's;
- all 104 table entries have literal expectations;
- all 281 records and 150 shared candidate/control comparisons were checked independently;
- 30 screenshots were inspected;
- the commits are exactly 2 and 9, and cancel from C4 does not commit;
- the stores are identical, and the profile byte is back at its default after a reopen;
- the dependency inventory holds 140 emulator modules and 3 task modules, with none missing.

The profile byte is checked against a per-role literal: 0, 2 and 9 for the candidate, and 255 for the
control, where the overlay does not own the byte. Sol accepted this.

## Corrections (accepted as recorded; no further round)

The two harness defects below do not affect these records, because no step failed:

1. The chooser's help sentence was asserted as the "title". Glyph-only headers need an explicit identity
   assertion. Fix it in any future runner version.
2. A failed store comparison does not stop immediately. Fix it in any future runner version.

Opus decision: record both here and in the promoted README; no correction round. The functional evidence
is complete, and both defects concern failure paths that were never taken.

## Promotion

The evidence is promoted to `analysis/button-af/readiness/t3-afon-zone-row/` (README, `t3j/`, `design/`).
Screenshots and NVRAM dumps are listed by hash only.
