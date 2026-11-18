# T3e: Own action record for the AF-ON zone row; confirm/cancel into the RAM profile (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

- **Workspace.** This is a disposable execution workspace (`TASK.md`). Write **only** under `work\`.
  - Do not modify OM-Emu source.
  - `ref\` is read-only.
  - Run Ghidra only through `tools\bin\run-ghidra.cmd`, and Node as `node26`.
  - `OM_EMU_NVRAM` stays `off`, except in persistence runs. Each persistence run uses its own new file under
    `work\out\`.
- **Emulator only.**
  - Firmware byte changes exist only as an in-memory overlay CSV, or as runtime writes or hooks.
  - Every behaviour-changing write, overlay load or hook is labelled **`role: behaviour` and
    `EMULATOR-ONLY`**, in code and on every JSONL line. Every pure observation is labelled
    `role: observe`.
  - Never write a firmware image, component or SD file. No hardware recommendation.
- **No storage decision.** The value goes to the RAM profile byte (`0xa031e920`) through T3a's
  EMULATOR-ONLY value hooks. Do not map the row onto `0x5b82` or any stock key.
- **Commands.**
  - Copy T3d's command wrapper (`ref\tasks\T3d-afon-registered-key\run-20261118-081316\work\scripts\`,
    the latest `run_logged` version) into `work\scripts\`.
  - Run **every** command through it.
  - Extend the wrapper so it also records the SHA-256 of the script being run.
  - Never reconstruct output.
- **Files.** Give every script and output a new, unique name, and never overwrite a used file.
- **Commands not allowed.** Call tools by name, and never start a command with a parenthesis. No network, Git,
  ACL commands or installs.

## 1. Background (read first)

Read these:
- the decisions for T3d, T3c and T3a: `ref\tasks\T3d-afon-registered-key\decision.md`, `ref\tasks\T3c-afon-editor-routing\decision.md` and
  `ref\tasks\T3a-afon-zone-row\decision.md`;
- T3d's Sol review, `run-20261118-090732-review\review.md`;
- T3d's work, `run-20261118-081316\work\`, including `out\decision-point.md` and `out\design.md`;
- T3a's `out\design.md`, for the overlay layout and the value hooks.

What is established:
- **What decides.** OK opens the native chooser only when the row's provider UI ID matches a record in the
  page-27 action table. The table holds 24-byte records. The UI ID is the halfword at record+4, compared at
  `0x611a26e1`. The table's pointer is at `0x6150f5f0`, followed by its count (2), both in compressed
  section 7.
- **What a matching record passes.** A matching record with a null handler passes two halfwords to
  `FUN_6119a177` (8/`0x1e3` for 2154).
- **The baseline.** The baseline row configuration is T3c's E1: the stock-shaped row with ID `0x3D6F`,
  T3a's 140-byte overlay, and the four section-7 redirects.

## 2. Work

1. **Decode the records.** Decode both stock records of the page-27 action table, and the C-AF Area record,
   field by field. In particular:
   - what the halfword pair passed to `FUN_6119a177` means (8 and `0x1e3`/`0x1e4`/`0x1e0`), and where it is
     used;
   - which fields, if any, tie a record to a particular editor, option list or help text.

   Give the static listings, checked against the image bytes.
2. **Build the third record.** In the owned section-1 tail, as overlay bytes:
   - place a 3-record copy of the table: the two stock records byte-exact, plus a third record for `0x3D6F`;
   - point the section-7 pointer and count at it with an `EMULATOR-ONLY` runtime write (count 3).

   Choose the third record's other fields from item 1, and justify each one. Copying 2154's record with
   only the UI ID changed is the default.
3. **Experiments.** At most **four**, each changing **one** thing against a stated baseline, with the
   explanation stated first. Use T3a's value hooks for `0x3D6F`.
   - **X1.** The third record, with the row's options at the two-record list `0x6158ba04`.
     - Does OK open a chooser for `0x3D6F`?
     - Does confirm call `0x6041937f` with UI ID `0x3D6F`? Choose the value **different from the current
       one**, so the change is visible.
     - Does the RAM byte change, and does cancel leave it unchanged?
     - Do 2154/2155 (`0x90a1`) stay untouched?
   - **X2** (if X1 commits). Change the options to the 10-record zone list `0x6158ba1c`.
     - Are the 10 zone images shown?
     - Do confirm and cancel work as in X1, with the zone value stored?
   - **X3** (if X2 does not show the zones). Build a text zone list as overlay bytes. It has kind-4 records,
     with the stock zone-name text IDs (for example from the "AF Target Mode Settings" checklist, group 364).
     - Give each text ID and the record it comes from. List any value that has no stock label.
     - Test it as in X2.
   - **X4** is free; state its explanation first.
4. **Evidence requirements for every experiment** (these close T3d's gaps):
   - **Uncapped traces.** Write traces on `0x6041937f`, `0x60063431` and `0x60063380` across the whole
     OK…confirm/cancel interval are **uncapped**, or else carry explicit truncation counters. Report the
     counters.
   - **The deciding compare.** Record D0, D1 and A2 at the compare `0x611a26e1`, with the record bytes, on
     every OK. Do this for 2154, 2155 and `0x3D6F`.
   - **Snapshots.** Take a snapshot immediately before OK (the screen and the highlighted row), immediately
     after OK, and after confirm and after cancel, each as its **own event group**. Each snapshot reads
     back:
     - `0x90a1`;
     - the RAM byte;
     - all 10 cells of `0x1dd1`;
     - `0x99a1`, `0x9a41` and `0x5962`;
     - every `MODE_AF_HOME_AREA_*` and `MODE_AF_HOME*` cell;
     - the backing cells of the `*_ORIGINALLY` IDs 2274–2279. Resolve those first, through the UI map and the
       typed accessor, and give the mapping.
5. **Acceptance (only if X2 or X3 commits correctly).** Run T3a's brief §4
   (`ref\tasks\T3a-afon-zone-row\brief.md`), under its §7 item 3 rules:
   - two fresh sessions, plus a stock control that uses the same key sequence;
   - an assertion after every step;
   - a full-cell comparison against the control at the same step;
   - pages 25, 26 and 27 rendered;
   - a persistence check: a native save to separate store files, then a new session, then a byte-by-byte
     comparison of the stores. Here the stores are expected to be **identical**, because the value lives
     only in RAM. The profile byte must return to its default.
6. **The native change.** List what a final firmware needs, as a proposal:
   - the action record and its table;
   - the section-7 pointer and count, either changed in the section or redirected by a runtime installer;
   - the four T3a section-7 fields;
   - the value routing for `0x3D6F`;
   - every overlay byte.

## 3. Deliverables (under `work\`)

- `result.md` (template)
- `evidence-manifest.json` (refreshed last, through the wrapper)
- `out\action-records.md`
- `out\design.md`
- `out\overlay-changed-bytes.csv` (complete)
- `out\cmd\`
- the scripts, the JSONL logs and the screenshots

## 4. Out of scope

- Storage choice.
- The target-position editor (T3b).
- AF-ON button behaviour.
- AF Home changes.
- Hardware.
