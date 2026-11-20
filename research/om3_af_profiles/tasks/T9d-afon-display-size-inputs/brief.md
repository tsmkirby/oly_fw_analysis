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

## 5. Correction round (Opus, after Sol's review `run-20261119-194955-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely.
Do **not** start over, and do not edit any executed file.

**Confirmed, reuse:** seeded A (Small) and seeded B (Single, 8×9) match their K1e references on all 12 edges;
full K2 and K1 stay stock; the display hook (position and zone at `0x6041935b`, `0x1dd1` at `0x6041a1fb`, owner 2,
saved bank) is accepted as the candidate change; the refresh results on the measured edges.

**Required:**
1. **Mark inventory (static, no version).** Reanalyse the retained sweep screenshots over the whole frame (no
   x<280 window). Correct Large and Custom (Sol found four complete 19×21 marks each) and every count and
   clipping description.
2. **Mode-word producer.** Arm a store watch on object+`0x374` (object `0x62c54158`) **before** the first
   translation of the code that writes it, and capture the storing instruction, its caller chain and the inputs
   (which getter return selects the mode). Give image-matching listings. Correct Cross's mode (Sol: mode 4, not
   2) and narrow the glyph-size inference to what the trace shows.
3. **Every refresh.** Record getter calls for every refresh window, each with a timestamped refresh identifier
   and a per-sample frame signature. Acknowledge that the windows discarded in the previous run cannot be
   reconstructed. Rerun the sweep, seeded A and seeded B only if needed to supply these records, against the
   hashed references already made.
4. **Records.** Record the shared validation library's digest before every run; update the completion and
   deviation wording; supplemental manifest and refreshed seal under new names.

**Authorization: four new experiment versions** (emulator processes).
