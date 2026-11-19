# T8d: Make the AF-ON target record equal the stock half-press writer's record; complete the short proof (OM-Emu)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T9d

## 0. Rules that override everything below

- **Read first:** the T8c decision (`ref\tasks\T8c-afon-bank-and-init-reconcile\decision.md`) and both T8c Sol
  reviews; the T6 design (`ref\analysis\button-af\readiness\t6-afon-target-size-position\out\design.md`); T8c's
  `run-20261119-175921\work\` (runners, `proof6.jsonl`, `slots-q2.json`).
- All T8, T8b, T8c, T6 and T3m rules apply: the wrapper, hashes, `EMULATOR-ONLY` labels, sections from the image,
  `0x1e71[0]=0` asserted after every key, `OM_EMU_MODEL=E147`, stop at the first failed assertion, no storage
  decision, no hardware recommendation.
- **Never overwrite a script, table or generator after it has run.** Every version gets a new filename.
- **Every emulator process is an experiment version. At most six.**
- **K1e** is the T5/T6 overlay with the AF-ON reader hook absent and the mirror unset (T8c decision, ruling 1).
  Label it the overlay S1 reference.

## 1. Work (in this order)

1. **Writer rule (static).** With bounded listings checked against the image:
   - how `0x609b3c79` computes each of the ten bytes, especially +4/+6, from `0x99a1`, `0x9a41[0]`,
     `0x1dd1[0]`, `0x1dd1[1]`, `0x84d1[0]` and the other immediates T8c listed;
   - how the T6 converter (builder `0x60a8f6bb` path plus the profile-read change at `0x60a8f708`) computes the
     same bytes;
   - what the zone codes mean: map stored values 0, 1, 2, 3, 5, 6, 7, 8, 9, 10 to their on-screen names from the
     descriptor `0x6061fd9c` / table `0x60617864` and the stock label resources.

   State exactly where the two paths diverge.
2. **Zone sweep (one version).** K1e, landscape, from the reset state. For each zone the stock dial reaches
   (identity-checked), plus one custom size: an S1 press and release, recording the ten-byte record and the
   inputs the writer read. In the same version, the candidate with the mirror seeded to each of the same
   settings: an AF-ON press and release. Report a table of zone, K1e record, candidate record and difference.
   Hash K1e's rows before comparing them.
3. **One change, labelled `EMULATOR-ONLY`.** Make the AF-ON record follow the stock writer's rule with the
   mirror's values, for every byte that differs in item 2. Prefer reusing the stock writer's computation (feeding
   it mirror values through the getter at the reads it makes) to re-implementing it. Keep the T8c bank mapping
   and `initMirror()` unchanged.
4. **Short integrated proof** (generated-table method). Sol's T8c corrections apply:
   - every exit resolves to an actual control sequence with identical ordered press/release semantics; reject
     candidate-only cycles;
   - expected title/highlight before every commit, retained in the success rows;
   - press expectations from K1e's S1 after the same keys (`ref:K1e:<step>`), release expectations from the
     candidate's own S1 in the same state, cross-checked with K2.

   Sequence: AF-ON entry (reset values) → landscape AF-ON edit, OK exit → press/release → EXIF 6 AF-ON edit, MENU
   exit → press/release in EXIF 6 → back to landscape press/release → one normal edit with half-press equal to
   K2. End `ok:true`. Include the zone sweep's rows as a pass/fail table.
5. **Records.** `result.md` (template) with the writer-rule table and the zone table at the top; the per-slot
   reset/ROM/fresh table with uncovered ROM slots marked explicitly; the manifest with execution-time hashes of
   every import and the baseline documents; an external seal.

## 2. Out of scope

Storage and persistence (they follow, in the integrated acceptance), the display (T9d), Subject Detect On,
packaging, hardware.
