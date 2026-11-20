# T12b harness guarantees

Demonstrated on the fake session inside `work/harness/entry_v1.mjs`. OM-Emu, Ghidra, and Java were not started. `createReal` throws `T12b does not start the emulator` (`work/harness/entry_v1.mjs` line 73). Retained proof is `work/out/test-harness-v3.txt` (79 PASS lines, no FAIL) and the inventory exits named below.

## Accepted bytes kept

`work/harness/test_harness_v3.mjs` hashed these copies against the T12 files they were copied from. The hashes matched:

| File | SHA-256 |
| --- | --- |
| `work/harness/afon_hooks_v8.mjs` | `488e6973767a246b24130173edf16fa4082dafb2ce00dcf8622150db8dc1fcd0` |
| `work/harness/predicates_v3.mjs` | `c6a11a0d03a8a355beb021cd2578d9be304498695c118250a1464f22de8a046f` |
| `work/harness/state_v1.mjs` | `8b5752adcf905e53af86d92e640135e3e9a83ed50bf3743f9e74a6f1c3da0677` |
| `work/harness/table_v2.mjs` | `1dbdfa871ec90c27010d5361c188b7d63db0d24c700ac57c74942dbce1bb5f20` |
| `work/harness/compare_v4.mjs` | `af808b73807143aeb87bd3cd8c1c89fb0c4860fbe2a7b663d409e2e844c4b5e2` |
| `work/harness/refresh_v4.mjs` | `01e4714d9f3067f1972e113ffc693bdb8a5dc847800b80604eed827bc1e75f48` |

`afon_hooks_v8.mjs` is the byte copy of T12 `afon_hooks_v7.mjs`, so its import specifiers stay `./state_v1.mjs` and `./predicates_v3.mjs`. Those two modules were copied under those names so the accepted bytes stay valid. The same test shows the hook text still contains `bank` and `initMirror`, `poseGate.decide` still omits `watch`, and toggling the watch does not change a pose refusal. `check_table_v3.mjs` reports no table problems. Full-value comparison is the copied `compare_v4.mjs`: a changed held slot, a wrong owner, and a shape-only compare all fail in the unit test.

## 1. Capability passing

`runWithGate` keeps the session in the entry closure and returns a handle created with `Object.create(null)`. The handle exposes `perform`, `operations`, and `results` (`work/harness/entry_v1.mjs`). The unit test shows that handle has no prototype and no session methods, and that a planted attempt (emulator-module import, `globalThis` lookup, prototype walk) ends with `planted runner failed to obtain the session`. `work/harness/static_check_v1.mjs`, as run by the unit test, accepts the six T13 runners and `driver_v1.mjs`: they import the harness entry plus Node built-ins on the allow-list. The planted file that imports `om-emu/emu/src/lab/play.mjs` is rejected. `driver_v1.mjs` iterates `gate.operations()` and does not carry its own operation ids.

## 2. Read inventory

`work/harness/inventory_register_v6.mjs` installs `exit`, `beforeExit`, `uncaughtException`, and `unhandledRejection` at lines 249–263, then wraps the read entry points, and only then reads `T12B_INVENTORY_TAG` at line 292. The unit test records:

- a missing tag still writes `work/out/inventory-init-exit.json` with `ok: false`
- `T12B_INVENTORY_FAIL=1` still writes `work/out/inventory-unit-init-exit.json` with `ok: false`
- `work/out/probe-identity.json` is inventoried and its exit hash matches a fresh SHA-256
- a `fs.promises.readFile`, an `openSync`, and a callback `readFile` are inventoried
- the registrar jsonl and exit file are absent from that import list
- `work/out/probe-changed.txt`, rewritten after the first read, makes `work/out/inventory-unit-changed-exit.json` fail with a `changed` problem

No path prefix is excluded. The registrar's own jsonl, exit, and command files are the writes that are not inputs. `fs.promises` function names on this Node are classified; the unit test reports no unclassified name.

