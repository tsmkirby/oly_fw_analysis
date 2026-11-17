# Portable reproduction run, 7 November 2026

On 7 November 2026, from 12:02 UTC (07:02 local), the offline suite was rerun from a
copy of this research directory placed inside the contribution checkout
(`research/om3_af_profiles/`). The run checked that the imported research reproduces
outside the original workspace before PR #19 was opened. It produced run directory
`live-runs/20261107-120222-858670`. The copy was never committed, and stayed untracked
in the local checkout until 17 November 2026.

Contents of this folder:

- `live-runs/20261107-120222-858670/`: the run's own records (evidence manifest,
  source hashes before the run, phase logs, transport log).
- `live-evidence-manifest.json` and `full-component-results.txt`: the two result
  files that differ from the original 7 November run. The differences are only the
  run identity, timestamps, script list and the full-checksum timing
  (82.87 s; the original run took 97.18 s). Both runs PASS.
- `contribution-portable-run.log`, `contribution-upstream-checks.log`,
  `contribution-whitespace-check.txt`: the console logs of that check. The
  whitespace check produced no output.
- `inventory.sha256`: SHA-256 and size of all 90 files in the untracked copy,
  binaries included. Binaries (the stock container, decoded components and
  emulator-only fixtures) are **not** included here.
- `comparison.txt`: per-file comparison with the main workspace: 82 identical,
  5 unique (the run directory), 3 different (the two results above, and
  `oly_container.py`, which differs in line endings only).

This is a reproducibility record. It adds no new research result and closes no
acceptance gate. The readiness decision remains NO-GO.
