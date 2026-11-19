# T6: AF-ON button target takes type, size and position from the AF-ON profile, per orientation (OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with the T3l correction round

## 0. Rules that override everything below

- **The T3j and T5 rules apply** (T3j brief §0; T5 brief §0 and §5, under `ref\tasks\`).
  - Use the wrapper for every command, with script hashes.
  - Never edit a script after it has run; give each experiment a new name.
  - Keep a complete manifest, including dynamic imports, plus a sealed supplement for the final command outputs.
  - Label every behaviour change `EMULATOR-ONLY`.
  - Make one change per experiment, or label the change as combined.
  - Table-driven runners assert after every edge and every key. Screenshot errors are fatal. A failed assertion
    ends the run with `ok:false`. Use unique step IDs.
- **Emulator only.**
  - Make no byte change in section 6 or 7, except the three inherited bytes `0x610bf5e3`–`0x610bf5e5`. Keep the
    section column and the checker.
  - Values stay in RAM. Make no storage decision and no hardware recommendation.
- **Subject Detect.** `0x90a1` is the page-27 per-button priority, not Subject Detect. Assert SCP Subject Detect
  through `MODE_SUBJECT_DETECT`, key `0x1e71[0]`, read back after setup. State its value and the stock menu text
  that shows it is Off. Set it only through native menu keys. Do not attempt Subject Detect On (CPU3).
- **At most six experiment versions.** Then stop and report.

## 1. Starting point (read first, under `ref\`)

- **Z5.** `analysis\button-af\readiness\t5-afon-button-handoff\`: the README, `out\target-bytes.md`,
  `out\design.md` and `out\overlay-changed-bytes-c1.csv` (3,262 rows), plus the T5 acceptance runner
  `scripts\accept_runner_c3.mjs` and its table.
  - The ten-byte AF-ON record takes kind, vertical, horizontal and priority from the zone byte `0xa031e920`.
  - Size `0xdfa1`, position `0x99d2` and +9 `0x1e01` are still legacy.
- **The AF-ON profile mirror** (T3b decision; `ref\tasks\T3b-afon-target-editor\run-20261119-063452\work\out\profile-layout.md`):
  55 bytes at `0xa031eeb0`. It holds the AF-ON copies of `0x99a1`, `0x5962`, `0x9a41`, `0x1dd1`, `0x88b2` and
  related cells, with their indices.
- **Orientation** (T7 decision): `pose.mjs` from `ref\tasks\T7-orientation-producer\run-20261119-072701\work\scripts\`.
  - Import it unchanged and record its hash.
  - The pose variable is `0xa32c568c`.
  - With Orientation Linked on (`0x1db1[0]` = `0x1dc1[0]` = 1), the stock bank indices are 1 (landscape),
    5 (EXIF 6) and 3 (EXIF 8). With it off, the index is 1.
- **The T5 decision** (`ref\tasks\T5-afon-button-handoff\decision.md`). The final reopen AF-ON release
  assertion was carried to T6.

## 2. Work

1. **Design.**
   - From the T5 listings and the home builder, state exactly which ten-byte target fields come from:
     - size (`0xdfa1`, and C1–C4 dimensions from `0x1dd1`);
     - position (`0x99d2`, `0x5962`, `0x88b2`);
     - +9.
   - State how each field must be sourced from the mirror instead, for the current pose.
   - Write this in `out\design.md`, with bounded listings checked against the image.
2. **Profile read (one change on top of Z5).**
   - When AF-ON owns the target, take the zone type, size, position and custom dimensions from the mirror, at
     the bank index the pose and Orientation Linked select.
   - Implement this at the narrowest point in the overlay's home-builder path. Keep the half-press record
     exactly as stock builds it.
   - For this task, seed the mirror with `EMULATOR-ONLY` session writes. The editor is T3l's job. Label the
     seeding as test setup.
3. **Experiments (at most four).** S-AF, Subject Detect Off (`0x1e71[0]` asserted).
   - **Q1.** AF-ON profile: Small, with a position different from the half-press position. Half-press: All.
     Run the 12-edge sequence, asserting after every edge:
     - the ten-byte target;
     - the owner;
     - every half-press cell, unchanged;
     - every mirror field, unchanged.
   - **Q2.** A custom zone (C1) with custom dimensions different from the half-press C1.
   - **Q3.** Three poses with Orientation Linked on, each with a different mirror bank value. The AF-ON target
     follows the bank for the current pose. Repeat with Orientation Linked off: index 1.
   - **Q4.** C-AF, with the Q1 profile. Use the T5 C-AF selection.

   Compare each with a K2 control (Z5 with the stock half-press only, no mirror seeding) and with K1 (stock).
4. **Acceptance (if Q1–Q3 pass).** Table-driven, with two fresh sessions plus K1 and K2.
   - Seed profile A, run the 12 edges, change to profile B, and run the 12 edges again.
   - Include one pose change between AF-ON presses.
   - Do a native save after the edits, with its completion asserted, then start a new session on that store.
   - On reopen, the mirror is RAM-only (image `FF`). The AF-ON press must then fall back to the zone-byte default
     and the stated fallback size and position. State the fallback, and prefer the factory defaults.
   - **Include the reopen AF-ON press and its release, both asserted** (the item carried from T5).
   - Compare the stores byte for byte with K2's.
   - The run must end `ok:true`.
5. **Native change list.** Update `out\design.md` with the native sites a final build must branch.

## 3. Deliverables (under `work\`)

- `result.md` (template)
- `evidence-manifest.json` and the sealed supplement
- `out\design.md`
- `out\target-fields.md`, the field-source table before and after the change
- `out\overlay-changed-bytes.csv`, with source and section columns
- `out\cmd\`
- scripts, tables, JSONL and screenshots

## 4. Out of scope

The editor (T3l), storage (Q7), display, Subject Detect On, packaging and hardware.

## 5. Correction round (Opus, after Sol's review `run-20261119-095259-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Do **not** start over.

**Confirmed, reuse unchanged:**
- the 15-byte profile read (one change on Z5);
- Q1's 12 edges (Small on the AF-ON-owned edges);
- C1 dimensions;
- the six pose/link combinations;
- C-AF;
- both 12-edge profiles in acceptance, including the EXIF-6 change.

Save everything new under a **new, unique name** (`-v1` onward). Never overwrite a file a run used or wrote.

**Authorization: six new experiment versions,** spent in the order below. When they run out, stop and report.

1. **Save procedure.** T5's final acceptance completed a native save with M and E byte-identical to its
   control: `ref\analysis\button-af\readiness\t5-afon-button-handoff\scripts\accept_runner_c3.mjs` and its
   table, steps up to and including `store`.
   - Reproduce that exact save procedure here: the same menu commit that dirties the store, then the menu
     exit.
   - Assert that the store log contains an M **and** an E save, with completion status 0 (not only a
     log-length change; see Sol's T3l note on `menu.mjs:879–880`).
   - Read the persisted cells back from the store file.
2. **Acceptance (new runner).**
   - Two fresh candidates, K1 and K2. K2 is Z5 with the stock half-press only and the same keys and menu
     exits as the candidates.
   - Replace every unconditional `check(id, [], …)` with exact expected-state comparisons, using explicit
     expected and actual values.
   - Assert every key, including those inside menu-exit loops, with unique step IDs.
   - Emit the complete 55-byte mirror and the focus/status readbacks on every edge.
   - Sequence:
     1. profile A, 12 edges;
     2. a pose change;
     3. profile B, 12 edges;
     4. the save from item 1;
     5. a new session on that store;
     6. on reopen: the mirror is back at image `FF`, the fallback is stated, **the AF-ON press and the AF-ON
        release are both asserted**, and the half-press record is stock;
     7. `compareStores` of decoded M and E against K2, reporting every differing offset.
   - The run must end `ok:true`.
3. **Size, distinguishing (one trial).**
   - Set the mirror's `0x9a41[0]` to a value that differs from the legacy size `0xdfa1`.
   - Show which one the AF-ON target uses, and that the half-press target still uses the legacy one.
4. **Narrow the claims.**
   - Q1: Small on the five AF-ON-owned edges, All restored on the others.
   - Q3: the reduced controls (K2 two linked edges per pose, K1 landscape only), unless you rerun them matched.
   - Q2: the unmatched navigation and store differences.
   - Correct the `0x9a41` descriptor count.
   - Remove "No other deviation".
5. **Records.**
   - Seal the final command outputs in a supplement.
   - Add the omitted consumed and cited inputs.
   - Canonicalize the duplicate manifest paths.
   - Refresh the manifest last.
