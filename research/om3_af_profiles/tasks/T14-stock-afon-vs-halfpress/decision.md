# T14 decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS — conclusion (c), undecided by static evidence.** Date: 2026-11-20.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| round 1 | `run-20261120-192849-review` | REJECT: conclusion (a) unsupported (shared writer ≠ equal inputs, shadow state, publication timing) |
| correction | `run-20261120-200040-review` | ACCEPT-WITH-CORRECTIONS: conclusion (c) follows |

## Accepted (STATIC, confirmed by Sol)

- One stock ten-byte record writer `0x609b3c79`, direct callers `0x609b3b98`, `0x609b3bbc`; inputs `0x9a41[0]`,
  `0x1dd1[0..1]`, `0x84d1[0]`, `0x88b2[0]`, `0x1df1[0]`, `0x1e01[0]` via getter `0x60063380`; kind-2 position 526;
  priority clear for kinds 0, 2, 3 with vertical 3. No pose term in the writer.
- Shadow replacement: if struct `+0x22` (from `0xe951[0]`) is 1, kind/position/vertical/horizontal come from
  `0xa33d4a94..9a`; the only direct stores of those words (`0x60983156`, caller `0x6041a848`) write kind 0, position
  526, 1×1.
- Direct rebuilds: pose-group change (`0x60447de4`) and the dirty accessor `0x609b3bb2`; neither is called directly
  from the S1 handler or the walked AF-ON down body. No direct write of the seven inputs, `0xe951`, or the shadow words
  on the walked button bodies.

## Corrections to the record (Sol)

1. Claim 7 / Answer 2: include the `0x3b` → `0x70` substitution at `0x610a24f3`; slot 8 calls mode 3, slot 10 mode 1.
2. Answer 3 is conditional: button-to-writer reachability and alternative writers are unresolved.
3. The r1 supplemental scan command is not retained; r1 seal and notes are historical, superseded by r2.

## Open (blockers to deciding)

Indirect calls between the button handlers and the rebuild; the `0x61083022` return on the default AF-ON edge; pointer
writes to inputs or shadow; `0x610a3735(0x31)` reads a table outside this image; `0x90a1[1]==0` callees
`0x6004cdf8`/`0x6004cefd`; T1's row-2155 binding. **Deciding evidence:** paired stock record-publication observations
for S1 and AF-ON, each with button, owner, pose, AF Button setting, the seven inputs and the shadow words identified.

## Consequence

The AF-ON reference (K1e S1) is **not yet confirmed as stock-equivalent**. The T13 harness design does not depend on
the reference choice; its relation set will name the reference explicitly so that it can be switched if the deciding
evidence shows a difference.

## Status

`ACCEPTED-WITH-CORRECTIONS`. Evidence stays in this task's latest run folder.
