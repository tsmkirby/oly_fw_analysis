# T10b decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS.** Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-175921` (static + unit tests, no emulator) | `run-20261119-183728-review` | ACCEPT-WITH-CORRECTIONS |

## Accepted (STATIC; unit tests recorded, not rerun by Sol because `node26` was unavailable to it)

- **Codec v2** (`codec_v2.mjs`, `codec_v2.test.mjs`). Each field's domain is the union of the descriptor values,
  the registration defaults (all zero), the accepted zero custom fields (T3l), the T8c reset values and partly
  initialized arrays. Encode rejects out-of-domain values; decode maps every failure to "no profile".
- **Packing fits** in the 26-byte record of the unnamed `0x5b82` cells, with marker, version, pad and CRC-16.
- **Pose-keyed.** The record stores fields per pose. The pose-to-cell-index mapping belongs to the reader (T8c:
  saved indices 0/4/2), not to the codec.
- The corruption tests ran on two profiles: 208 bit positions each, 416 single-bit assertions.

## Coordinator correction to the record (Sol)

`encoding-v2.md`, "Pose-keyed layout", misdescribes the custom slots. The established layout (T3l
`profile-layout.md`, T3m "Custom sizes from a zeroed mirror") is:
- **C1** dimensions `0x1dd1[2,3]`, steps `0x1de1[0,1]`;
- **C2** dimensions `0x1dd1[4,5]`, steps `0x1de1[2,3]`.

The codec and its fixtures already use the correct slots; only the prose is wrong. This decision is the
correction. Grok's evidence is left unedited.

## Not established

Persistence, the reader integration and reset/fallback in the emulator. These are part of the integrated
acceptance after the bank and target reconciliation (T8d).

## Status

`ACCEPTED-WITH-CORRECTIONS`. Promoted to `analysis\button-af\readiness\t10b-afon-profile-codec\`.
