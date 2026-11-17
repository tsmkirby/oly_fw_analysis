Investigate independent stock AF target profiles for OM-3 shutter half press and AF-ON: half press follows the current SCP Subject Detect selection, AF-ON bypasses detection, and S-AF/C-AF remains shared. This preserves the research and executable probes for review; it does **not** deliver a finished camera extension or an installable firmware release.

## Contents

- Topic references for AF-button configuration/ownership, native handler and capture integration, and the Human detection pipeline, with exact firmware identities and address spaces.
- An isolated `research/om3_af_profiles/` workspace containing 66 authored Ghidra Java scripts, Python/PowerShell tooling, detailed historical notes, compact recorded outcomes and source/evidence manifests.
- A portable launcher for checking recorded identities, preparing separately obtained inputs with the pinned upstream parser, and executing the bounded native suites. Git attributes preserve the imported bytes across line-ending settings so historical hashes remain meaningful.

Start with `docs/features/om-3/AF_BUTTON_PROFILES.md`, `docs/features/om-3/SUBJECT_DETECTION.md`, and the research workspace README. Historical reports describe different checkpoints; their counts must not be combined into a claim that the feature works.

## Evidence and remaining boundaries

The profile mechanism is exercised across stock/Home enums, supplied orientation banks, SCP Off and all six classes, shared focus mode, mixed button edges, target gates and initialization failure. The integrated decoded component passes the stock native validator and its complete 32 MiB checksum loop. Container reconstruction stays in memory and preserves the other five components.

Original-handler returns in the basic dispatch fixture are native **error-path cleanup**, not successful AF. More complete initialization makes stock and modified firmware reach the same null-backend capture-router wait. Native shooting-component construction, a conditional connection event, and command-40 packet construction are traced further; successful operational AF reception/acquisition remains unproven. No positive AF/device completion is fabricated.

Actual orientation/UI editing/display, full capture/lifecycle behavior, concurrency/record lifetime, physical settings reload, whole boot, SD service acceptance and intact-camera recovery remain open. Some are unfinished software analysis/modeling, not exclusively hardware-only checks. The contribution remains **not ready to flash** and is intentionally a draft.

No vendor firmware, extracted resources, model weights, full decompilation/disassembly, Ghidra databases, tool binaries, credentials or bulk execution logs are included. Recorded manifests retain hashes of omitted local artifacts; reproduction requires separately obtained exact inputs.

## Validation

- Imported source/result identity checks, staged byte-hash verification, Python source parsing, new documentation link checks and `git diff --check`: passed.
- Exact stock input preparation through the portable launcher: passed.
- Packaged Ghidra suite through the portable launcher: native RAM/profile, error/receiver boundary, stock-control, codec, mutex and full-component checks; supplemental transport probe stops at its declared submission boundary. Passing the runner preserves the **NOT READY TO FLASH** status.
- Upstream `tools/run_checks.py`: parsed 195 Python files and imported 127 modules; 9 container tests and 4 performance tests passed. The overall suite is not fully passing on this Windows host: two unchanged camera-client test-module imports require POSIX `fcntl`.

No camera was connected, commanded or flashed during this work.
