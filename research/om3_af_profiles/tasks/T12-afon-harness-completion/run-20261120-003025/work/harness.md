# T12 acceptance harness

The checks below are the PASS lines in `work/out/test-harness-v5.txt` and `work/out/test-harness-v6.txt`. Every emulator object in those tests was a fake. `work/harness-freeze.json` is the import set loaded from the T13 runners with `T12_LOAD_ONLY=1`. `proofRun` is false. The six runners and `run_display_job_t13_v2.mjs` are marked `notRun`.

## Copies the test hashed

These files match the T11 sources byte for byte.

| File | SHA-256 | Bytes |
|---|---|---|
| `work/harness/afon_hooks_v7.mjs` | `488e6973767a246b24130173edf16fa4082dafb2ce00dcf8622150db8dc1fcd0` | 24636 |
| `work/harness/predicates_v3.mjs` | `c6a11a0d03a8a355beb021cd2578d9be304498695c118250a1464f22de8a046f` | 1605 |
| `work/harness/state_v1.mjs` | `8b5752adcf905e53af86d92e640135e3e9a83ed50bf3743f9e74a6f1c3da0677` | 3647 |
| `work/harness/table_v2.mjs` | `1dbdfa871ec90c27010d5361c188b7d63db0d24c700ac57c74942dbce1bb5f20` | 17566 |

`checkTable` accepts `table_v2.mjs`. The hook file still contains `bank()`, `initMirror()`, the writer feed, the pose latch, and the display substitution. `createPoseGate().decide` does not read the watch. Turning `setWatch` on and off left the same refusal. The `poseGate.decide` call does not pass the watch.

## Gate and comparison

`createGate` in `work/harness/gate_v5.mjs` is the delivery path the T13 runners import. `compareState` in `work/harness/compare_v4.mjs` compares the captured state. The gate object has no `press` function. A raw press, a raw key, and a raw `s.key` on the fake throw.

A held slot that changes value fails. A slot exemption without a declared value fails, including when that slot changes. A declared owner that does not match the value after the operation fails. `fromDeclared('candidate-af-up')` names or holds every full-state field, has no seal field, and has no slot exemption.

`classifyCommit` treats OK as a commit when the caller flag is false. AF-ON is a commit when the operation id is in the plan or the plan's AF-ON context is set. An OK with no expectation key is refused before the operation function runs, so the counting fake records zero deliveries. A sealed proof row that is missing also delivers zero key calls. A sealed row that is present delivers one key call, and the approval still compares title, highlight, and screen after the key. On a successful AF-ON release the identity title is the title after settle. The retained record keeps both the expected identity and the actual identity.

A null frame is refused when the gate requires a frame. A held frame that changes between the before and after captures fails. The same frame on both captures passes.

## Setup, coverage, and the custom zone

`runSetup` in `work/harness/setup_v2.mjs` performed five gated steps: `role-bring-up`, `role-lever`, `role-focus-arg`, `role-focus-289`, `role-focus-1712`. The fake counted one bring-up, one lever, and three calls. The second call received `d1` 41, which was the `d0` returned by the first call. The third call received `d1` 0. Bring-up and focus-1712 used `setupExpect()`. The other three steps used `holdAll()`. On this fake the captured state was stable, so those comparisons passed. The test does not show what a live bring-up does to the picture or to a held field.

`operationPlan()` has 101 keys, including `k1e:ke-s1-down`, `k1e:zone-z0-s1-up`, and `display:seed-a-e0`. Removing any one of those 101 keys makes `coverageProblems` non-empty. `declaredGaps()` reported no missing ids and no extra ids against the 279 declared steps. `judgeDown` for the K1e role and for the candidate role both reported `half`, `owner`, `target`, `halfTarget`, and `flag`.

`driveCandidateZone` was called with one custom row. `bindSession` bound the mode writer. The fake's `sim.write` saw the mode address, and the function returned. The fake hooks object was given `counts.writer` 7 before the call, so the writer log line passed on that supplied count.

## Scanner and recorder

`static_check_v9.mjs` rejected each planted bypass on a fake filename: `armPress`, `ctx.key`, `ctx.s.key`, `dial_input`, `setPose`, `setKey`, `sim.write`, `sim.u8`, `sim.word`, `writeU32`, `writeU16`, `nk.svc`, `bringUp`, `tap`, `raw-ok`, `press`, `native`, `l.call`, and `switch_input`. `assertClean` accepted `work/harness` and `work/scripts` after those files were written.

The refresh recorder kept a return value of 42, kept a substitution, categorised a setup getter, and reported an orphan and a null outside return. Each window kept the sample taken inside it. A later sample did not replace it. With `hookGetter` enabled, the getter return hook and `passthrough` filled `ret` 9 for key `0x1e71` and stored category `assert`. A `sampleNow` callback ran while the window's end time was still empty, and the stored sample time sat inside `[tEntry, tEnd]`.

## Display job on the fake

`driveJob` from `work/harness/display_v5.mjs` ran the stock K1 job on a fake. The fake's memory was painted from `DECLARED.setup` and its `frameSample` returned the centre marks, 444 pixels, and `n31` 444. The job reported `k1-refresh` with pass true. Every refresh window had `sampleT` inside `[tEntry, tEnd]`. A getter for key `0x1e71` outside those windows had category `assert` and a non-null return. The picture was the supplied sample, so this run does not show a live screenshot.

`display_v4.mjs` still imports `om-emu/checks/lib/png.mjs`, which is not a file. The runners import `display_v5.mjs`, which loads `om-emu/emu/checks/lib/png.mjs`.

## Inventory and the freeze

The inputs probe under `inventory_register_v4.mjs` exited clean. The exit record includes `argv` and `execArgv`. The read set includes the T6 overlay, the E147 firmware block `blk00000000`, and the resource block `blk02000000`. The NAND note is empty, with a null backing path. A thrown probe still wrote an exit file. Setting `T12_INVENTORY_FAIL=1` still wrote an exit file, and the process reported `inventory init failed`.

`write_freeze_v5.mjs` loaded each T13 v2 runner with `T12_LOAD_ONLY=1` and `OM_EMU_NVRAM=off`. The freeze has 177 files, 140 under `om-emu/`, and the five `ref/` modules the junction resolves outside the workspace, including `zone_session_k1.mjs`. It also lists `model.mjs`, `menu.mjs`, `display.mjs`, and `png.mjs`. `runZone` was not called.

There is no storage decision and no hardware recommendation. Two T9d items stay unresolved and non-blocking: the mode-selecting getter input, and the producer of `0x610c8b66`.
