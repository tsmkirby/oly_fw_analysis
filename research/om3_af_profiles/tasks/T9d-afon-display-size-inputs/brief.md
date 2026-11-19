# T9d: Display: find where the AF frame's size and kind come from, then extend the change and validate a visible second size (OM-Emu)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T8d

## 0. Rules that override everything below

- **Read first:** the T9c decision (`ref\tasks\T9c-afon-display-causal-input\decision.md`) and both T9c Sol reviews;
  T9c's `run-20261119-175921\work\` (`display.md`, the addenda, the K1e/K2/seeded runners and logs).
- All T9, T9b and T9c rules apply: the wrapper, hashes, frozen scripts (new names), `EMULATOR-ONLY`, one change per
  experiment, sections from the image, `0x1e71[0]=0`, `OM_EMU_MODEL=E147` per session, no storage decision, no
  hardware recommendation.
- **Expectations come from reference runs** (K1e with the half-press settings set to the profile's values; full K2
  with the same display hook unseeded). No formula-derived rectangles. Hash references before the candidate runs.
- **Every emulator process is an experiment version. At most six.**

## 1. Work (in this order)

1. **Stock size sweep (one version).** K1e, landscape. For each zone the stock dial reaches plus one custom size,
   at a non-centre position: record the frame (all mark rectangles, sizes, colours) and **every settings-getter
   call** made from entry to `0x61184dd6` through the writer `0x61184e51` (call site, key, index, return), plus
   object+`0x364` and +`0x374`. Report which zones draw visible marks.
2. **Size and kind inputs (static, with that trace).** Name the call sites and keys that set the mode word
   object+`0x374` and the size constants, with bounded listings checked against the image.
3. **One change.** Extend the T9c display hook so that, while the owner is 2, exactly the call sites found in
   item 2 return the AF-ON profile's values for the current bank (T8c saved-index mapping), from the mirror. Remove
   the `0x6041935b` kind branch if item 2 shows that site never supplies kind. Every remaining branch must fire at
   least once in validation.
4. **Validation.**
   - Profile A: Small (as T9c). Profile B: a zone or custom size that **draws visible marks** of a different size
     from A, at a non-centre position.
   - Seeded A, seeded B, full K2, stock K1: 12 edges each; after every edge the full frame against the reference,
     the ten-byte target and the owner; stop at the first failure; each ends `ok:true`.
   - **Refresh:** for every edge where the reference frame changes, measure edge-to-first-change and require it
     within K1e's measured stock latency plus one idle period; on edges where the frame does not change, assert it
     stays unchanged through the same window. Report per edge.
   - Report substitution counts per branch; zero on any branch is a failure.
5. **Records.** `result.md`, `display.md` (superseding wording marked), the manifest including the three T6
   baseline files T9c omitted, and an external seal.

## 2. Out of scope

The target record reconciliation (T8d), storage, Subject Detect On, packaging, hardware. If T8d changes the AF-ON
record, the display expectations stay valid because they come from K1e references.
