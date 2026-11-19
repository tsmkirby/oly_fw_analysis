# T4b: Boot order and duplicate-record readers (stock OM-Emu watch run from reset, plus flash callees)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu · Runs concurrently with T3b (separate workspace)

## 0. Rules that override everything below

- **Stock image only.** No overlay, no patch, no hook that changes behaviour. Watchpoints and probes only.
  `OM_EMU_NVRAM=off`; record the actual environment value and session configuration in the log.
- Every command through the wrapper `run_logged.mjs`, with script hashes. Never edit a script after it has
  run; a new name per experiment. A complete manifest, including imported emulator modules.
- Ghidra only through `tools\bin\run-ghidra.cmd`. Listings are checked against the image bytes.
- No image, no installer, no storage decision, no hardware recommendation.

## 1. Background (read first, under `ref\`)

- `analysis\button-af\readiness\t4-afon-packaging\README.md`, `out\packaging-c1.md`, `out\watch-c1.jsonl`,
  `out\callers-c1.txt`, and `ref\tasks\T4-afon-packaging\decision.md`. T4's watch run was armed **after**
  boot, never opened page 28, and did not reach distinct page-25/26 editors.
- `HARDWARE-STAGE0-RECORD.md`: the loader, the key-port hook point `0x6017a5fc`, Finding 2 (section 7
  compressed), the owned-RAM analysis.

## 2. Work

1. **Watch from reset.** Arm the probes **before** the first instruction of the session (or at the earliest
   point the player allows; state exactly which). Record, with PC, cycle or step count, and caller:
   - the first and every execution of `FUN_60405865` (descriptor builder) and its call site;
   - every execution of `0x6017a5fc` (key-port hook point);
   - every read of the key-8 directory entry `0x615cc934`–`0x615cc93b`;
   - every read of `0x615c6234`–`0x615c624b` (the duplicate `0x216` record) and of `0x615c59dc`–`0x615c59f3`
     (the first one);
   - every execution of the walkers `0x6124f4e5`, `0x6124f55e`, `0x6124f63d`;
   - every write to the bucket `0x62a84b2c`.
2. **Exercise the menus.** From that session, with native keys, open pages 25, 26, 27 and 28 (28 by the
   reference construction from T3c if there is no native route; say which), and open **every** editor on
   each page, cancelling each. Also open the AF target selection screen and the Fn/button assignment pages.
   Log the page title and highlighted row after every key.
3. **Order.** From item 1, state the order of: descriptor build, first key-port hook execution, first
   directory read, first walker execution. Say whether a runtime installer at the key-port hook would run
   before or after the descriptor build and before the first menu lookup.
4. **Duplicate record.** State every reader of the duplicate record observed, and every walker invocation
   whose scan passed index 151. Add a static search for computed indexing into the key-8 array (base plus
   index × 24) in all loaded code. Grade the reuse hypothesis: supported on the exercised paths, refuted, or
   unresolved.
5. **Flash callees.** List the flash-read callees that T4 left unlisted (`0x60021812`, `0x60023042`,
   `0x60023228`, `0x600218ea`, `0x600236ea`, `0x600236a2`) through their own callees, to the hardware access
   or a bounded depth of your choice (state it). Answer: does any of them checksum or decompress the copied
   bytes? Bound the answer to what was listed.

## 3. Deliverables (under `work\`)

`result.md` (template); `evidence-manifest.json`; `out\boot-order.md` (items 1–4); `out\flash-callees.md`
(item 5); watch logs (JSONL) and hit summaries; bounded listings; `out\cmd\`; scripts.

## 4. Out of scope

Building an installer, any image, any overlay, storage, hardware.
