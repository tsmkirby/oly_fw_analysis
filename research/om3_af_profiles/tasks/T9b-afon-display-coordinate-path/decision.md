# T9b decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS, as a partial investigation.** Continued as T9c. Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-142721` | `run-20261119-152529-review` | REJECT: two measurement errors, incomplete seal |
| `run-20261119-153249` (correction, 6 versions) | `run-20261119-163010-review` | ACCEPT-WITH-CORRECTIONS (partial investigation) |

## Accepted (EMULATOR-ONLY)

- **Getter path.** During the idle after the `0x88b2` setter, thunk `0x6041a1f9` (`d0=0x88b2`, `d1=0`) is
  called from `0x6041935b`. It returns 526, then 412. Its caller is `0x603f15d8` in `0x603f15b1`.
- **Frame pixel writer.** The routine `0x61184e51`, entered once per refresh from `0x61184e30` in `0x61184dd6`:
  - It stores 356 and 198 at `0x611852e9` and `0x61185307`.
  - Its inputs are point (16, 10), size (3, 3), object `0x62c54158`, and object+`0x364`=406.
  - `0x61184dd6` has no direct caller; it is entered indirectly. It calls the writer only after two checks
    through `0x610cd5ac`.
- **Copies.** Object `0x62c546b8` +8/+`0xa` (`0x610c8c62` and `0x610c8c70`), then the four-halfword copy
  loop at `0x610deb9d`.
- **AF-ON press, seeded and unseeded.** Owner 2 and the ten-byte target change. In the observed press window
  plus 400 ms, the writer `0x61184e51` had **zero entries**, and the flag writer `0x610f7172` ran 3 times.

## Coordinator corrections to the record (Sol)

1. Addendum finding 3: 436 and 286 occupy `0x62bd71f0`/`f2`, not `0x62bd71ec`/`ee`.
2. Replace "AF-ON schedules the flag writer" and the categorical scheduling exclusions with the measured counts
   in that window.
3. **Still unresolved:**
   - the continuous getter-to-geometry path (406 is neither 412 nor the AF-ON position);
   - the width and height fields;
   - the frame-specific refresh trigger;
   - the indirect entry into `0x61184dd6`.

## Not established (carried to T9c)

The causal input of the frame writer, the refresh trigger, and the display change.

## Status

`ACCEPTED-WITH-CORRECTIONS`.
