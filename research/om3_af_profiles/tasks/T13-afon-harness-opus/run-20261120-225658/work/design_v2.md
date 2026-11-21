# T13 acceptance harness: design v2 (Opus)

Supersedes `design.md` (kept unchanged) after Sol's REJECT-DESIGN `run-20261120-184738-review`. Each of its seven
required corrections is answered in §9. EMULATOR-ONLY. Owner decision 2026-11-20: Opus writes the harness, Grok only
runs it, Sol reviews both; the acceptance bar is unchanged.

## 0. Threat model and principles

The harness protects against **mistakes**: accidental bypass of the gate, accidental reads of unfrozen or changed
files, drift between plan, coverage and execution, and expectations that are absent, shape-only or circular. It does
not claim isolation from deliberately malicious code; all executable code is the harness itself, reviewed by Sol.
Node's documented permission-model limits are handled explicitly in §2.

| Class | Mechanism |
|---|---|
| Gate bypass | No runner code. Plans are frozen data (`plan_v1.mjs` exports only plain objects; a validator rejects functions, getters and unknown keys). The session object exists only inside `session_v1.mjs`. |
| Read inventory | Two layers: **recording** (the accepted T12b loader hook plus `fs` wrappers record every module load and every read path with first-read SHA-256) and **enforcement** (Node `--permission` restricts reads to the freeze). A read must be both recorded and permitted; an unrecorded permitted read is still covered by the parent's before/after hashing of every permitted file. |
| Freeze | Execution-derived on the fake (§5) plus the explicitly listed real-only inputs; enforced by the launcher before and after; the child refuses to run without the launcher's per-run nonce file (§2). |
| Coverage drift | One plan module; execution, coverage, identity rows and the identity seal all derive from it and the seal records its hash. |
| Expectations | Per-operation, per-field source map (§4): reproduction against the sealed identity pass **and** the accepted table/display relations evaluated on real states. |

## 1. Files (`work\harness\`, versioned names, never edited after running)

- `launch_v1.mjs`: the only entry (`node launch_v1.mjs <plan> <tag> [--identity <tag>]`).
- `run_v1.mjs`: restricted child; `inventory_v1.mjs` (recording, derived from the accepted T12b registrar v6 parts).
- `session_v1.mjs`: emulator session. **Derived from `zone_session_k1.mjs` `runZone`**, with a retained line diff
  (`session_v1.diff`) limited to: per-tag output paths; in-memory NVRAM (§3); `bringUp()` split into five functions;
  overlay CSV written under the tag. The T3a hooks, help records, face hook, `0x120b` override and overlay
  application are unchanged.
- `gate_v1.mjs`, `state_v1.mjs`, `expect_v1.mjs` (§4), `relations_v1.mjs` (port of `table_v2.mjs` field rules and
  `display_v5.mjs` `edgeExpect` routing), `plan_v1.mjs`, `seal_v1.mjs`, `fake_v1.mjs`, `test_v1.mjs`,
  `make_freeze_v1.mjs`.
- Reused byte-identical: `afon_hooks_v7.mjs`, `refresh_v4.mjs`, `predicates_v3.mjs`, `lib_map_c1.mjs`, `pose.mjs`,
  `accept_lib_v4.mjs` (`titleBand`), `lib_valid_t9d.mjs` (references and mark analysis).

## 2. Launch boundary

Launcher (unrestricted parent), in order; any failure writes `work\out\<tag>.launch\exit.json` with `ok:false`:

