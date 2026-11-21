# T13 acceptance harness: design (Opus)

Status: design for review before implementation. EMULATOR-ONLY. Owner decision 2026-11-20 (escalation option 4):
Opus writes the harness, Grok only runs it, Sol reviews both. The acceptance bar is unchanged: every requirement of
T11 §1–§3, T11 §6, T12 §1/§3 and T12b §1/§3, as stated in the six Sol reviews, applies.

## 0. Principles

Each recurring defect class is closed by a mechanism that does not depend on enumerating cases:

| Class (Sol findings) | Mechanism |
|---|---|
| Raw inputs / writes bypass the gate; scanner misses APIs | **No runner code exists.** Runs are selected by plan name; plans are data. The only executable code is the harness itself (reviewed). The session object never leaves one module's closure. |
| Read inventory misses interfaces or paths | **Node permission model.** The run process starts with `--permission` and `--allow-fs-read` limited to frozen files/directories; every read form (named imports, Buffer/URL paths, descriptors, FileHandle, streams, promises, `stat`, `import()`, `require`) is refused by Node itself (probe below). |
| Freeze incomplete or enforcement optional | **The launcher is the only way to start a run.** It verifies the freeze against disk (every file under every allowed directory must be listed), spawns the restricted child, and re-verifies after exit. The child refuses to run unless it is restricted and its `execArgv` equals the launcher's. |
| Separately enumerated coverage drifts | **One plan module** defines every operation; execution, coverage and identity all iterate it. |
| Expectations shape-only, exempted, or circular | **Two layers** (§3): every operation of every role is compared field by field with its sealed identity-pass record; behavioural claims are relations between roles, evaluated on real emulator states. The fake is used only for unit tests and knows no expectations. |
| Tests target older versions | Tests import the frozen modules by the same paths the run uses; the freeze includes the tests' own hashes and their retained output. |

Permission probe (Node v26.12.1, this machine): with `--permission` and reads allowed for three files only, the
following were all refused with `ERR_ACCESS_DENIED`: named `readFileSync`, `fs.openSync`, Buffer path, URL path,
`statSync`, `fs.promises.readFile`, dynamic `import()` of an unlisted module, and a write. An allowed file and an
allowed import succeeded.

## 1. Files (`work\harness\`, versioned names, never edited after running)

