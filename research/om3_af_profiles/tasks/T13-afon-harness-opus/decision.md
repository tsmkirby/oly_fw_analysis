# T13 decision (Opus)

**Verdict: CLOSED as PARTIAL.** Date: 2026-11-20. Loop rule: the run-only stage failed and its correction (v4) was
rejected, so T13 closes and a different approach follows (T13b).

## What T13 established

- Design accepted with changes (round 2); code accepted (v3, `run-20261120-224009-review`).
- **Real emulator, run-only `run-20261120-225658` (`OBSERVED-EMU`, Sol-confirmed in `run-20261120-231437-review`):**
  every T8d and zone session of the identity plan completed with zero failing relations. Counts: k1e 30, k2 36,
  candidate 50, zk1e 81 and zcand 127 operations. The candidate writer count was 3 and the zone writer count 7.
  The relations covered the AF-ON press, which equals the named K1e S1 half-press reference, the release, which
  equals the candidate's own S1 record, the per-role mirror rules, the pose-after-edit live cells against K2, the
  read bank, pose protection, and the zone and custom press/release against zone K1e. No identity seal exists
  because the plan stopped in the display sessions, so reproduction (the proof process) did not run.
- Relations also pass on the 80 retained T11 emulator records.

## What failed

- `disp-seed-a` faulted after its `lever` setup operation; the trap was at the HLE.call return sentinel `0xa2100007`.
- **Cause (Sol, static):** display instrumentation executes the emulator inside observers. `frame('boundary')` and,
  as v4 showed, `frame('now')` (`compose(dev, true)` runs to a frame and calls `kernel.deliver()`) both advance it.
  Harness getters (assertions and the hook's internal `refresh()` link reads) also reach the hook's return-site
  instrumentation.
- **v4** (`run-20261120-232617-review`, REJECT-CODE) fixed the preparation order but claimed a passive read that is
  not passive: Opus relied on the policy name without reading `DisplayLab._compose`. Its getter separation was
  incomplete, and its tests used stubs that could not detect either problem.

## Different approach (T13b)

1. **Stage the proof.** Split the identity plan into the T8d and zone part, which has passed on the emulator in
   unchanged form, and the display part. The core AF-ON proof (identity plus reproduction for T8d and zone) can then
   complete without depending on the display instrumentation. The acceptance bar is unchanged: display validation
   remains required, as a separate stage.
2. **Display instrumentation** in its own task. A sample read is used only after a static audit of its full call path
   in the pinned emulator: `compose(dev, false)`, latched bank, and its VSC doorbell, with tests run against the real
   modules rather than stubs where that is possible without starting a session. The audit also separates harness
   getters (assertions and `hooks.refresh()` link reads) from firmware getters without global suppression across
   advancing screen reads. If no passive sample exists, the "frame sample inside each refresh window" requirement
   (T11 brief §1.4/§6.6, design §4.3) would have to change, which needs the owner's approval.

## Status

`CLOSED-PARTIAL`. All evidence stays in `C:\Dev\OM3-tasks\T13-afon-harness-opus\ws\work\`, with the failed run in
`superseded-5/`.
