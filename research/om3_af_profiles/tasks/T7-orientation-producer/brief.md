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
