# T3l: AF-ON target editor completion (exit handling, initialization, custom sizes, full acceptance)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with the T7 correction round

## 0. Rules that override everything below

- **The T3j, T5 and T3b rules apply.** See T3j brief §0, T5 brief §0 and §5, and T3b brief §0 and §5,
  under `ref\tasks\`.
  - Every command goes through the wrapper, with script hashes. Never edit a script after it has run; give
    each experiment a new name.
  - Keep a complete manifest, including every dynamically imported emulator module and every final
    command-output hash. Write the post-manifest command records to a separate sealed supplement.
  - Label every behaviour change `EMULATOR-ONLY`. Make one change per experiment, or label the experiment
    combined.
  - Table-driven runners assert after **every individual key**. Screenshot errors are fatal, and a failed
    assertion ends the run with `ok:false`.
- **Emulator only.**
  - No byte in sections 6 or 7, except the three inherited bytes `0x610bf5e3`–`0x610bf5e5`. Keep the section
    column and the checker.
  - Values stay in RAM. Make no storage decision and no hardware recommendation. Subject Detect stays Off.
  - Add no visible menu entry. The entry stays the `EMULATOR-ONLY` session flag (Q5 is with the coordinator).
- **At most six experiment versions.** If they are used up, stop and report.

## 1. Starting point (reuse, do not redo)

T3b, closed as PARTIAL; read `ref\tasks\T3b-afon-target-editor\decision.md`. Its final work is
`ref\tasks\T3b-afon-target-editor\run-20261119-063452\work\`:

- `accept_f3.mjs`, the table, and the hook code;
- the stock measurements `stock-target-screen.md` and the `stock-gaps-f2` record;
- the 55-byte mirror at `0xa031eeb0`, the extension, and the flag at `0xa031eef7`;
- the Z5 overlay, unchanged.

Sol's last review is `ref\tasks\T3b-afon-target-editor\run-20261119-071657-review\review.md`. Read it
completely.

## 2. Work

1. **Exit handling inside the hook (one change).**
   - On every exit from the AF-ON-mode editor, the **hook**, not the harness, clears the flag and restores
     the zone byte `0xa031e920`.
   - Identify the exits from the trace: OK, MENU, shutter half-press (S1), leaving to playback or the menu,
     session end, and any other exit you observe.
   - State what the zone byte must hold after exit, and why.
   - Prove each exit with the following normal edit, asserted against the controls.
2. **First-entry initialization (one change).** If a mirror field is `FF` on AF-ON entry, initialize it to
   the **stock factory default** of the corresponding cell. Find those defaults in the settings descriptor or
   default table, not from a session's current values. List them in `out\profile-layout.md`. The
   zone-type default stays 0 (All), as already established.
3. **Controls.** Run two controls:
   - **K1:** a stock session with no overlay;
   - **K2:** a Z5 session with the flag kept off, so that the zone byte exists on both sides.

   Compare normal edits against K2 for cell equality, and against K1 for the half-press cells.
4. **AF-ON custom sizes.**
   - With the flag set, edit C1 and one more custom slot (C2–C4) in AF Target Mode Settings through native
     keys.
   - Read back the complete mirror, including `0x1dd1`, `0x1de1`, `0x1df1` and `0x5a11`, and every
     half-press cell, including `0x1df1`.
   - Show that the AF-ON edit lands in the mirror only, and that the same edit with the flag off lands in the
     half-press cells exactly as in K1.
   - Measure C2–C4 on stock if needed.
5. **Acceptance (new runner).**
   - Run two fresh candidate sessions, plus K1 and K2.
   - Assert after every individual key:
     - the visual identity, by title-band pixel hash or resource ID;
     - every mirror field;
     - the separate zone byte;
     - the flag;
     - every half-press cell.
   - Cover: AF-ON entry with initialization; move; type change; C1 selection; a custom-size edit; each exit
     from item 1, each followed by a normal edit.
   - Then do a native save **after** the edits. Assert its completion, either from the save log entry with
     its status or by reading back the persisted cells. Start a new session on that store, and assert the
     full profile state on reopen: RAM-only, so the image values, and the initialization on the next entry.
   - Compare the stores byte for byte with K2's.
   - The run must end `ok:true`.
6. **Orientations (only if item 5 passes).**
   - Import `ref\tasks\T7-orientation-producer\run-20261119-063452\work\scripts\pose.mjs` **unchanged**.
     Record its hash.
   - With Orientation Linked set through the stock menu, repeat one AF-ON move and one normal move in each of
     landscape, EXIF 6 and EXIF 8.
   - Assert which mirror index the AF-ON move writes per pose, and that the normal move writes the stock
     index (1, 5 and 3).
   - If the module does not work unchanged, report that, and keep one pose.

## 3. Deliverables (under `work\`)

`result.md` (template, with an "Owner decision Q5" section kept current); `evidence-manifest.json` plus the
sealed supplement; `out\profile-layout.md`; `out\design.md` (native sites, exit handling, initialization);
`out\overlay-changed-bytes.csv` (with source and section columns); `out\cmd\`; scripts, tables, JSONL,
screenshots.

## 4. Out of scope

The button target using the mirror (T6); storage (Q7); display; packaging; hardware.

## 5. Correction round (Opus, after Sol's review `run-20261119-081955-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Do **not** start over.
The hook-side exit handling (OK, MENU, S1 and playback clear the flag and restore the zone byte) and the C1/C2
mirror-only routing are confirmed. Save everything new under a **new, unique name** (`-m1` onward), and never
overwrite a file that a run used or wrote.

