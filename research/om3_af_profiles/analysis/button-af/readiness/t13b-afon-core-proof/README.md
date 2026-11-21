# T13b: staged core AF-ON proof (EMULATOR-ONLY), ACCEPTED

The first valid real-emulator proof in this project:
- **Run:** Grok run-only `run-20261121-055653`, two processes on the Opus-written harness. The harness was accepted in
  `run-20261121-054631-review` and is byte-identical to the accepted T13 v3, except that the identity plan is limited
  to the T8d and zone sessions.
- **Result:** both runs `ok:true`, `valid:true`, mode `real`, freeze `03db7d96…ae92`. Sol accepted the run in
  `run-20261121-061752-review` (ACCEPT-RUN).
- **`identity`:** 324 operations, 1096 relations, 0 failed, identity sealed.
- **`proof`:** the same 324 operations, every field reproduced against the sealed identity, 1096 relations, 0 failed.

Covered (K1e, K2, candidate; zone K1e, zone candidate):
- the AF-ON press equals the K1e S1 half-press record (the named reference; T14 conclusion (c): not shown to equal
  stock AF-ON);
- the AF-ON release equals the candidate's own S1 record;
- the per-role mirror rules;
- pose-after-edit live cells equal K2's, with no live store of the saved mirror position;
- the read bank;
- link read-back;
- writer counts 3 and 7;
- zone and custom press and release equal zone K1e;
- every commit's screen identity.

Not covered:
- display validation (separate stage, T13 decision);
- persistence and lifecycle;
- physical camera behaviour.

Files:
- `harness/`, `freeze/`;
- `out/` (both runs);
- `result-impl.md`, `result-run.md`;
- `review-code.md`, `review-run.md`;
- `evidence-manifest.json`;
- `LOCAL-ONLY-SHA256.txt`.
