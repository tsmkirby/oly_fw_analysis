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

## 7. Correction round (Opus, after Sol's review `run-20261118-052742-review`: REJECT)

Your previous work is in `work\`. Sol's full review is `audit\previous-review.md`. Do **not**
start over. Keep every earlier script and output. Save new versions under new names (`-v4`).
The verdict stays **UNRESOLVED** unless item 1 closes every open setter source.

1. **The open setter sources (the substantive item).** For each one-cell setter still open, trace the key
   and index back to their origin, with a bounded listing for every step. Do this for
   `FUN_60196ee3` (`0x60196f73`), the sibling calls in `FUN_601971f5` and `FUN_601972f1`,
   `FUN_601eff7a` (`0x601effc8`) and `FUN_6041ab1d` (`0x6041ab71`).
   - Where the key comes from a table, give the table's address and bounds, and dump every entry's
     key and index. State whether `0x5b82` appears, and with which index.
   - Where it comes from the caller, follow every caller.
   - Classify each setter: *cannot name 0x5b82*, *names 0x5b82 index N only* (and is N named or
     unnamed?), or UNRESOLVED (with the exact gap).
2. **Correct the `0x607135ad` lineage.** Sol shows that A2 receives `0xfa64` at `0x607135ef` and that
   A3 is copied from A2 at `0x6071365d`. Verify this from the listing. Remove the group from the
   blocker list if it holds, and update the result, the verdict and `uses-5b82-v4.tsv`.
3. **Candidate dispositions.** In `candidates-5b82-v4.tsv`, fix every row whose exclusion rests
   on "first use", "unaligned data byte" or "no function coverage":
   - extend the trace until the value is consumed in a way that cannot become key `0x5b82`, or
     give the concrete structure and its bounds;
   - otherwise mark the row UNRESOLVED.

   Sol named `0x6128c262` (`add D2,D3`), `0x608f8614` (stack store), `0x60539e07`, `0x607c8e19`
   and `0x607e2ef9`. Check all 29 `mov 0x5b8` rows under the same standard, and replace the
   blanket PASS with a per-row status.
4. **Route and replay wording.** Keep the parameter routes and debug dispatchers as classified.
   Do not describe replay-source closure as complete while any setter feeding the wrappers is
   still open.
5. **Records.**
   - Record the actual stdout, stderr and exit code of every command, including the manifest script.
     Do not describe intended behaviour in place of output.
   - Refresh `out\INDEX.md` (`verdict-v4.md`).
   - Refresh the manifest last, then log its own run.

Cursor pages stay BOUNDARY; do not spend this round on them. No OM-Emu sessions are needed.
