# T2b correction review (Codex Sol, read-only)

Read `brief.md` §7 (the correction list), your previous review in `audit\previous-review.md`, and
the updated `work\result.md`, `work\evidence-manifest.json`, `work\out\INDEX.md`,
`work\out\verdict-v4.md`, `work\out\candidates-5b82-v4.tsv` and `work\out\uses-5b82-v4.tsv`, plus the
new listings. For each of corrections 1–5, report DONE / NOT DONE / WRONG, with evidence.

In particular:
- verify each setter-source trace of item 1 from the listings and the raw bytes, including any
  table dump;
- verify the `0x607135ad` lineage;
- spot-check at least 15 rows of `candidates-5b82-v4.tsv` against the raw bytes, including the five
  that you named;
- check that the command log holds real output.

Recompute every manifest hash. Use PowerShell; Python is not on your PATH. Do not run Ghidra or
OM-Emu. Give the verdict in the structure of `templates\review.md`.

OWNABLE for normal use requires that no unresolved writer can reach the unnamed cells outside the
explicitly classified reset/default and adjustment/debug paths. If the result keeps UNRESOLVED, say
whether that is now justified by a specific, bounded residual list.
