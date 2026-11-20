# T11 acceptance harness

The harness is what a later persistence task calls. It does not choose storage and it does not change the image. Persistence stays behind a proof that ends `ok:true`. The proof in this round stopped at `candidate-af-up`.

## What a later task calls

1. Start with `node26 --import ./work/harness/inventory_register_v2.mjs`. Set `T11_INVENTORY_TAG`, `OM_EMU_MODEL=E147`, and `OM_EMU_NVRAM=off` before the process starts. The registrar loads the module hook first, records every imported file, writes `work/out/cmd/<tag>.json`, and re-hashes on every exit, including a throw. A hashing error fails the load. Non-module inputs (both decoded images, the combined overlay, and the three T9d references) are in the exit record. Build `work/evidence-manifest.json` from those exit records with `work/scripts/build_manifest_v2.mjs`.

2. Send every key, dial detent, pose change, setter write, flag write, and mirror seed through `createGate` in `work/harness/gate_v3.mjs`. The gate captures the 63 half-press slots, the 71-byte mirror and flag, both ten-byte records, the owner, `0x1e71[0]`, and, on a display run, the frame signature. It compares that capture with the step expectation before it returns. A named field must equal its one declared source. Every other field must equal the value from before the operation. A raw key, dial, `setPose`, or `setKey` outside the gate fails `work/harness/static_check_v7.mjs`. `work/harness/test_harness_v2.mjs` plants those calls in a string the checker rejects.

3. Seal commit screens before any acceptance session. `work/out/identity-t11-v10.json` is sealed by `work/out/identity-t11-v10.seal.json` (SHA-256 `1865a575c63ee414f387a16d2db586653f6324e967f1a790c87e6a23a48dc24d`, 9165 bytes). `coverageProblems` in `work/harness/identity_v2.mjs` refuses to start unless every `identityFrom` and every commit has a row, including `k1e:ke-s1-down`, `k1e:ke-s1-up`, `k1e:ke-p-s1-down`, and `k1e:ke-p-s1-up`. `commitDecision` refuses the key when the sealed row is missing, and it logs expected and actual title, highlight, and screen on every commit.

4. Install one hook, `installCombined` from `work/harness/afon_hooks_v6.mjs`, before `createGate`, so the gate's key path is the one that ends a pose. The writer arms itself when the native path sees the owner enter 2 after the builder. `shouldArmWriter` in `work/harness/predicates_v3.mjs` takes no runner flag. `bank()` and `initMirror()` are the T8c text. Pose refusal comes from `createPoseGate`: issue `0x6006a8ab` and publish `0x6007805e` set `poseActive`, and the next key or dial clears it. `decide` does not read `watchArmed`. An editor write (mode 1) is allowed. A mirror value written onto a different live cell is refused while a pose change is in progress, and also while that live cell is still the reset value.

5. Drive from `work/harness/table_v2.mjs`. `check_table_v2.mjs` accepts that table. `judge_v2.mjs` still checks the completed step. The gate's own comparison is `compare_v3.mjs`. The zone K1e centre record is `[14,2,2,0,27,0,39,0,0,0]`; that capture sets `allowStale` because those bytes are the reference, and the candidate matched them. A later zone enter holds the mirror: `initMirror` fills only `0xFF` bytes, and the first enter already filled them. A zone AF-ON press writes the K1e press bytes into both ten-byte records.

6. Display runs use `work/harness/display_v2.mjs` and `work/harness/refresh_v2.mjs`. Setup sets and the mirror seed go through the gate. Each edge compares owner, both records that the edge names, the 63 slots, the mirror, the flag, and the frame signature. The recorder keeps the returned value of a passthrough call, records a substituted call, and fails on a null return, an unclosed window, or a dropped call. This round did not reach a display job.

## The commit that stops acceptance

`candidate-af-up` uses `identityFrom` `k1e:ke-s1-up`. The sealed row, captured on K1e before S1 up, has title `19a0f247d22625e54bb1ea773998e8886a8591151390eb27af9b5d4ac6e3ea69`. On the candidate, the same check runs before AF-ON up, while AF-ON is down, and the screen title is `166805347ccaf26ddad5750dbfd0a2b169855ffa38b4dbcdfa0717ddd42a3059`. Highlight is null and the screen is `shooting` on both sides. `work/out/proof-t11-v2.jsonl` records expected and actual. The gate refused the key. A later task needs a sealed row taken at the moment the candidate is actually showing, and a new driver and a new proof. The comparison stays exact.

## Unresolved items carried forward

The mode-selecting getter input is still unresolved. The producer that schedules `0x610c8b66` is still unresolved.
