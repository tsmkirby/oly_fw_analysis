# T3j review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`,
`work\scripts\accept_table_j1.json`, the runner, the per-step JSONL logs, the screenshots, `work\out\cmd\`
and `audit\`.

Check the following:

1. **Same configuration as T3i.** The configuration must be byte-identical to T3i's. Compare the overlay and
   the runtime writes against
   `ref\tasks\T3i-afon-zone-acceptance\run-20261118-123315\work\out\overlay-changed-bytes.csv` and T3i's
   scripts.
2. **Literal expectations.** Every step in the table must have a literal `expect` (title, highlight,
   readback), with expected texts stated in the table, not derived from the candidate at run time.
3. **Coverage.** The table must cover every item in brief §2.3, with every key asserted. That includes
   chooser navigation, exits, menu navigation, the page-28 reference construction, the save and the
   reopen.
4. **The runner.** It must assert after every step, compare against the control at `controlStep`, and stop
   on the first failure.
5. **The run records.** Every JSONL step must show `pass:true` with expected equal to actual (spot-check at
   least 25 steps against their screenshots). Each candidate session must show exact commits of 2 and 9 and
   a cancel from C4. The stores must be byte-identical, with the profile back at its default.
6. **The manifest.** It must list every imported emulator module, with its hash timing marked.

State whether **T3a brief §4 is now met in full**, as an EMULATOR-ONLY prototype. If it is not, list exactly
what is missing.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
