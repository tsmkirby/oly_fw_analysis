# T8 decision (Opus)

**Verdict: CLOSED as PARTIAL.** Continued as T8b with an amended save criterion and a generated step table.
Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-122049` | `run-20261119-131023-review` | REJECT: six versions stopped in K1, each on one guessed control literal. This was a coordinator brief flaw: controls were asserted against values nobody had measured |
| `run-20261119-132229` (correction) | `run-20261119-141248-review` | REJECT: the reference run ended `ok:false` on the fresh-E check; no candidate ran; the table checker was incomplete; version accounting was unsupported |

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **Static integration.** The T6 and T3m overlays differ only in the 15 profile-read bytes. Sections are
  computed from the image: 1,308 / 95 / 1,856 / 3 rows, with only `0x610bf5e3`–`0x610bf5e5` in section 7.
- **The controls run through save and reopen** (t8r5).
  - K1 stock: the target is `0e 02 02 00 1b 00 27 00 00 00` on all 12 edges, and owner, status and enabled
    read 255.
  - K2 on the combined overlay, flag off: the mirror is `FF`, zone 0, status 0, enabled 1.
- **Save navigation.** Twenty Left presses from the reopened menu reach the AF tab (title `2.AF`). Its identity
  is asserted, and the AF Target Mode row is asserted before the commit.
- **Save timing (new; this qualifies T6).**
  - The E save and the unposted M save from `0x6006124a` happen **at session open**, before bring-up.
  - The AF Target Mode commit adds **only a posted M** from `0x60061268`: status 0, 262,144 bytes, with its
    image captured. It adds no E.
  - T6's `save_v3` judged the whole log, so its "E and M at status 0" included the session-open pair.
  - T6's store equality against K2 is unaffected.

## Coordinator decision on the save criterion

The "fresh E after the commit" requirement (T8 §2.2) was based on misreading T6's witness. The firmware does
not rewrite E on this commit. Demanding it would need a behaviour change. From T8b the save criterion is:
- a fresh **posted M** after the recorded baseline, with a captured image and its own status-0 completion;
- **no new E** in any role, asserted equally for K2 and the candidates;
- the decoded E bank byte-identical to K2's.

This corrects the test, not the functional requirement.

## Not established (carried to T8b)

- A complete per-key step table, with matched exits and every field.
- Both candidates.
- Every acceptance item.
- Both reopens, with re-initialization.
- Store equality with K2.
- `ok:true`.
- **The 65 K1-to-K2 store differences.** K1 cannot commit AF Target Mode, because stock has no such row. The
  candidates are therefore compared with K2, the matched control. K1 is a behavioural reference only.

## Status

`CLOSED-PARTIAL`. The run's evidence stays in `tasks\T8-afon-integrated-acceptance\run-20261119-132229\`, and
`work\out\reference-v1.json` is a reference.
