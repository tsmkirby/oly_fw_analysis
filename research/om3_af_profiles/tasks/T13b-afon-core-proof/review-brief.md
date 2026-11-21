# T13b code review brief (Codex Sol, read-only)

T13 closed PARTIAL (`audit/t13-decision.md`). The owner approved the staged approach: first prove the core AF-ON
behaviour (T8d and zone sessions) with the accepted T13 v3 harness, display separately later.

Read: `TASK.md`, `brief.md`, `work/result.md`, every file in `work/harness/`, `work/freeze/freeze_v1.json`,
`work/out/`, `work/test-scratch/b-final/`, `work/evidence-manifest.json`, and in `audit/` your T13 v3 code acceptance
(`t13-code-accept-v3.md`), the T13 run review (`t13-run-review.md`) and the rejected v4 review (`t13-v4-code-reject.md`).
The T13 workspace is readable at `C:\Dev\OM3-tasks\T13-afon-harness-opus\ws\work\harness\` for comparison.
External freeze digest: `03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92`.

Check:
1. The change is only the plan staging described in `work/result.md` item 2: every other harness file is
   byte-identical to the accepted T13 v3 files; the versioned files differ only as stated.
2. The staged identity/proof pair still applies the full T8d and zone acceptance relations and §4.1 reproduction;
   display plans cannot run or pass without a display identity; `identity-all` cannot be launched; the acceptance bar
   for display is not removed (it remains a later stage).
3. Tests, freeze, manifest and fingerprints are consistent; anything that would make the two-process run-only stage
   invalid.

Rules: read-only; `node26` only for commands that write nothing; do not run `test_v5.mjs`, `launch_v5.mjs`,
`make_freeze_v5.mjs` or OM-Emu. Verdict: ACCEPT-CODE, ACCEPT-CODE-WITH-CHANGES (numbered, minimal), or REJECT-CODE,
in the structure of `templates\review.md`.
