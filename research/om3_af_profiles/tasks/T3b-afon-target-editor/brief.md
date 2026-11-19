# T3b: AF-ON target size and position editor (measure the stock screen, then route it to the AF-ON profile)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T4b (separate workspace)

## 0. Rules that override everything below

- **The T3j and T5 rules apply.** Read T3j's brief §0 (`ref\tasks\T3j-afon-acceptance-assertions\brief.md`)
  and T5's brief §0 and §5 (`ref\tasks\T5-afon-button-handoff\brief.md`):
  - every command through the wrapper `run_logged.mjs`, with script hashes;
  - never edit a script after it has run; new name per experiment;
  - a complete manifest, including imported emulator modules and every consumed input;
  - every behaviour change is labelled `EMULATOR-ONLY`;
  - one change per experiment, or label it as combined;
  - table-driven runners assert after every key, screenshot errors are fatal, a failed assertion ends the
    run with `ok:false`, and a header is never inferred from help text.
- **Emulator only.** Overlay bytes are an in-memory OM-Emu CSV. Never write a firmware image or SD file.
  No byte in sections 6 or 7, except the three inherited call-site bytes `0x610bf5e3`–`0x610bf5e5` that T5
  amended (keep the section column and the checker script).
- **Values stay in RAM.** No storage decision. No hardware recommendation. Subject Detect Off.
- **Do not change the visible menu design without saying so.** If the editor can only be reached by a new
  row, a new page or a new key behaviour, prototype it **only** as an `EMULATOR-ONLY` entry and report the
  options under "Owner decision Q5" in `result.md`. The coordinator decides whether it goes to the owner.

## 1. Background (read first, under `ref\`)

- `PROJECT-STATE.md` §3 (current design), §6 Q5.
- `analysis\button-af\FEATURE-SPEC.md` items 2 and the 10 November revision: the AF-ON profile has its own
  zone type, size and position per orientation, edited by **reusing the stock AF target selection screen**,
  including orientation-specific targets and custom sizes (`MODE_AF_AREA_SIZE_*_CUSTOM_*`).
- `analysis\button-af\AFON-MENU-RESEARCH.md` §1 "AF target settings (half-press profile today)" and §8
  "How a page-27 row opens its editor".
- `analysis\button-af\readiness\t5-afon-button-handoff\README.md`, `out\target-bytes.md`, `out\design.md`:
  the accepted combined configuration, called "Z5" below (3,262 overlay rows, profile byte `0xa031e920`,
  relocated owned block at `0xa031ed00`). The ten-byte target takes kind, vertical, horizontal and priority
  from the profile zone type; size `0xdfa1`, position `0x99d2` and +9 `0x1e01` still come from legacy
  cells; C1–C4 dimensions come from `0x1dd1`.
- T2 capacity table (`ref\tasks\T2-cell-ownership\run-20261117-220544\work\out\verdict-v2.md`): the
  half-press fields are zone type `0x99a1`, size `0x9a41`, position `0x5962`, custom size `0x1dd1`.

## 2. Work

1. **Measure the stock AF target selection screen** (stock image, no overlay):
   - every native route that opens it (button, menu, live-view key), in OM-Emu with native keys;
   - what it reads and writes, as full-cell readbacks before and after each key: `0x99a1`, `0x9a41`,
     `0x5962`, `0x1dd1` (all cells), `0xdfa1`, `0x99d2`, and anything else the trace shows;
   - how orientation selects a bank (which cell index per orientation, and how the screen picks it);
   - the functions entered on open, move, size change, confirm and cancel (an entry trace), with bounded
     listings checked against the image bytes;
   - screenshots of the screen in at least two zone types (one movable zone and one custom zone).
2. **Profile layout.** Propose the RAM layout for the AF-ON profile's size, position and custom size per
   orientation, next to `0xa031e920`, in owned RAM that is free in Z5 (check against the Z5 CSV and the
   relocated block). Keep the zone-type byte where it is. Document the layout in `out\profile-layout.md`.
3. **Route the screen to the AF-ON profile** (Z5 plus one change). Make the stock screen, when opened in
   "AF-ON mode", read and write the AF-ON profile fields instead of the half-press cells:
   - prefer the narrowest `EMULATOR-ONLY` hook at the accessor sites the trace identifies;
   - the entry into AF-ON mode may be an `EMULATOR-ONLY` session action for this prototype (see §0);
   - the half-press cells must not change during an AF-ON-mode edit, and the profile must not change during
     a normal edit.
   At most four experiment versions on this item. If it cannot be done, report BLOCKED with the evidence and
   the smallest native change that would do it.
4. **Acceptance (if item 3 works).** Table-driven, two fresh sessions and a stock control:
   - in AF-ON mode, move the target and change size (and a custom size), confirm: the profile fields hold the
     new values (native readback), and every half-press cell is unchanged;
   - repeat and cancel: nothing changes;
   - a normal (half-press) edit in the candidate changes the half-press cells exactly as in the control, and
     leaves the profile unchanged;
   - at least two orientations, if the emulator can supply them; otherwise say so with evidence;
   - native save and a new session: stores byte-identical to the control's; the profile returns to defaults.
5. **Native change list.** Update `out\design.md`: which accessor sites a native build must branch, and the
   entry route options (Q5).

## 3. Deliverables (under `work\`)

`result.md` (template); `evidence-manifest.json`; `out\stock-target-screen.md` (item 1); `out\profile-layout.md`;
`out\design.md`; `out\overlay-changed-bytes.csv` (complete, with source and section columns); `out\cmd\`;
scripts, tables, JSONL and screenshots.

## 4. Out of scope

The button target using the new fields (that is T6); storage (Q7); display; Subject Detect On; packaging;
hardware.
