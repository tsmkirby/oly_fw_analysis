# T11: A shared acceptance harness that makes the checks structural; combined hook set; re-prove T8d and T9d (OM-Emu)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu

## 0. Why this task exists, and rules that override everything below

T8d and T9d now **work** (T8d `proof-t8d10` `ok:true`; T9d frames match references), but both were rejected for
the same recurring defects: assertions not made after every edge, identity expectations missing for some commits,
behaviour armed by the runner rather than the installed hook, and incomplete execution-time inventories. This task
removes those defects **by construction**, then re-runs both proofs on one combined hook set.

- **Read first:** the T8d and T9d decisions and all four of their Sol reviews; the T8b decision (generated-table
  method); `proof_t8d10.mjs`, `hook_t8d_writer9.mjs`, `gen_proof_table_t8d1.mjs`, `check_proof_t8d1.mjs`
  (`ref\tasks\T8d-afon-target-record-reconcile\run-20261119-202459\work\scripts\`); `lib_valid_t9d.mjs`,
  `obs_seed_t9d.mjs`, `write_refs_t9d.mjs` (`ref\tasks\T9d-afon-display-size-inputs\run-20261119-202459\work\scripts\`).
- All inherited rules apply (T3j, T5, T6, T8, T8b, T8c, T8d, T9c, T9d): wrapper, hashes, frozen scripts (new names,
  never edit after running), `EMULATOR-ONLY`, sections from the image (only `0x610bf5e3`–`0x610bf5e5` in section 7),
  `0x1e71[0]=0`, `OM_EMU_MODEL=E147`, stop at the first failure, no storage decision, no hardware recommendation.
- **Every emulator process is an experiment version. At most six.** Building and unit-testing the harness in pure
  Node, without OM-Emu, is not a version.

## 1. Harness (`work\harness\`, versioned filenames)

1. **Execution inventory.** A Node module-loader hook (`module.register`) that records, at import time, every
   imported file's absolute path, byte length and SHA-256, plus the command line, environment (`OM_EMU_MODEL`,
   `OM_EMU_NVRAM`) and start time; re-hashes them at exit and fails the session if any changed. Every emulator
   session must load it first. The manifest is generated from these records, not written by hand.
2. **One gated input function.** All keys, dial detents, edges (down and up separately), setter test-setup writes and
   pose changes go through a single function that, after each, takes and asserts the **full state**: every
   mirror-copied half-press slot in every bank (the 63 T8c slots), the full 71-byte mirror and flag, both ten-byte
   records, owner, `0x1e71[0]`, and, for display runs, the frame signature. A raw key call outside it fails a static
   check (grep of the runner) and fails the session.
3. **Identity table.** A dedicated identity pass (one version) records, for every commit step of every role,
   title hash and highlighted row; the table is hashed and sealed before any acceptance session. The commit function
   refuses to send OK/MENU/commit unless the sealed table has that step's expectation, and compares it — for K1e,
   K2 and candidate alike.
4. **Generated table and checker** from T8b/T8c/T8d, extended with: per-field single source; exits matched to
   real control sequences; zone press **and release** comparisons; every-refresh getter records with refresh id,
   time and frame signature for display runs.
5. **Unit tests** for 1–4 in pure Node (a fake emulator object is acceptable).

## 2. Combined hook set (`afon_hooks_v1.mjs`, one labelled combined change)

The accepted parts only: T6 reader with the T8c saved-index `bank()`; T3m restores; the T8d writer feed and pose
gate; the T9d display hook using the same `bank()`. **Self-arming:** the writer feed is armed by the installed hook
detecting the AF-ON press on the native path (owner transition to 2), with no runner flag. `initMirror()` unchanged.

## 3. Proofs (on the harness)

1. The T8d sequence (landscape, EXIF 6, return, normal edit, the seven-zone table with press and release, custom),
   plus one extra: the pose gate after a **non-reset normal edit**. Ends `ok:true`.
2. The T9d display validation for seeded A and seeded B against the existing hashed K1e references, full K2 and K1,
   with every-refresh getter records. Each ends `ok:true`.

Suggested budget: identity pass 1, T8d proof 1–2, display 2, spare 1–2.

## 4. Records

`result.md` (template); `harness.md` describing the guarantees and how a later task uses them; the generated
manifest; an external seal. Carry the non-blocking unresolved items (mode-selecting getter input; `0x610c8b66`
scheduling producer) forward unchanged.

## 5. Out of scope

Persistence (next task, on this harness, with codec v2), Subject Detect On, packaging, hardware.

## 6. Correction round (Opus, after Sol's review `run-20261119-222335-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely.
Do **not** start over, and do not edit any executed file (new versioned names only).

**Confirmed, reuse:** `afon_hooks_v5.mjs` `bank()` and `initMirror()` equal T8c; reader, writer feed and display share
`bank()`; the writer self-arms on the owner 0→2 transition with no `armPress` (3 calls in the candidate session);
the identity-mode numerical comparisons (three press, three release, normal edit = K2, 14 zone press/release);
the 39-step table and its 28 exit matches; section and overlay records.

**Required:**
1. **Assertions inside the gate.** The gate itself captures and **compares** the full state (§1.2 list) after every
   individual down, up, setter, pose and zone operation, before returning. Define the expectation per step in the
   generated table: every field the step names equals its single declared source; **every other field equals its
   value before the operation**. Capturing without comparing does not count. Route all setup writes (custom live
   cells, flag clear, display seeding) through the gate as declared setter steps; extend the static check to reject
   direct memory writes and `tap(...)`/raw OK outside the gate, and prove it rejects a planted bypass in a unit test.
2. **Identity completeness.** Before any acceptance session, a pure-Node check proves that every `identityFrom` and
   every commit of every role has a row in the sealed table (including `ke-s1-down`, `ke-s1-up`, `ke-p-s1-down`,
   `ke-p-s1-up`); the session refuses to start otherwise. The gate refuses any commit-class input (OK, MENU, AF-ON
   commits in zone runs, custom traversal) without a sealed row, and logs expected and actual for every success.
3. **Pose protection from installed behaviour.** The refusal predicate must not read `watchArmed` or anything else
   the runner sets. Derive "pose change in progress" from an installed hook on the native pose path. Show in a unit
   test that toggling instrumentation does not change any refusal. Keep the normal-edit commit and the non-reset
   pose-after-edit case.
4. **Inventory fails closed.** Load the loader hook before any task module (e.g. `--import` of the inventory
   registrar), make a hashing error fatal, run the exit check on every exit path (including throws), include
   non-module inputs (decoded images, combined overlay, references) and write `work\out\cmd\` command records.
5. **Refresh recorder.** Keep the returned value for passthrough calls, record substituted (`skip_call`) calls too,
   remove the silent 500-call cap or fail on it, and fail on any null return or unclosed window. Unit-test the
   **final** versions of gate, judge, predicates, static check and recorder.
6. **Proofs.** Then: a new identity pass sealed before acceptance, the T8d proof `ok:true`, and display A, B, K2, K1
   `ok:true` with every-refresh records. Optional: custom-release with a live profile distinct from the AF-ON one.
7. **Records.** Correct `result.md` §9, §11, §12 and `harness.md` guarantees; supplemental manifest and new seal.

**Authorization: five new experiment versions** (emulator processes); pure-Node work is not a version.
Stop at the first failed assertion as before.
