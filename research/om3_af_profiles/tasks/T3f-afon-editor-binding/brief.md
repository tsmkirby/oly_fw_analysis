# T3f: An editor binding of its own for the AF-ON row; commit `0x3D6F` into the RAM profile (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

These are the same as T3e's brief §0 (`ref\tasks\T3e-afon-action-record\brief.md`). In short:

- **Where to write.** Write only under `work\`. Do not change OM-Emu source. `ref\` is read-only.
- **Tools.** Ghidra only through `tools\bin\run-ghidra.cmd`. Node as `node26`. `OM_EMU_NVRAM` stays `off`,
  except in persistence runs, which use a new file under `work\out\` for each run.
- **Emulator only.** Make no firmware image, component or SD file, and no hardware recommendation.
- **Labels.** Label every behaviour-changing write, overlay load or hook `role: behaviour` and
  `EMULATOR-ONLY`. Label pure observations `role: observe`.
- **No storage decision.** The value goes to the RAM profile byte `0xa031e920` through T3a's
  EMULATOR-ONLY value hooks. Do not map the row onto a stock key.
- **Command records.** Run every command through T3e's wrapper. Copy the latest `run_logged` from
  `ref\tasks\T3e-afon-action-record\run-20261118-091509\work\scripts\`. The wrapper records the script
  hash. Never reconstruct output.
  - When you refresh the manifest, take each command from the actual requested or spawned command, which
    is Sol's correction 5 on T3e.
- **File names.** Give each script and output a new, unique name.
- **Wording.**
  - Say "capped at N, dropped D", not "uncapped".
  - Keep inferences and hypotheses labelled as such.
- **Commands.** Call tools by name, and never start a command with a parenthesis. No network, Git, ACL
  commands or installs.

## 1. Background (read first)

Read:
- `ref\tasks\T3e-afon-action-record\decision.md` and its Sol review;
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md`, "How a page-27 row opens its editor";
- T3e's work in `run-20261118-091509\work\`: `out\action-records.md`, `out\design.md`, and the X1 and X4
  scripts and logs.

What is established:

- **The action table.** The 3-record table at `0x6031e*` (T3e's layout), with a runtime redirect of the
  section-7 pointer and count, makes OK on `0x3D6F` match the third record.
- **The second dispatch word.**
  - With `0x1e3`, the copy of 2154's word, the chooser that opens is 2154's, and confirm commits UI 2154.
  - With `0x0e3d`, nothing opens.
- **Where the word goes.** The pair (8, second word) is stored at `0x60379d44`/`0x60379d46`, then passed
  to vtable slot +4, `0x611a01e8`.

## 2. Work

1. **Trace the binding.** Starting from `0x611a01e8`, trace how the second word (`0x1e3`, `0x1e4`,
   `0x1e0`) becomes:
   - the chooser or editor instance;
   - its option list (`0x6158ba04` for the priority rows);
   - the UI ID that confirm passes to `0x6041937f`.

   Find the table or code that binds each editor ID to its setting. Give:
   - its address, section and whether that section is compressed;
   - its record layout and bounds;
   - every entry near `0x1e0`–`0x1e4`;
   - bounded listings checked against the image bytes;
   - a dynamic trace, taken at the conversion instruction, for 2154, 2155, C-AF Area and `0x3D6F` (X1
     configuration).
2. **Experiments.** At most four, each changing one thing against a stated baseline. State the
   explanation each one tests first.
   - **B1.** Give `0x3D6F` an editor binding of its own, using the binding found in item 1. For example:
     - a new editor ID whose binding entry copies 2154's with the UI ID changed to `0x3D6F`, placed in owned
       space through the same relocation-and-redirect technique;
     - or, if the binding reads the UI ID from the row or provider, the minimal data change that does so.

     Keep the options at `0x6158ba04`. Then check:
     - Does OK open a chooser?
     - Does confirming the value **not** currently held call `0x6041937f` with UI `0x3D6F` and change the
       RAM byte?
     - Does cancel leave it unchanged?
     - Are 2154 and 2155 (`0x90a1`) untouched?
   - **B2** (only if B1 commits `0x3D6F`). Point the row's options at the 10-record zone list
     `0x6158ba1c`. Do the 10 zone images appear? Do confirm and cancel work as in B1, storing the zone
     value?
   - **B3** (only if B2 does not show the zones). Use a text zone list in overlay bytes, as in T3e brief
     X3, with each text ID justified. Test it as in B2.
   - **B4** is free; state its explanation first.
3. **Evidence for every experiment** (as in T3e brief item 4):
   - write traces on `0x6041937f`, `0x60063431` and `0x60063380`, with cap and dropped counters;
   - D0, D1 and A2 at `0x611a26e1`, plus the conversion instruction's operands from item 1;
   - separate event groups for before-OK, after-OK, confirm and cancel;
   - full cell readbacks:
     - `0x90a1` and the RAM byte;
     - all 10 cells of `0x1dd1`;
     - `0x99a1`, `0x9a41` and `0x5962`;
     - every `MODE_AF_HOME_AREA_*` and `MODE_AF_HOME*` cell (the `*_ORIGINALLY` IDs have no backing cell
       through the UI map; record their getter results).
4. **Acceptance** (only if B2 or B3 commits correctly). Run T3a brief §4 under its §7 item 3 rules:
   - two fresh sessions, plus a stock control with the same key sequence;
   - assertions after every step;
   - a full-cell comparison against the control at the same step;
   - pages 25, 26 and 27 rendered;
   - a persistence check: a native save to separate store files, a new session, and a byte-by-byte store
     comparison. The stores are expected to be **identical**, because the value is RAM-only. The profile
     byte must be back at its default.
5. **The native change.** As a proposal, list everything a final firmware needs:
   - the action record;
   - the editor binding;
   - the section-7 pointers and counts, changed in place or through a runtime installer;
   - T3a's four section-7 fields;
   - the value routing for `0x3D6F`;
   - every overlay byte.

## 3. Deliverables (under `work\`)

`result.md` (template), `evidence-manifest.json` (refreshed last, through the wrapper), `out\binding.md`,
`out\design.md`, `out\overlay-changed-bytes.csv` (complete), `out\cmd\`, the scripts, the JSONL logs and
the screenshots.

## 4. Out of scope

Storage choice, the target-position editor (T3b), AF-ON button behaviour, AF Home changes and hardware.
