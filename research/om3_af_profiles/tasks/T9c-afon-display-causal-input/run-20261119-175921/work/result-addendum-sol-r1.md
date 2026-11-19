# T9c addendum after Sol's rejection

This file applies the four record corrections in Sol's review of `run-20261119-174959`. It does not edit that review, the version-4 logs, or the version-4 screenshots. Those stay as the failed evidence.

## 1. The first submission is a partial investigation

The run that produced version 4 is a partial investigation with an unvalidated display change. Version 4's twelve frame assertions failed and that session ended `ok:false`. The logs and screenshots under `work/out/obs-valid-v4.jsonl` and `work/out/valid-v4-e*.png` are unchanged.

## 2. What stays unresolved

The scheduling producer of the dispatch at `0x610c8b66` is unresolved. The recorded return `0x610c8b68` names the indirect call. The next stacked return, `0x610cdc4f`, names that function's caller. Neither names the code that decides the call should run. The two checks through `0x610cd5ac` gate the writer. The dirty byte `0xa32bfb32` was not the scheduler.

The general relation from the getter return to the word at object+`0x364` is unresolved. Three words were read from the running machine: 526 at rest, 409 when the return was 409, and 406 when the return was 412. Word 523 was not read. It was inferred from version 4's screenshot. The sentence "when the return modulo 39 is 22, the word is the return minus 6" is a fitted hypothesis. The correction round did not use it to choose an expected frame.

## 3. Version 5 is the Z5 control

Version 5 of the first six is the Z5 control with a reduced display hook. Its overlay is `overlay-changed-bytes-c1.csv`. It does not install the T6 profile reader, and its hook does not contain the size and kind branches or the current-bank selection. It is not the unseeded T6 control. That control is the later full K2 run.

## 4. "No other deviation" is withdrawn

The first submission's closing line "No other deviation" is withdrawn. Besides version 4's failed flag, that submission substituted a Z5 control for the unseeded T6 control, left the size and kind branches with zero substitutions, and did not implement an edge-triggered refresh condition. The producer of `0x610c8b66` was not raised on press or release.
