# T0 review brief (Codex Sol, read-only)

You are the independent reviewer. You cannot write files. Your final message is saved by the host.

1. Read `TASK.md`, `brief.md`, `work\result.md`, `work\out\log.txt` and `work\evidence-manifest.json`.
2. Recompute SHA-256 of `ref\PROJECT-STATE.md`, `ref\analysis\button-af\FEATURE-SPEC.md` and
   `inputs\00_0100_50000020.decoded.bin`, and compare them with the result.
3. Recompute every hash in `work\evidence-manifest.json`.
4. Check `work\out\ghidra-smoke.txt` against `ref\analysis\ghidra-validation\` (the 9 bytes at
   `0x60405804`), and against the decoded main itself (file offset = address − `0x60021020`).
5. Check whether each claimed outcome in steps 6a–6h is supported by the log. A refusal
   needs the actual error text; a claimed refusal with no error text is UNSUPPORTED.
6. Try **once** to create `work\sol-write-test.txt` with a shell command, and report the
   result. Do not retry or work around it.
7. Answer in the structure of `templates\review.md`. Treat steps 2–6 of the T0 brief as the claims.
