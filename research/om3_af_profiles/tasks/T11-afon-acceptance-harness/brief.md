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
