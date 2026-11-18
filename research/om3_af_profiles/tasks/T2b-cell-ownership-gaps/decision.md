# T2b decision (Opus)

**Verdict: CLOSED as UNRESOLVED.** Date: 2026-11-18.
**Storage question escalated to the owner in writing** (PROJECT-STATE §5 and §6, Q7).

## Runs

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-042524` | UNRESOLVED; parameter routes and debug dispatchers classified; five setters open | `run-20261118-052742-review`: **REJECT** (candidate exclusions overstated, `0x607135ad` lineage wrong, command output not recorded) |
| `run-20261118-053855` (correction) | UNRESOLVED; all setters excluded; residual = five data halfwords | `run-20261118-062119-review`: **REJECT** (table B key fields +0x50/+0x52 omitted, three `mov 0x5b8` explanations wrong, command output reconstructed) |

## Established (confirmed by Sol across both reviews)

- Parameter route `0x6183dcee` (outer command `0x9029`, inner 53): runtime packet key → whole-key ROM
  default. Route `0x6183cc7d` (callers `0x6183bd67`, `0x61841ea8`): runtime packet key, span copy. Both
  sit behind the adjustment flag at `0x62d31d10` (set only by command `0x1002`). Classified as the
  factory adjustment path, not normal operation.
- Both debug dispatchers (`FUN_60215a26` via `dbgall`; `FUN_6021818d` shell task) are 63-entry
  name tables; entry 14 is `prm` → `0x600619a9`. Debug console / adjustment only.
- The replay queue `0x600630a3` is filled only at `0x600634d9` (type 1), `0x60063668` (type 2) and
  `0x6006397b` (type 4).
- `FUN_607135ad` uses the constant key `0xfa64`.
- The earlier "twelve cursor tabs" claim was wrong; the cursor pages remain BOUNDARY.
- Ownership of `0x5b82` is **UNRESOLVED**. Not OWNABLE under brief §6.

## Not accepted (correction round claims Sol did not confirm)

- That every one-cell setter is excluded: the table-B key-field inventory is incomplete (+0x50/+0x52).
- That the residual is exactly five data halfwords.

## Process

The first run and the correction round of T2b were both rejected. The `0x5b82` line has now been
rejected four times in all (T2 twice, T2b twice). Under the loop rule, Opus does not start a third
attempt of the same approach. The residual is small but not bounded. The storage design is an
owner decision anyway, because any choice (accept the residual risk, use another storage
mechanism, or keep the profile RAM-only) affects user-visible behaviour. Offline UI work continues on a
RAM-only profile, which does not need this answer.
