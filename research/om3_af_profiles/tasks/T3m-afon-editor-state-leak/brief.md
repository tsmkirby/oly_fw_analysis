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

## 5. Correction round (Opus, after Sol's review `run-20261119-111407-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely.
Do **not** start over.

**Confirmed, reuse unchanged:**
- the reproduction of the leak (`leak_p1`);
- the three leaking copies:
  - `0x62953c10`, written by `0x60063519`;
  - `0x60379d64`, written by `0x6119af20` from object +`0x42`;
  - the object halfword `0x62473182`;
- the p3 exit restore of those copies (`leak_p3`, `ok:true`);
- K1 and K2 matching each other, with stores equal;
- c1's per-key parity with K2 for the normal edits.

**Sol explained M+2.** It is the M-bank checksum word. It compensates for the eight payload bytes (+78 and −78),
and the bank's 16-bit word sum is zero. It disappears once the eight bytes do.

Save everything new under a **new, unique name** (`-v1` onward). Never overwrite a file a run used or wrote,
including import inventories: one inventory per version.

**Authorization: six new experiment versions,** spent in the order below. When they run out, stop and report.

1. **Find the persistence route for the AF-ON custom sizes (observation, one version).**
   - c1 saved the mirror's C1 and C2 values into M at +211472…+211484 (`0x1dd1[2..5]`) and +211504…+211516
     (`0x1de1[0..3]`). The live half-press cells stayed at K2's values.
   - Find the RAM the save serialises those offsets from. Watch every write to it during the AF-ON C1 and C2
     edits and their exits, recording the writer PC, the caller and the value in **chronological order, with no
     aggregation**.
   - State why the T3l hook's routing misses that write. Is it a second record, the AF Target Mode Settings
     editor's own commit, or a read through the redirected getter at save time?
   - Record matched K2 reads and writes at the same steps, in chronological order, so a "first difference" claim
     is exhaustive over the watched set. Otherwise, qualify it.
2. **Fix it (one change on top of p3).** Either route that write into the mirror, or restore the persisted
   record on AF-ON exit. The AF-ON custom sizes must stay in the mirror, and the half-press settings record must
   end byte-identical to K2's.
   - Show it on the shortest sequence that reproduces the defect: AF-ON entry, C1 edit, C2 edit, exit, save.
   - In that sequence, `compareStores(K2, candidate)` has zero differing offsets, and the mirror still holds C1
     and C2.
3. **Save verification, done properly.** Use the save procedure Sol accepted in T6:
   `ref\analysis\button-af\readiness\t6-afon-target-size-position\scripts\save_v3.mjs` and its table
   `out\save-table-v3.json`.
   - The final save must be **caused by the final call**. Record the store log and callback count before the
     call, and require a new E and a new M after it, each with a captured image and completion status 0,
     including the posted M callback.
   - Earlier session saves and unrelated callbacks must not satisfy the check.
   - Then assert the persisted cells against **explicit post-edit expectations**: half-press cells equal K2;
     mirror cells not persisted.
4. **Acceptance (new runner, on a new `accept_lib` version).** The sequence from §2.4, with two fresh
   candidates, K1 and K2.
   - Use a complete step table. **After every individual key**, assert explicit expected and actual values for:
     - the visual identity (title hash, via `waitTitle`);
     - every mirror field;
     - the zone byte;
     - the flag;
     - every half-press cell.
   - Never derive an expectation from the candidate's own observation. A missing control reference is a
     failure, not a skip.
   - Then:
     1. the save from item 3;
     2. a new session on that store;
     3. on reopen: the mirror is at image `FF`, the zone byte is 0, and the next entry initializes;
     4. `compareStores` of both candidates against K2, with zero differences and no truncation of the
        difference list.
   - The run must end `ok:true`.
5. **Records and wording.**
   - Seal command 23 and the final commands in a supplement.
   - Inventory the consumed stock measurements individually.
   - Compute each overlay row's section from the image, not from the CSV column (the section-7 label currently
     becomes `NaN`).
   - Correct the `DisasmLeak.java` range units: they are instruction counts, not bytes.
   - Qualify the "first differing read" claim (6.2) and the writer completeness (6.3).
   - Remove the unrestricted "values stayed in RAM" wording.
   - Refresh the manifest last.
