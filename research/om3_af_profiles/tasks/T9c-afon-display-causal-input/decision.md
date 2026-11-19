# T9c decision (Opus)

**Verdict: CLOSED as PARTIAL.** The correction round failed (loop rule → different approach). Continued as T9d.
Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-163743` | `run-20261119-174959-review` | REJECT: getter causal; dispatch found; validation used formula-predicted rectangles and a reduced K2 |
| `run-20261119-175921` (correction, 6 versions) | `run-20261119-184652-review` | REJECT: seeded A, full K2 and K1 pass; seeded B `ok:false` (kind branch never reached); size coverage absent; latency per edge not established |

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **Causal input.** With `0x88b2` left at 526, overriding the getter return at `0x6041935b` (key `0x88b2`, owner 2
  only) moves the four 19×21 marks; 412 → (356, 198), 409 → (417, 198).
- **Dispatch.** `0x61184dd6` is entered via `calls (A2)` at `0x610c8b66` (vtable+`0x190`, object `0x62c54158`)
  during idle. The two `0x610cd5ac` checks gate the writer; they do not schedule it. The scheduling producer is
  **not** named.
- **Geometry, partial.** Division by 39 at `0x61185152`; mode 2 at object+`0x374` gives size constants 3/3; glyph
  19×21 at `0x6146f990`. The minus-6 rule is a **fitted hypothesis**; the general getter-to-word relation is open.
- **Validation of profile A (Small, landscape).** Expected frames from the K1e reference, hashed first. Seeded A
  matches on all 12 edges (owner-2 frame from K1e, owner-0/1 frames from full K2), ten-byte and owner correct,
  `ok:true`. Full K2 (same display hook, unseeded) and stock K1 also `ok:true`. In the six measured A
  transitions, the frame changed within the bound (K1e setter-derived latency plus one idle period).

## Not established (carried to T9d)

- **Size and kind.** Key `0x84d1` is never presented at `0x6041935b` while the owner is 2, so a kind substitution
  at that site never fires. Profile B (zone 6) draws no marks in either the reference or the candidate, so it
  shows neither position nor size. Where the frame's size and kind actually come from is unknown.
- Latency on edges whose frame does not change has no sample; B's measurement was S1-based.
- Three cited T6 baseline files were missing from the inventory.

## Status

`CLOSED-PARTIAL`. Evidence stays in `tasks\T9c-afon-display-causal-input\run-20261119-175921\`.
