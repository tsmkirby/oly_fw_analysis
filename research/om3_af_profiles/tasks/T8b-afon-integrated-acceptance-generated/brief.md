# T8b: Integrated acceptance with a generated step table and the measured save criterion (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T9b

## 0. Rules that override everything below

- **Read first:** the T8 brief, including its §5 (`ref\tasks\T8-afon-integrated-acceptance\brief.md`). The
  T8 decision (`ref\tasks\T8-afon-integrated-acceptance\decision.md`). Sol's two T8 reviews
  (`run-20261119-131023-review`, `run-20261119-141248-review`). All of T8's rules apply, except where this brief
  replaces them.
- **No new behaviour change.** Use only the accepted components (T8 brief §1). Leave them unchanged.
- **Version accounting.** **Every emulator process is an experiment version,** diagnostics included. At most
  six. Static scripts (the table generator and the checker) are not versions.
- **Stop at the first failed assertion.** End the run with `ok:false`, and run nothing after it.
- Everything else from T8 §0 stays: wrapper, hashes, frozen scripts, labels, sections from the image,
  `0x1e71[0]=0`, no visible menu entry beyond the inherited third row, no storage decision, no hardware
  recommendation.

## 1. Starting point

- T8's run `ref\tasks\T8-afon-integrated-acceptance\run-20261119-132229\work\`. It holds the t8r5 runner,
  `reference-v1.json`, the save navigation (twenty Left presses, `2.AF` identity, AF Target Mode asserted) and
  the observations in its result §6.
- **The save criterion (coordinator decision, T8 decision).** E and an unposted M are written **at session
  open**. The AF Target Mode commit adds only a posted M. Assert:
  - a fresh **posted M** after the recorded baseline, with a captured image and its own status-0 completion;
  - **no new E** in any role;
  - the decoded E bank byte-identical to K2's.

## 2. Work

1. **The sequence as data (static).** Write `out\sequence.json`, a declarative list of actions: the T8 §2.3
   sequence plus the save and the reopens. For each action, list:
   - the role set (K1, K2, candidate);
   - the individual keys it expands to: each Up, each dial detent, each Left in the save navigation, each
     menu-exit key;
   - the AF-ON-specific literal expectations: mirror bytes, AF-ON ten-byte target, bank positions, C1 `[5,7]`,
     size byte.
2. **Generated table (static).** `gen_table.mjs` expands `sequence.json` into one row per individual key and per
   edge, with a unique step ID. Each row lists every required field:
   - the title hash;
   - all 55 mirror bytes;
   - the zone byte and the flag;
   - every half-press cell;
   - the `0x62954108` record;
   - on edges: the ten-byte target, the owner, status, enabled and focus.

   Each field's source is exactly one of:
   - `literal`;
   - `ref:K2:<stepId>`;
   - `ref:K1:<stepId>`.
3. **Complete checker (static).** `check_table.mjs` fails on any of the following:
   - a missing field or a missing source;
   - a source naming a step that does not exist for that role;
   - an unmatched exit or save step between K2 and the candidates (the skipped AF-ON editor keys are listed);
   - a candidate field sourced from the candidate itself;
   - a collapsed procedural step.

   Record its output.
4. **Reference run (version 1).** K1 and K2 over the generated table. Assert only:
   - the T8 §5 item 2 invariants;
   - the amended save criterion (for K2);
   - no screenshot error.

   Record every field into `out\reference-t8b.json`, keyed by role and step ID, and hash it at once. Report
   the K1/K2 store differences without requiring zero, because K1 cannot commit AF Target Mode.
5. **Acceptance (versions 2–6).** c1 and c2 over the same generated table. Every field at every step is asserted
   against its declared source. A missing reference is a failure. Then:
   - the save, with the amended criterion;
   - a reopen for each candidate: mirror `FF`, zone 0, AF-ON press All with owner 2, release stock with owner
     0, focus compared, half-press equal to K2, and the next entry initializing;
   - **`compareStores` of each candidate against K2:** M and E, zero differing offsets, no truncation.

   The run ends `ok:true`.
6. **Records.**
   - `result.md` (template), including PROJECT-STATE §3's required behaviours, each marked demonstrated, not
     demonstrated, or out of scope (persistence is Q7; display is T9b).
   - The manifest, with every consumed input and transitive emulator modules.
   - An external final seal.

## 3. Out of scope

- Storage (Q7), display (T9b), and Subject Detect On.
- Packaging and hardware.
- Playback and session-end exits. Report them as remaining.

## 5. Correction round (Opus, after Sol's review `run-20261119-151728-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely.
Do **not** start over.

**Confirmed, reuse:**
- the generator, checker and reference-run pattern;
- the K1/K2 reference (`reference-t8b.json`, `ok:true`);
- K2's amended save witness (one fresh posted M at status 0, no new E);
- the measured candidate prefix (claims 7–11).

**Diagnosis (coordinator).** The candidate stalled because the AF-ON mirror initializes to **zero**. The stock
factory state is position 526 and the 3×3 custom size (K1 claim 2). The editor therefore starts the AF-ON profile
from a state the stock screen never starts from, so the "zone Small, then move" literals were guesses.

**Coordinator amendment: one behaviour change is authorized (labelled EMULATOR-ONLY).**
1. **Factory initialization.** `initMirror()` writes each mirror field with its **stock factory value**, instead
   of 0:
   - Find the value from the ROM default tables walked by registration `0x60062536`.
   - Confirm it against K1's fresh store (claim 2).
   - Keep the rule that only `FF`/`FFFF` fields are initialized.
   - If a ROM default and K1's fresh store disagree, report it and use the ROM default.
   - This keeps the owner-reported default ("stock factory defaults") with the true values. It is the only
     change. The T3l, T3m and T6 components are otherwise unchanged.
2. **Independent expectations: a new role K1e.** K1e is stock with no overlay, starting from the factory store.
   It presses **the same editor keys** as the candidate's AF-ON edits, in normal mode, so it edits the half-press
   cells.
   - The candidate's expected mirror after each AF-ON key is **K1e's half-press cells after the same key**,
     mapped to the mirror's layout and bank. Declare it as `ref:K1e:<stepId>` with the stated mapping.
   - The AF-ON ten-byte target expected on AF-ON-owned edges is K1e's **half-press** ten-byte target on its S1
     edge after the same edits. The T6 design shows the AF-ON record is built from the mirror the same way.
   - The K1e role and the mapping are static table content. Validate them in the checker.
3. **Table repairs (Sol §8 item 2):**
   - exit matching between K2 and the candidates;
   - bank and target consistency (EXIF 6 → bank 5, landscape → bank 1, per T7);
   - candidate flag expectations;
   - literal provenance: each remaining literal cites its accepted source (decision and claim).
4. **Run.**
   - Version 1: K1e reference only, appended to the reference with its own hash.
   - Versions 2–6: c1 and c2 through the full sequence:
     - the save with the amended criterion;
     - both reopens: the mirror is `FF` and the next entry initializes to the **factory values**; the AF-ON
       press after the reopen gives the factory-state target (state it); the release is stock;
     - full decoded M/E equality against K2.
   - Every emulator process is a version, and the run stops at the first failure.
   - It ends `ok:true`.
5. **Records.**
   - The required baseline-input inventory.
   - Revise result §§2, 5, 9.6, 9.8, 11 and 12 as Sol lists.

**Authorization: six new experiment versions.**
