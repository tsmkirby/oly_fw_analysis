# OM-3 project state

Opus (coordinator) maintains this file. It **points to** evidence; it does not restate it.
If this file and a linked document disagree, the linked evidence wins: correct this file
and add a decision-log entry.

Last updated: 2026-11-17 (Phase 1 preparation).

## 1. Continuation point

- **Now:** T3f is running. It gives the AF-ON row an editor binding of its own.
  - In T3e (accepted), the row's own action record opened a native chooser, but confirm committed stock
    UI 2154, because the record's second word selects the editor and its bound setting.
  - T3d showed that the page-27 action table, not a registered key, decides whether OK opens a chooser.
  - Storage (Q7) is not a prerequisite for the UI prototype.
  - T2b, T3a, T3c and T3d are closed (18 Nov); T3e is accepted.
  - **T2b:** UNRESOLVED. The `0x5b82` line was rejected four times. The storage question is with the
    owner (Q7).
  - **T3a:** BLOCKED. The row draws and native keys reach it (label `0x0DD2` "AF Target Mode", UI ID
    `0x3D6F`, 140 overlay bytes in the section-1 tail), but OK opens no editor. Page 28 never appears
    in the OM-3 menu.
- **T1 outcome:** on page 27, value 0 = "always the selected AF target" and value 1 =
  detected-subject priority. The top row is 2154 = `0x90a1[0]` and the bottom row is
  2155 = `0x90a1[1]`. Which row is the shutter (inference: top) and the AF-ON key binding are open.
