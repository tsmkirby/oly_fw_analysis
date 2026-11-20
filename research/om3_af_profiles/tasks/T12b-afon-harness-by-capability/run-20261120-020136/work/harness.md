# T12b harness

Demonstrated on a fake emulator object. No OM-Emu process is started. `createReal` in `work/harness/entry_v5.mjs` contains the T12 zone-session construction and is not called by `runRunner`.

## Accepted bytes

These copies match `ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/harness/` byte for byte:

- `afon_hooks_v8.mjs` matches `afon_hooks_v7.mjs`
- `predicates_v3.mjs`, `state_v1.mjs`, `table_v2.mjs`, `compare_v4.mjs`, `refresh_v4.mjs`

`gate_v6.mjs` is the previous run's gate, unchanged. It decides commit class, refuses a missing sealed row before delivery, compares full values, and reads release identity after settle.

## What a runner is allowed to touch

`work/harness/entry_v5.mjs` keeps the session in a closure. The handle exposes frozen operation descriptions and `perform(id)` for a string id. It has no setup callback. `work/harness/static_check_v5.mjs` allows the six `run_*_t13_v5.mjs` runners and `driver_v5.mjs` to import only that entry plus `node:fs`, `node:path`, `node:url`, `node:crypto`, and `node:child_process`. Computed `import()`, `createRequire`, `require`, `process.binding`, and `node:module` are rejected. A resolvable import of `om-emu/emu/src/fw/model.mjs` is refused with `policy-refuse: emulator module` (`POLICY_EMULATOR`).

## One operation list

`work/harness/operations_v2.mjs` is the only ID list. The driver iterates `handle.operations()`. Coverage and the identity generator read the same array. Setup operations use a sealed delta. Other operations use the restored T12 sources `declared`, `plant`, `mirror`, `edge`, and `hold` where T12 held a link. `setup-lever` idles 400 ms. Display edges settle by repeated 25 ms idles until the reference bound. Deleting an identity-bearing definition removes it from execution, coverage, and the identity generator together.

## What the fake runs actually call

`work/harness/fake_session_v1.mjs` installs `installCombined` and the refresh recorder, attaches pose, and answers the lab, menu, and simulator calls those functions make. `work/harness/execute_v2.mjs` then calls the real setup functions, key, dial, pose, enter, `setKey`, `writeMode`, and `writeMirrorBytes`, and `captureState` reads the memory those calls wrote. A planted wrong flag fails the comparison. Bring-up with setup flag 7 seals `{changed:{flag:7}}`; proof accepts 7 and rejects 9.

## Inventory and freeze

`work/harness/inventory_register_v10.mjs` installs exit handlers before the tag check, wraps the read entry points, and loads `inventory_hook_v6.mjs`. Buffer paths, URL paths, and descriptor reads are hashed. The registrar's own jsonl, exit, and command files are writes. The freeze file is an input: the proof inventory contains `work/harness-freeze.json` and `work/out/harness-freeze.seal.json`. A changed file fails the exit record. A missing tag or an init failure still writes a failing exit record.

Capture mode is logged and cannot be combined with proof. Every other runner start refuses unless the freeze and its seal validate. `work/harness-freeze.json` is the union of the identity and four display capture inventories (36 files) plus every file under `om-emu/emu` (388 files) at revision `4e4ec4ef084542a7e30eecce56970c7e09c123c9`, diff digest `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`. The proof runner completed against that freeze. A seal-matched freeze with `entry_v5.mjs` removed was refused because that file was missing.

## Records from the fake runs

Identity and proof each executed 372 operations, installed the hook and the recorder, made 536 API calls, recorded 1362 idles, and reported no refresh problems. The identity file has 145 rows and 25 setup deltas. Display passes executed 24, 24, 23, and 17 operations.

No storage decision. No hardware step. The mode-selecting getter input and the producer of `0x610c8b66` stay unresolved and non-blocking.
