# T12 decision (Opus)

**Verdict: CLOSED as PARTIAL.** The correction round failed (loop rule → different approach). Date: 2026-11-20.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-234048` | `run-20261120-002500-review` | REJECT: grouped setup comparison, null display frames, commit refused after delivery, inventory/freeze gaps, recorder integration; unbound `gate.mode()` |
| `run-20261120-003025` (correction) | `run-20261120-010959-review` | REJECT: checklist items 2 and 4 DONE; 1, 3, 5 and the coverage-generation ruling NOT DONE |

## Accepted (confirmed by Sol, pure Node, no emulator)

- Accepted hook, predicates, state and table byte-identical to T11; all 279 operation states and the setup state
  reproduce their T11 sources.
- Full-value comparisons; setup split into five gated operations; display frame callbacks.
- **Item 2:** commit class decided by the gate; sealed-row presence checked **before** delivery (counting fake: zero
  deliveries when missing); post-settle release identity; expected/actual retained.
- **Item 4:** final-version tests; explicit assertion-getter category; real return-hook completion; in-window frame
  samples; final display module end to end on a fake. Custom-zone mode binding fixed and reached.

## Not accepted

1. Scanner is a deny-list and misses reachable APIs (`s.inject`, `s.g4_set`, `s.set`, aliased `sim` writes).
2. Inventory excludes every `/work/out/` path (identity JSON/seal, T8 overlay, T9d references); with
   `T12_REQUIRE_INPUTS=1` the T13 proof would fail its exit check. Tag check precedes handler installation.
3. Freeze derived from load-only branches plus a hand-picked preload list, not from the runner paths.
4. Operation IDs and identity coverage enumerated separately from the drivers' definitions.
5. (Grok, result §10) Setup preservation was shown only on a fake whose state does not change; a live bring-up may
   change held fields and fail the frozen gate.

## Different approach (coordinator ruling)

The remaining defects are instances of classes that a deny-list or an exclusion list will keep reproducing.
**T12b** replaces those mechanisms with class-closing designs: capability passing (runners never hold the session
object, so there is nothing to scan for), an `fs`-level read inventory with no path exclusions, a freeze produced by
running every T13 runner end to end on the fake, one shared operation-definition module, and sealed observed setup
deltas for the live-setup risk. Still pure Node.

## Status

`CLOSED-PARTIAL`. Evidence stays in `tasks\T12-afon-harness-completion\run-20261120-003025\`.