**Authorization: six new experiment versions, in this order of priority.** Do items 1–3 before anything else.
If the versions run out, stop and report.

**Erratum (coordinator).** `0x90a1` is the page-27 per-button priority (T1: 1 = detected-subject priority), not
SCP Subject Detect. Remove every claim that `0x90a1 = [1,1]` means Subject Detect Off. SCP Subject Detect is
`MODE_SUBJECT_DETECT`, key `0x1e71[0]`. Read it back, and state its value and how you know that value means Off
(stock menu text). Do not set it unless that is needed, and if you do, set it only through native menu keys.

1. **Entry must not overwrite the profile (a bug found in this round).** Each AF-ON entry currently recopies the
   half-press cells over the mirror, so the profile is not independent.
   - Fix it so that entry copies **nothing** into the mirror except the factory defaults for fields that are
     still `FF` (one change).
   - Show the following:
     - first entry with an all-`FF` mirror initializes from the descriptor defaults (all zero, per your finding
       2), and the screen still draws (assert the title-band hash);
     - a mixed mirror (some fields set, some `FF`) initializes only the `FF` fields;
     - C1 edited, exit, re-entry, C2 edited: both C1 and C2 stay in the mirror;
     - a value set in AF-ON mode survives a normal half-press edit and a re-entry.
2. **Acceptance (new runner, before the remaining exits).**
   - Run two fresh candidate sessions, K1, and a K2 that repeats only the half-press keys and the same menu
     exits.
   - After **every individual key**, assert:
     - the visual identity;
     - every mirror field;
     - the zone byte;
     - the flag;
     - every half-press cell, including all nine bytes of `0x1df1`.
   - Use unique step IDs.
   - Cover: entry with initialization; move; type change; C1; C2 with C1 retained; the OK, MENU and S1 exits,
     each followed by a normal edit.
   - Then do a native save **after** the edits, with its completion asserted, and start a new session on that
     store.
   - On reopen, assert: RAM-only, so the mirror holds the image `FF` values and the zone byte holds 0; the next
     entry initializes.
   - Compare the stores byte for byte with K2's.
   - The run must end `ok:true`.
3. **Restore with a non-zero snapshot.** In one case the zone byte is non-zero on entry. Show that exit restores
   that value.
4. **Remaining exits (only after items 1–3 pass).**
   - **Playback:** dismiss or avoid the no-picture warning (for example, return to shooting with the native
     key), then do the following normal edit.
   - **Session end:** call the shutdown path from the direct screen, and read the flag before and after.

   Correct the playback warning description.
5. **Orientations (only if item 2 passes).** As in brief §2 item 6. Use `pose.mjs`, unchanged, from
   `ref\tasks\T7-orientation-producer\run-20261119-072701\work\scripts\` (record its hash).
6. **Records.**
   - Seal the final command-output hashes in a supplement.
   - Inventory the consumed research inputs and the actual emulator resource files.
   - Qualify the wording on complete invariance.
   - Refresh the manifest last.
