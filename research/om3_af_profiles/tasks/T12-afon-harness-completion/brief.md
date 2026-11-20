# T12: Complete and freeze the acceptance harness in pure Node (no emulator)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: OM-Emu source (read for its API only)

## 0. Why this task exists, and rules that override everything below

T11 closed PARTIAL: two rounds spent most emulator versions discovering harness defects mid-experiment. This task
finishes the harness **without running the emulator at all**, so it can be reviewed and frozen before any proof.
The proofs follow in T13 on the frozen harness, with no harness edits allowed there.

- **Zero emulator processes.** Do not start OM-Emu, Ghidra or Java. Every test uses a fake emulator object. Any
  OM-Emu session in the command records fails the task.
- **Start from** `ref\tasks\T11-afon-acceptance-harness\run-20261119-223109\work\` (harness, scripts, table, identity
  table v10 and its seal). Read the T11 decision and both T11 Sol reviews completely
  (`ref\tasks\T11-afon-acceptance-harness\run-20261119-222335-review\review.md`, `...\run-20261119-233249-review\review.md`).
- **Do not change behaviour that is accepted:** `bank()`, `initMirror()`, the self-arming writer feed, the native pose
  latch, the display substitution. Copy them under new versioned names byte-for-byte unless a checklist item requires
  a change, and say which.
- Inherited rules apply: new versioned filenames, never edit a file after running it, `EMULATOR-ONLY` labels, no
  storage decision, no hardware recommendation.

## 1. Closed checklist (the only acceptance criteria)

1. **Full-state comparison.** For every operation (each individual down, each up, setter, pose, zone, setup write),
   the gate compares **every** field of the §1.2 T11 state against either a declared expected value with a single
   source, or explicit preservation (equal to the value before the operation). No shape/type-only check, no
   undeclared exemption (fix `compare_v3` seal fields, `k1eMenuExpect`, `stepExpect` position exemption, control-role
   `judgeDown`). Remove paired `press()` or make it two gated edges. Route the remaining native setup calls through
   the gate. The scanner rejects every bypass form.
2. **Identity completeness and enforcement.** The pre-session check covers every commit of every role, including the
   dynamic zone, custom and display operations (generate them into the table, or enumerate them before the session).
   The gate decides commit class itself from the input (OK, MENU, AF-ON edges in commit context), not from a caller
   flag, and refuses any commit without a sealed row. Zone AF-ON releases and display commits get identity rows.
   Every success retains expected and actual. Redesign the candidate AF-ON release step so its identity is captured
   **after** the key event, at the screen that is actually up, in both the identity pass and the proof.
3. **Inventory.** Include the identity table and seal and every non-module input read during a session; record
   `process.execArgv` together with `process.argv`; every exit path runs the exit check.
4. **Tests of the exact final files.** Unit tests import the very versions the T13 runners will import (gate,
   comparator, scanner, judge, predicates, recorder, inventory, coverage check). Include, at minimum: a planted
   bypass for each scanner rule; a changed unexpected slot, a changed exempt-looking slot and a wrong declared value
   each failing the gate; a missing identity row (static and dynamic) refusing the session; an unmarked commit refused;
   instrumentation toggles not changing pose refusal; the recorder keeping returns and substitutions, assigning
   getters that occur outside a refresh to a declared category rather than rejecting them blindly, and linking each
   refresh to a frame sample taken in that refresh's window (not a later one).
5. **Records.** `harness.md` states only guarantees demonstrated by the tests. `harness-freeze.json` lists every file
   T13 may import (path, length, SHA-256) and the T13 runners (identity pass, T8d proof, display A/B/K2/K1) written
   but **not run**; the static check passes on them. `result.md`, a manifest and an external seal.

## 2. Out of scope

Running any proof (T13), persistence, Subject Detect On, packaging, hardware. The two T9d mechanism items stay
unresolved and non-blocking.
