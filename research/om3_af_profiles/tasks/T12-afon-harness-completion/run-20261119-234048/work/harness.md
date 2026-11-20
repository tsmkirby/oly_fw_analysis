# T12 acceptance harness

`work/out/test-harness-v4.txt` is the passing record. Every check below is one of those lines. No emulator process was started. `work/harness-freeze.json` lists the files T13 may import. The six runners and their two helpers are marked `notRun` and were not started.

## Copies that the test hashed

These files match the T11 sources byte for byte. Nothing in them was edited.

| File | SHA-256 | Bytes |
|---|---|---|
| `work/harness/afon_hooks_v7.mjs` | `488e6973767a246b24130173edf16fa4082dafb2ce00dcf8622150db8dc1fcd0` | 24636 |
| `work/harness/predicates_v3.mjs` | `c6a11a0d03a8a355beb021cd2578d9be304498695c118250a1464f22de8a046f` | 1605 |
| `work/harness/state_v1.mjs` | `8b5752adcf905e53af86d92e640135e3e9a83ed50bf3743f9e74a6f1c3da0677` | 3647 |
| `work/harness/table_v2.mjs` | `1dbdfa871ec90c27010d5361c188b7d63db0d24c700ac57c74942dbce1bb5f20` | 17566 |

`checkTable` in `work/harness/check_table_v3.mjs` accepts `table_v2.mjs`.

The hook file is the T11 combined hook, including `bank()`, `initMirror()`, the writer feed, the pose latch, and the display substitution. No checklist item changed those functions. `createPoseGate().decide` does not read `watchArmed`. Turning `setWatch` on and off left the same refusal. The `poseGate.decide` call in the hook file does not pass the watch.

## What the unit test showed

The gate under test is `createGate` in `work/harness/gate_v4.mjs`, compared by `compareState` in `work/harness/compare_v4.mjs`. The emulator object was a fake. There is no `press` function on the gate. A raw key and a raw press on that fake throw.

A held slot that changes value fails the gate. A slot listed as an exemption without a declared value fails the gate, including when that slot's value changes. A declared owner that does not match the value after the operation fails the gate. `fromDeclared('candidate-af-up')` names or holds every full-state field, and it has no seal field and no slot exemption.

`classifyCommit` treats OK as a commit when the caller flag is false. AF-ON is not a commit unless the operation id is in the plan or the plan's AF-ON context is set. An OK with no sealed identity key is refused. On a successful AF-ON release, identity is read after the key function and after settle. The retained record has both the expected identity and the actual identity. In the fake, the title during the key was `during` and the title after settle was `after`.

`operationPlan()` includes `k1e:ke-s1-down`, `k1e:zone-z0-s1-up`, and `display:seed-a-e0`. Removing any one of those rows makes `assertCoverage` throw.

`judgeDown` for the K1e role and for the candidate role both reported `half`, `owner`, `target`, `halfTarget`, and `flag` against a wrong actual value. The control role was not skipped.

`scanText` rejects one planted string for each scanner rule. `assertClean` accepts `work/harness` and `work/scripts`, which is where `setup_v1.mjs` holds the native setup calls and where `drive_v11.mjs` and `display_v3.mjs` do not.

`installRefresh` kept a passthrough return and a substituted return on the same record. A getter outside a window with category `setup` is kept. A getter with no category is an orphan. A null return outside a window fails. Two windows kept the samples whose times fell inside those windows. A sample from outside a window did not replace the sample taken inside it.

The inventory registrar records `process.argv` and `process.execArgv` on the command file and on the exit file. The exit file for the read probe includes `work/harness/predicates_v3.mjs`. The throw probe exits non-zero and still writes an exit file. Both probes set `OM_EMU_MODEL=E147` and `OM_EMU_NVRAM=off`. Neither probe is an OM-Emu session.

## Written for T13 and not run

Start T13 with `node26 --import ./work/harness/inventory_register_v3.mjs` and set `T12_INVENTORY_TAG`, `OM_EMU_MODEL=E147`, and `OM_EMU_NVRAM=off`. The checkout argument is `om-emu`. The identity runner is `work/scripts/run_identity_t13.mjs`. It is written to drive the table and the zone pass, then all four display jobs, then seal `work/out/identity-t13-v1.json`. The proof runner is `work/scripts/run_proof_t13.mjs`. The display runners are `run_display_a_t13.mjs`, `run_display_b_t13.mjs`, `run_display_k2_t13.mjs`, and `run_display_k1_t13.mjs`. They load that seal. T12 did not run any of them, so that seal does not exist yet. The T11 v10 table is not that seal. The gate tested here takes identity after the key, which is the capture T13 has to record.

The harness does not choose storage and does not recommend hardware.

## Unresolved, non-blocking

The mode-selecting getter input is still unresolved. The producer that schedules `0x610c8b66` is still unresolved.
