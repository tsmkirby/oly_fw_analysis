# T13 code-stage decision (Opus)

**Verdict: code ACCEPTED** (`run-20261120-224009-review`, ACCEPT-CODE, no required corrections). Date: 2026-11-20.

| Round | Submission | Sol review | Verdict |
|---|---|---|---|
| code 1 | v1 (`run-20261120-221234-opus-impl`), freeze `8aef6774…189f` | `run-20261120-221318-review` | REJECT-CODE: 7 corrections (display pose path, inventory gaps, refresh records, deadline, display frame holds, output root, housekeeping) |
| code 2 | v2 (`…-opus-impl2`), freeze `282fc757…7a04` | `run-20261120-223058-review` | ACCEPT-CODE-WITH-CHANGES: glob recording, `_refusals` containment |
| code 3 | v3 (`…-opus-impl3`), freeze `819876c4…4e2b` | `run-20261120-224009-review` | ACCEPT-CODE |

Accepted for execution, not as proof: 43/43 pure-Node tests, six fake plans through the launcher (valid:false by
construction), relations evaluated on the 80 retained T11 emulator records (532 relations, 0 failures). The AF-ON press
reference is the named K1e S1 down half-press record (T14 conclusion (c) still open).

Next: Grok run-only stage, six processes, stop at first failure (`brief.md`). Then Sol results review.
