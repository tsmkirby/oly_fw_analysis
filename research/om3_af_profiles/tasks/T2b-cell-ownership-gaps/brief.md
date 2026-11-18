# T2b: Close the open ownership items for key `0x5b82`

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu · Runs concurrently with T3a (separate workspace)

## 0. Rules that override everything below

- Disposable execution workspace (`TASK.md`). Write **only** under `work\`.
- `ref\` (research) is read-only. Ghidra only through `tools\bin\run-ghidra.cmd`. Node as `node26`.
  Do not modify OM-Emu source. Set `OM_EMU_NVRAM` to a file under `work\out\` for persistence
  runs (one per run); never the default store.
- Keep every probe version: never overwrite a script you have run.
- Log every command with its **completed** output and exit code as it finishes.
- Call tools by name; do not start a command with a parenthesis. No network, no Git, no ACL or
  permission commands, no installs, no firmware image. No hardware recommendation.

## 1. Objective

T2 left `0x5b82` UNRESOLVED. Sol's review of T2's correction round
(`ref\tasks\T2-cell-ownership\run-20261117-224756-review\review.md`) names exactly what is
missing. Close those items, and **only** those, then give the final classification for
`0x5b82`: OWNABLE for normal use, with the reset/default behaviour stated; NOT OWNABLE; or
UNRESOLVED, with the residual list. Do not redo work that T2 or Sol already confirmed.

## 2. Read first

- Sol's two T2 reviews: `ref\tasks\T2-cell-ownership\run-20261117-220006-review\review.md` and
  `run-20261117-224756-review\review.md`.
- T2's final outputs: `ref\tasks\T2-cell-ownership\run-20261117-220544\work\`, especially
  `result.md`, `out\verdict-v2.md`, `out\candidates-5b82.tsv`, `out\uses-5b82.tsv`,
  `out\listings-5b82-v2.txt` and `out\c1-cycle-v21.txt`, plus the scripts in `scripts\`.
  Reuse them; copy any script you need into `work\scripts\` under a new name.
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §8 (settings mechanics).

## 3. Already established (do not redo)

These are confirmed by Sol:
- Registration at `0x600e5874`, and UI-map indices 5/12/13 only.
- The mapped setter `0x6041937f` writes the map's index.
- A completed Custom Mode Assign/Recall plus save cycle left the unnamed cells untouched (C1
  does not store this key).
- The whole-key default path (`0x604193ca → 0x60063962 → 0x6006398b`) writes ROM zeros. Its only
  caller `0x618cfda1` passes other constants.
- The bank-7 invalid-area rebuild writes zeros.
- The 18-byte CRC layout fits in 26 bytes, and zero decodes as "no profile".

## 4. Items to close (Sol's required corrections)

1. **Candidate dispositions.** Every row of `candidates-5b82.tsv` with a *provisional* exclusion
   needs concrete evidence: the data use (which table or structure, with its bounds) or the
   control flow (why the bytes are not executed as a key operand). Otherwise mark it UNRESOLVED
   explicitly. Write `out\candidates-5b82-v3.tsv`.
2. **The two parameter-key routes**, each with a bounded listing and a caller/source/bounds
   analysis:
   - `0x6183dcee` (load at `0x6183e9b5`): which record supplies the key, where those records live
     (ROM table or runtime), and can any record name `0x5b82`?
   - `0x6183cc7d` → `0x60063567` (span copier): every caller of `0x6183cc7d`, the key each passes,
     and whether a runtime-derived key can be `0x5b82`.

   Also cover the transaction replay `0x600630a3`: what fills its queue, and whether any filler
   can queue `0x5b82` with an unnamed index, a span, or a type-4 whole-key default.
3. **Debug-table dispatchers.** Trace both dispatchers that read the handler slots `0x602ec448`
   and `0x602eda1c` (find the code that indexes those tables, not just pointers to the slots).
   Classify each entry path (debug console only, or reachable in normal operation).
4. **Cursor pages.** Correct the earlier claim: the twelve samples all showed the same C1 list.
   Then either reach the Toy Photo / Vintage / Partial Color type-3 cursor editing UI in OM-Emu
   (with native keys) and change each cursor (2017, 2031, 2034), reading back all 16 cells in two
   fresh marked sessions plus a control; or keep these steps as BOUNDARY with the reason. Log a
   known C1-managed setting alongside, as evidence that each operation completed.
5. **Records.** Make the manifest, use classifications and completion claims consistent. Add a
   versioned artifact index (`out\INDEX.md`) naming the current verdict and tables.

## 5. Deliverables (under `work\`)

`result.md`, `evidence-manifest.json`, `out\INDEX.md`, `out\verdict-v3.md`,
`out\candidates-5b82-v3.tsv`, `out\uses-5b82-v3.tsv`, the listings, and the dynamic JSONL plus
NVRAM files.

## 6. Acceptance

- **OWNABLE for normal use** requires:
  - no UNRESOLVED candidate or route that could write a non-zero value into an unnamed cell
    during normal operation;
  - every path that can write the unnamed cells classified (expected: default/reset paths that
    write zeros, which decode as "no profile").
- Otherwise the verdict is UNRESOLVED or NOT OWNABLE, with the specific path.
- Every claim cites bytes or listings that can be rechecked against
  `inputs\00_0100_50000020.decoded.bin` (offset = address − `0x60021020`).
