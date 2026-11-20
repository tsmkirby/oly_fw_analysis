# T12b: Close the harness defect classes by construction (pure Node, no emulator)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-20 · Workspace: OM-Emu source (read for its API only)

## 0. Why this task exists, and rules that override everything below

T12 closed PARTIAL. Its remaining defects are instances of classes that keep recurring: a deny-list scanner misses
APIs, an inventory with path exclusions misses inputs, a hand-picked freeze misses imports, and separately enumerated
coverage lists drift from the drivers. This task replaces each mechanism with one that cannot miss by construction.

- **Zero emulator processes.** No OM-Emu, Ghidra or Java. All tests on a fake emulator object.
- **Start from** `ref\tasks\T12-afon-harness-completion\run-20261120-003025\work\`. Read the T12 decision and both
  T12 Sol reviews (`...\run-20261120-002500-review\review.md`, `...\run-20261120-010959-review\review.md`).
- **Keep what is accepted** (T12 decision, "Accepted"): the combined hook, predicates, state and table byte-identical;
  the pre-delivery sealed-row check; gate-decided commit class; post-settle release identity; full-value comparisons;
  the recorder and its tests. Copy under new versioned names; change only what an item below requires, and say so.
- New versioned filenames, never edit after running, `EMULATOR-ONLY`, no storage decision, no hardware step.

## 1. Closed checklist (the only acceptance criteria)

1. **Capability passing instead of scanning.** Runners and drivers never receive the session, lab, simulator or
   memory objects. A single harness entry creates the session and hands runners only a gate handle exposing gated
   operations (and read-only results). The session object lives in a module-private closure. Static check: runner
   and driver files may import only the harness entry (and Node built-ins on an allow-list). Unit test: a planted
   runner that tries to reach the session (import of an emulator module, `globalThis` lookup, prototype walk on the
   handle) cannot obtain it and fails.
2. **`fs`-level read inventory, no exclusions.** At registrar load, before anything else, wrap every Node file-read
   entry point (`fs.readFileSync`, `readFile`, `openSync`/`open`, `createReadStream`, `fs.promises.*`, and module
   loads via the loader hook). Every path read is hashed at first read and re-hashed at exit; no path is excluded
   (the registrar's own output files are the only writes and are not inputs). Exit handling is installed first,
   before any validation, including the tag check. Tests: an identity JSON under `work/out/` is recorded and
   compared; a file changed between read and exit fails; a failure during initialization still writes a failing exit
   record.
3. **Freeze from execution.** Produce `harness-freeze.json` by running **every** T13 runner end to end on the fake
   emulator under the inventory (no load-only branches, no preload list). Freeze = every module loaded plus every
   file read, with length and SHA-256. T13 must refuse to start if any loaded module or read file is missing from the
   freeze or differs from it.
4. **One operation-definition module.** A single module defines every operation (setup, keys and edges, setters,
   poses, zone, custom, display jobs) with its ID, commit class, expectation source and identity requirement. Drivers
   iterate that module; the coverage check and identity-table generator read the same module. No other list of IDs
   exists. Test: deleting one definition removes it from the drivers' execution and from coverage together.
5. **Live setup deltas sealed, not assumed.** For setup operations whose live effect is unknown, the identity pass
   records the observed full-state delta and seals it alongside the identity rows; the proof compares each setup
   operation to its sealed delta (any field not in the sealed delta must be preserved). Unit test on a fake whose
   setup changes a field: the identity pass seals it, and the proof passes on the same change and fails on a
   different one.
6. **Records.** `harness.md` limited to demonstrated guarantees; T13 runners written but not run on the emulator;
   `result.md`, manifest and external seal.

## 2. Out of scope

Running any emulator proof (T13), persistence, Subject Detect On, packaging, hardware. The two T9d mechanism items
stay unresolved and non-blocking.

## 3. Correction round (Opus, after Sol's review `run-20261120-015622-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely. Do not
start over and do not edit any executed file. Still **zero emulator processes**.

**Confirmed, reuse:** the six accepted copies byte-identical; the shared `OPERATIONS` module feeding drivers,
coverage and identity (item 4); sealed setup deltas with `diffState`/`expectFromDelta` (item 5); exit handlers before
the tag check; the closure-private session; the 20-path fake-run freeze generation.

**Most important (item 6 / Sol item 4):** the runners must execute the **real** T13 implementation. Restore the
accepted T12 operation payloads, expectations, settling/idle times, full state capture, hook installation
(`afon_hooks` combined hook) and recorder integration from `ref\tasks\T12-afon-harness-completion\run-20261120-003025\work\`
behind the private entry. Write `createReal()` fully (OM-Emu session creation as T11/T12 did) but do not call it.
The fake must implement the emulator API surface those real paths use (as the T12 v6 fake did), so the fake runs
exercise the same code, not stubs. No `hold`-everything expectations, no zero idle, no no-op delivery.

**Required:**
1. **Capabilities.** No runner-supplied callback receives backing state; the handle exposes frozen operation
   descriptions or IDs only. The static check covers computed `import()`, `createRequire`, `require`, `process.binding`
   and `node:module`; a runtime test plants a **valid, resolvable** emulator import and shows it is refused by policy
   (assert the refusal reason, not any error).
2. **Inventory.** No exclusions: the freeze file is an input and is inventoried. Handle Buffer and URL paths and
   descriptor-based reads (record the path at `open`, hash at first read). Probes for each form.
3. **Freeze enforcement mandatory.** Any non-capture run refuses to start unless the freeze validates; capture mode is
   an explicit, logged exception that cannot be combined with proof mode. The freeze also lists, by revision, diff
   digest and per-file SHA-256, every file under the OM-Emu checkout's source tree, so a real T13 session's emulator
   imports are covered without running the emulator now.
4. **Records.** Make the identity-generator deletion test use an identity-bearing operation; regenerate the freeze from
   the restored runners on the fake; update `harness.md`, `result.md`, manifest and seal.
