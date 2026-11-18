# T1: Page-27 ("AF Button") row and value mapping

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-17 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

- You are in a disposable execution workspace (`TASK.md`). Write **only** under `work\`:
  `work\result.md`, `work\evidence-manifest.json`, `work\out\`, `work\scripts\`.
- `ref\` is the research workspace and is read-only (enforced by the operating system).
  Paths below such as `scripts\...` or `analysis\...` are under `ref\`.
- Ghidra: `tools\bin\run-ghidra.cmd` only (private project copy, `-readOnly -noanalysis`).
- OM-Emu: use the private copy `om-emu` as the checkout argument. **Do not modify it in
  this task.** `OM_EMU_NVRAM` is `off` (blank camera); keep it that way.
- Run Node as `node26` (the pinned v26.12.1). Plain `node` is the Cursor CLI's own runtime.
  Call tools by name, and do not start a command with a parenthesis (the tool rejects it).
- Stock firmware only: no overlay, candidate or patch of any kind is needed or allowed here.
- No network, no Git, no ACL/permission commands, no installs. No firmware image,
  component or SD file. Make no hardware or flashing recommendation.
- If something cannot be done within these rules, stop that part and explain it in `work\result.md`.

## 1. Objective

Establish for stock OM-3 E147 1.1, with two independent lines of evidence per claim:

- **(a) Row identity.** Which page-27 row is the shutter-button row and which is the AF-ON
  row: setting ID 2154 `MODE_AF_SUBJECT_PRIORITY_RELEASE` or 2155
  `MODE_AF_SUBJECT_PRIORITY_CUSTOM_SW` (storage key `0x90a1`, indices 0 and 1).
- **(b) Value meaning.** For each row, which stored value (stock options are 1 and 0)
  corresponds to the camera's option texts:
  - "Always tracks focus on the selected AF Target Point";
  - "Tracks focus on the subject when it is detected at the selected AF target point".
- **(c) AF-ON binding.** Whether the `_CUSTOM_SW` row governs the physical AF-ON key in the
  stock default assignment, or a generic custom-switch function that AF-ON happens to use.
- **(d) Leads only, no conclusion required.** The first stock readers of `0x90a1` indices
  0/1 on the AF request path (addresses only), as input to a later trace.

## 2. Project history to read first (under `ref\`; do not re-derive it)

- `PROJECT-STATE.md` §1–§3: the current design and why this task is first.
- `analysis\button-af\FEATURE-SPEC.md`: "Requirement revision, 10 November 2026".
- `analysis\button-af\AFON-MENU-RESEARCH.md`:
  - §1 "Stock per-button Subject Detect setting": the owner's 17 Nov hardware result and the open question this task answers;
  - §2–§3: descriptor tables, how settings are read;
  - §6 "Menu structure": row table `0x6158cee8`, 36-byte rows, sub-page table `0x6158ee8c`, viewer `0x61203696`, row lookup `0x61203a81`;
  - §8 "How stored settings work": keys, registry `0x600624d3`, typed accessor `0x60063a20`, ID maps;
  - "Live acceptance regression and third menu row": provider getter `0x611af938`, source record `0x61529ce8`, constructor `0x611afaa1`.
- `contribution\docs\features\om-3\AF_BUTTON_PROFILES.md` "Menu and settings".

## 3. Established findings to build on

- Page 27 is the AF Button page. Its title label `0x1279` renders as "@A02C@@A065@AF Button"
  (OM-Emu; `analysis\button-af\readiness\om-emu-af-acceptance1\*.jsonl`, step `menu-labels`).
- The live provider list for page 27 contains exactly 2154, 2155 (count 2), as asserted in
  `scripts\om_emu_af_live_probe.mjs` (around lines 322–323).
- A blank OM-Emu session reads **1** for both 2154 and 2155. Values alone settle nothing.
- The stock page drew rendered texts `["@A066@ Priority","@A066@ Priority","@A02C@@A065@AF Button"]`
  (`stock-af-button-page.jsonl`, step `af-button-page`).
- `scripts\om_emu_af_live_probe.mjs` resolves label IDs through the string getter at
  `0x510bb079` (Ghidra notation; follow the script's `A()` conversion), and navigates to
  the page with `OM3_LIVE_AF_MENU=1`. Its arguments are
  `<om-emu checkout> [mode=stock] [diff] [afonCode=0xb] [assignment] [setup]`
  (line 7; the 16 Nov runs used `om-emu stock - 0xb - idle-120b`).
- Owner hardware fact (17 Nov): the menu path is Menu > AF > 2. AF > AF Button. The owner's
  camera has AF-ON set to "Always tracks focus on the selected AF Target Point", and with
  that setting AF-ON disregards Subject Detect.

## 4. Already attempted, and a discrepancy you must resolve

§6 (static, 13 Nov) reads the rows' labels as `0x06b1` and `0x282c`, with option labels
`0x127b`/`0x124f` "probably on/off". The OM-Emu string getter later returned:

| Label | String |
|---|---|
| `0x06b1` | "@A0BF@/Value" |
| `0x282c` | null |
| `0x127b` | "@A066@ Priority" |
| `0x124f` | "@A02F@ Priority" |

So `0x127b`/`0x124f` look like **row** names told apart by icon glyphs, not option names,
and §6's field assignment may be off by one field. Determine the correct 36-byte row
layout for these two rows, and their 12-byte option records, from the bytes and from the
viewer code before relying on either reading. State which part of §6 is confirmed and
which is corrected.

## 5. The exact questions

1. Which row is the shutter and which is AF-ON? (Expected: the identities of glyphs `@A066@`
   and `@A02F@`, from glyph/icon resource data or from other strings that use the same glyph
   with an unambiguous meaning, plus which setting ID each row binds.)
2. Which strings are the option texts, and which stored value does each map to?
3. Does 2155 bind to the AF-ON key in the stock default assignment?
4. Where does stock code first read `0x90a1` indices 0/1 on the AF request path? (Leads only.)

## 6. Authorised actions

- Read anything under `ref\`, `inputs\` and `om-emu\`.
- Ghidra headless, through `tools\bin\run-ghidra.cmd`, with read-only scripts you write in
  `work\scripts\`: byte dumps, bounded disassembly listings, cross-references. Existing
  scripts under `ref\scripts\` may be used, not edited.
- OM-Emu, **stock mode only**, using `ref\scripts\om_emu_af_live_probe.mjs` and
  `ref\scripts\om_emu_af_player.mjs` with checkout argument `om-emu`. You may write a new
  probe in `work\scripts\` that imports or copies their navigation logic, to:
  - read further label and option strings;
  - change each row's value **through the menu with native keys** (not by writing storage),
    reading back 2154/2155 and the rendered option text after each change;
  - read `0x90a1` indices 0/1 through the native accessor.
- Python 3.12 (`python -I`) for parsing outputs.

## 7. Deliverables (under `work\`)

- `result.md` (follow `templates\result.md`) and `evidence-manifest.json`.
- `out\page27-rows.txt`: decoded 36-byte rows and option records with addresses and raw hex.
- `out\labels.json`: every label ID you touched, with its OM-Emu string.
- `out\menu-toggle.jsonl`: each UI step with key, rendered texts, 2154/2155 and `0x90a1[0..1]` readback.
- `out\glyphs.txt`: evidence for the meanings of `@A066@`, `@A02F@` and `@A0BF@`.
- `out\afon-binding.txt`: the evidence for question 3.
- `out\readers-0x90a1.txt`: the lead list for question 4.
- Logs of every run, and every script you ran (in `scripts\`).
- Optional: `proposed-doc-patch.md` with exact proposed text for AFON-MENU-RESEARCH §1/§6.
  Do not edit the documents themselves.

## 8. Acceptance criteria

- Q1 and Q2 each answered with **two independent evidence classes**: STATIC/DATA (bytes and
  viewer code, with addresses) **and** OBSERVED-EMU (rendered text plus native readback after
  native-key menu changes). Otherwise mark the answer UNRESOLVED and state the gap.
- Q3 answered, or marked UNRESOLVED with what would settle it (for example, an owner check on the camera).
- §6's row/option field layout explicitly confirmed or corrected, with raw bytes.
- Input identities recorded in `evidence-manifest.json`. Decoded main must be
  `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, and resource 0106
  `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`.
