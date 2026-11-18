# T3h decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS (applied here). Acceptance is still PARTIAL.** Date: 2026-11-18.

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-113413` | Face source traced; ten zone faces render; full acceptance passed | `run-20261118-122604-review`: **ACCEPT-WITH-CORRECTIONS**. Acceptance overstated; four items outstanding. |

## Accepted findings (confirmed by Sol)

- **Where the chooser's faces come from.** `FUN_611c7785` is called at `0x611f83aa`. It reads the face list
  from `*(object+0xdb8)`: record+8 is the count, record+`0xc` the face list, record+`0x10` the help list.
  `FUN_611f7f01` selects that record from the **face table** at `0x6037bedc`, which holds 96 records with
  a stride of `0x24`. The key it searches for is the halfword copied from binding-record +`0x10`.
- **Why the priority labels appeared.** Editor `0x1e3` (2154) uses face key `0x2d`, which is record 76 at
  `0x6037c98c`: count 2, faces `0x61575880` (kind 4, IDs `0x124f` and `0x127b`), help `0x61576520`. Every
  one of the 96 keys is used by some binding.
- **The ten zone faces now render.** A private copy of record 76 for `0x3D6F` (count 10, faces
  `0x6158ba1c`, at `0x6031ea48`, EMULATOR-ONLY) shows All, Single, Small, Cross, Mid, Large, C1, C2, C3 and
  C4. Stock 2154's chooser is unchanged. This is the first time the AF-ON row shows the zone options.
- **Commit and cancel.** Cancel leaves the RAM profile byte at 0. Confirm stores the table value (3; and 2,
  then 5).
- **Comparison with the stock control.** Every shared cell matches, including the getter values (0) of
  `*_ORIGINALLY` IDs 2274–2279. After a native save, the M and E stores are byte-identical, and a new
  session reads the profile as 0.

## Outstanding (Sol)

1. **Assertions are incomplete.** Not every navigation step is asserted, and the commit checks test
   "different", not the exact values 2 and 5.
2. **Wrong row label.** The row still shows the copied half-press glyph (from the T3c E1 row clone), not
   its label.
3. **Page 28 was not rendered.** It has no native route, so it needs a reference-construction render in
   both the candidate and the control, or an explicit resolution.
4. **Crash and help list.** Cancelling from C4 (nine Rights, then Menu) crashed with an access violation.
   The private record's count of 10 also makes the help reader scan past the two-record help list, and the
   help text shown is stale. A properly sized zone-help source is needed. The crash cause is not yet
   isolated.

## Record defects

- The manifest omits the imported helpers and several research inputs (their execution-time hashes exist
  in JSONL).
- `design.md` wrongly says `0x60320000` is outside the loaded image. Its native placement is still
  unresolved.

## Next

T3i closes the four items above. Packaging (T4) follows.
