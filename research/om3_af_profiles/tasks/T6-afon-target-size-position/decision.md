# T6 decision (Opus)

**Verdict: CLOSED as PARTIAL.** Every functional result Sol confirmed is accepted. The remaining
evidence-contract items carry into the final combined acceptance (T8). Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-083228` | `run-20261119-095259-review` (the first attempt, `092803`, hit the Codex usage limit) | REJECT: acceptance had no M/E save and no reopen; the size source was not distinguished; unconditional checks; manifest unsealed |
| `run-20261119-095919` (correction, 5 of 6 versions used) | `run-20261119-110745-review` | REJECT: one leftover `check(..., [], ...)`, K1 status readbacks and reopened focus not compared, the half-press size source misattributed, manifest coverage of command 30 and the seal |

That was the single correction round, so T6 is closed. Sol found the remaining gaps to be about evidence and
wording, not function. Every substantive behaviour below was independently confirmed.

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **Profile read.** One 15-byte change on Z5, at the home builder's swap window `0x60a8f708` (all section 4,
  source `profile-read`). When AF-ON owns the target, the zone type, size, position and custom dimensions come
  from the 55-byte mirror at `0xa031eeb0`, at the bank the pose and Orientation Linked select. Unrelated
  getter callers pass through, and the half-press record stays as stock builds it.
- **Overlay.** 3,262 rows: section 1 = 1,308, section 2 = 95, section 4 = 1,856, section 7 = 3. The only
  section-7 bytes are the amended `0x610bf5e3`–`0x610bf5e5`, and none are in section 6. Sol reconstructed this
  independently.
- **Q1.** Small `11 02 03 00 01 00 01 00 00 00` on the five AF-ON-owned edges (2, 5, 8, 9, 10). All
  `0e 02 02 00 01 00 01 00 00 00` is restored on the other seven.
- **Q2.** C1 with mirror dimensions `[5,7]` gives `11 02 07 00 05 00 07 00 00 00`. The half-press C1 stays at 3.
- **Q3.** With Orientation Linked on, pose words 1, 2 and 4 select banks 1, 5 and 3 (Small 529, Single 532,
  Cross 535). With it off, all poses use bank 1. The controls were reduced: K2 ran two edges per pose, and K1 ran
  landscape only.
- **Q4.** In C-AF, the Q1 record is unchanged on the AF-ON-owned edges.
- **Size, distinguishing.** Mirror `0x9a41[0]`=4, against `0xdfa1`=0 and live `0x9a41[0]`=0. The AF-ON press
  gives size byte 4. Shutter and release keep size 0.
- **Save.** It reproduces T5's procedure (menu commit, then menu exit). E and M are witnessed with status 0,
  including the posted M callback. The persisted cells are read back.
- **Acceptance (`accept_v1`, `ok:true`).** Two fresh candidates, plus K2 matched on 45 menu records and both
  12-edge sequences, and K1. The sequence is profile A, the EXIF-6 pose change, profile B, the save, then
  reopen. On reopen:
  - the mirror is 55 `FF` bytes and the zone byte is 0;
  - the AF-ON press gives All, owner 2, and the release gives the stock half-press record
    `0e 02 03 00 03 00 03 00 00 00`, owner 0;
  - Sol decoded M and E for both candidates and found **zero differing offsets** against K2.
- **Subject Detect.** `0x1e71[0]=0` is read back, and the stock screen places Off beside Subject Detection.

## Coordinator corrections to the record

These override the wording in `result.md`. The executed scripts and logs are kept unchanged.

1. **Half-press size source.** The half-press record's size comes from **live `0x9a41[0]`**, read by the stock
   writer `0x609b3c79` (T7; `0x609b3c7a` loads `0x9a41`). It does not come from legacy `0xdfa1`. The numeric
   result stands: AF-ON size 4, half-press size 0. The two candidate half-press sources were both 0, so this
   trial does not distinguish them. The source is established statically.
2. **Review-brief digest.** The manifest's `inputs[150]` (`4636e428…`, 2,158 bytes) is the round-1 review brief,
   preserved as `review-brief-initial.md` with that exact hash. The current `review-brief.md` (`04160c4c…`,
   1,827 bytes) is the correction-round review brief, written by the coordinator before launch. The persistent
   workspace kept the round-1 copy.
3. **Command 30 and the seal.** These sit outside the submitted manifest. The coordinator's isolation audit
   (`run-20261119-095919\audit\`) hashes them independently. That preserves their integrity, but the submitted
   manifest is still incomplete as delivered.
4. **"Only copied."** The maker scripts in result §3 transform runner text, so "only copied" is incomplete.

## Not established (carried to T8)

- The full assertion contract on a single runner:
  - explicit comparisons in place of the leftover empty-problem setup check (`accept_v1.mjs:431`);
  - K1 status readbacks;
  - comparison of the reopened focus values;
  - half-press cell snapshots on the reopened edges.
- The size `FF` fallback against a non-zero legacy size.
- C2–C4, mixed link flags, and custom dimensions in more than one bank.
- Matched Q2 navigation, and Q3 controls on the full edge list.
- **Persistence.** The profile does not survive a reopen. The mirror returns to `FF`, so the press falls back
  to All. This is a consequence of the open storage decision (Q7), not a defect.
- A pose publish can rewrite the live half-press `0x84d1` and `0x1dd1`. This was observed but not explained.

## Status

`CLOSED-PARTIAL`. Evidence is promoted to `analysis\button-af\readiness\t6-afon-target-size-position\`.
