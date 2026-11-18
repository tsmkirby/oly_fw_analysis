# T3j: Table-driven acceptance with exact assertions on every key (AF-ON zone row, OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: OM-Emu (Ghidra not needed)

## 0. Rules that override everything below

These are T3i's brief §0 (`ref\tasks\T3i-afon-zone-acceptance\brief.md`), unchanged. In particular:
- Never edit a script after it has run.
- The manifest lists every input, including **every imported emulator module** (each OM-Emu `.mjs`/`.js`
  file the scripts load, directly or transitively). Give each one's hash, and say whether it was taken at
  execution time or later.
- Label every behaviour-changing write, hook or reference construction `role: behaviour` /
  `EMULATOR-ONLY`.
- The value lives in RAM only. No storage decision, no firmware image and no hardware recommendation.

**This task changes no firmware configuration.** Use T3i's final configuration exactly: H, plus the help
list, plus the kind-4 label row, with T3i's 368-byte overlay and runtime writes. Copy it from
`ref\tasks\T3i-afon-zone-acceptance\run-20261118-123315\work\`. Any byte difference from T3i is a
deviation and must be reported.

## 1. Background

T3i's functional acceptance is confirmed by Sol (`ref\tasks\T3i-afon-zone-acceptance\decision.md`). The
one remaining gap, also raised in T3g and T3h, is this: **every key press must be followed by an exact,
executable assertion** of the expected UI state and readback. That includes chooser navigation, exits,
menu navigation and the page-28 reference construction.

## 2. Work

1. **Step table.** Write the acceptance as data: `work\scripts\accept_table_j1.json`, a list of steps. Each
   step has these fields:
   - `id`;
   - `key`, or `action` for non-key steps such as a reference construction, save or reopen;
   - `expect`, which holds:
     - `title`: the exact page-title text;
     - `highlight`: the exact highlighted row text, or chooser-slot text or image ID;
     - `readback`: the exact values expected for the profile byte, `0x90a1` and any cell the step may
       change;
     - `invariant: true` (meaning every other listed cell must equal the previous step's snapshot);
   - `controlStep`: the ID of the matching control step, or `null`.

   Derive the expected texts from the stock control where they are shared, and state them literally in the
   table. Do not compute them at run time from the candidate.
2. **Runner.** Write one runner, `work\scripts\accept_runner_j1.mjs`, that executes the table for the
   candidate (two fresh sessions) and the control.
   - After **every** step, it captures the title, the highlighted item, the full-cell snapshot and a
     screenshot.
   - It compares each against `expect`, and against the control at `controlStep`.
   - It writes one JSONL record per step with `pass: true|false`, the expected and actual values, and the
     screenshot name. On the first `pass:false` it stops with `ok:false`.
   - The full-cell snapshot is the same as T3i's: `0x90a1`, all of `0x1dd1`, `0x99a1`, `0x9a41`, `0x5962`,
     every `MODE_AF_HOME*` cell, the `*_ORIGINALLY` getter values, and the profile byte.
3. **Coverage.** The table must cover, for each candidate session:
   - the menu path to page 27, every navigation key included;
   - opening and cancelling both stock rows;
   - opening the AF-ON chooser, moving to C4 slot by slot (every Right asserted), and cancelling from C4;
   - committing exactly 2 and then exactly 9, each with every navigation key asserted and a readback of the
     row glyph;
   - pages 25 and 26, page 27 on return, and page 28 by reference construction;
   - the native save, then a new session on the saved store, with an assertion that the profile byte is at
     its default and that the M and E stores are byte-identical to the control's.

   The control runs the shared steps.
4. **If a step fails,** report it as it happened. Do not change the expectation to make it pass. You may fix
   a harness defect only in a new script version, with the fix explained, and you must keep the failing run.

## 3. Deliverables (under `work\`)

`result.md` (template), `evidence-manifest.json` (refreshed last, through the wrapper, with the complete
dependency inventory), `accept_table_j1.json`, the runner, the per-step JSONL logs, the screenshots and
`out\cmd\`.

## 4. Out of scope

Any configuration change, packaging, storage, T3b, AF-ON button behaviour and hardware.
