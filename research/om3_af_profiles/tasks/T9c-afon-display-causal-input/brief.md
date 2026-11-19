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

## 5. Correction round (Opus, after Sol's review `run-20261119-174959-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely.
Do **not** start over. Preserve version 4's failed evidence unchanged.

**Confirmed, reuse:** the getter return at `0x6041935b` is a causal input (412 → 356,198 marks, cell 526); the
entry is `calls (A2)` at `0x610c8b66` (vtable+`0x190`); the two `0x610cd5ac` checks gate the writer; division
by 39, mode-2 size 3/3, glyph 19×21.

**Coordinator ruling: frame expectations come from reference runs, not from a formula.** The minus-6 rule stays
a fitted hypothesis and is **not** used to derive expectations.
- **AF-ON-owned edges:** K1e is stock with the half-press zone, size and position set to the AF-ON profile's
  values for the current bank (native editor keys, or the stock setter labelled test setup). Its frame after the
  same idle is the expected frame for that profile. Record the four mark rectangles, sizes and colour, and hash
  them **before** the candidate runs.
- **Owner 0/1 edges:** the frame of the full K2 configuration at the same edge (`ref:K2:<edge>`).

**Required:**
1. **Full K2.** K2 is the T6 overlay, the T6 profile-reader hook and the **same** display hook as the candidate,
   unseeded. The Z5 control does not count. Relabel version 5 as the Z5 control with a reduced hook.
2. **Size coverage.** Two seeded profiles: profile A (Small, as before) and profile B with a different zone and
   size at a non-centre position, so the hook's size/kind branches execute (count substitutions per branch;
   zero is a failure).
3. **Refresh.** Either name the producer that schedules the `0x610c8b66` dispatch and raise it on press and
   release, **or**, if it cannot be named within budget, measure per edge the time from the edge to the first
   frame change and require it to be no longer than K1e's measured stock latency from S1 press to frame change,
   plus one idle period. State which criterion was used. The producer then stays unresolved.
4. **Validation.** Seeded A, seeded B, full K2, K1: all 12 edges, full frame plus ten-byte target plus owner after
   every edge, stop at the first failure, each ending `ok:true`.
5. **Records.** Apply Sol's corrections 1–4: a partial-investigation label for the previous run, refresh scheduling
   and the general getter-to-word relation left unresolved, minus-6 labelled as a fitted hypothesis, "No other
   deviation" withdrawn. Separate directly sampled words from screenshot-inferred ones. Complete the manifest and
   refresh the seal.

**Authorization: six new experiment versions** (emulator processes).
