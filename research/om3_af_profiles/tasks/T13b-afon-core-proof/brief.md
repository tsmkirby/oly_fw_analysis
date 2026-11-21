# T13b: run the staged core AF-ON proof (Grok 4.7 High, run-only)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-21 (run-only stage). Opus wrote the harness; Sol accepted it (`run-20261121-054631-review`,
ACCEPT-CODE). **Coordinator authorization:** this brief authorizes exactly the two emulator processes in §2 (as
required by T13's run review `run-20261120-231437-review`).

## 0. Rules that override everything below

- **You only run commands.** Do not create, edit, rename or delete any file except the two report files in §3. In
  particular nothing under `work/harness/`, `work/freeze/`, `om-emu/`, `inputs/`. The launcher writes all evidence
  under `work/out/`.
- **Exactly two processes**, in the order of §2, each started once. Stop at the first process whose exit code is not 0
  or whose `work/out/<tag>.launch/exit.json` does not have `"ok": true`. No retry, no other tag, no diagnostic
  process: report and stop.
- **Do not interrupt a running process**; wait for it to exit.
- **No hardware.** EMULATOR-ONLY. Use `node26` by name from the workspace root; add no flags; set no variables.

## 1. What the processes do

1. `identity` — the T8d sessions (K1e, K2, candidate) and zone sessions (zone K1e, zone candidate): 324 operations,
   all behaviour relations, identity seal.
2. `proof` — reproduces the same 324 operations against the sealed identity (every field, preservation, commit
   identities) and checks the relations again.

A run is valid only if its `exit.json` has `"ok": true`, `"valid": true` and `"mode": "real"`.

## 2. Commands

```
node26 work/harness/launch_v5.mjs identity t13b-identity --freeze-sha 03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92
node26 work/harness/launch_v5.mjs proof t13b-proof --freeze-sha 03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92 --identity t13b-identity
```

After each, read `work/out/<tag>.launch/exit.json` (`ok`, `valid`, `mode`, `problems`, `completion`). On a failure,
report from `exit.json` `problems`, `work/out/<tag>/complete.json` `error`, and the last rows of
`work/out/<tag>/log.jsonl` (rows with `"active": true` or `"pass": false`) and `work/out/<tag>.launch/stderr.txt`.

## 3. Report (the only files you write)

- `work/result.md` in the structure of `templates/result.md`: per process the exact command, exit code, duration,
  `ok`/`valid`/`mode`, `problems` verbatim, and from `completion` operations executed/expected, relations
  evaluated/failed, reproduction count, press reference; for a failure the first failing operation id and its
  problems verbatim. Label claims `OBSERVED-EMU` or `INFERRED`. No claim about stock-camera behaviour or hardware.
- `work/evidence-manifest.json`: every file under `work/out/<tag>/` and `work/out/<tag>.launch/` for each tag you
  started (path, sha256, bytes), and the commands. Overwrite the existing file; the implementation-stage files are
  kept as `work/result-impl.md` and `work/evidence-manifest-impl.json` (do not edit them).
