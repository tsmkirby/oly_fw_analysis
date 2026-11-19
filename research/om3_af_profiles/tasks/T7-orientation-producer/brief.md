# T7: Orientation in OM-Emu: the stock orientation producer and per-orientation AF target banks

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with the T3b correction round

## 0. Rules that override everything below

- **Stock image only for measurement.** For the measurements, use no overlay and no behaviour change; NVRAM is
  off unless a step says otherwise. The **only** permitted behaviour change is an `EMULATOR-ONLY` pose
  injection at the point where the orientation sensor's value enters the firmware (item 2), clearly labelled.
- Every command goes through the wrapper `run_logged.mjs`, with script hashes. Never edit a script after it has
  run; use a new name per experiment. Keep a complete manifest, including the imported emulator modules. Ghidra
  only through `tools\bin\run-ghidra.cmd`. Check listings against the image bytes.
- No image, no storage decision, no hardware recommendation. Subject Detect Off.

## 1. Background (read first, under `ref\`)

- `analysis\button-af\FEATURE-SPEC.md`: orientation-specific targets; "Establish the physical orientation
  producer … The supplied pose matrix and immutable-record checks alone do not satisfy it."
- `analysis\button-af\AFON-MENU-RESEARCH.md` §1 "AF target settings (half-press profile today)": the bank
  cells `0x1db1`/`0x1dc1`, and **Orientation Linked** (an AF target tab page that T4b entered).
- T3b result (`ref\tasks\T3b-afon-target-editor\run-20261119-053817\work\result.md` finding 5): `rotate` and
  monitor-closed left `0xe91` index 3 at 0, and only one pose was available.
- Earlier pose work: search `ref\analysis\button-af\` and `ref\PREHARDWARE-AF-AUDIT.md` for "pose" and
  "orientation-bank capture", and reuse what exists.

## 2. Work

1. **Producer.** Find where the firmware obtains the camera orientation, from the sensor or peripheral read,
   through to the value the AF target code uses to select a bank. Give bounded listings and xrefs. Identify the
   cell or RAM variable that holds the current pose and its encoding (landscape, CW, CCW).
2. **Injection.** Find the narrowest point at which OM-Emu can supply a pose, preferably the peripheral or
   register read the producer performs, so that the native producer code still runs. Implement it as an
   `EMULATOR-ONLY` session option and label it. Show, in a stock session, that each injected pose reaches the
   pose variable through the native producer (an entry trace and readbacks).
3. **Banks.** With Orientation Linked enabled through the stock menu, using native keys, and each pose injected:
   - Open the stock direct target screen (from shooting, with the arrow keys) and move the target.
   - Read back `0x5962`, `0x88b2`, `0x1dd1`, `0x1db1`, `0x1dc1`, `0x99a1`, `0x9a41`, `0x99d2`, `0xdfa1` and
     `0xe91` in full before and after.
   - State which cell index each pose writes, and which the ten-byte AF target record (the T5 home builder)
     reads per pose. Do the same with Orientation Linked off as a control.
4. **Reusable harness.** Provide the pose option as a small module that the T3b and T6 runners can import
   unchanged. Document its interface in `out\pose-injection.md`.

## 3. Deliverables (under `work\`)

- `result.md` (template)
- `evidence-manifest.json`
- `out\orientation-producer.md` (items 1–3)
- `out\pose-injection.md`
- the pose module, scripts, JSONL, screenshots, listings
- `out\cmd\`

## 4. Out of scope

AF-ON routing (T3b and T6), storage, display, packaging, hardware.

## 5. Correction round (Opus, after Sol's review `run-20261119-072102-review`: REJECT)

Your previous work is in `work\`. Sol's full review is `audit\previous-review.md`. Do **not** start over.
Findings 1–4, 10 and 12 are confirmed, the bank measurements (7–9) are supported, and `pose.mjs` is
accepted as an importable module. Save every new script, JSONL and screenshot under a **new, unique name**
(`-r1` suffix onward). Never overwrite a file that a run used or wrote. You may make at most four new
experiment versions.

**Coordinator amendment, injection scope (replaces the "only permitted behaviour change" wording in §0).**
This emulator has no I2C bus and no data-ready pin. The following `EMULATOR-ONLY` stand-ins are therefore
permitted as part of the pose injection:

- skipping pin setup;
- bus open, write and close returning 0;
- the synchronous probe identity;
- lab-triggered issue and completion.

Only the register-read hook may supply pose data. List every intervention in `out\pose-injection.md` in a
table with these columns: address, stock behaviour, stand-in, whether it supplies data. No other behaviour
change is permitted.

1. **The ten-byte target per pose (required by brief §2.3).**
   - For each of landscape, EXIF 6 and EXIF 8, with Orientation Linked on and then off (set through the stock
     menu with native keys), establish which `0x99a1` / `0x5962` / `0x9a41` / `0x1dd1` index the **ten-byte
     AF target record's producer** reads.
   - Use the native producer path: the T5 home builder and the converter `0x609b3ecd`, or whatever native
     path builds the record on a stock image. Trigger it with a stock action that builds the record, such as
     a half-press (S1). Subject Detect stays Off; read back `0x90a1` and assert it.
   - Record the getter calls with caller addresses and the record bytes.
   - Keep the direct-editor getter evidence separate from this result.
   - If no stock action builds the record in this emulator, say so with evidence, and give the static path
     from the pose variable to the index selection.
2. **Store-trace correction.** Correct finding 5. There are several raw-store sites (`0x60077ff6`,
   `0x60078025`, `0x60078052` and `0x6007805e`). If you claim per-sample traces, instrument all of these
   sites and the copy entry in a new experiment. Otherwise downgrade the claim.
3. **Bounding.**
   - Bound finding 6 (`0xe91`) and finding 11 (the zero record) to the observations actually recorded.
   - Add the xrefs from the producer to the bank selector, from `0xa32c568c` / `0x60077de1` to the readers
     that select a change index.
   - Use descriptor-backed cell lengths, not adjacent data read as extra indices.
4. **Runner assertions.** New runs must assert:
   - each pose is reached;
   - each move succeeds;
   - completion is reached.

   A missing pose or an incomplete run must end `ok:false`.
5. **Records.** Complete the command-13 provenance in a separate final supplement and correct the "every
   file" statement. Refresh the manifest last.
