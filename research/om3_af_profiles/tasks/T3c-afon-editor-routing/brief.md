# T3c: Route the AF-ON zone row to a stock editor (measure first, then prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

- **Workspace.** This is a disposable execution workspace (`TASK.md`). Write **only** under `work\`. Do not
  modify OM-Emu source.
- **Read-only material.** `ref\` (research) is read-only.
- **Tools.** Run Ghidra only through `tools\bin\run-ghidra.cmd`. Run Node as `node26`.
- **Persistence.** `OM_EMU_NVRAM` stays `off`, except for persistence runs. Each persistence run uses its own
  new file under `work\out\`.
- **Emulator only.** Firmware byte changes exist only as an in-memory overlay CSV, or as runtime writes or
  hooks labelled `EMULATOR-ONLY` in code, in JSONL and in the result. Never write a firmware image, a
  component or an SD file. Make no hardware recommendation.
- **Evidence.**
  - Give every experiment a **new, unique script name and output name**. Never overwrite a file that a run
    used or wrote.
  - Run every command so that its real stdout, stderr and exit code are saved to a file under
    `work\out\cmd\` (for example `node26 x.mjs ... > work\out\cmd\NN.out 2> work\out\cmd\NN.err`, then
    record the exit code). Never reconstruct output.
  - A terminal `done` record is not acceptance.
- **Commands.** Call tools by name, and never start a command with a parenthesis. No network, Git, ACL
  commands or installs.

## 1. Background

T3a built a third row on page 27, "AF Target Mode", with UI ID `0x3D6F`. Its data is 140 overlay bytes in
the section-1 tail, plus four section-7 runtime redirects. Its option pointers point at the 10-zone list
`0x6158ba1c`, and its value is read and written in a RAM profile byte at `0xa031e920` through EMULATOR-ONLY
hooks.

Pressing OK on that row opens nothing.
- Page 27's list model is type 1, kind 11, so `0x61203e81` returns early.
- Forcing type 2 produced only bubbles, sliders or nothing.
- The stock editors that do respond to OK (the priority rows on page 27 and the C-AF Area chooser) run in
  the `0x610e*` function family, which `0x3D6F` never enters.
- Page 28 (the AF Home zone rows, group `0x116`) was never built from any menu screen reached with native
  keys.

Read first:
- `ref\tasks\T3a-afon-zone-row\decision.md`.
- Both T3a Sol reviews: `ref\tasks\T3a-afon-zone-row\run-*-review\review.md`.
- T3a's final work: `ref\tasks\T3a-afon-zone-row\run-20261118-053855\work\`, including `out\design.md`,
  `out\design-v12.md`, `out\overlay-changed-bytes.csv` and the probe scripts.
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §6 (row table, sub-page table, viewer).
- `ref\PROJECT-STATE.md` §3.

Reuse T3a's overlay and redirects: copy the scripts you need into `work\scripts\` under new names. Do not
re-derive what T3a's decision lists as established.

## 2. Phase A: measure (no prototype yet)

1. **How a row's OK selects its editor.** Trace why OK on the stock priority row (2154) and on C-AF Area
   enters the `0x610e*` family, and OK on `0x3D6F` does not. Find the decision point that makes the
   choice, which may be a table keyed by setting ID, row kind, page, or a handler slot. Record the
   decision point's address, the data it reads, and the values for 2154, 2155, C-AF Area and `0x3D6F`.
   Give a bounded static listing and a dynamic trace (function entries and the decision values), using
   native keys.
2. **What pages 28 and 29 open.**
   - First, look for a native route to pages 28 and 29: a menu row, a key or a sub-page entry. Search the
     sub-page table, the row table and the callers of the viewer constructor `0x61203696` for page IDs 28
     and 29.
   - If no native route exists, say so with the static evidence. Then build page 28, and separately page
     29, directly in a stock session: for example, call the viewer constructor with that page ID from a
     state where page 27 would be built. Label this `EMULATOR-ONLY reference construction`.
   - On each page, press OK on the first row with native keys. Record the list type, the editor kind, the
     functions entered, the screenshot, and every settings write. Read back all `MODE_AF_HOME_AREA_*` and
     `MODE_AF_HOME*` cells before and after.
   - Write nothing that persists. If a write to an AF Home cell happens, report it; it is a stock session,
     so nothing is lost.
3. **Report Phase A** in `work\out\phaseA.md`, with routes R1 and R2 below rated **possible**,
   **possible with code** or **not possible**, with evidence:
   - **R1.** The `0x3D6F` row opens the editor the stock rows use (the `0x610e*` family, or page 28's
     editor) and shows the 10 records of `0x6158ba1c`.
   - **R2.** A page-29-style row opens the target-selection editor. State which settings that editor reads
     and writes (zone type, size, position, AF Home keys), and whether it selects the zone type as well as
     the position.

## 3. Phase B: prototype R1

Prototype **R1 only**. R2 is reported in Phase A and belongs to T3b.

- Prefer native data: overlay bytes in the owned section-1 tail, or a setting registration copied from the
  stock row's own. If the decision point needs code, use one EMULATOR-ONLY hook placed at the decision
  point and nowhere else.
- The 10-option editor must open from the row. Selecting and confirming must call the setter for `0x3D6F`
  and store the value in the RAM byte. Cancel must not.
- Stop after at most **four** prototype versions. If none works, report R1 as BLOCKED with the evidence,
  and give the decision point and the code needed there, as a qualified proposal.

## 4. Acceptance (only if Phase B works)

The acceptance is T3a's brief §4, carried out under T3a's brief §7 item 3 rules:
- two fresh sessions, plus a stock control that uses the same key sequence;
- assertions after every step, with a failed assertion ending the run with `ok:false`;
- all 10 cells of `0x1dd1`, plus `0x99a1`, `0x9a41`, `0x5962` and every `MODE_AF_HOME_AREA_*` and
  `MODE_AF_HOME*` cell, read back and compared against the control at the same step;
- both stock rows exercised in the candidate and in the control;
- pages 25, 26 and 27 rendered in both. Page 28 is rendered only if a native route exists;
- the persistence check: a native save to separate store files, a new session, a byte-by-byte comparison
  of the stores, and the profile byte back at its default.

## 5. Deliverables (under `work\`)

`result.md` (template), `evidence-manifest.json` (refreshed last), `out\phaseA.md`, `out\design.md`,
`out\overlay-changed-bytes.csv` (full: T3a's 140 bytes plus any new ones), `out\cmd\` (all command
records), the scripts, the JSONL logs and the screenshots.

## 6. Out of scope

- Persistence design.
- Prototyping R2. Its editor redirect is T3b.
- The AF-ON button behaviour.
- Any change to AF Home behaviour.
- Any hardware step.
