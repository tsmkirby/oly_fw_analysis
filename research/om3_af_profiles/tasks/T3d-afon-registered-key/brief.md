# T3d: Does a registered key open the native chooser for the AF-ON row? (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

- **Where you may write.** This is a disposable execution workspace (`TASK.md`). Write **only** under
  `work\`. Do not modify OM-Emu source. `ref\` is read-only.
- **Tools.** Run Ghidra only through `tools\bin\run-ghidra.cmd`, and Node as `node26`.
- **Emulator state.** `OM_EMU_NVRAM` stays `off`, except in persistence runs, which use a new file under
  `work\out\` for each run.
- **Emulator only.**
  - Firmware byte changes exist only as an in-memory overlay CSV, or as runtime writes or hooks labelled
    `EMULATOR-ONLY`.
  - **Label every behaviour-changing write or hook `role: behaviour`**, and every pure observation
    `role: observe`, in the code and in every JSONL line.
  - Never write a firmware image, component or SD file. Make no hardware recommendation.
- **This is an offline UI experiment, not a storage decision.**
  - Mapping the row onto a cell of `0x5b82` here does not choose the AF-ON storage. That is the owner's
    decision Q7 in `ref\PROJECT-STATE.md`.
  - Do not describe any result as a persistence design.
- **Recording commands.**
  - Copy T3c's `run_logged.mjs` from `ref\tasks\T3c-afon-editor-routing\run-20261118-073716\work\scripts\`
    into `work\scripts\`.
  - Run **every** command through it: `node26 work\scripts\run_logged.mjs NN <program> <args...>`.
  - `node26` is a `.cmd` file, so the wrapper must start Node scripts with `process.execPath` (or use
    `cmd.exe /d /c` for `.cmd` programs). Fix this first, as a new version of the wrapper.
  - Never reconstruct output.
- **Naming.** Give every script and output a new, unique name, and never overwrite a used file.
- **Commands.** Call tools by name, and never start a command with a parenthesis. No network, Git, ACL
  commands or installs.

## 1. Background (read first)

Read these first:
- `ref\tasks\T3c-afon-editor-routing\decision.md`;
- `ref\tasks\T3a-afon-zone-row\decision.md`;
- T3c's last Sol review, `run-20261118-080617-review\review.md`;
- T3c's final work, `ref\tasks\T3c-afon-editor-routing\run-20261118-073716\work\`: the E1/E4 scripts,
  `out\design.md` and `out\phaseA.md`;
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §8 (UI-ID maps, typed accessor, registry);
- T2's capacity table and verdict, `ref\tasks\T2-cell-ownership\run-20261117-220544\work\out\verdict-v2.md`;
- `ref\tasks\T2b-cell-ownership-gaps\decision.md`.

What is established:
- **The working stock route.** OK on rows 2154, 2155 and C-AF Area reaches the branch at `0x6124f7d4`
  with D0=4, then the chooser path `FUN_610cdebf` → `FUN_610cdf05` → `FUN_610e2536`.
- **What fails for the new row.** `0x3D6F` gets D0=1, even as a byte-exact copy of row 2154 (E1).
- **The provider ID decides.** Changing only the provider ID to 2154 (E4) opens the chooser.
- **Mapped keys.** The mapped getter `0x60419446` returns key `0x90A1` for 2154 and 0 for `0x3D6F`.
- **Leading hypothesis.** The editor opens only for a UI ID that resolves to a registered settings key.

## 2. Work

1. **Locate the decision.** Follow `FUN_6119a2be` → `FUN_61203082` → `FUN_6120308d` into the callee that
   returns 4 or 1.
   - Give a bounded listing, checked against the image bytes.
   - Record a dynamic trace of the values for 2154, 2155, C-AF Area and `0x3D6F` at the instruction that
     decides.
   - State exactly what it reads: the mapped key, the registry entry, the descriptor, a type or count, or
     something else.
   - Fix the direct-call search that Sol found unreliable: compare absolute targets with absolute
     targets.
2. **Experiments.** At most **four**, each changing **one** thing against a stated baseline. Before each
   one, state the explanation it tests.
   - **Baseline:** T3c's E1 configuration (the stock-shaped row with ID `0x3D6F`, the T3a overlay and the
     redirects), **without** T3a's value hooks.
   - **K1.** Make `0x3D6F` resolve natively to a registered key cell: key `0x5b82`, **unnamed index 0**.
     Do this at the narrowest point the item-1 decision needs: a UI-ID map entry, or else one
     EMULATOR-ONLY hook on the mapped getter and index getter, returning `0x5b82` and 0 only for
     `0x3D6F`. Test:
     - Does OK now give D0=4 and open the two-option chooser of list `0x6158ba04`?
     - Does confirm write `0x5b82[0]` through the native setter, and cancel not write it?
     - Read back all 16 cells of `0x5b82`, plus `0x90a1`, before and after.
   - **K2 (only if K1 opens).** Point the row at the 10-record zone list `0x6158ba1c` (image options).
     Does the chooser show the 10 zone images? Do confirm and cancel behave as in K1?
   - **K3 (only if K2 fails to show the zones).** Build a text zone list in the owned section-1 tail as
     overlay bytes.
     - It holds kind-4 records with the zone values, and the text labels of the stock zone names, for
       example from the "AF Target Mode Settings" checklist, group 364.
     - Give each label's text ID and its source record. List any value that has no stock label.
     - Test it as in K2.
   - **K4** is free. State its explanation first.
   - For every experiment, record:
     - a snapshot **immediately before OK** (the screen and the highlighted row text);
     - **immediately after OK**, and after confirm or cancel: the screen, the cells listed in K1, and
       `0x1dd1` (all 10 cells), `0x99a1`, `0x9a41`, `0x5962`, and every `MODE_AF_HOME_AREA_*` and
       `MODE_AF_HOME*` cell;
     - a write trace on the native setter and on the store routines (`0x6041937f`, `0x60063431`,
       `0x60063380`) across the whole OK…confirm/cancel interval;
     - row refresh, chooser construction, input focus and commit, as separate events.
3. **Acceptance (only if K2 or K3 commits correctly).** Run brief §4 of T3a
   (`ref\tasks\T3a-afon-zone-row\brief.md`), with the rules of its §7 item 3:
   - two fresh sessions plus a stock control with the same key sequence;
   - assertions after every step;
   - full-cell readbacks compared against the control at the same step;
   - pages 25, 26 and 27;
   - the persistence check: a native save to separate store files, then a new session, then a
     byte-by-byte store comparison. In this experiment the stores are **expected** to differ only in the
     `0x5b82` cell that was written. Report every differing byte, its record and its key.
4. **The native change.** For the route that works, list the native data or code a final firmware
   would need:
   - the UI-map entry's location and section (and whether that section is compressed);
   - the registry implications;
   - the overlay bytes.

   Give this as a proposal, not as a storage choice.

## 3. Deliverables (under `work\`)

`result.md` (template), `evidence-manifest.json` (refreshed last, through the wrapper), `out\decision-point.md`,
`out\design.md`, `out\overlay-changed-bytes.csv` (complete), `out\cmd\`, the scripts, the JSONL logs and
the screenshots.

## 4. Out of scope

- Choosing storage.
- Any write to a stock store except inside the emulator.
- The target-position editor (T3b).
- AF-ON button behaviour.
- AF Home.
- Hardware.
