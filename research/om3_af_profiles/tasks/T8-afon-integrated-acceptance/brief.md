# T8: Integrated acceptance: AF-ON profile edited in the editor drives the AF-ON button target (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T9 (display)

## 0. Rules that override everything below

- **Inherited rules.** The T3j, T5, T3b, T3l, T3m and T6 rules apply: each brief's §0 and correction §5, under
  `ref\tasks\`.
  - Run every command through the wrapper, with script hashes.
  - Never edit a script after it has run. Give each version a new name, and never overwrite a file a run used
    or wrote. That includes import inventories: one per version.
  - Keep a complete manifest, including dynamic imports, with the final command outputs in a sealed
    supplement.
  - Label every behaviour change and every test-setup write `EMULATOR-ONLY`.
  - Screenshot errors are fatal. A failed assertion ends the run with `ok:false`.
- **No new behaviour change.** This task integrates accepted components only (§1). The integration is one
  labelled, combined configuration. If a defect needs a new change, stop and report it with evidence.
- **Emulator only.**
  - No byte goes in section 6 or 7, except the three inherited bytes `0x610bf5e3`–`0x610bf5e5`.
  - Compute each overlay row's section from the image section table at `0x60029b28`.
  - Make no storage decision and no hardware recommendation. Add no visible menu entry.
- **Subject Detect.** Read `0x1e71[0]` back and assert 0 (Off). Do not attempt Subject Detect On.
- **At most six experiment versions,** spent in the order of §2. Then stop and report.

## 1. Components (read first, under `ref\`)

All are accepted, EMULATOR-ONLY.

- **The button target.** `analysis\button-af\readiness\t6-afon-target-size-position\`:
  - the README (the T6 decision, including its coordinator corrections) and `out\design.md`;
  - `out\overlay-changed-bytes.csv`, the Z5 configuration with the 15-byte profile read;
  - `scripts\accept_v1.mjs`, the accepted runner (`ok:true`; reopen press and release asserted; stores
    equal to K2);
  - `scripts\save_v3.mjs` and `out\save-table-v3.json`, the accepted save witness.
- **The editor.** `analysis\button-af\readiness\t3m-afon-editor-state-leak\`:
  - the README (the T3m decision, including its coordinator corrections);
  - `scripts\fix_v1.mjs`. It holds the T3l hook (routing, `initMirror()`, the OK/MENU/S1/playback exit
    restore), the p3 restore of the three position copies, and the 72-byte custom-size record restore at
    `0x62954108`;
  - `out\profile-layout.md`.
- **Background.** The T3l decision at `tasks\T3l-afon-editor-completion\decision.md`, and the last Sol reviews
  of T6 and T3m (`tasks\T6-afon-target-size-position\run-20261119-110745-review\review.md` and
  `tasks\T3m-afon-editor-state-leak\run-20261119-121201-review\review.md`). Read both reviews completely: their acceptance-contract
  findings are this task's requirements.
- **Orientation.** `pose.mjs` from `tasks\T7-orientation-producer\run-20261119-072701\work\scripts\`.
  Import it unchanged and record its hash. With Orientation Linked on, the banks are 1 (landscape), 5 (EXIF 6)
  and 3 (EXIF 8).

## 2. Work (in this order)

1. **Integration and static check (no experiment version).**
   - Show that the T6 overlay CSV and the overlay the T3m runners used differ only in the 15 profile-read bytes.
     Otherwise list every difference and stop.
   - Write `out\config.md`: the combined configuration, with every runtime hook, its address and its source
     script and line.
2. **Controls first (version 1).** Build the runner and the step table, then run **K1 and K2 only**: the full
   sequence below, including the save and the reopen. This version must end `ok:true` before any candidate runs.
   - **K1** is stock with no overlay.
   - **K2** is the combined overlay with no hooks and the flag off. It runs the same half-press keys, the same
     edges, the same menu exits and the same save as the candidate. It skips only the AF-ON editor keys, and
     the table states which keys those are.
   - **Save, caused by the final call.**
     - Use the T6 save procedure. The menu reopens on the last-used tab (T3m claim 10), so navigate by
       **screen identity**: press a bounded number of keys until the title hash equals T6's AF-tab hash. Then
       assert that the highlighted row is AF Target Mode before the commit.
     - Record the store log and the callback count before the call.
     - Require a new E and a new M after it, each with a captured image and its own status-0 completion,
       including the posted M callback.
     - Assert the persisted cells against explicit expectations.
3. **Acceptance (versions 2–6).** Two fresh candidates, c1 and c2, plus K1 and K2.
   - **Setup.** S-AF, Subject Detect Off (assert `0x1e71[0]=0`), Orientation Linked on. Set the half-press zone
     with **native keys** on the stock direct screen, not with RAM pokes.
   - **Sequence:**
     1. **AF-ON entry** (session flag). Assert the mirror initialises from `FF` to the factory defaults.
     2. **AF-ON edit in the editor:** zone Small, then move the position. Exit with OK.
     3. **Normal edit:** one move. The half-press position must match K2.
     4. **12 AF-ON/S1 edges** (the T5 list), asserting after each edge:
        - The AF-ON-owned edges use the editor-made Small at the edited position.
        - All other edges use the stock half-press record.
        - The owner.
     5. **Pose change to EXIF 6.** Re-enter AF-ON mode, edit the position, exit with MENU. The mirror's bank-5
        position changes and bank 1 does not.
        - AF-ON down and up in EXIF 6 use bank 5.
        - Return to landscape: AF-ON down and up use bank 1.
     6. **AF-ON entry, C1 with custom sizes `[5,7]`.** Exit with S1, then a normal edit.
        - The AF-ON press gives the C1 record with those dimensions.
        - The half-press C1 cells and the `0x62954108` record equal K2.
     7. **Size check** (T6 carry): set the mirror's `0x9a41[0]` with native editor keys where possible. If the
        editor cannot set it, write it as labelled test setup. The AF-ON target's size byte must follow the
        mirror's, while the half-press size follows live `0x9a41[0]`.
     8. **Save** (§2.2).
     9. **Reopen** each candidate on its own store:
        - the mirror is 55 `FF` bytes and the zone byte is 0;
        - the AF-ON press is All, owner 2, and the release is the stock half-press record, owner 0;
        - the focus readbacks are compared;
        - the half-press cell snapshots equal K2's;
        - the next AF-ON entry initializes.
     10. **`compareStores`** of each candidate against K2. Zero differing offsets, with no truncated list.
   - **The step table** (`out\accept-table-v*.json`) is complete and independent.
     - Every key and every edge has a unique step ID.
     - Every step has explicit expected values for:
       - the title hash;
       - all 55 mirror bytes;
       - the zone byte and the flag;
       - every half-press cell;
       - the ten-byte target and the owner on edges;
       - status and focus readbacks, K1 included.
     - Expected values come either from **literals in the table** or from **the K2/K1 row with the same step
       ID**. Never from a candidate's own observation.
     - A missing reference is a failure. The table contains no `check(id, [])`.
   - The run ends `ok:true`.
4. **Records.**
   - `result.md` (template). For each claim, say which component it rests on.
   - The manifest, with the final commands sealed.
   - A single numeric `section` column.
   - The step table, JSONL logs, screenshots, stores and `out\cmd\`.

## 3. Out of scope

- Storage (Q7), so the profile not surviving a reopen is expected.
- Display (T9).
- Subject Detect On, packaging and hardware.
- Playback and session-end exits. Note them as remaining if they are not exercised.

## 5. Correction round (Opus, after Sol's review `run-20261119-131023-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely.
Do **not** start over.