1. Install exit handlers first. Refuse if `work\out\<tag>\` or `<tag>.launch\` exists.
2. Runtime: `process.execPath` must be the pinned `tooling\node-v26.12.1-win-x64\node.exe` with its SHA-256 in the
   freeze; `process.version` must be `v26.12.1`.
3. Load `freeze_v1.json`; canonicalise every path with `realpathSync.native`; refuse any path outside the workspace
   or the research tree; refuse any symbolic link, junction or reparse point inside an allowed directory; verify
   length and SHA-256 of every listed file; enumerate every allowed directory recursively and refuse any unlisted file.
4. For `proof` and `display-*`: require `--identity <tag>` whose `<tag>.launch\exit.json` is `ok:true`, whose seal
   verifies, and whose seal records this freeze's SHA-256 and the plan's SHA-256; add its files to the read list and to
   the before/after hashing.
5. Write a random nonce to `<tag>.launch\nonce` (child: read-only permission on that file only).
6. Spawn the child with: `execPath` (pinned), arguments
   `--permission --allow-fs-read=<canonical files and dirs> --allow-fs-write=<canonical work\out\<tag>\>` and no
   others; `env` built from scratch (`OM_EMU_MODEL=E147`, `OM_EMU_NVRAM=off`, `SystemRoot`, `PATH` limited to the
   pinned Node directory; no `NODE_OPTIONS`, no `NODE_*`); `stdio: ['ignore','pipe','pipe']` (no inherited
   descriptors); `cwd` the workspace. Record exact command, arguments, environment, start time in
   `<tag>.launch\cmd.json` and capture stdout/stderr to `<tag>.launch\`.
7. After exit: re-verify every listed file and identity input; re-enumerate allowed directories (additions fail);
   compare the child's recorded reads with the freeze (any read not in the freeze, or any first-read hash differing,
   fails); write `<tag>.launch\exit.json` with `ok` only if all pass and the child exited 0.

The child cannot write `<tag>.launch\`. **A run is valid only if its `<tag>.launch\exit.json` is `ok:true`;** child
output without it is invalid by definition. The child, before importing any non-built-in module, checks
`process.permission`, that a sentinel outside the list is refused, that `execArgv` contains exactly the launcher's
flags, that `NODE_OPTIONS` is absent, and that the nonce file is readable; it echoes the nonce into its first log line,
which the launcher checks.

Node limits (permission documentation): existing descriptors (none inherited, stdio piped); symlinks (refused in
step 3); pre-initialisation reads and the entry file (entry `run_v1.mjs` is in the freeze and hashed); preloads (none:
no `--import`/`--require` other than the launcher's own flags, verified by the child); non-`fs` access such as SQLite
(no such module in the freeze, verified by the import record). Probes for each in §6.

## 3. Session compatibility

- Outputs: everything the session writes goes to `work\out\<tag>\` (session JSONL, screenshots, overlay CSV).
- NVRAM: an in-memory object with the `fileNvram` interface; `load()` returns `null` (blank camera, as
  `OM_EMU_NVRAM=off` and the T8c fresh store); `save*` calls are recorded in the log and kept in memory. No NVRAM file
  is read or written.
- Bring-up: five gated operations: `init-6071181e`, `init-608fe1b0`, `init-609df7e4`, `take-focus-act` (checks
  TAKE_FOCUS entry, state, flag; `act_tsk`), `take-focus-settle`. Then the lever and the two focus calls (T12
  split), each one operation.
- Trusted internal paths: wrappers make the **delivery** APIs (`ctx.key`, `ctx.press`, `s.key`, `s.dial_input`,
  `s.inject`, `s.g4_set`, `s.set`, `s.switch_input`) throw unless the gate is delivering. State capture, getter reads
  through `ctx.l.call`, and hook code running inside emulator callbacks use `l.sim`/`l.call` unwrapped. Native setup
  calls through `l.call` are made only from `session_v1.mjs` setup functions invoked by the gate.

## 4. Expectation source map

Full state per operation: 63 slots (all banks), 71-byte mirror (head 55, tail 16), mode flag, consumer and
half-press ten-byte records, size record (72 bytes), owner, edge status/enabled, `0x1e71[0]`, pose word, getter
read-bank record, screen, frame signature (display roles, real framebuffer).

**4.1 Reproduction (proof and display plans).** For every operation of every role, every field equals the sealed
identity-pass value (absolute), **and** every field whose identity-pass delta was zero must have a zero delta in the
proof (preservation rule; this carries the T12b sealed setup-delta rule to every operation). Commits: title hash and
highlight equal the sealed row.

**4.2 Behaviour (all plans, including identity).** Ported unchanged in meaning from the accepted sources:
- `table_v2.mjs` field rules for every T8d step and role: flag (`flagOn`/`flagOff`/`flagImage`/`flagClear`), mirror
  (`mirrorFrom`, factory at entry, tail from K1e base at entry), half cells (`k1e-move`, `k1e-hold`,
  `edited-vs-reset`, `normal-move`, `normal-hold`, `pose-hold`, `reset`, each with its `halfRef`), owner (`ownerLit`,
  S1 1/0), edge status 0 / enabled 1, pose word and bank (`pose`, `bank`, `bankFrom`, read-bank via `judgeRead`),
  press records (`pressFrom` = K1e S1 down of the named step), release records (`releaseFrom` = the candidate's own
  named S1 step), cross-check `crossS1` with K2, `matchExit` control sequences, size record preserved, `0x1e71[0]=0`.
  Where `table_v2` used `seal`, the field is covered by 4.1 reproduction only, and the source map says so.
- Pose-after-non-reset-edit: all 63 slots and the mirror equal K2's after the same operations (not only
  `0x5962[0]`); no live store of the saved mirror position (installed hook's watch record).
- Zone: each of seven zones and custom, press and release ten-byte records equal zone K1e for the same zone.
- Display (`display_v5.mjs` routing): seeded A and B use their K1e references on owner-2 edges and the K2 reference on
  other edges; K2 its own reference; K1 stock with owner 255 and the centre mark; owner, target and half-target per
  `edgeExpect`; changing edges redraw within 599.6 ms; recorder rules (§4.3).
- Writer counter from the installed hook: 3 (T8d candidate), 7 (zone candidate).
- Identity pass validity: since 4.1 cannot apply in the identity pass, its validity rests on 4.2 alone; the identity
  pass fails if any 4.2 relation fails.

**4.3 Recorder.** Accepted `refresh_v4.mjs`: passthrough returns retained, substitutions recorded, getter calls
outside a refresh assigned to a declared category (`setup`, `seed`, `boot`, `link`, `watch`, `assert`), and any
null return, orphan, unclosed window or truncation fails. Each refresh window has a frame sample taken inside it.

`expect_v1.mjs` emits, for each operation, the explicit map field → source (`sealed`, `literal:<v>`,
`ref:<role>:<op>:<field>`, `preserve`), retained in the log.

## 5. Plans, identity coverage and freeze

- Plans: `identity` (K1e, K2, candidate T8d roles; zone K1e, zone candidate; display A, B, K2, K1), `proof` (T8d
  and zone roles), `display-a`, `display-b`, `display-k2`, `display-k1`.
- Identity coverage: before any proof or display plan, the child verifies the sealed identity rows contain one row
  per commit operation of that plan (keys `plan-sha:role:op-id`); missing rows refuse before any session starts. The
  gate also refuses a commit without its row, with zero deliveries.
- Freeze: `make_freeze_v1.mjs` runs all six plans through the same launcher and child on the fake (`--fake`), records
  their reads, and writes the freeze as: union of fake-run reads, plus the OM-Emu checkout source tree (revision, diff
  digest, every file), plus real-only inputs listed with reasons (decoded images, overlays, T9d references). Real runs
  retain their own read inventory, which must be a subset.

## 6. Unit tests (pure Node, fake; retained command, stdout, exit)

All six plans end to end on the fake through the common implementation; commit refused with zero deliveries
(static and dynamic missing row); identity read after the input; a changed unexpected field, a wrong value, an absent
field, and a preservation violation each fail; identity-bearing plan deletion removes execution and coverage
together; custom-mode reachability; pose instrumentation toggles change no refusal (accepted hook); recorder
integration incl. return-hook completion, substitution, categories, orphan/null/unclosed failure, in-window sampling;
plan validator rejects functions/getters; launcher refuses unlisted file in an allowed dir, changed file, link inside
an allowed dir, wrong runtime, `NODE_OPTIONS`, missing identity seal, drift at exit; child refuses unrestricted
start, wrong `execArgv`, missing nonce; permission probes on the pinned runtime for named imports, `require`,
`createRequire`, `import()`, Buffer/URL paths, `open`+`read`, `readv`, FileHandle, streams, `fs.promises`, `stat`;
initialization failure and abnormal exit write a failing `exit.json`.

## 7. Execution limits

Grok runs exactly six processes, one per plan, in order; stop at the first failure; any further process needs the
coordinator's written authorization. No edits to any frozen file.

## 8. Unchanged carried items

Non-blocking T9d items: the getter input selecting the mode template; the producer scheduling `0x610c8b66`. Section
7 limited to `0x610bf5e3`–`0x610bf5e5`. Optional: custom release with a distinct live profile (will be included as an
extra zone-candidate case if it costs no extra process).

## 9. Answers to the design review's required corrections

1. Source map and relations: §4 (ported `table_v2`/`display_v5` semantics; reproduction vs behaviour separated;
   setup-delta preservation generalised).
2. Identity coverage bound to plan, role, op: §5.
3. Actual read inventory and execution-derived fake evidence alongside permission: §0, §1, §5, §6.
4. Launch boundary: §2.
5. Session compatibility: §3.
6. Inherited tests: §6.
7. Limits, stop rule, seal linkage, T9d items, versions: §2 step 4, §7, §8.
