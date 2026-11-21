# T13: run the accepted acceptance harness (Grok 4.7 High, run-only)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-20 (run-only stage). Design, implementation and code review are complete: Opus wrote the
harness (owner decision 2026-11-20, escalation option 4); Sol accepted it (`run-20261120-224009-review`, ACCEPT-CODE).

## 0. Rules that override everything below

- **You only run commands.** Do not create, edit, rename or delete any file under `work/harness/`, `work/freeze/`,
  `om-emu/`, `inputs/` or anywhere else, except the two report files in §3. The launcher writes all run evidence
  itself under `work/out/`.
- **Exactly six processes**, in the order of §2, each started once. Stop at the first process whose exit code is not
  0 or whose `work/out/<tag>.launch/exit.json` does not have `"ok": true`. Starting any further process (a retry, a
  re-run under another tag, a diagnostic) needs the coordinator's written authorization: report and stop instead.
- **Do not interrupt a running process.** The identity run starts nine emulator sessions and may take a long time.
  Wait for it to exit by itself.
- **No hardware.** EMULATOR-ONLY. Nothing here touches a physical camera, and no image is built.
- Use `node26` by name (the pinned Node v26.12.1), from the workspace root. Do not add flags. Do not set
  `NODE_OPTIONS` or any other variable. The launcher builds the child's environment itself.

## 1. What the six processes do

- **`identity`:** seals the identity pass and checks the behaviour relations. It runs the K1e, K2, candidate, zone and display sessions, 432 operations.
- **`proof`:** reproduces the T8d and zone roles against the sealed identity, 324 operations.
- **`display-a`, `display-b`, `display-k2`, `display-k1`:** reproduce one display job each.

A run is valid only if its `exit.json` has `"ok": true`, `"valid": true` and `"mode": "real"`.

## 2. Commands

Freeze digest (recorded by the coordinator outside the workspace):
`819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b`

```
node26 work/harness/launch_v3.mjs identity t13-identity --freeze-sha 819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b
node26 work/harness/launch_v3.mjs proof t13-proof --freeze-sha 819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b --identity t13-identity
node26 work/harness/launch_v3.mjs display-a t13-display-a --freeze-sha 819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b --identity t13-identity
node26 work/harness/launch_v3.mjs display-b t13-display-b --freeze-sha 819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b --identity t13-identity
node26 work/harness/launch_v3.mjs display-k2 t13-display-k2 --freeze-sha 819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b --identity t13-identity
node26 work/harness/launch_v3.mjs display-k1 t13-display-k1 --freeze-sha 819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b --identity t13-identity
```

After each process, read its `work/out/<tag>.launch/exit.json`: `ok`, `valid`, `mode`, `problems`, `completion`.
If a process fails, do not diagnose it by running anything. Report the failing operation from `exit.json`
`problems`, `work/out/<tag>/complete.json` `error`, and the last rows of `work/out/<tag>/log.jsonl` and
`work/out/<tag>.launch/stderr.txt`.

## 3. Report (the only files you write)

- **`work/result.md`.** Use the structure of `templates/result.md`. For each process started, give:
  - the exact command, exit code and duration;
  - `ok`, `valid` and `mode`, and the `problems` list verbatim;
  - from `completion`: operations executed and expected, relations evaluated and failed, reproduction count, refresh-record counts, and press reference;
  - for a failure, the first failing operation id and its problems, verbatim from `log.jsonl`.
  Label every claim `OBSERVED-EMU` (from the run records) or `INFERRED`. Make no claim about stock-camera behaviour, packaging or hardware.
- **`work/evidence-manifest.json`.** List `work/out/<tag>/` and `work/out/<tag>.launch/` for every tag you started (path, sha256, bytes), plus the six commands. Overwrite the existing file; the implementation-stage manifest is kept as `work/evidence-manifest-impl-v3.json`.

The implementation-stage result is kept as `work/result-impl-v3.md`. Do not edit it.