- No claim about physical AF behaviour beyond the owner's 17 Nov observation.
- Every output file appears in the manifest with SHA-256, and every command is listed.

## 9. Testing and verification

- Repeat the native-key menu toggle twice from fresh sessions; the results must agree.
- Include a control: the same navigation without changing values, showing that readback stays 1/1.
- For each static claim, include the bounded listing (address range, byte count), so the
  reviewer can recheck it without running Ghidra.

## 10. Out of scope

AF Home; any Subject Detect bypass; CPU3/MDET work; adding the AF-ON zone row (T3);
storage ownership (T2); any overlay or candidate image; editing existing scripts or documents.

## 11. Correction round (Opus, after Sol's review `run-20261117-204643-review`: ACCEPT-WITH-CORRECTIONS)

Your previous work is still in `work\`. Do **not** redo the investigation. Make only these
corrections, then update `work\result.md` and `work\evidence-manifest.json` (rehash every changed file):

1. Mark Q1 **UNRESOLVED** (state the shutter = 2154 / `@A049@` button = 2155 mapping as an
   INFERRED claim with its evidence). State Q2 directly: **1 = detected-subject priority;
   0 = always the selected AF target position**.
2. The probe versions that produced `menu-toggle-*-first.jsonl` and the control's label-ID set were
   overwritten. Disclose this as a reproducibility deviation in section 12. Then either add a script
   in `work\scripts\` that reproduces those runs exactly, or state plainly that it cannot be
   reproduced. Make `out\labels.json` list every label ID touched in any run, including `0xff0`,
   `0xff2`, `0x5b4` and `0xc6`.
3. Replace the selected instructions in `out\page27-rows.txt` with **complete** bounded listings
   (every instruction, with address and bytes) for each claimed range: `0x611c782f`, `0x611c7785`,
   `0x61203a81` and the call site in `0x61204088`. Give the start, end and byte count of each range,
   and use `tools\bin\run-ghidra.cmd` with a read-only listing script.
4. In `out\readers-0x90a1.txt`, correct the pointer that follows the 2155 descriptor at
   `0x60621340` to **`0x606190b7`** (not `0x606190b9`), after checking it yourself in the bytes.
5. Reconcile the NVRAM statement with `OM_EMU_NVRAM=off`. Describe the correction to §6 as a
   kind/meaning interpretation (kind 12 = image id; kind 4 = string id), not as a demonstrated
   field-offset shift.
6. Optional: give the initial and the successful repeats distinct run IDs; note that the control
   checks navigation to the page without opening the editors.