- **Last research result:** live OM-Emu native AF initialization and central button
  dispatch, 16 Nov ([AFON-MENU-RESEARCH.md §8](analysis/button-af/AFON-MENU-RESEARCH.md#live-native-initialization-and-central-button-dispatch-2026-11-16)).
- **Last owner observation:** 17 Nov, stock AF Button setting
  ([AFON-MENU-RESEARCH.md §1](analysis/button-af/AFON-MENU-RESEARCH.md#stock-per-button-subject-detect-setting-likely-answer-to-the-owners-belief)).
- **Readiness: NO-GO.** No installable image exists; the camera has never been flashed.
  Offline prototypes are permitted; deploying anything to the camera is not.

## 2. Objective and completion conditions

Independent AF target profiles for shutter half press and AF-ON on OM-3 E147 1.1 (main build
1100). Authoritative spec: [FEATURE-SPEC.md](analysis/button-af/FEATURE-SPEC.md), starting
with its 10 November revision.

The autonomous programme ends at either of these:

- **A. Verified software proof.** The independent AF-ON profile is implemented and shown
  by reproducible software testing or emulation to have every required behaviour in §3,
  with Sol's independent review. Partial demonstrations, isolated fixtures and plausible
  static readings are reported as such, never as complete proof.
- **B. Genuine hardware dependency.** No further feasible software method (better emulation,
  instrumentation, static analysis, targeted experiments, alternative offline checks) can
  resolve what remains. The report states exactly what is unproven, why software cannot
  settle it, and the minimum hardware tests that would. An emulator limitation is not
  declared a hardware limitation without investigating the alternatives first.

## 3. Current design

| Aspect | Current design | Since | Source |
|---|---|---|---|
| Half press | Normal stock AF target; Subject Detect follows SCP | 31 Oct | FEATURE-SPEC |
| AF-ON profile | Own saved AF-ON zone (type, size, position per orientation) | 10 Nov | FEATURE-SPEC revision |
| AF-ON menu | New row on page 27 (AF Button), after the two priority rows; AEL/AFL page untouched | 13 Nov | AFON-MENU-RESEARCH §6 (owner) |
| AF-ON Subject Detect | Stock AF Button setting "Always tracks focus on the selected AF Target Point"; no firmware bypass | 17 Nov | owner, stock hardware |
| S-AF/C-AF | Shared | 31 Oct | FEATURE-SPEC |
| Precedence | AF-ON wins while both held; release restores (proposed, not hardware-tested) | 31 Oct | FEATURE-SPEC |
| Persistence | AF-ON profile survives power-off | 10 Nov | FEATURE-SPEC revision |
| Display | AF-ON target shown while AF-ON controls AF | 10 Nov | FEATURE-SPEC revision |

**Superseded:** AF Home as the AF-ON source (10 Nov) and the firmware Subject Detect bypass
(17 Nov). Their evidence remains valid as a record of the button path only.

## 4. Tasks

| ID | Task | Status | Record |
|---|---|---|---|
| T0 | Isolation and tool canary | **Accepted (qualified)**, attempt 7 | [decision](tasks/T0-canary/decision.md) |
| T1 | Page-27 row and value mapping | **Accepted** (value meaning and row↔storage settled; Q1/Q3 open) | [decision](tasks/T1-page27-mapping/decision.md) |
| T2 | Ownership proof for unclaimed cells `0x5b82` / `0x5b52` | **Closed: UNRESOLVED** (two Sol rejections; escalated) | [decision](tasks/T2-cell-ownership/decision.md) |
| T2b | Close Sol's open items for `0x5b82` | **Closed: UNRESOLVED** (two Sol rejections; storage escalated, Q7) | [decision](tasks/T2b-cell-ownership-gaps/decision.md) |
| T3a | AF-ON zone row on page 27, RAM-only profile (OM-Emu) | **Closed: BLOCKED** (row drawn; no editor opens; two Sol rejections) | [decision](tasks/T3a-afon-zone-row/decision.md) |
| T3c | Route the zone row to a stock editor: measure the editor dispatch and pages 28/29, then prototype R1 | **Closed: BLOCKED** (two Sol rejections; substance confirmed). Dispatch branch `0x6124f7d4`: D0=4 for stock rows, 1 for `0x3D6F`. Provider ID decides (E4). Pages 28/29 dead on OM-3 | [decision](tasks/T3c-afon-editor-routing/decision.md) |
| T3d | Registered-key hypothesis: `0x3D6F` → registered key cell (EMULATOR-ONLY, `0x5b82[0]`) — does the native chooser open and commit? | **Closed: hypothesis refuted; finding accepted (qualified).** The page-27 action table (`0x6150f5f0`, 24-byte records, UI ID at +4, compare `0x611a26e1`) decides | [decision](tasks/T3d-afon-registered-key/decision.md) |
| T3e | Own action record for `0x3D6F`; confirm/cancel into the RAM profile; then the zone list; acceptance | **Accepted with corrections.** Its own record opens a chooser, but with the second word `0x1e3`, confirm commits UI 2154 | [decision](tasks/T3e-afon-action-record/decision.md) |
| T3f | Editor binding of its own: trace `0x611a01e8` (second word → editor → committed UI ID); commit `0x3D6F`; zone list; acceptance | Running | [tasks/T3f-afon-editor-binding](tasks/T3f-afon-editor-binding/brief.md) | [tasks/T3c-afon-editor-routing](tasks/T3c-afon-editor-routing/brief.md) |
| T3b | AF-ON target-position editor routing | Queued after T3c (uses T3c's R2 measurement) | AFON-MENU-RESEARCH §9 |
| — | Beyond T3: persistence, display, hook point (Q4), acceptance matrix | Planned by Opus as results arrive | §2 |
| — | CPU3 request/loader port | Deferred; regression only | AFON-MENU-RESEARCH §9 item 5 |

## 5. Blockers

| Blocker | Blocks | Needs | Source |
|---|---|---|---|
| No proven storage for the AF-ON profile | Persistence (not the RAM-only UI work) | **Owner decision, Q7** | T2/T2b decisions; AFON-MENU-RESEARCH §8 |
| The AF-ON row opens no editor | T3 acceptance | T3c | T3a decision |
| No CPU3 service in OM-Emu; TAKE logger maps `0x50003090` read-only | Detection-on regression cases | Deferred work | AFON-MENU-RESEARCH §8 |
| Repeated AF-ON presses blocked by the display-completion fixture | Stress evidence | Stock display state; stage-2 G1 | Stage-0 record, "Next work" #1 |
| Gate 1 secondary-chip reply; gate 4 updater and recovery | GO | Hardware stages | AF-GAP-CLOSURE-ASSESSMENT gate table |

## 6. Open questions

- **Q1. Unconfirmed:** whether hardware stage 1 (stock re-flash rehearsal) was run. No log exists. *Owner.*
- **Q2. Unconfirmed:** whether two off-camera copies of the stock container have been verified. *Owner.*
  Neither Q1 nor Q2 blocks offline work.
- **Q3.** Value meaning settled by T1 (0 = always the selected target). Still open: which row is
  the shutter and which the AF-ON button (inference: 2154 = shutter), and whether 2155 follows
  the physical AF-ON key or function `0x0a`. *Owner glance at the menu icons; later hook task.*
- **Q4.** Final hook point. The archived installer redirects rows `0x6131bd50`/`0x6131bd60`;
  the 16 Nov live S1 selected `0x61339090`/`0x613390a0`; the working emulator path hooks
  `0x610bf5e2` (section 7, no placement proof). Phase-plan stage 6 still assumes the table redirect.
- **Q5.** Does the AF-ON position editor need a second row (page-29 pattern)? *T3.*
- **Q6.** Section-4 tail run-time use; secondary-CPU/DMA ownership of the reserved tails.
- **Q7. Storage for the AF-ON profile. *Owner decision* (escalated 18 Nov).**
  - **What is established.** The unnamed cells of `0x5b82` (26 bytes) fit the 18-byte CRC layout. Custom
    Mode C1 does not store this key, so the profile would be global, not per custom mode. The default and
    reset paths write zeros, which decode as "no profile". The factory adjustment and debug paths can
    write any key and are classified as not normal operation.
  - **What is unresolved.** After four Sol reviews, the following are still open: a few data occurrences
    of `0x5b82` whose structure is unidentified, the key fields +0x50/+0x52 of one setter table, and
    three `mov 0x5b8` explanations.
  - **Options.**
    - (a) Accept `0x5b82` with that residual risk; the CRC protects against misreading.
    - (b) Commission a different storage approach, for example a new registered key or another owned area.
      This is larger work and needs its own research.
    - (c) Keep the profile RAM-only, resetting at power-on. This contradicts FEATURE-SPEC's persistence
      requirement.
  - **Update 18 Nov (T3c):** I suspected the menu row depends on this choice.
  - **Corrected by T3d (confirmed by Sol):** mapping the row to a registered key alone did **not** open the
    chooser. What decides is a page-27 action table: 24-byte records keyed by UI ID, at `0x6150f5f0`,
    count 2, compared at `0x611a26e1`. The menu row needs an action record, so the storage choice is
    again not a prerequisite for the UI prototype.

## 7. Operating rules (owner, 17 Nov)

- **Autonomy.** After T0 passes, Opus runs the loop: choose the next justified task → Grok →
  Sol review → accept, reject or correct → preserve → update this file → next. No owner
  approval per cycle. Every substantive result gets a Sol review.
- **Owner approval still required for:** any physical-camera operation or flashing;
  irreversible hardware steps; new API charges or subscriptions; destructive repository or
  research-data operations; any push or GitHub change (including the archive branch and
  PR #19); material changes to the functional requirements. A storage design that changes
  user-visible behaviour (for example, giving up an existing setting) is treated as a requirement change.
- **Loop limits.**
  - A task gets at most one correction round; a second failure of the same approach means a
    different approach, or a written escalation to the owner.
  - Timeouts: Grok 180 min, Sol 60 min.
  - Never re-run an identical failed brief.
  - Record any usage figures the CLIs report in each run log. If an agent reports a
    subscription limit, stop and write the state down; do not switch to paid usage.
- **Isolation (every agent run).** See §9. If the lock or the audit reports a problem, the
  task is BLOCKED and autonomous work stops until it is understood.

## 8. Established findings (index)

- Stock inputs and hashes: [HARDWARE-STAGE0-RECORD.md §2](HARDWARE-STAGE0-RECORD.md#2-stock-inputs-verified-8-november-2026)
- Decompilation coverage and limits: [DECOMPILATION.md](DECOMPILATION.md)
- Queue 95, AF start path, gate table: [AF-GAP-CLOSURE-ASSESSMENT.md](AF-GAP-CLOSURE-ASSESSMENT.md)
- Task-context mutex repair; 28/28 profile edges (fixture); proposed 3,612-byte layout: [HARDWARE-STAGE0-RECORD.md](HARDWARE-STAGE0-RECORD.md#completed-verification)
- Menu tables, page 27, viewer/provider registration: [AFON-MENU-RESEARCH.md §6](analysis/button-af/AFON-MENU-RESEARCH.md#6-menu-structure-13-november) and "Live acceptance regression and third menu row"
- Settings registry, bank 7, storage options: [AFON-MENU-RESEARCH.md §8](analysis/button-af/AFON-MENU-RESEARCH.md#8-storage-for-the-af-on-profile-13-november)
- Live OM-Emu handoff (12 edges each in S-AF and C-AF, detection Off); 0/14 full acceptance: [report.json](analysis/button-af/readiness/om-emu-af-native1/matrix-cpu3-final/report.json)
- Hardware plan and stop rules: [HARDWARE-PHASE-PLAN.md](HARDWARE-PHASE-PLAN.md)

A fixture pass, a native result and a physical result are reported separately and never summed.

## 9. Workspaces, isolation and recovery

| Location | Role | Agent access |
|---|---|---|
| `C:\Dev\OM3-research` (not Git) | Research workspace | Read-only via the `ref\` junction; OS write-denied during runs |
| `…\contribution` on `om3-concise` | PR #19 working copy | None. Local `pre-push` hook refuses the PR branch, non-fast-forward updates and deletions |
| `C:\Dev\OM3-worktrees\archive` on `archive/om3-af-research` | Versioned text mirror | None (write-denied during runs) |
| `C:\Dev\OM3-tasks\<ID>\ws` | Disposable execution workspace per task | Grok writes `work\` (and `om-emu\` if the brief allows); Sol read-only |
| `tasks\<ID>\` | Task record: brief, STATUS, harvested runs, decision | Opus only |

**Primary boundary: Windows integrity levels.** The Cursor CLI's own sandbox is macOS/Linux
only (T0 attempt 1). Grok therefore runs as a Low-integrity copy of the CLI
(`C:\Dev\OM3-tasks\_agent`, built by `orchestration\Initialize-AgentRuntime.ps1`), and every
process it starts inherits Low integrity. Windows refuses Low-integrity writes to anything
labelled Medium, which is the default for all user files. Only the agent's home and the task's
`work\`, `state\`, `projects\` and `om-emu\` are labelled Low. Your sign-in
(`%APPDATA%\Cursor\auth.json`) is read in place, never copied.
Verified without the agent on 17 Nov: research tree, task root, user profile and other
`C:\Dev` projects all refused; Ghidra headless works at Low.

Run sequence (`orchestration\Invoke-Grok.ps1`, `Invoke-Sol.ps1`):
1. Pre-checks: pins, archive sync, no open Ghidra project.
2. Build the task workspace with copies of the pinned inputs, a private Ghidra project copy
   and launcher, and a private OM-Emu copy.
3. **OS lock:** a deny-write rule for this user on the research tree, the archive worktree,
   `~\.om-emu` and the workspace's supplied inputs.
4. Run the agent at Low integrity, with Cursor's allow list and deny rules (Cursor's own
   sandbox is unavailable on Windows, so it is not used), `OM_EMU_NVRAM=off`, TEMP inside the
   workspace, and the pinned tools on PATH (`java`, `node26`).
5. Unlock, always (in a `finally` block).
6. Audit: rule still present before unlock, workspace snapshot unchanged, inputs re-hashed,
   OM-Emu diff.
7. Harvest `work\` into `tasks\<ID>\run-<stamp>\`.

**Recovery after a crash during a run:** if `C:\Dev\OM3-tasks\.research-lock.json` exists,
the workspace is still write-denied. Run
`powershell -NoProfile -ExecutionPolicy Bypass -File C:\Dev\OM3-research\orchestration\Lock-Research.ps1 -Mode Unlock`
(the machine's execution policy blocks plain `powershell -File`).
It removes the rules and verifies that writing works again.

**Coordinator rule (18 Nov).** Opus makes no edits under the research tree while a Grok or Sol run is
active. The snapshot audit counts any such edit as a violation, and one did: see the T3d review
`audit-note.md`.

**Residual risks (documented, not hidden):**
- **Read access.** A Low-integrity process can still *read* anything the user can, including
  tokens in the user profile. Network access is also unrestricted. This is inherent to running
  a cloud agent as this user; no secret material is placed in task workspaces.
- The ACL lock alone could be removed by a process at the owner's integrity level; the agent
  runs at Low, which cannot modify a DACL on Medium objects. The rule's presence is still
  checked before unlock, and the snapshot audit still runs.
- The snapshot audit cannot see in-place edits inside the heavy generated trees, but both
  the integrity boundary and the ACL lock cover them.

**Incident, 17 Nov 2026 (resolved).** While preparing labels, a recursive `icacls /grant /T`
on `C:\Dev\OM3-tasks` followed the task workspaces' `ref\` junctions into the research tree
and added an explicit Full Control entry for the owner's account to its 4,545 directories.
No file contents changed, and the account already had Modify there. All 4,545 entries were
removed (the five `tooling\python-deps` directories with their own pre-existing ACLs were
left untouched), and sampled ACLs match their original shape. Rule since then: no recursive
ACL or label operation on any tree containing a junction; the scripts check for this and refuse.

## 10. Reference pins

| Item | Value |
|---|---|
| Container | `8c133084414533159f587bf46bfb4152714c4074312a47c8d8503e33d605696d` |
| Decoded main `0100` (base `0x60021020`) | `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` |
| Resource `0106` | `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059` |
| OM-Emu | `4e4ec4ef084542a7e30eecce56970c7e09c123c9` + local patch (CR-stripped diff `61cd1327…7702`) |
| Archive branch | local `archive/om3-af-research`: see `git log`; fork copy at `a2b6d44` (push pending owner approval) |
| PR #19 head | `af68f58` (fork `research/om3-af-profiles` = local `om3-concise`) |

## 11. Decision log

| Date | Decision | By | Source |
|---|---|---|---|
| 2026-10-31 | Independent stock target profile per button; S-AF/C-AF shared | Owner | FEATURE-SPEC |
| 2026-11-01 | SD installation route in scope | Owner | FEATURE-SPEC |
| 2026-11-09 | Mutex created in task context; IRQ installer makes no OS calls | Research | Stage-0 record |
| 2026-11-10 | Risk accepted for stages 1–3 only; one body; stage-1 Go | Owner | Stage-0 §1 |
| 2026-11-10 | AF-ON gets its own menu zone; AF Home not used | Owner | FEATURE-SPEC revision |
| 2026-11-13 | AF-ON zone row on page 27; AEL/AFL page untouched | Owner | AFON-MENU-RESEARCH §6 |
| 2026-11-15 | PR #19 reduced to concise docs + probe; full history in `archive/om3-af-research` | Owner/research | git reflog |
| 2026-11-17 | Stock AF Button setting handles AF-ON Subject Detect; no firmware bypass | Owner (hardware) | AFON-MENU-RESEARCH §1 |
| 2026-11-17 | Phase 1 approved: archive commit (local), untracked folder kept with a local exclude, push guards, PR #19 drafts archived, documents reconciled, orchestration installed | Owner | session |
| 2026-11-17 | Autonomy after T0; completion conditions A/B; approval boundaries as in §7; stage 1 and container copies unconfirmed | Owner | session |
| 2026-11-17 | Isolation: disposable per-task workspaces + OS deny-write lock + Cursor sandbox + audit; no unrestricted flags | Opus (owner requirement) | §9 |
| 2026-11-17 | Cursor sandbox unavailable on Windows; Grok runs at Low integrity instead, with a Cursor allow list naming the needed programs | Opus | T0 attempts 1–2; §9 |
| 2026-11-18 | After T2's second rejection: run T2b (Sol's open items only) and, alongside it, T3a with a RAM-only AF-ON profile; persistence decided later | Owner | session |
| 2026-11-18 | Concurrent Grok runs: one lock window per batch, a separate Low-labelled agent home per task | Opus | `orchestration\Invoke-Grok.ps1` |
| 2026-11-18 | Sol rejected the first runs of T2b and T3a; one correction round each. T2b: trace the open setter sources. T3a: measure page 28's editor and route the new row to it (at most four experiments, then BLOCKED). | Opus | brief §7 of each |
| 2026-11-18 | Both correction rounds rejected. T2b is closed as UNRESOLVED, and storage is escalated to the owner in writing (Q7). T3a is closed as BLOCKED. T3c is a different approach: measure the stock editor dispatch and pages 28/29, then prototype the row→editor route (R1). | Opus | T2b/T3a decision.md |
| 2026-11-18 | Sol rejected the first T3c run. Correction round: isolated experiments. E1 is row 2154 copied with only the ID changed. E2 is a text zone list built from the stock zone-name strings, because the stock chooser rows use text options and the dead page-28 rows use images. | Opus | T3c brief §7 |
| 2026-11-18 | T3c correction rejected on wording only. Closed as BLOCKED, with Sol's qualifications applied in decision.md. T3d tests the registered-key hypothesis offline. | Opus | T3c decision.md |
| 2026-11-18 | T3d refuted the registered-key hypothesis: the page-27 action table decides. Accepted with Sol's qualifications, without a correction round. The evidence gaps (uncapped traces, compare operands, the `*_ORIGINALLY` cells) are mandatory in T3e. | Opus | T3d decision.md |
| 2026-11-18 | Audit flag in the T3d review: the coordinator edited PROJECT-STATE during the run. New rule: no coordinator edits under the research tree while an agent run is active. | Opus | T3d review `audit-note.md`; §9 |
| 2026-11-18 | T3e accepted with corrections; the corrections are applied in decision.md. The findings were added to AFON-MENU-RESEARCH ("How a page-27 row opens its editor"). T3f briefed. | Opus | T3e decision.md |

## 12. Session resumption checklist (Opus)

1. If `C:\Dev\OM3-tasks\.research-lock.json` exists, a run was interrupted: unlock (§9), then
   inspect that task's record.
2. Read this file, then the `STATUS` and latest `decision.md` of every task that is not CLOSED.
3. `orchestration\Test-Pins.ps1` and `orchestration\Test-ArchiveSync.ps1`; fix before delegating.
4. `git -C contribution status`; `git -C C:\Dev\OM3-worktrees\archive status`.
5. Continue from §1. Reassess the whole project only if a check fails or the owner asks.
