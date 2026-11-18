# T3c decision (Opus)

**Verdict: CLOSED as BLOCKED. Findings accepted with Sol's qualifications. Continued by T3d.**
Date: 2026-11-18.

## Runs

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-063313` | Pages 28/29 dead; four prototypes failed; hook at `FUN_611c7894` proposed | `run-20261118-073208-review`: **REJECT** (decision point not found; `FUN_611c7894` is a buffer copy; missing records) |
| `run-20261118-073716` (correction) | Dispatch branch found; E1 fails, E4 opens the chooser | `run-20261118-080617-review`: **REJECT** (wording: "first divergence" overstated; incomplete immediate snapshots; one erratum wrong). Substance confirmed. |

## Accepted (confirmed by Sol), with Sol's corrections applied here

- **Stock chooser path.** OK on 2154, 2155 and C-AF Area opens the chooser through
  `FUN_610cdebf` → `FUN_610cdf05` → `FUN_610e2536`. OK on `0x3D6F` does not enter that path.
- **Dispatch branch.** The first *measured distinguishing dispatch branch* is in `FUN_6124f6c7`, at `0x6124f7d4`
  (`cmp 1,D0`) and `0x6124f7d8` (`cmp 0,D2`), on key `0x900C`. The listing bytes match the image.
  - D0/D2 values: 2154, 2155 and C-AF Area give 4/0; `0x3D6F` gives 1/0; E1 gives 1/0; E4 gives 4/0.
  - D0 comes from `FUN_6119a2be` → `FUN_61203082` → `FUN_6120308d`.
  - The return already differs at `0x6124f7c0`. **The decision inside that callee chain is unresolved.**
- **E1: row data is not the cause.** E1 is the byte-exact stock row 2154 with only the ID changed to `0x3D6F`.
  It opens no chooser, makes no setter or store call, the profile byte stays 0 and `0x90a1` stays `[1,1]`.
- **E3 is not a test of a rendered duplicate.** E3 put an exact copy of the stock row in place, while the
  provider ID list still read `0x3D6F`. The third slot was blank, and OK on that blank slot did nothing.
- **E4: the provider ID decides.** E4 differs from E3 only in the provider ID (`0x3D6F` → 2154). Three rows
  draw, and the stock 2154 chooser opens from the third slot. This was not a `0x3D6F` editor, and nothing
  was committed.
- **Mapped keys and descriptors.** The mapped getter returns `0x90A1` for 2154 and 0 for `0x3D6F`. The
  descriptors differ: 2154 uses template `0x606190b7` with count 2; the linked `0x3D6F` descriptor uses
  template `0x606178b1` with count 10.
- **`FUN_611c7894`** is a byte-to-halfword copy, not an editor.
- **Pages 28 and 29.** Bounded searches found no native route to either page. With reference construction,
  OK opens no editor there, and the endpoint readbacks change only the known `0x1dd1[0,1]` menu-entry
  pair. That does not exclude transient writes.
- **Leading hypothesis (not yet proven).** The viewer opens an editor only for a UI ID that resolves to
  a **registered settings key**. A RAM-only value behind an unmapped ID is not enough for a native row.

## Gaps (Sol)

- The immediate pre-OK and post-OK snapshots are incomplete, and they were not reconstructed.
- The direct-call search in `static_rows_c1.py` compares component-relative and absolute addresses, so
  its `call_count=0` is unreliable.
- The `trace-kind-a3.jsonl` erratum is wrong: its lines are labelled `observe`, but the session had the
  behaviour-changing baseline installed.

## Next

**T3d** tests the registered-key hypothesis directly. In an EMULATOR-ONLY experiment, `0x3D6F` resolves to a
registered key cell, and T3d checks whether the native chooser then opens and commits. It also locates the
callee decision. This is an offline prototype only. It does not decide storage (Q7).
