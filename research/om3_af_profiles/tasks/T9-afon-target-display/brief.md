# T9: Display: is the AF-ON target shown while AF-ON controls AF? (OM-Emu, investigation first)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T8

## 0. Rules that override everything below

- **Inherited rules.** The T3j, T5 and T6 rules apply: each brief's §0 and correction §5, under `ref\tasks\`.
  - Run every command through the wrapper, with script hashes.
  - Never edit a script after it has run. Use new names, and never overwrite a file a run used or wrote.
  - Keep a complete manifest, including dynamic imports, with the final outputs sealed.
  - Label every behaviour change and every test-setup write `EMULATOR-ONLY`.
  - Make one change per experiment.
  - Screenshot errors are fatal. Assertions use explicit expected and actual values.
- **Emulator only.**
  - No byte goes in section 6 or 7, except the three inherited bytes `0x610bf5e3`–`0x610bf5e5`.
  - Compute each overlay row's section from the image section table at `0x60029b28`.
  - Make no storage decision and no hardware recommendation.
- **Subject Detect** stays Off: assert `0x1e71[0]=0`.
- **Spec requirement** (FEATURE-SPEC, 10 November revision): the AF-ON target is shown while AF-ON controls AF.
  Restate the spec's exact wording in `result.md` from `ref\analysis\button-af\FEATURE-SPEC.md`.
- **At most six experiment versions.** Then stop and report.

## 1. Starting point (under `ref\`)

- **The T6 configuration.** `analysis\button-af\readiness\t6-afon-target-size-position\`:
  - the README and `out\design.md`;
  - `out\overlay-changed-bytes.csv`;
  - `scripts\accept_v1.mjs` and `scripts\exp_q1_t6.mjs`, which seed the mirror as test setup (Small at 529).
  - In it, the AF-ON-owned ten-byte target comes from the mirror, and the consumer `0xa33ca384` follows the
    builder.
- **The T5 notes on the consumer and the owner variable.** `analysis\button-af\readiness\t5-afon-button-handoff\out\design.md`.
- **The stock direct screen `ID_ST_MENU_DIRECT`.** It draws the AF target grid (T3b decision).
- **Emulator capability.** Before any claim, establish what OM-Emu renders on the **shooting screen** (the
  live-view overlay), and whether an AF frame is drawn there at all, on stock K1.

## 2. Work (in this order)

1. **Observation on stock (K1, no overlay; version 1).**
   - Capture the shooting screen at rest, during S1 held, and after release.
   - Also capture it in S-AF with the half-press target set to Small at a non-centre position, using native keys
     on the direct screen.
   - Report whether an AF target frame is drawn and whether it moves with the half-press target position. Locate
     it by pixel region and screenshot hash.
   - If nothing frame-like is drawn on the shooting screen in the emulator, report BOUNDARY. Then try the
     alternatives, in order:
     - a different display path: EVF versus monitor, or a display-mode key;
     - static tracing of the frame's drawing routine from the overlay draw calls;
     - logging the draw-list parameters instead of the pixels.

     An emulator limitation is not a hardware dependency until those alternatives are exhausted.
2. **Find the frame's source (static, and dynamic where possible).**
   - Identify the routine that positions the AF frame on the shooting screen.
   - Identify what it reads: the ten-byte target, the half-press cells (`0x5962`, `0x99a1`, `0x9a41`, `0x1dd1`),
     the owner `0xa33ca384`, or another copy.
   - Give bounded listings, checked against the image.
3. **Behaviour with the T6 configuration (seeded mirror, test setup).** This is not a change.
   - The half-press target is All. The mirror holds Small at 529.
   - At the AF-ON press, the AF-ON release, S1 alone, and S1 held while AF-ON is pressed, record:
     - what the frame shows;
     - the ten-byte target;
     - the owner.
   - State whether the displayed frame follows the AF-ON target while AF-ON owns the target.
   - Compare with K2: the T6 overlay with no seed.
4. **Only if item 3 shows the frame does not follow:** make **one** EMULATOR-ONLY change at the narrowest point
   that makes the frame read the AF-ON target while AF-ON owns it, and restores it on release.
   - Assert the frame (pixel region, screenshot hash, or draw parameters) after every edge, for the 12-edge T5
     list.
   - Assert that the half-press frame is unchanged on the S1-owned edges, and that K1 and K2 behave as stock.
5. **Records.**
   - `result.md` (template).
   - `out\display.md`: what is drawn, where it comes from, and the change, if one was made.
   - The manifest and sealed supplement.
   - Screenshots, JSONL and `out\cmd\`.

## 3. Out of scope

- The editor (T8), storage (Q7) and Subject Detect On.
- Packaging and hardware.
- Any detected-subject frame. Subject Detect is Off.