`inventory_register_v5.mjs` was executed and is not the registrar used for the freeze. Its probe exits record `Maximum call stack size exceeded`: `readFileSync` re-entered the wrapped `openSync` before the path was marked. v6 marks the path before the read. The freeze exits name `./work/harness/inventory_register_v6.mjs` in `execArgv`.

## 3. Freeze from execution

Each T13 runner imports only `../harness/entry_v1.mjs` and calls `runRunner`. There is no load-only branch and no preload list. Under `inventory_register_v6.mjs` with `T12B_FREEZE_CAPTURE=1`, these exits are `ok: true` with an empty problem list:

- `work/out/inventory-freeze-identity-exit.json`
- `work/out/inventory-freeze-proof-exit.json`
- `work/out/inventory-freeze-display-a-exit.json`
- `work/out/inventory-freeze-display-b-exit.json`
- `work/out/inventory-freeze-display-k2-exit.json`
- `work/out/inventory-freeze-display-k1-exit.json`

`work/scripts/write_freeze_v1.mjs` unioned those imports, re-hashed every path, and wrote `work/harness-freeze.json` (20 files, each with length and SHA-256). One of those files is `work/out/identity-t13-v1.json`, so a file under `work/out/` that the proof run read is part of the freeze.

`work/out/inventory-freeze-proof-enforce-exit.json` is `ok: true` for the proof runner with `T12B_FREEZE_ENFORCE=1` against that freeze. `work/out/bad-freeze.json` is the same freeze with `entry_v1.mjs` removed. The proof runner under that path exited 1. `work/out/inventory-freeze-proof-refuse-exit.json` has `ok: false` and the problem `refuse to start: missing C:/Dev/OM3-tasks/T12b-afon-harness-by-capability/ws/work/harness/entry_v1.mjs`.

The freeze is the modules and files those six fake runs loaded and read. It includes the T9d edge list because `operations_v1.mjs` imports it. It does not include OM-Emu modules. A later process that loaded one would be outside this freeze, and the loader hook would refuse that start.

## 4. One operation definition

`work/harness/operations_v1.mjs` builds one `OPERATIONS` array (line 261). `coverageIds` and `identitySpecs` read that array. `driver_v1.mjs` executes `gate.operations()`, which returns the same array. The unit test counts the groups setup 25, table 80, setter 77, pose 5, zone 111, custom 24, display 50. Deleting `setup-lever` from that array removes it from the driver's execution, from `coverageIds`, and from `identitySpecs` together; the test then restores the array.

## 5. Sealed setup deltas

Setup operations use `expectationSource: 'sealed-delta'`. In identity mode the gate records the observed full-state delta and compares against that delta. In proof mode it loads the sealed delta and requires every other full field to be preserved (`work/harness/gate_v6.mjs` `expectationFor`). The unit test, on a fake whose setup sets `flag` to 7, seals `{changed:{flag:7}}`, passes the proof on that same change, and fails the proof when the flag is 9.

The identity runner wrote `work/out/identity-t13-v1.json` (145 identity rows and 25 setup deltas) and `work/out/identity-t13-v1.seal.json` (SHA-256 and length of that file). The proof runner checks that seal before it compares. The retained `work/out/proof-t13-v1.json` reports `executed: 372` and `ok: true`. Display runners completed on the same fake: display-a 24, display-b 24, display-k2 23, display-k1 17 (`work/out/display-*-t13-v1.json`). Those counts are the operations whose `kinds` include that runner's kind.

On this fake, each setup delta is the flag value the fake's setup apply writes. The unit test is the demonstration that a different change fails. The runner seal shows the same mechanism recorded for every setup operation the identity pass executed.

Commit class is decided by `classifyCommit` from the key and the plan. A stored `commitClass` flag is ignored. A missing sealed row throws before `fn`, `apply`, or `key`. Identity is read after settle. The unit test shows zero deliveries when the sealed row is missing, one delivery when it is present, and the expected and actual identity retained on success.

## Limits

No storage decision. No hardware step. Two T9d mechanism items stay unresolved and non-blocking: the mode-selecting getter input, and the producer of `0x610c8b66`.

The six T13 runners were executed on the fake. They were not executed on the emulator.
