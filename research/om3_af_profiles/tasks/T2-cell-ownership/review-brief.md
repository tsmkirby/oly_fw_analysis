# T2 correction review (Codex Sol, read-only)

Read `brief.md` §11 (the correction list), your previous review in `audit\previous-review.md`, and
the updated `work\result.md`, `work\evidence-manifest.json`, `work\out\verdict.md`,
`work\out\candidates-5b82.tsv`, `work\out\uses-5b82.tsv`, the new listings and the new dynamic
JSONL. For each of corrections 1–6, report DONE / NOT DONE / WRONG, with evidence.

In particular:
- spot-check at least 15 candidate dispositions against the raw bytes;
- verify the whole-key route analysis (`0x6006398b`) and its reachability claims from the
  listings;
- verify that the C1 cycle and the cursor-page steps actually completed in both repeats;
- check the layout's capacity arithmetic.

Recompute every manifest hash. Use PowerShell; Python is not on your PATH. Give the overall verdict
in the structure of `templates\review.md`. OWNABLE for normal use needs no unresolved writer that
can reach the unnamed cells outside the explicitly classified reset/default paths.
