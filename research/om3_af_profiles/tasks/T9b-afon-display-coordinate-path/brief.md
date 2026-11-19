# T9b: Display: trace the AF frame's coordinate path, then make the frame follow the AF-ON target (OM-Emu)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T8b

## 0. Rules that override everything below

- **Read first:**
  - the T9 brief, including its §5 (`ref\tasks\T9-afon-target-display\brief.md`);
  - the T9 decision (`ref\tasks\T9-afon-target-display\decision.md`);
  - Sol's two T9 reviews (`run-20261119-131450-review` and `run-20261119-141920-review`).

  All of T9's rules apply. They include the wrapper, hashes, frozen scripts, `EMULATOR-ONLY` labels, one change
  per experiment, sections from the image, `0x1e71[0]=0`, and no storage decision or hardware recommendation.
- **Set `OM_EMU_MODEL=E147`** before any import of `model.mjs`, and assert the model at the start of each
  session.
- **Every emulator process is an experiment version.** At most six. Then stop and report.
- **Do not guess a hook.** If the path is not identified, report it with the evidence.

## 1. Starting point

T9's run `ref\tasks\T9-afon-target-display\run-20261119-132229\work\`:
- `display.md`;
- the runners `obs_cell_v9`, `obs_cell_v10` and `obs_k2_v11`;
- the paint call: `GPI_DRAW_RECT` return `0x610f66df`, widget `0x610f6649`, called from `0x610eee11`;
- the coordinate reload at `0x610eedee`;
- the redraw function `0x610f70c5`, which tests `0x6036faad` and toggles `0x6036faac`.

## 2. Work (in this order)

1. **Coordinate object (observation).**
   - Writing `0x88b2` moves the marks without entering the getter (T9 claim 12).
   - Record the callees of setter `0x60063431` while it writes `0x88b2[0]`: every store, its PC, its caller and
     its value, in chronological order. Continue until the store that fills the memory reloaded at
     `0x610eedee` is found.
   - Name that object: its address, its fields (x, y, w, h), and its writer.
   - Report whether the setter reaches it directly, through a registered callback, or through a cached copy.
2. **Invalidation (observation).**
   - Find what makes the OSD frame repaint after that store: the flag, the message or the queue, and its
     writer.
   - Show whether an AF-ON press reaches it. Record this for the seeded T6 configuration and for the unseeded
     T6 control.
3. **One change (only after items 1 and 2).** While AF-ON owns the target (owner 2), write the frame object from
   the AF-ON ten-byte target or the mirror at the identified writer, and trigger the identified invalidation.
   On release, restore the half-press frame and invalidate.
   - **The narrowest choice:** call the stock writer with the AF-ON values, rather than writing pixels or OSD
     registers.
4. **Validation.** Run the 12-edge T5 list on the seeded T6 configuration plus the change, the unseeded T6 control
   (K2), and stock (K1).
   - After every edge, assert the **full expected frame** (all four mark rectangles: position, size and colour)
     with executable expectations derived from the target's position and size. Also assert the ten-byte target
     and the owner.
   - On S1-owned edges, the frame is the half-press frame.
   - K1 and K2 behave as stock.
5. **Records.**
   - `result.md` (template).
   - `out\display.md`, updated.
   - The manifest, with **every transitive emulator module** (`kernel.mjs`, `rtos.mjs`, `fw/board.mjs`,
     `fw/facts.mjs`, `fw/sections.mjs`, the device modules, and so on).
   - An external final seal covering the last command.

## 3. Out of scope

The editor (T8b), storage (Q7), Subject Detect On, packaging and hardware.
