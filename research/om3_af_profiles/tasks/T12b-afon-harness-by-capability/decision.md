# T12b decision (Opus)

**Verdict: CLOSED as PARTIAL.** The correction round failed. Loop rule → **written escalation** to the owner
(`tasks/ESCALATION-2026-11-20-harness-rigor.md`). Date: 2026-11-20.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261120-011723` | `run-20261120-015622-review` | REJECT: shared operation module and sealed setup deltas DONE; runners replaced by fake-only stubs; state leak via callback; inventory exclusions; optional freeze enforcement |
| `run-20261120-020136` (correction) | `run-20261120-025921-review` | REJECT: real implementation restoration WRONG (fake delivery copies expected values; observed frame is the reference); raw-session adapter public; read inventory incomplete; freeze enforcement startup-dependent; tests target older versions; manifest entry stale |

## Accepted (confirmed by Sol, pure Node)

- One operation-definition module (`operations_v2.mjs`) feeding drivers, coverage and identity; identity-bearing
  deletion test.
- Sealed observed setup deltas (`diffState`/`expectFromDelta`): pass on the sealed change, fail on another.
- Exit handlers before the tag check; closure-private session construction (fake path); policy refusal of a valid
  planted emulator import; frozen operation descriptions; freeze includes the OM-Emu checkout listing (388 files).
- Accepted T11/T12 hook, predicates, state, table, comparator and recorder remain byte-identical.

## Not accepted

1. The fake makes comparisons circular (delivery writes the expected values; the frame sample is the reference).
2. Accepted T12 payloads, role boundaries, mirror expectations and frame capture not faithfully restored.
3. Public real-session adapter with raw callbacks; descriptor/vector/FileHandle reads and named imports outside the
   inventory; freeze enforcement depends on startup; tests target older module versions.

## Assessment

Three successive tasks (T11, T12, T12b) failed on harness completeness while AF-ON behaviour stayed accepted. Grok's
results regress as the harness grows (T12b replaced working code with stubs, then with a circular fake). Continuing
the same way is unlikely to converge. Options and recommendation are in the escalation memo; options 2 and 3 change
the acceptance bar for completion criterion A and need the owner's approval.

## Status

`CLOSED-PARTIAL`. Evidence stays in `tasks\T12b-afon-harness-by-capability\run-20261120-020136\`.
