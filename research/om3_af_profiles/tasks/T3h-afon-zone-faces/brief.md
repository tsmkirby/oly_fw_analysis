# T3h: Zone faces in the AF-ON chooser, then the complete acceptance (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

These are T3g's brief §0 (`ref\tasks\T3g-afon-zone-chooser\brief.md`), unchanged:
- One change per experiment, or the combination labelled explicitly.
- Never edit a script after it has run.
- Every input goes into the manifest with its hash, including emulator resources and imported helpers.
  Record each imported helper's hash **at execution time**.
- Label every behaviour-changing write, override or hook `role: behaviour` / `EMULATOR-ONLY`. That
  includes harness overrides such as `0x120b`.
- Every command is run through the wrapper, which records the real command text and the script hash.
- The value goes to the RAM profile byte only. Make no storage decision, write no firmware image, and make
  no hardware recommendation.
- Give screenshots of failed attempts distinct names.

## 1. Background (read first)

Read:
- `ref\tasks\T3g-afon-zone-chooser\decision.md` and its Sol review;
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md`, "How a page-27 row opens its editor";
- T3g's work, `run-20261118-104935\work\`: `out\descriptors.md`, `out\design.md`, and the Z1 and
  acceptance scripts.

What is established:
- **The Z1 configuration.** The row has its own action record, binding `0x1e6` → `0x3D6F` in the
  relocated array, and a registered descriptor cloned from UI 238 (value table `0x606178b1`, count 10).
- **What it does.** OK opens a ten-slot chooser, and confirm commits `table[index]` to the RAM byte.
- **The defect.** The faces are wrong: values 0 and 1 show the priority strings, and the other slots are
  blank.
- **What does not drive the faces.** The row's kind-12 list at `0x6158ba1c` changes only the row glyph.
  The row's alternate pointer (+0x1c) is 0, because the row is a copy of 2154's.

## 2. Work

1. **Trace the face source (static and dynamic).** When the ten-slot chooser draws a slot, find the code
   that resolves the slot's value to a face (an image or a string). Find the list it searches, and how
   that list is reached. For example, check whether it comes from:
   - the row's primary list or its alternate list;
   - the page's rows;
   - the descriptor;
   - another table keyed by UI ID or editor ID.

   Give the deciding addresses and listings, checked against the image bytes. Give a dynamic trace of the
   list pointer and the face found for each slot, in the Z1 configuration.

   Explain why values 0 and 1 resolve to the priority strings. Compare with the kind sets of
   `FUN_611c7785` and `FUN_611c782f`, and state which one the chooser uses.
2. **Experiments.** At most **four**, each one change against the Z1 configuration. State the
   explanation tested before each one. The aim is that the ten slots show the ten zone faces of
   `0x6158ba1c`. Item 1 decides the change; for example:
   - set the row's alternate pointer and count to `0x6158ba1c` and 10, as page 28's rows have them;
   - change the row kind, if item 1 shows that the kind selects the face reader;
   - point the face source that item 1 found at the zone list;
   - only if item 1 shows that images cannot be drawn there, use a ten-record kind-4 text list built from
     stock strings, with each ID justified.

   Record a screenshot after every navigation step in the chooser.
3. **Complete acceptance**, only if the ten zone faces render and commit. Run T3a's brief §4 under its
   §7 item 3 rules:
   - two fresh sessions, plus a stock control with the same key sequence (as T3g did for the shared keys);
   - **an assertion at every step**, where a failed assertion ends the run with `ok:false`;
   - in each session, commit at least two different zone values, read each back, and cancel once;
   - full-cell comparisons against the control at every shared step. These include the **actual getter
     values** of the AF Home `*_ORIGINALLY` IDs 2274–2279, from a new script version;
   - pages 25, 26 and 27 rendered;
   - a native save to separate store files, a new session, and a byte-by-byte store comparison (identical
     expected), with the profile back at its default.
4. **Native change.** Update the list of native data a final firmware would need, now including the face
   source.

## 3. Deliverables (under `work\`)

`result.md` (template), `evidence-manifest.json` (refreshed last, through the wrapper), `out\faces.md`,
`out\design.md`, `out\overlay-changed-bytes.csv` (complete), `out\cmd\`, the scripts, the JSONL logs and
the screenshots.

## 4. Out of scope

Storage choice, binding-array placement, the target-position editor (T3b), AF-ON button behaviour,
AF Home changes and hardware.
