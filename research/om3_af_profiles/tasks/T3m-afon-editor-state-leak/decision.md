# T3m decision (Opus)

**Verdict: CLOSED as PARTIAL.** Both restores are accepted. Save verification and full acceptance carry to T8.
Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-095919` | `run-20261119-111407-review` | REJECT: leak located and fixed (p3); c1's saved M carried the mirror's C1/C2 custom sizes (8 bytes plus the checksum word); c2 and the reopen not run |
| `run-20261119-112342` (correction, 6 versions) | `run-20261119-121201-review` | REJECT: custom-size restore confirmed (zero store differences); save witness and acceptance failed on harness defects; records incomplete |

That was the single correction round, so T3m is closed.

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **Position leak, p3 exit restore** (`leak_p3.mjs`).
  - After an AF-ON move to 994, three copies kept the AF-ON position:
    - the shadow `0x62953c10`, written by `0x60063519`;
    - the global record `0x60379d64`, written by `0x6119af20` from object +`0x42`;
    - the editor object halfword `0x62473182` (object `0x62473140` + `0x42`).
  - On exit, the restore writes back the entry snapshot of the first two and the half-press position into the
    third.
  - The next normal edit then matches K1 and K2 (526), and the AF-ON edit stays in the mirror.
  - The "first difference" claim is limited to the watched reads.
- **Custom-size persistence, record restore** (`fix_v1.mjs`, one change on top of p3).
  - The stock size editor's OK commit writes the custom-size words straight into a settings-bank record at
    `0x62954108`: ten words for `0x1dd1`, then eight for `0x1de1`. The writers are `0x60063519` and alias
    `0x6006351b`.
  - That happens before the routed setter `0x60063431` runs. The live packed cells therefore stay unchanged,
    while the saved M bank carries the AF-ON values.
  - The fix snapshots those 72 bytes on AF-ON entry and writes them back to the address and its alias on every
    exit.
  - Sol decoded both banks: **zero differing offsets** against K2. C1 and C2 stay in the mirror, and the live
    custom-size cells are unchanged.
- **M+2** is the M-bank checksum word. It compensates for any payload change, and the bank's 16-bit word sum
  is zero.
- **Overlay sections**, computed from the image section table at `0x60029b28`: 1,308 rows in section 1, 95 in
  section 2, 1,856 in section 4 and 3 in section 7. Only `0x610bf5e3`–`0x610bf5e5` fall in sections 6 or 7.
- **Subject Detect.** `0x1e71[0]=0` is read back. No visible menu entry was added, and Q5 is unchanged.

## Coordinator corrections to the record

1. **Event attribution.** The custom-size word writes labelled `c1-sub` and `c2-sub` happen during the
   following **OK commits**, not during the sub-dials. The runner advances `currentStep` after the key runs.
   The snapshots agree: the words are unchanged at `c1-sub` and change at `c1-ok`.
2. **Serialization source.** The trace recorded no NAND events. That `0x62954108` is the RAM the save
   serializes is strongly supported by the addresses and by the restore's effect, but it was not captured
   directly.
3. **Focused-run save.** In `fix_v1`, the final menu call added no save. The count was 3 both before and
   after. The zero-difference store comes from saves earlier in the session.
4. **CSV format.** `overlay-changed-bytes-sections.csv` has two `section` headers. The section values themselves
   were confirmed.
5. **Records.** Command 42 is not in the task manifest, although the coordinator's audit hashes it. The
   `leak_p2` and `leak_p3` import inventories collide on one path, and that cannot be recovered.

## Not established (carried to T8)

- **A save caused by the final call.** The T6 key table, replayed inside an editor session, reached Wireless
  Shutter, and later Priority, because the menu reopens on the last-used tab.
- **Full acceptance.**
  - a complete, independently expected step table;
  - both candidates;
  - a reopen for each candidate, with next-entry initialization;
  - store equality with K2;
  - `ok:true`.
- **Exits not yet covered:** playback, session end, and other exit paths, plus orientations in the editor.

## Status

`CLOSED-PARTIAL`. Evidence is promoted to `analysis\button-af\readiness\t3m-afon-editor-state-leak\`.
