# T9c: Display: prove the frame writer's causal input and refresh trigger, then one change (OM-Emu)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T8c and the T10 correction

## 0. Rules that override everything below

- **Read first:**
  - the T9b decision (`ref\tasks\T9b-afon-display-coordinate-path\decision.md`), including its coordinator
    corrections;
  - T9b's run `ref\tasks\T9b-afon-display-coordinate-path\run-20261119-153249\work\`
    (`result-addendum-v1.md`, `out\display-addendum-v1.md` and the c1–c6 runners and logs).

  All of the T9 and T9b rules apply: the wrapper, hashes, frozen scripts, `EMULATOR-ONLY`, one change per
  experiment, sections computed from the image, `0x1e71[0]=0`, `OM_EMU_MODEL=E147` asserted per session, no
  storage decision and no hardware recommendation.
- **Every emulator process is an experiment version. At most six.**
- **Do not guess a hook.** Each step below is a causal trial with a stated expected outcome.

## 1. Work (in this order)

1. **Causal trial: the getter return (version 1).** On stock, with the cell left at 526:
   - make the thunk call at `0x6041935b` return 412, only for `d0=0x88b2`, labelled test setup;
   - then trigger the same refresh the setter path triggers.

   Find the trigger first, by recording the call stack (return addresses) at the entry of `0x61184dd6` during
   the post-setter idle. It is entered indirectly. Name the dispatcher and the condition: the two checks via
   `0x610cd5ac`, a message, a timer, or the dirty byte `0xa32bfb32`. Then reproduce that condition without
   writing the cell.

   - **Expected if the getter return is the causal input:** the marks move to (356, 198) 65×71 while
     `0x88b2` stays 526.
   - Report either outcome.
2. **Geometry inputs (static, with one version if needed).**
   - Explain object+`0x364`=406 and point (16, 10) in terms of the getter return.
   - Establish where width and height come from, and which inputs a size or zone change alters. Use one trial
     with zone Small against All (the T9 claim: All changes the grey pixels).
3. **One change (only if item 1 is positive).**
   - While AF-ON owns the target (owner 2), the identified getter call path, and only that call site, returns
     the AF-ON position and size for the current bank, from the mirror, as the T6 reader does.
   - On the AF-ON press and on the release, raise the identified refresh condition.
   - Owner 0 restores stock behaviour.
4. **Validation (versions 4–6).** Run the 12-edge T5 list on the seeded T6 configuration plus the change, the
   unseeded T6 control (K2) and stock (K1).
   - After every edge, assert:
     - the full expected frame (all four mark rectangles: position, size and colour, derived from the target
       by the relation established in item 2);
     - the ten-byte target;
     - the owner.
   - S1-owned edges show the half-press frame.
   - K1 and K2 behave as stock.
   - The run ends `ok:true`.
5. **Records.**
   - Apply T9b's three corrections in a uniquely named addendum.
   - `result.md`.
   - `display.md`.
   - The manifest, with the transitive modules, the cited reviews and an external seal.

## 2. Out of scope

The editor (T8c), storage (T10), Subject Detect On, packaging and hardware.
