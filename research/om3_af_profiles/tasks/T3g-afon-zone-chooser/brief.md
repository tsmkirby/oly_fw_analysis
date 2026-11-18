# T3g: The ten-zone chooser for the AF-ON row, then acceptance (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

These are T3f's brief §0 (`ref\tasks\T3f-afon-editor-binding\brief.md`), plus the record defects Sol
found in T3f:

- **Never edit a script after it has run.** A fix is a new file under a new name, run as a new command.
- **Every input the scripts read is in the manifest with its hash.** This includes emulator resources such
  as `.0101`.
- **Every behaviour-changing write, overlay load or hook** (including prerequisite overlays) is labelled
  `role: behaviour` and `EMULATOR-ONLY`.
- **The manifest keeps every command's real requested text,** including the manifest command itself.
- **Each experiment changes ONE thing.** If a step needs two changes, split it into two experiments, or
  report it explicitly as a combined change.
- **No storage decision.** The value goes to the RAM profile byte `0xa031e920` through T3a's value hooks.
  Make no hardware recommendation, and write no firmware image.

## 1. Background (read first)

- `ref\tasks\T3f-afon-editor-binding\decision.md` and its Sol review.
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md`, "How a page-27 row opens its editor".
- T3f's work, `run-20261118-095558\work\`: `out\binding.md`, `out\design.md`, and the B4 and B2 scripts and
  logs.
- T3a's `out\design.md`, for the `0x6031e9a0` descriptor that was cloned from UI 238.

What is established:
- **B4 (combined change).** The binding `0x1e6` → `0x3D6F` (relocated array) plus a descriptor cloned from
  2154's and hash-linked gives the native two-option chooser. It commits `(0x3D6F, value)` to the RAM byte.
  Cancel does not commit.
- **B2.** Pointing the row's options at `0x6158ba1c` changes only the glyph drawn on the row.

## 2. Work

1. **Descriptors.** Decode the stock editor descriptors involved, field by field, with bounded listings
   checked against the image bytes:
   - 2154's descriptor `0x6062132c` (template `0x606190b7`, count 2);
   - UI 238's descriptor (template `0x606178b1`, count 10).

   Establish:
   - what the template is and how it produces the chooser's entries;
   - whether the count is the number of options;
   - where the option values, images and texts come from (the descriptor, the template, the row list, or
     elsewhere).

   Also report UI 238's setting name and the key it maps to.
2. **Experiments.** At most **four**, one change each. State the explanation before each experiment.
   - **Baseline:** B2's configuration (B4, plus row options at `0x6158ba1c`).
   - **Z1.** Replace the `0x3D6F` descriptor's contents with an **unchanged clone of UI 238's descriptor**
     (only the ID set to `0x3D6F`). Keep the registration and the binding. Check:
     - Does OK show the ten zone images?
     - Does confirming a zone value different from the current one call the setter with `(0x3D6F, value)`
       and store that value in the RAM byte?
     - Does cancel leave it unchanged?
     - Are 2154, 2155 and every listed cell untouched?
   - **Z2–Z4** test the strongest remaining explanation from item 1, one change each. For example: the
     template or count alone; the row's option list with Z1's descriptor; or, only after item 1 justifies
     it, a full ten-record text list built from stock strings with each ID justified.
3. **Evidence for every experiment.** As in T3f:
   - capped/dropped trace counters on `0x6041937f`, `0x60063431` and `0x60063380`;
   - the operands at `0x611a26e1` and at the binding lookup `0x6124f523`;
   - separate event groups for before-OK, after-OK, each navigation step inside the chooser, confirm, and
     cancel;
   - full cell readbacks: `0x90a1`, the RAM byte, all of `0x1dd1`, `0x99a1`, `0x9a41`, `0x5962`, and every
     `MODE_AF_HOME*` cell (the `*_ORIGINALLY` getter results);
   - screenshots of the chooser after each navigation step.
4. **Acceptance (only if a zone value commits correctly).** Run T3a's brief §4 under its §7 item 3 rules:
   - two fresh sessions, plus a stock control with the same key sequence;
   - assertions after every step;
   - full-cell comparison against the control at the same step;
   - pages 25, 26 and 27 rendered;
   - the persistence check: a native save to separate store files, a new session, and a byte-by-byte store
     comparison. The stores are expected to be **identical**, because the value lives only in RAM. The
     profile byte must be back at its default.

   For each session, choose at least two different zone values in turn. Read back each one, and cancel once.
5. **Native change.** Propose an updated list of the native data a final firmware would need: the
   action record, the binding record, the descriptor and its registration, the section-7
   pointers/counts, T3a's fields, the value routing, and every overlay byte.

## 3. Deliverables (under `work\`)

`result.md` (template), `evidence-manifest.json` (refreshed last, through the wrapper), `out\descriptors.md`,
`out\design.md`, `out\overlay-changed-bytes.csv` (complete), `out\cmd\`, the scripts, the JSONL logs and
the screenshots.

## 4. Out of scope

- Storage choice.
- Placement and packaging of the binding array.
- The target-position editor (T3b).
- AF-ON button behaviour.
- AF Home changes.
- Hardware.
