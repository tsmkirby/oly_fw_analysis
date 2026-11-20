# T13 design review brief (Codex Sol, read-only)

The owner decided (2026-11-20) that Opus writes the acceptance harness directly, Grok only runs it, and you review
both. The acceptance bar is unchanged.

## Read

- `work/design.md`, `work/result.md`, `work/perm-probe/`.
- The decisions and your reviews for T11, T12 and T12b (under `ref\tasks\T11-afon-acceptance-harness\`,
  `ref\tasks\T12-afon-harness-completion\`, `ref\tasks\T12b-afon-harness-by-capability\`), and the T11 brief.

## Check

1. For **every** required correction in your six T11/T12/T12b reviews, state whether the design closes it, leaves it
   open, or makes it inapplicable (with the reason). Give a table.
2. Is the two-layer expectation scheme (§3) acceptable as "each field equals a declared value with a single source
   or explicit preservation", and is it non-circular for the behavioural claims? If not, what would be?
3. Does the permission-model approach close the read-inventory and freeze-enforcement classes? Name any read or load
   path it would not cover, and any way the launcher/child split could be bypassed.
4. Anything in the design that would make a T13 proof invalid, or a requirement missing from §3.2.

## Rules

Read-only. Use PowerShell. Do not run Ghidra or OM-Emu. Use the structure of `templates\review.md`; for the verdict
use ACCEPT-DESIGN, ACCEPT-DESIGN-WITH-CHANGES (list them), or REJECT-DESIGN.

## Round 2

Review `work/design_v2.md` against your previous review (`audit/previous-review.md`). For each of its seven required
corrections, and for each row you marked Open in its table, report CLOSED / OPEN / INAPPLICABLE with the reason. Then
the same verdict options. Apply the threat model of design_v2 §0 (mistakes, not malicious code) unless you find it
inconsistent with a stated requirement; if so, cite the requirement.
