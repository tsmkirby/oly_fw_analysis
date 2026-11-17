# <ID> review (Codex Sol, read-only)

Write your final answer in exactly this structure. The Codex host saves it as the task's `review.md`.

1. **Verdict:** ACCEPT | ACCEPT-WITH-CORRECTIONS | REJECT
2. **Baseline checked:** the brief, `result.md`, the manifest, and which research sections you read.
3. **Hash verification:** each manifest entry you recomputed, MATCH or MISMATCH.
4. **Claim-by-claim:** for each numbered claim in `result.md`:
   `CONFIRMED` (what you checked independently) · `SUPPORTED-NOT-INDEPENDENT` ·
   `UNSUPPORTED` · `WRONG` (with evidence) · `OVERSTATED` (correct class stated).
5. **Contradictions with established findings** (cite document §), or "none".
6. **Alternative explanations** not excluded by the evidence.
7. **Scope and safety:** writes outside `work/` (or unapproved `om-emu/` changes), image construction, or hardware recommendations seen in the result or scripts.
8. **Required corrections** (numbered, minimal) and **optional improvements**.