- `launch_v1.mjs` — the only entry. `node launch_v1.mjs <plan> <tag>` (plans: `identity`, `proof`, `display-a`,
  `display-b`, `display-k2`, `display-k1`). Unrestricted parent. Steps: refuse if `work\out\<tag>\` exists; load
  `freeze_v1.json`; verify every listed file's length and SHA-256; for each allowed directory, enumerate it
  recursively and refuse if any file is unlisted; for `proof` and `display-*`, require the sealed identity output of
  a named identity tag and add it to the read list; spawn `node --permission --allow-fs-read=<files and dirs>
  --allow-fs-write=work\out\<tag>\ run_v1.mjs <plan> <tag>` with `OM_EMU_MODEL=E147`, `OM_EMU_NVRAM=off`; record
  the command line, `execArgv`, environment and start time to `work\out\<tag>\cmd.json`; after exit, re-verify every
  listed file and write `exit.json` (ok only if child exit 0 and no drift).
- `run_v1.mjs` — restricted child. Before importing any non-built-in module: assert `process.permission` exists,
  that reading a sentinel outside the allow list is refused, and that `execArgv` equals the value the launcher
  recorded; then import `session_v1.mjs` and execute the plan.
- `session_v1.mjs` — creates the emulator session (through the accepted `runZone` of `zone_session_k1.mjs`) inside a
  closure; installs the accepted combined hook (`afon_hooks_v7.mjs`, byte-identical) for candidate roles; installs
  the accepted refresh recorder (`refresh_v4.mjs`) for display roles; wraps raw `ctx.key`, `ctx.press`, `ctx.s.key`,
  dial, `inject`, `g4_set`, `set`, `switch_input`, `ctx.l.call` and simulator writes so that they throw unless the
  gate is delivering (defence in depth; the plan interpreter is the only caller).
- `gate_v1.mjs` — one function `perform(op)`: (1) commit class decided from the op's input, never from a flag;
  (2) for a commit in proof mode, sealed identity row present, else refuse with zero inputs delivered; (3) capture
  full state and frame; (4) deliver exactly one input (one edge, one detent, one pose change, one setter write, one
  native setup call); (5) settle for the op's declared emulated time; (6) capture full state and frame; (7) compare
  (§3); (8) for a commit, read identity at the screen that is now up and compare with the sealed row. Any problem
  stops the run.
- `state_v1.mjs` — full state: all 63 T8c slots in every bank, 71-byte mirror and the mode flag, both ten-byte
  records, owner, `0x1e71[0]` (getter readback), pose word, screen, size record, and the frame signature taken from
  the real framebuffer for display roles. No field may be absent; absence is a failure.
- `plan_v1.mjs` — every operation as data: id, role, input, settle time, commit flag derived by rule, relation
  references. Built from the accepted T8d table (`table_v2.mjs` content), the zone navigation and custom traversal,
  the pose-after-non-reset-edit case, the setup sequence (each native call one op), and the four display jobs.
- `relations_v1.mjs` — the behavioural claims (§3.2), each with provenance to a decision.
- `seal_v1.mjs` — writes and verifies identity-pass records and their SHA-256 seal.
- `fake_v1.mjs` and `test_v1.mjs` — unit tests (§5).
- `freeze_v1.json` — generated by `make_freeze_v1.mjs`: the harness files, the accepted reused modules (byte-identical
  to their accepted sources), the OM-Emu checkout source tree (revision, diff digest, and every file), the decoded
  firmware/resource inputs, the overlays, and the T9d references.

## 2. Plans

- `identity`: roles K1e, K2, candidate (T8d sequence incl. pose-after-non-reset-edit), zone K1e and zone candidate
  (seven zones press and release, custom), then display A, B, K2, K1. Records every operation's full after-state,
  every commit's identity (title hash and highlighted row, read after the input), and every refresh record. Seals.
- `proof`: the same T8d and zone roles; every operation compared with the sealed record; commits refused without a
  sealed row.
- `display-a`, `display-b`, `display-k2`, `display-k1`: the T9d validation per job, compared with the sealed record
  and with the hashed K1e references; every-refresh getter records.

## 3. Expectations

### 3.1 Layer 1: reproduction (every operation, every role, every field)

For each operation, the expected after-state is the sealed identity-pass after-state of the same operation, compared
on every field of §1 `state`: no exemptions, no shape checks, no holds. Setup operations whose live effect is not
known in advance are covered the same way (their observed delta is sealed). Identity: expected title hash and
highlighted row from the sealed record. A preservation check also runs in both passes: any field that a declared
relation or the op's input class cannot change (e.g. bank slots other than the active bank during a key in shooting
mode) must equal its before-value; these preservation rules are listed per input class in `relations_v1.mjs`.

### 3.2 Layer 2: requirements (non-circular, real states)

Evaluated in both passes on real emulator states, never on fake data:

- AF-ON press record (landscape, EXIF 6, return): equals K1e's S1 press record after the same keys.
- AF-ON release record: equals the candidate's own S1 record in the same state, cross-checked with K2.
- Normal edit: all 63 slots equal K2 after the same keys; the mirror is unchanged.
- Pose gate: after the non-reset normal edit and a pose change, live `0x5962[0]` equals K2's.
- Zone press and release for all seven zones and custom: equal zone K1e.
- Owner 2 on AF-ON down, 0 on up; owner 1/0 on S1; `0x1e71[0]=0` after every op.
- Writer calls: 3 (T8d roles) and 7 (zone candidate), from the installed hook's own counter; no runner arming.
- Display: frames equal hashed K1e references (A Small, B Single) on all 12 edges; K2 and K1 stock; changing edges
  redraw within the 599.6 ms bound; every refresh window has getter records with refresh id, time and an in-window
  frame signature.
- Exits: every AF-ON exit matches the K2 control sequence it names.

## 4. Records

Per run: `cmd.json`, `exit.json`, the JSONL of every op (before, after, problems, identity expected/actual), the
seal. `result.md` and `harness.md` state only what the tests and runs demonstrate. Manifest generated from the
freeze plus the run outputs; external seal. Sections from the image (only `0x610bf5e3`–`0x610bf5e5` in section 7).

## 5. Unit tests (pure Node, fake emulator)

The fake implements the session surface the harness uses, with memory that changes only through its own simple
model of inputs (it does not import plans, relations or seals). Tests: commit refused with zero deliveries when the
row is missing; a changed unexpected field, a wrong value and an absent field each fail; preservation violations
fail; identity read after the input; raw-call wrappers throw outside the gate; the child refuses to run unrestricted
or with different `execArgv`; the launcher refuses an unlisted file in an allowed directory, a changed file, and
drift at exit; a planted module importing an unfrozen file fails with `ERR_ACCESS_DENIED`; the recorder keeps
returns and substitutions and links in-window samples. Tests run under the launcher's restricted mode as well.

## 6. Execution split

Opus writes and unit-tests the harness (no emulator). Sol reviews. Grok then runs only `launch_v1.mjs identity`,
`proof` and the four display plans, with no edits; Sol reviews the results.
