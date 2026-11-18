# T3i: Close the AF-ON zone row (help list, the C4 crash, row label, page 28), then the complete acceptance (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

These are T3h's brief §0 (`ref\tasks\T3h-afon-zone-faces\brief.md`), with additions:
- **Manifest.** The manifest lists **every input**:
  - imported helpers;
  - emulator resources;
  - research files read, such as `all-functions.asm`, earlier reports and baseline scripts.

  Give each one's hash, and mark whether the hash was taken at execution time or later.
- **One change per experiment.** If an experiment needs a combined change, label it as combined.
- **Scripts.** Never edit a script after it has run.
- **Hooks.** Label every behaviour-changing write or hook `role: behaviour` / `EMULATOR-ONLY`.
- **Values stay in RAM.** Values go to the RAM profile byte only. No storage decision, no firmware image,
  no hardware recommendation.

## 1. Background (read first)

Read these first:
- `ref\tasks\T3h-afon-zone-faces\decision.md` and its Sol review;
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md`, "How a page-27 row opens its editor";
- T3h's work in `run-20261118-113413\work\`: `out\faces.md`, `out\design.md`, `exp_faces_h2.mjs` and the
  acceptance script.

The configuration that works (call it **H**) is:
- the T3a overlay and redirects, plus T3c's E1 row (a copy of 2154's, with ID `0x3D6F`);
- the action record with editor `0x1e6`;
- the binding `0x1e6` → `0x3D6F` in the relocated array;
- the UI-238 descriptor clone;
- the private face record at `0x6031ea48` (count 10, faces `0x6158ba1c`, help still `0x61576520`, which has
  only two records).

## 2. Work

1. **Help list.**
   - Decode the help-list format, in particular its record size and how `FUN_611c7785` (or the help
     reader) indexes it.
   - Find the stock help texts for the zone types, for example the help used by `MODE_AF_HOME_AREA_TYPE` or
     by the stock AF target mode screens.
   - Build a **ten-record help list** in owned overlay space. Each record gets a justified text ID. If no
     per-zone help exists, use one neutral stock text, justified, for every record.
   - Point the private face record's +`0x10` at it. This is one change against H.
2. **The C4 crash.** Run two separately named experiments with the same key sequence (nine Rights to C4,
   then Menu/cancel):
   - **C-a:** H unchanged. Does it reproduce the access violation? Record the faulting PC and address if
     the emulator reports them.
   - **C-b:** H plus the item-1 help list.

   Report whether the help overrun is the cause. If C-b still crashes, isolate the cause and report it;
   do not paper over it.
3. **Row label.** Starting from H plus the item-1 help list, restore the row's own label and glyph, as one
   change. That means row kind 4, label `0x0DD2` ("AF Target Mode"), and primary list `0x6158ba1c` with
   count 10, as in T3a's original row. Keep the alternate list at 0 unless item 1 shows it is used. Check:
   - the row shows "AF Target Mode" and the current zone's glyph;
   - the chooser still opens and commits.
4. **Page 28.** No native route to page 28 exists (T3c). Render page 28 by the EMULATOR-ONLY reference
   construction used in T3c, in both the candidate and the control, and compare the renders. Label it as a
   reference construction.
5. **Complete acceptance.** Use the final configuration (H, plus the help list, plus the label). Write a
   **new acceptance script**.
   - Two fresh sessions and a stock control, with the same shared key sequence.
   - **An exact assertion after every key press,** including every Down/Right and every menu
     navigation step:
     - the expected page title;
     - the highlighted row or chooser slot text;
     - the expected readback.
   - In each session:
     - commit two **specified** zone values, chosen to include C4 (the last slot); assert the exact
       stored values;
     - cancel once **from C4**.
   - **Full-cell invariance** checks before and after every AF-ON action, and against the control at
     every shared step:
     - `0x90a1`;
     - all 10 cells of `0x1dd1`;
     - `0x99a1`, `0x9a41` and `0x5962`;
     - every `MODE_AF_HOME*` cell;
     - the `*_ORIGINALLY` getter values.
   - Render pages 25, 26, 27 and 28 (28 by reference construction) in the candidate and the control.
   - Do a native save to separate store files, then start a new session. Compare the stores byte by byte
     (they are expected to be identical), and check that the profile byte is back at its default.
   - A failed assertion ends the run with `ok:false`. Report it as it happened.
6. **The native change.** Update the list of native data a final firmware needs:
   - action record, binding record, descriptor and its registration;
   - face record and help list;
   - row data;
   - section-7 pointers and counts;
   - value routing.

   For each item, give its current emulator placement and the native constraint, such as the compressed
   section or the size.

## 3. Deliverables (under `work\`)

`result.md` (template), `evidence-manifest.json` (refreshed last, through the wrapper), `out\help.md`,
`out\crash.md`, `out\design.md`, `out\overlay-changed-bytes.csv` (complete), `out\cmd\`, the scripts, the
JSONL logs and the screenshots.

## 4. Out of scope

Storage choice; placement of the binding array; the target-position editor (T3b); the AF-ON button
behaviour; AF Home changes; hardware.
