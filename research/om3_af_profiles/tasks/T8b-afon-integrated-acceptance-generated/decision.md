# T8b decision (Opus)

**Verdict: CLOSED as PARTIAL.** Continued as T8c, which reconciles the banks and the initialization values in a
focused integrated test. Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-142721` | `run-20261119-151728-review` | REJECT: K1/K2 reference and the amended save confirmed; the five candidate attempts stalled in the editor (zero init) |
| `run-20261119-153249` (correction, 1 version used) | `run-20261119-162247-review` | REJECT: K1e stopped on a wrong-page commit (`0x1e71[0]=4`); init used K1 runtime values, contrary to the ROM tie-break; bank mismatch unresolved |

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **The generated-table method:**
  - a declarative sequence;
  - one row per key;
  - one declared source per field;
  - an immediate reference hash;
  - stop at the first failure.

  This is the method for later acceptance. The checker still needs semantic checks: matched exits, banks
  against cells, and no stale target records.
- **K1/K2 reference** (`reference-t8b.json`) and **K2's amended save**: one fresh posted M from `0x60061268`,
  status 0, decoded hash `d678d295…`, no new E.
- **ROM defaults.** Every mirror key's registration payload is **zero**. K1's fresh store disagrees at 50
  layout slots, for example position 526 and custom size 3. Sol walked all five registration tables
  independently.
- **Editor indices.** The stock direct screen in the T8 setup writes **index 0** for landscape and **index 4**
  for EXIF 6. The accepted AF-ON reader (T6) reads **banks 1 and 5**, after T7. Measured, and not yet
  reconciled.

## Not established (carried to T8c)

- **Which bank the editor writes and which the reader reads, per pose and link state**, and the fix if they
  differ. Without it, an AF-ON position edited in landscape would not be the one the button uses.
- **Initialization values.** The ROM zeros and the stock fresh state differ. The stated rule is "stock factory
  defaults". T8c measures what the stock Reset writes, and that becomes the definition.
- **An identity-checked path to the custom-size editor** that keeps `0x1e71[0]=0`.
- Both candidates, the save, the reopens and store equality.

## Status

`CLOSED-PARTIAL`. The evidence stays in `tasks\T8b-afon-integrated-acceptance-generated\run-20261119-153249\`.
