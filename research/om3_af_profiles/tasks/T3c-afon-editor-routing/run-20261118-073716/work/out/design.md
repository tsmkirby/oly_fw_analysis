# Phase B design

R1 is BLOCKED. The four Phase B trials and correction experiment E1 did not open a chooser from a row whose provider id is `0x3D6F`. Acceptance was not run. E2 was not run, because E1 did not open a chooser.

## Phase B trials

Each trial kept T3a's overlay, the page-27 redirects, the EMULATOR-ONLY value hooks, and the EMULATOR-ONLY descriptor link. The link resolves: `FUN_604058bc(0x3D6F)` returns the id in D0 and `0x6031e9a0` in A0 (`work/out/link-diag-a9.jsonl`). The extra bytes below were runtime writes. They are not in the overlay CSV.

| Trial | Change | Result |
| --- | --- | --- |
| v1 | Row kind at `0x6031e97c` set from 4 to 12 | Page stays. Setter not called. Profile stays 0. |
| v2 | Kind 12, and the alternate pointer and count at `0x6031e994` cleared | Page stays. |
| v3 | Kind 12, alternate cleared, option count at `0x6031e988` forced to 2 | Page stays. |
| v4 | Kind 12, alternate cleared, descriptor at `0x6031e9a0` given UI 2154's template pointer `0x606190b7` | Page stays. |

v2's writer stored its screens under the v1 names. Those two files hold the v2 frames. Copies are `work/out/proto-r1-v2-page.png` and `work/out/proto-r1-v2-open.png`.

## Correction experiments

Each one changes one thing against the stated baseline. The decision value is D0 at `FUN_6124f6c7` `0x6124f7d4` for key `0x900C`. D2 is 0 throughout.

| Experiment | Baseline | The one change | OK result |
| --- | --- | --- | --- |
| E1 | T3a row, provider ids `2154, 2155, 0x3D6F` | Third row becomes 2154's 36 bytes with the id left at `0x3D6F` | Chooser does not open. D0 stays 1. Profile stays 0. `0x90a1` stays `[1, 1]`. `work/out/exp-e1-c1.jsonl` |
| E2 | — | Not run. E1 did not open a chooser, so a text zone list was not built. | — |
| E3 | T3a row and the same provider ids | Third row becomes all 36 bytes of 2154, id included. Provider list unchanged. | The page draws two rows. OK returns D0 1. No chooser. `work/out/exp-e3-c1.jsonl` |
| E4 | E3's exact row copy | Provider list's third id changes from `0x3D6F` to 2154 | Three rows. OK opens 2154's two-option chooser. D0 is 4. No setter call. `0x90a1` stays `[1, 1]`. `work/out/exp-e4-c1.jsonl` |

E4's chooser is the stock priority chooser. It stores through setting 2154, not through `0x3D6F`. Menu was pressed to leave it. Confirm was not sent.

## What these trials show

Row kind, a null alternate, an option count of 2, and a copied descriptor template do not select the chooser while the provider id stays `0x3D6F`. Copying 2154's row bytes except the id does not either (E1). The provider id has to name 2154 before a duplicate of that row is drawn and before D0 becomes 4 (E3 against E4).

`FUN_60419446(2154)` returns `0x90A1`. `FUN_60419446(0x3D6F)` returns 0 before the EMULATOR-ONLY hook replaces it with `0xA70F`. The stock setter calls `FUN_60063431` only when that mapped value is non-zero. `0x3D6F` has a descriptor only because the session links one.

## Withdrawn proposal

`FUN_611c7894` is a 26-byte copy of bytes into halfwords. It is not an editor, and a hook that sends kind 12 into it is not a proposal for opening the chooser.

## Qualified proposal

R1 needs `FUN_6119a2be` to return 4 for `0x3D6F`, so that `FUN_6124f6c7` returns 3 and `FUN_61283b1c` calls `FUN_6127e750`. E4 shows that this already happens for provider id 2154. It does not show which field of `0x3D6F`'s missing registration (mapped key, descriptor template, or count) the chain reads. No hook that forces the return value was run. Until one is, R1 stays BLOCKED.
