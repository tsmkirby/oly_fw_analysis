# T3m: AF-ON editor state isolation (find and restore the editor state that leaks position across modes)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

- **Inherited rules.** The T3j, T5, T3b and T3l rules apply (each brief §0 and its correction §5, under
  `ref\tasks\`):
  - Run every command through the wrapper, with script hashes.
  - Never edit a script after it has run. Give each experiment a new name.
  - Keep a complete manifest, including dynamic imports. Put the final command outputs in a sealed
    supplement.
  - Label every behaviour change `EMULATOR-ONLY`.
  - Make one change per experiment.
  - Runners assert **immediately after every individual key**, with explicit expected and actual values and
    unique step IDs.
  - Screenshot errors are fatal. A failed assertion ends the run with `ok:false`.
- **Emulator only.**
  - No byte goes in section 6 or 7, except the three inherited bytes `0x610bf5e3`–`0x610bf5e5`.
  - Values stay in RAM. No storage decision and no hardware recommendation.
  - No visible menu entry is added.
- **Subject Detect.** Read back `0x1e71[0]` and assert it is 0 (Off, per T3l). Do not use `0x90a1` as Subject
  Detect.
- **At most six experiment versions.** Spend them in the order of §2. Stop and report when they run out.

## 1. Starting point (read first)

- `ref\tasks\T3l-afon-editor-completion\decision.md` and Sol's last review,
  `ref\tasks\T3l-afon-editor-completion\run-20261119-092300-review\review.md`. Read both completely.
- The T3l work: `ref\tasks\T3l-afon-editor-completion\run-20261119-083228\work\`. It contains the hook with
  `initMirror()` and the exit restore, the runners `entry_m3` and `accept_m6`, `out\profile-layout.md`, and
  the stock measurements.
- **The defect.** After an AF-ON session, the first normal edit (`n1-dial`, `n1-ok`) wrote
  `0x5962[1]=994` and `0x88b2[0]=994`. K1 and K2 wrote 526.

## 2. Work (in this order)

1. **Locate the leaking state** (observation only, no behaviour change beyond the accepted T3l hook).
   - Reproduce the defect in the smallest sequence possible: AF-ON entry, one move, exit, normal entry, dial.
   - Trace every read on the normal-entry path that feeds the position written at `n1-dial`: the getters
     called, with their callers and returned values; RAM loads; and the editor object's fields.
   - Compare those reads with K2 at the same step. Find the first value that differs and where it lives: a
     cell such as `0x88b2` or `0x5962` at an index the hook does not route, an editor object field, or a
     cached copy.
   - Report the address, its writer during the AF-ON session, and why the exit restore misses it.
2. **Restore it (one change).** Extend the exit restore so the leaking state returns to its half-press value on
   every exit, or stop the AF-ON session from writing it.
   - Show that the minimal sequence from item 1 now matches K1 and K2 at every key.
   - Show that the AF-ON edit itself still lands only in the mirror.
3. **A shared acceptance harness.** Write `accept_lib.mjs`, a small module that T6 can also import, with these
   functions:
   - **`waitTitle(hash, timeoutMs)`.** Wait for the title-band hash before asserting it. Fail on timeout and
     record the last hash seen.
   - **`nativeSave()`.** Make the stock settings store dirty the way T5's menu commit does. Then assert both
     that the store log contains an M **and** an E save, and that the save callback reported status 0.
     Afterwards read the persisted cells back from the store file.
   - **`compareStores(a, b)`.** Compare the M and E banks byte by byte, and report every differing offset with
     both values.
   - **`assertCells(expected)`.** Assert the exact expected and actual value of every listed cell, every mirror
     field, the zone byte and the flag.
   - **K2 matching.** K2 must run the same half-press key sequence and the same menu exits as the candidate.
     Before any candidate comparison, show that K1 and K2 stores match each other, or explain every byte that
     differs.
4. **Acceptance (only after items 1–3).** Use a table-driven runner built on `accept_lib.mjs`, with two fresh
   candidates, K1 and K2. After every individual key, assert the visual identity, every mirror field, the zone
   byte, the flag and every half-press cell.
   - **Sequence:** entry with initialization; move; type change; C1; C2 with C1 kept; the OK, MENU and S1
     exits, each followed by a normal edit.
   - **Then:** `nativeSave()` after the edits, followed by a new session on that store.
   - **On reopen, assert:** the mirror is back at the image `FF` values and the zone byte is 0; the next entry
     initializes.
   - **Finally:** `compareStores` against K2. The run must end `ok:true`.

## 3. Deliverables (under `work\`)

- `result.md` (template, with "Owner decision Q5" kept current)
- `evidence-manifest.json` and the sealed supplement
- `out\leak.md` (item 1)
- `out\design.md`
- `out\profile-layout.md`
- `scripts\accept_lib.mjs`, documented in `out\accept-lib.md`
- `out\overlay-changed-bytes.csv`, with the section column
- `out\cmd\`
- the scripts, tables, JSONL and screenshots

## 4. Out of scope

- The playback and session-end exits, and orientations. These come after acceptance, in a later task.
- The button target (T6).
- Storage (Q7), display, packaging and hardware.
