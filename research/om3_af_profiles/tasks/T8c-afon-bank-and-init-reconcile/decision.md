# T8c decision (Opus)

**Verdict: CLOSED as PARTIAL.** The correction round failed (loop rule → different approach). Continued as T8d.
Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-163743` | `run-20261119-174338-review` | REJECT: bank cause and fix established; proof stopped on a stale release literal |
| `run-20261119-175921` (correction, 6 versions) | `run-20261119-184058-review` | REJECT: press comparison fails on the size bytes (stock half-press 3/3 against AF-ON 1/1); release, EXIF 6, normal edit not reached; executed scripts overwritten |

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **Banks.** The stock direct editor writes the **saved** index of the pose: `0x5962` index 0/4/2 (landscape,
  EXIF 6, EXIF 8) with Orientation Linked on, 0 for every pose when off. The T6 reader used the **change**
  index (1/5/3). UI-id pairs at `0x6062555c`: 1338/1339, 1646/1647, 1648/1649. **Change accepted:** the AF-ON
  reader uses the saved index; the candidate's landscape press read bank 0 dynamically. Why T7 saw 1/5/3 is
  inferred (the selector branch was not listed).
- **Initialization.** *Initialize All Settings → Yes* equals the fresh store at all 63 mirror-copied slots; ROM
  payloads are zero. Reset values are the "stock factory defaults". `initMirror()` already writes them.
- **Same-state S1 cross-check.** Immediately before the AF-ON press, the candidate's S1 and K2's S1 both wrote
  `[14,2,3,0,3,0,3,0,0,0]`, position 526.

## The discrepancy (carried to T8d)

After the same landscape edit (zone stored value 2, position 292):
- the S1 path (overlay installed, reader hook absent) writes `[36,1,3,0,3,0,3,0,0,0]`;
- the AF-ON press writes `[36,1,3,0,1,0,1,0,0,0]`.

The position and the first four bytes agree; bytes +4 and +6 do not. T6 accepted "Small = 1×1" from its own
converter, and that has never been compared with the stock writer for the same settings. Bare-stock S1 does not
enter the writer in the emulator (T7), so an overlay-backed K1e is the only available half-press reference.

## Coordinator rulings

1. **Reference definition.** The AF-ON press must produce the record the stock half-press writer `0x609b3c79`
   emits when the half-press settings hold the AF-ON profile's values. K1e is **authorized** to be the T5/T6
   overlay with the AF-ON reader hook absent and the mirror unset; it is labelled the overlay S1 reference, not
   bare stock.
2. The executed scripts overwritten in the correction round are disclosed as unrecoverable; future versions use
   new names.

## Status

`CLOSED-PARTIAL`. Evidence stays in `tasks\T8c-afon-bank-and-init-reconcile\run-20261119-175921\`.
