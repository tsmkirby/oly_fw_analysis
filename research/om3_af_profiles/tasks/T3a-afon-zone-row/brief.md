# T3a: AF-ON zone row on page 27 with a RAM-only profile (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu · Runs concurrently with T2b (separate workspace)

## 0. Rules that override everything below

- Disposable execution workspace (`TASK.md`). Write **only** under `work\` and, if needed, your
  private `om-emu\` copy (every change there is diffed and reviewed; prefer the probe and
  overlay mechanisms the existing scripts already use).
- `ref\` (research) is read-only. Ghidra only through `tools\bin\run-ghidra.cmd`. Node as `node26`.
  `OM_EMU_NVRAM` stays `off` except for a persistence-check run that writes a store under `work\out\`.
- **Emulator only.** Byte changes to firmware exist only as an in-memory OM-Emu overlay (a CSV of
  changed bytes, like `task-context-placement1\proposed-changed-bytes.csv`, applied by the player)
  or as emulator-side hooks. Never write a firmware image, component or SD file. Label every
  emulator-side hook `EMULATOR-ONLY` in code and in the result. No hardware recommendation.
- Keep every probe version; log every command with its completed output.
- Call tools by name; do not start a command with a parenthesis. No network, Git, ACL commands
  or installs.

## 1. Objective

First build step of the independent AF-ON zone, under the current design (`ref\PROJECT-STATE.md` §3):

- Add a **third row, "AF-ON AF zone"**, to page 27 (AF Button), after the two stock priority rows.
- Its value is the AF-ON **zone type**, chosen from the same zone list the stock AF Home zone row
  uses on page 28 (10 options, list `0x6158ba1c`).
- The value lives in a **RAM-only AF-ON profile**: no persistent setting is written, and it resets
  to a default at power-on.

Persistence waits on T2b and the owner's storage decision. The target-position editor is T3b.
Do not start it.

## 2. Read first (under `ref\`)

- `PROJECT-STATE.md` §1–§3, §6 (Q4, Q5).
- `analysis\button-af\AFON-MENU-RESEARCH.md`:
  - §1 "T1 result";
  - §6 (menu structure, row table, sub-page table, page-28 zone options, "What this means for
    adding the AF-ON zone option", the owner decision of 13 Nov, viewer row iteration);
  - **"Live acceptance regression and third menu row"**: the RAM-only experiment that drew a
    third row. Extending only the descriptor array drew two rows; extending the live provider
    and its parallel arrays, or the **source record `0x61529ce8`** (table `0x61529ba4`, group
    `0x115`, ID pointer `0x61529812`, count 2; constructor `0x611afaa1` copies count from +8 and
    the pointer from +4), drew a third row. The reproduction commands and
    `OM3_LIVE_AF_MENU_THIRD` are there.
  - §8 "How stored settings work" (UI-ID maps, typed accessor, registry).
- `analysis\button-af\readiness\t1-page27-mapping\`: the page-27 row and option record layouts
  (36-byte rows, 12-byte options) with complete listings, and the probe `page27_probe.mjs`.
- T2 capacity table (`ref\tasks\T2-cell-ownership\run-20261117-220544\work\out\verdict-v2.md`,
  "Capacity"): the profile fields are zone type `0x99a1`, size `0x9a41`, position `0x5962`, custom
  size `0x1dd1`. T3a uses only the zone-type field, for the current orientation.

## 3. What to build (in OM-Emu)

1. **Row registration (native data only).** Add the third row through native data: a new 36-byte
   row array (two stock rows plus one) in owned space, page 27's descriptor pointer and count,
   and the provider source record's ID list and count. Give the row an option list equal to page
   28's 10-option zone list, and a label that reuses an existing text ID (no resource 0106
   edit); propose the most fitting stock string and justify it.
2. **A UI ID for the row.** It needs a setting ID that the viewer resolves. Find one that is
   provably unused (not in any of the four UI-ID maps, and no code immediate uses it), or explain
   why another approach is required. Document the choice.
3. **Value storage, RAM only.** Route the row's get and set to a RAM AF-ON profile byte in
   owned memory, not to any stock setting. See the owned RAM analysis in
   `HARDWARE-STAGE0-RECORD.md` ("Owned RAM analysis"): profile state at `0x6031e920`, accessed
   through the uncached alias `0xa031e920`. If routing needs code, implement it either as an
   `EMULATOR-ONLY` hook at the stock mapped getter/setter (`0x60419446`, `0x6041937f`,
   `0x60419696`), or as native MN103 code in the owned section-1 or section-4 tail.
   - A hook only proves the UI flow.
   - Native code must respect the placement and alignment rules of the stage-0 record.
   - State which one you used, and list the native insertion points a final version needs.
4. **Initial value.** At power-on the profile reads the default zone. Propose the default (for
   example the stock "Single" zone), and justify it from the zone list.

## 4. Acceptance (two fresh sessions each, plus a stock control)

- The page shows three rows; the third reads as the AF-ON zone row with the chosen label.
  Navigation with native keys reaches it.
- Opening the row shows the 10 zone options. Choosing one and confirming stores it in the RAM
  profile (native readback of the profile byte). **Cancel** leaves it unchanged.
- The two stock rows (2154/2155) and their values behave exactly as in the stock control.
- The half-press AF target settings (`0x99a1`, `0x9a41`, `0x5962`, `0x1dd1`) and AF Home
  (`MODE_AF_HOME_AREA_*`) are **unchanged** by any AF-ON row action (read back all cells).
- With a store file, a native settings save followed by a new session leaves the stock settings
  stores **byte-identical** to a control that did the same steps without touching the new row. The
  AF-ON value returns to the default (RAM-only, as designed).
- Other pages that share the viewer (pages 25, 26, 28) render as in the control.
- Every overlay byte is listed (`out\overlay-changed-bytes.csv`: address, old, new, purpose), with
  no byte inside a compressed section, and every hook is marked `EMULATOR-ONLY`.

## 5. Deliverables (under `work\`)

`result.md`, `evidence-manifest.json`, `out\overlay-changed-bytes.csv`, `out\design.md` (row
data, UI ID, storage routing, native insertion points still needed), the probe scripts, the
JSONL logs with rendered texts and readbacks, and screenshots if the player can produce them.

## 6. Out of scope

The target-position editor, size and custom size (T3b); persistence; any change to page 28/29
or AF Home; the AF-ON button behaviour itself (profile switching on press, which comes later);
any hardware step.
