# T7 correction review (Codex Sol, read-only)

Read the following:

- `brief.md` §5, which contains the correction list and the coordinator amendment on injection scope;
- your previous review, in `audit\previous-review.md`;
- the updated `work\result.md`, `work\evidence-manifest.json` and its supplement;
- `work\out\orientation-producer.md` and `work\out\pose-injection.md`;
- the new scripts, JSONL logs, screenshots and listings;
- `work\out\cmd\` and `audit\`.

For each of corrections 1–5 and the amendment, report DONE, NOT DONE, WRONG or BLOCKED (honestly reported),
with evidence.

In particular, check:

- that the ten-byte record's producer was triggered by a stock action, and the per-pose index it reads,
  with Orientation Linked on and off, getter callers recorded, and `0x90a1` asserted Off. If the work is
  BLOCKED, check the static path instead;
- that the intervention table lists every stand-in, and that only the register-read hook supplies data;
- the raw-store instrumentation, or the downgraded claim;
- the xrefs from the producer to the bank selector, and the bounded wording of findings 6 and 11;
- that a missing pose or an incomplete run ends `ok:false`;
- new listings against `inputs\00_0100_50000020.decoded.bin`, where offset = address − `0x60021020`.

Recompute every manifest hash. Use PowerShell; Python is not on your PATH. Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
