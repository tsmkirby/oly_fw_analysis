# Phase B design

R1 was prototyped four times. None opened a chooser from the `0x3D6F` row, so R1 is BLOCKED. Acceptance was not run.

Each trial kept T3a's overlay, the page-27 row and source redirects, the EMULATOR-ONLY value hooks, and the EMULATOR-ONLY descriptor link. The link resolves: `FUN_604058bc(0x3D6F)` returns the id in D0 and `0x6031e9a0` in A0 (`work/out/link-diag-a9.jsonl`). The extra bytes below were runtime writes in that session, labelled in the JSONL. They are not added to the overlay CSV, because none of them opened the editor.

| Trial | Change | Result |
| --- | --- | --- |
| v1 | Row kind at `0x6031e97c` set from 4 to 12 | Page stays. Setter not called. Profile stays 0. `work/out/proto-r1-v1.jsonl` |
| v2 | Kind 12, and the alternate pointer and count at `0x6031e994` cleared | Page stays. `work/out/proto-r1-v2.jsonl` |
| v3 | Kind 12, alternate cleared, option count at `0x6031e988` forced to 2 | Page stays. `work/out/proto-r1-v3.jsonl` |
| v4 | Kind 12, alternate cleared, descriptor at `0x6031e9a0` given UI 2154's template pointer `0x606190b7` and count 10 | Page stays. `work/out/proto-r1-v4.jsonl` |

The screenshots for v3 and v4 are `work/out/proto-r1-v3-open.png` and `work/out/proto-r1-v4-open.png`. v2's writer still named its screens `proto-r1-v1-*.png`, so those two files now hold the v2 frames. Copies are `work/out/proto-r1-v2-page.png` and `work/out/proto-r1-v2-open.png`. Both trials left the highlighted third row on the AF Button page.

## What the trials rule out

Kind 12 on this row does not select the chooser. A null alternate list does not. An option count of 2 does not. A descriptor whose template pointer is the one UI 2154 carries does not. The lookup hash is not the missing registration: it already returns this row's descriptor, and OK still enters `FUN_61203816` instead of `FUN_610cdebf`.

## Qualified proposal

The split that was measured is upstream of `FUN_61203816`.

- For 2154 and 2155, OK does not enter `FUN_61203816`. It does enter `FUN_610cdebf` at return address `0x61149d29`, then `FUN_610cdf05` and `FUN_610e2536`.
- For `0x3D6F`, OK enters `FUN_61203816` from `0x6124f7e4` and calls `FUN_61204065(0x3D6F, 10)` with A1 = `0x6158ba1c`. `FUN_610cdebf` does not run.

`FUN_61204065` calls `FUN_611c7785`. That function walks 12-byte option records and calls `FUN_611c7894` only when the record kind is 1, 2, 5, 6, 7, 8, 9, 10 or 11 (`ref/analysis/decompiled-main/functions/611c7785.c`). The records at `0x6158ba1c` are kind 12, so the walk returns without that call. This was not one of the four trials.

A single EMULATOR-ONLY hook at `FUN_611c7785` (`0x611c7785`), taken only when the list base is `0x6158ba1c` and the enclosing `FUN_61204065` was entered with D0 = `0x3D6F`, could treat those kind-12 records as a spawning kind and call `FUN_611c7894`. That is a proposal for a later trial. It was not run. It is not claimed to be a smallest native change, and the row data is not claimed to be unable to host the editor: the four trials did not open it, and this hook site was not tested.
