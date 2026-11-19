# T8c: Reconcile the editor's bank with the AF-ON reader's bank, and the initialization values; short integrated proof (OM-Emu)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T9c and the T10 correction

## 0. Rules that override everything below

- **Read first:**
  - the T8b decision (`ref\tasks\T8b-afon-integrated-acceptance-generated\decision.md`);
  - Sol's two T8b reviews (`run-20261119-151728-review`, `run-20261119-162247-review`);
  - the T7 decision, "Direct editor banks";
  - the T6 design (`ref\analysis\button-af\readiness\t6-afon-target-size-position\out\design.md`).

  All of the T8, T8b, T6 and T3m rules apply, including:
  - the wrapper, hashes and frozen scripts;
  - `EMULATOR-ONLY` labels;
  - sections computed from the image;
  - `0x1e71[0]=0`, **asserted after every key**;
  - `OM_EMU_MODEL=E147`;
  - stop at the first failed assertion;
  - no storage decision and no hardware recommendation.
- **Every emulator process is an experiment version. At most six.**
- **Keep it small.** This is not the full acceptance. It is the shortest sequence that proves the integrated
  path once.
- **Identity before commit.** Before every OK or commit key, assert the screen title hash and the highlighted
  row. The T8b K1e run committed a wrong page.

## 1. Questions

1. **Bank indices (observation).** Under the T8 setup, stock with no overlay, for the poses landscape, EXIF 6
   and EXIF 8, each with Orientation Linked **on** and **off** (set through native menu keys, with the link
   cells `0x1db1[0]` and `0x1dc1[0]` read back), record:
   - **(a)** which `0x5962`/`0x99a1` indices the stock direct screen writes for one Up;
   - **(b)** which index the stock ten-byte writer `0x609b3c79` and the T6 profile-read hook read for that pose
     and link state.

   T7 reported banks 1/5/3 when linked and 1 when not. T8b measured editor writes at 0 and 4. Explain the
   difference:
   - Is the T8 setup's link state not what was assumed?
   - Are writes and reads offset by one?
   - Or is something else going on?

   Give bounded listings checked against the image for the index computations on both sides.
2. **Initialization values (observation).**
   - Run the stock **settings reset** through native menu keys, on stock K1.
   - Read every half-press cell that the mirror copies.
   - Those values are the "stock factory defaults" for initialization (coordinator definition, replacing both
     the ROM zeros and the K1 fresh store).
   - Report every slot where reset, ROM and the fresh store disagree.

## 2. Work

1. Answer Q1 and Q2. These are observations, one or two versions.
2. **One combined change, labelled `EMULATOR-ONLY`.**
   - **(i) Bank mapping.** If the editor's write index and the reader's read index differ for the same pose and
     link state, make the T6 reader use the bank the stock editor writes. The stock editor defines the layout,
     because the spec requires reusing the stock screen.
   - **(ii) Initialization.** `initMirror()` writes the Q2 reset values, keeping the `FF`-only rule.
   - If neither is needed, report that, and make no change.
3. **Short integrated proof (one candidate, plus K2 and K1e, one version).** Use the T8b generated-table method,
   with these checker additions:
   - exits matched as actual action sequences, with press/release semantics and order;
   - bank labels validated against the mapped cells;
   - no stale target records.

   The sequence:
   1. AF-ON entry: the mirror initializes to the Q2 values.
   2. AF-ON edit, landscape: zone Small via the identity-checked dial, then one Up. Exit with OK.
   3. AF-ON press and release:
      - The ten-byte target is Small at the edited position. The expectation comes from **K1e's half-press
        ten-byte target after the same keys from the reset state**, at the mapped bank.
      - The release gives the stock half-press record.
      - The owner is 2, then 0.
   4. Pose change to EXIF 6. AF-ON edit, one Up. Exit with MENU. Assert the press and release in EXIF 6, then
      back in landscape, each against its bank.
   5. One normal edit: the half-press equals K2.

   The run ends `ok:true`. A save and reopen is **not** required in this task.
4. **Records.**
   - `result.md` (template), with Q1 and Q2 tables at the top.
   - The manifest: transitive modules, the required baseline documents (the T6/T3m/T8/T8b reviews and the
     inherited briefs), and an external seal.

## 3. Out of scope

- The full acceptance (C1/C2, size, save and reopen, two candidates). That is the next task, once this passes.
- Storage (T10), display (T9c), Subject Detect On, packaging and hardware.

## 5. Correction round (Opus, after Sol's review `run-20261119-174338-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely.
Do **not** start over.

**Confirmed, reuse (do not re-measure):**
- Q1: the stock editor writes the **saved** index (0/4/2 linked, 0 unlinked); the T6 reader used the **change**
  index (1/5/3, 1). The UI-id table at `0x6062555c` pairs them (1338/1339, 1646/1647, 1648/1649).
- Q2: Initialize All Settings → Yes equals the fresh store at all 63 slots; ROM payloads are zero.
- The change: `bank()` returns the saved index; `initMirror()` unchanged.

**Coordinator ruling on references.** No literal and no image-era record may serve as an expectation.
- **Press expectation:** K1e performs the **same edit keys** on the stock half-press editor from the reset state,
  then an **S1 press**; its ten-byte record at that step is the AF-ON press expectation (`ref:K1e:<step>`),
  hashed as soon as it is written.
- **Release expectation:** immediately before each AF-ON press, the candidate itself does an S1 press and release
  in the same state; that S1 record is the release expectation for the following AF-ON release. Cross-check it
  against `ref:K2:<step>` where K2 took the same normal keys.
- Delete the hard-coded `STOCK` record and the "3×3 or 1×1" alternatives.

**Required:**
1. Generated table `fields` declare and judge: mirror bytes, flag, half-press cells at the mapped bank, the
   custom-size record, edge state, owner, `0x1e71[0]`, bank. One declared source per field.
2. The checker fails any exit without a matched control sequence (an exit may not match itself).
3. Before every commit key, compare the screen title hash and the highlighted row with **expected** values
   recorded from K1e at the same step (not "non-empty").
4. Run the complete §2.3 sequence: landscape edit/press/release, EXIF 6 edit with MENU exit and press/release,
   back to landscape press/release, the normal edit equal to K2. End `ok:true`. Stop at the first failure.
5. Records: the per-slot reset/ROM/fresh table (all 63 slots, not only the disagreement count); describe the
   T7-versus-T8 explanation as inferred (the selector branch was not listed); complete the import and baseline
   inventory with execution-time hashes; refresh the seal; distinguish the static T6 bank calculation from
   dynamically observed reads.

**Authorization: six new experiment versions** (emulator processes).
