# T7 decision (Opus)

**Verdict: CLOSED as PARTIAL. The producer and pose injection are accepted; the ten-byte consumer's per-pose
index is BLOCKED on stock in this emulator.** Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-063452` | `run-20261119-072102-review` | REJECT: the ten-byte consumer index was missing; injection scope; store-trace wording |
| `run-20261119-072701` (correction; I2C stand-ins amended) | `run-20261119-082520-review` | REJECT: the ten-byte producer was never triggered; the static pose → selector path is incomplete; the `0x90a1` "Off" assertion is wrong |

That was the single correction round, so T7 is closed.

## Accepted (confirmed by Sol)

- **Producer.** The accelerometer is on I2C channel 6, device `0x6b`.
  - The probe `0x6006a791` (WHO_AM_I `0x70`) and the issue `0x6006a8ab` read 14 bytes from register `0x20`.
  - The completion `0x6006a8ca` unpacks X, Y and Z, and the copy `0x6006a9c1` caches them.
  - `PER_ROTATE` stores the raw code (0..5) at `0xa32c5690` and the reported index (1..4) at `0xa32c568c`.
    Depending on the sign there are four store sites: `0x60077ff6`, `0x60078025`, `0x60078052` and
    `0x6007805e`.
  - The EXIF getter `0x60077de1` reads the table at `0x60357e68`.
- **Pose injection** (`pose.mjs`, `EMULATOR-ONLY`). The sample is supplied only in the register-read hook.
  The other permitted stand-ins (pin setup, bus open, write and close, probe identity, lab-triggered issue
  and completion) supply no data and are listed in `out/pose-injection.md`. Six axes give raw codes 0–5.
- **Direct editor banks.**
  - With Orientation Linked on (`0x1db1[0]` = `0x1dc1[0]` = 1, set through native keys), the direct editor
    reads and writes `0x99a1` and `0x5962`:
    - index 1 in landscape;
    - index 5 in EXIF 6;
    - index 3 in EXIF 8.
  - With Orientation Linked off, it uses index 1 in all three poses.
- **The ten-byte writer `0x609b3c79`** reads `0x9a41[0]` and `0x1dd1[0,1]`. It does not read the pose.

## Blocked or open

- **The stock consumer's index per pose.** On a stock image in this emulator, S1 did not enter
  `0x609b3c79`, `0x609b3d3d`, `0x609b3ecd` or `0x609b3dfb`, and the record stayed 0. Neither the static path
  from `0xa32c568c` to the change-index selection nor the instruction that loads the pose into the editor's
  D1 was found.
- **Subject Detect.** Coordinator erratum: see PROJECT-STATE §11.
  - `0x90a1` is the page-27 per-button priority (T1: 1 = detected-subject priority, 0 = always the selected
    target), **not** SCP Subject Detect.
  - SCP Subject Detect is `MODE_SUBJECT_DETECT`, key `0x1e71[0]` (FEATURE-SPEC).
  - T7's "Off" assertion on `0x90a1` therefore proves nothing about Subject Detect.

## Consequence for T6

The AF-ON target is built by the overlay (T5's swap), not by the stock consumer. T6 can therefore select the
mirror's bank directly from the pose variable `0xa32c568c` with `pose.mjs`, using the stock bank mapping the
direct editor uses (1 / 5 / 3, gated by `0x1db1` / `0x1dc1`). It does not depend on the blocked stock
consumer. How the stock half-press target follows the pose remains open.
