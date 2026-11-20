# T11 acceptance harness

The harness is the gate a later persistence task (codec v2) calls. It does not choose storage and it does not touch the image.

## What a later task uses

1. Start the process with `node26`. Set `OM_EMU_MODEL=E147` and `OM_EMU_NVRAM=off`. Call `beginSession` from `work/harness/inventory_v1.mjs` before the first dynamic import of OM-Emu. The loader records every file imported after that, and `finish` re-hashes them. A changed file fails the session. Build `work/evidence-manifest.json` from those exit records.

2. Send every key, dial detent, pose change, and setter write through `createGate` in `work/harness/gate_v1.mjs`. The gate asserts the 63 half-press slots, the 71-byte mirror and flag, both ten-byte records, the owner, and `0x1e71[0]` after the down edge and again after the up edge. A raw `ctx.key`, `dial_input`, `setPose`, or `setKey` outside `gate_v1.mjs` fails `static_check_v5.mjs`.

3. Record commit screens in an identity pass, then `writeSeal` the JSON before any acceptance `runZone`. `commitDecision` in `work/harness/identity_v1.mjs` refuses the key unless the seal contains that step's `identityFrom` row, and it compares the title hash, highlight, and screen for K1e, K2, and the candidate. The row is stored only when the role that is running is the role named by `identityFrom`, and only when that step has `commit: true`. A candidate step that names `k1e:ke-s1-down` needs the K1e step `ke-s1-down` itself to be a commit, or the seal will not contain the row.

4. Install one hook, `installCombined` from `work/harness/afon_hooks_v5.mjs`. Do not pass a runner arm flag. The hook arms the stock writer when the native reconcile path sees the owner enter 2 after the builder (`shouldArmWriter` in `predicates_v2.mjs`). `bank()` and `initMirror()` are the T8c text. The pose gate refuses a copier store at `0x604193c7` of the mirror cell onto a different live cell while a pose change is in progress, including when that live cell is no longer the reset value. The same setter return during an editor key is the commit of the edit: it is allowed unless the live cell is still the reset value. An unset saved position (`0xFFFF`) does not replace the stock record.

5. Drive the sequence from `work/harness/table_v1.mjs`. `check_table_v1.mjs` rejects a commit with no identity source, an exit that is not a real K1e or K2 step, and a table with no press and release zone rule. `judge_v2.mjs` checks the completed step. On a down edge, a candidate half that has not moved yet is the deferred live commit; a down edge that does move the half has to match K2.

## What the identity pass already showed

`work/out/identity-t11-v6.jsonl` ended `ok:true`. The candidate writer ran 3 times, armed by owner 0 becoming 2 with no runner flag. Zone press and zone release, including custom, matched the K1e records. The pose change after the non-reset normal edit did not store the mirror position into a different live cell.

## What blocked the acceptance session

`work/out/proof-t11-v1.jsonl` stopped at `candidate-af-down`. That step's `identityFrom` is `k1e:ke-s1-down`. The K1e step `ke-s1-down` has no `commit: true`, so the identity pass never stored the row, and the commit function refused. The same gap exists for `k1e:ke-p-s1-down`. The display jobs did not start. This task used its six emulator processes on the way to that refusal.

A later task should add `commit: true` on those K1e steps in a new table file, point a new driver at it, seal a new identity file, and only then run the proof and the display jobs. Persistence stays behind that.