**Confirmed, reuse:**
- the static integration (`overlay-diff-t8.json`: the overlays differ only in the 15 profile-read bytes;
  sections computed from the image);
- `config.md`;
- the K1 observations in claims 2–6.

**Coordinator change of method (this replaces the literal-only rule for controls in §2.3).** Six versions were
spent discovering K1 values one per run. A control cannot be asserted against values nobody has measured. From
now on:

1. **Table check (no experiment version).** Before any emulator run, a static checker validates the step table:
   - every step has a unique ID and every required field;
   - K2 and the candidates have the same half-press keys, edges, exits and save steps, and the AF-ON editor keys
     K2 skips are listed;
   - each reference points to an existing step ID of the same name;
   - the C1 step selects C1, so its mirror expectation is the C1 type, not Small;
   - the bank-1 values are preserved across the EXIF-6 edit;
   - the S1 exit is a real S1 key in the editor.

   Fix the issues Sol listed. Record the checker's output.
2. **Reference run (version 1).** Run K1 and K2 over the full sequence, including the save and the reopen.
   Assert only these invariants:
   - accepted literals: `0x1e71[0]=0`; the mirror is 55 `FF` bytes in K1 and K2; the flag is off; K1's
     ten-byte target is the stock `0e 02 02 00 1b 00 27 00 00 00`; K1's owner, status and enabled are the image
     value 255, the role-specific stock readback (your claim 6);
   - no screenshot error, with no fallback after `ctx.screen()` throws;
   - for the save: a fresh E and a fresh M after the recorded baseline, each with a captured image and its own
     status-0 completion, including the posted M, reached by identity-guided navigation with the AF Target Mode
     row asserted before the commit.

   Write every other field at every step into `out\reference-v1.json`, keyed by role and step ID. Add a hash of
   that file to the manifest at once. Then, in that same run, compare K1 and K2 decoded stores and report every
   differing offset.
3. **Acceptance (versions 2–6).** The candidates c1 and c2 assert every field at every step against either the
   same-step K2 or K1 reference from `reference-v1.json`, or a literal for the AF-ON-specific values:
   - the mirror;
   - the AF-ON ten-byte target on AF-ON-owned edges (from T6: Small `11 02 03 00 01 00 01 00 00 00` pattern,
     at the edited position);
   - C1 `[5,7]`;
   - the bank-5 position;
   - the size byte.

   A missing reference is a failure. No expectation is taken from the candidate's own observation. Every
   acceptance item of §2.3 is in force, including both reopens with re-initialization and `compareStores` of
   each candidate against K2 with zero differences. The run ends `ok:true`.
   - If version 1's K2 fails an invariant, fix only the table or the harness, and record why.
   - The accepted components are never changed.
4. **Records.**
   - Inventory the final commands and every consumed input, with an external final seal.
   - Revise §5 and §11.
   - Rename misleading presets (for example `halfSingle`).
   - Preserve the executed scripts.

**Authorization: six new experiment versions.** The table check is not an experiment version.
