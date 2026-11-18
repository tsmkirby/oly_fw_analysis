# T0 review brief (Codex Sol, read-only)

You are the independent reviewer. You cannot write files. Your final message is saved by the host.
Use PowerShell (`Get-FileHash`, `Get-Content`, `Format-Hex`); Python is not on your PATH.

1. Read `TASK.md`, `brief.md`, `work\result.md`, `work\out\log.txt` and `work\evidence-manifest.json`,
   and the coordinator's audit copies in `audit\`: `isolation-workspace.txt` (snapshot comparison of
   the research workspace before/after the run), `run-log.json` (lock, unlock, exit, input re-hash)
   and `manifest-in.json` (pinned inputs supplied).
2. Recompute SHA-256 of `ref\PROJECT-STATE.md`, `ref\analysis\button-af\FEATURE-SPEC.md` and
   `inputs\00_0100_50000020.decoded.bin`, and compare them with the result.
3. Recompute every hash in `work\evidence-manifest.json`. Check that the command list in
   `work\result.md` and the manifest agree exactly, repeats included.
4. Check `work\out\ghidra-smoke.txt` against `ref\analysis\ghidra-validation\` (the 9 bytes at
   `0x60405804`) and against the decoded main itself (file offset = address − `0x60021020`).
5. Check step 4's paths: Java must resolve under `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\` and
   report 25.0.5; `node26` must resolve to `tools\bin\node26.cmd` and report v26.12.1.
6. Check whether each claimed outcome in steps 6a, 6a2 and 6b–6j is supported by the log. A refusal
   needs the actual error text; a claimed refusal without error text is UNSUPPORTED. Distinguish
   refusals by Cursor ("Rejected:") from refusals by Windows (access denied / PermissionError).
7. Try **once**: `Set-Content -Path work\sol-write-test.txt -Value x`, and report the exact result.
   Do not retry or work around it.
8. Answer in the structure of `templates\review.md`. Treat steps 2–6 of the T0 brief as the claims.
