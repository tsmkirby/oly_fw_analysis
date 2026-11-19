# T3l decision (Opus)

**Verdict: CLOSED as PARTIAL.** Accepted components carry into T3m. Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-072701` | `run-20261119-081955-review` | REJECT: initialization and acceptance not run; entry recopied the half-press values over the mirror |
| `run-20261119-083228` (correction, 6 versions) | `run-20261119-092300-review` | REJECT: acceptance `ok:false`; **position leak in the normal edit after an AF-ON session**; records incomplete |

That was the single correction round, so T3l is closed.

## Accepted (confirmed by Sol)

- **Exit hook.** OK, MENU, S1 and playback clear both flag aliases and restore both zone-byte aliases to
  the entry snapshot, including a non-zero snapshot (zone `4 → 1 → 4`).
- **Entry.** Entry copies nothing into the mirror. `initMirror()` writes only `FF` bytes and `FFFF` words,
  and sets them to the descriptor defaults (all zero; the second `0x9a41` byte is an implementation choice).
  Mixed mirrors keep their values. C1 is retained through a C2 edit. Values survive a normal edit and a
  re-entry. The Single title draws (`entry_m3`, `ok:true`).
- **Custom sizes in AF-ON mode.** C1 writes `[1,33]` and `[5,8]` and sets `0x1df1[4]=1`. C2 adds its own
  values. All nine bytes of half-press `0x1df1` stay unchanged.
- **Subject Detect (erratum applied).** `0x1e71[0]=0` is read back. The stock screen shows "Subject
  Detection — Off", and nothing was set.

## Defect found (carried to T3m)

- **The normal edit after an AF-ON session leaks position.** In `accept_m6`, the candidate's first normal
  edit after leaving AF-ON mode produced `0x5962[1]=994` and `0x88b2[0]=994` at `n1-dial` and `n1-ok`.
  K1 and K2 both show 526.
- The earlier parity (`exit_l4`) only held because entry copied the half-press values into the mirror, so
  the two sides were always equal.
- Some editor state outside the zone byte carries the AF-ON position into the next normal session. The
  restore on exit is therefore incomplete.

## Not established

- Acceptance: two candidates, a completed save, reopen, a store equal to K2's, and `ok:true`. Sol also
  found 65 differing M bytes between K1 and K2 in these sessions, so the controls were not matched either.
- Playback's following edit, the session-end flag reading, and orientations.
- The save-completion assertion. `menu.mjs:879–880` appends the save record before calling back with
  status 0, so a save-log entry alone does not prove completion.
