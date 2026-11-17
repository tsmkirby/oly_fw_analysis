# Agent tasks

`tasks/<ID>/` is the **record** of one delegated task. Opus writes it while the research
workspace is unlocked. The agents never write here.

| File | Written by |
|---|---|
| `brief.md`, `review-brief.md`, `STATUS`, `decision.md` | Opus |
| `run-<stamp>/` | `orchestration\Invoke-Grok.ps1`: `work/` harvested from the execution workspace, `run-log.json`, `isolation-workspace.txt`, `pins.txt`, `archive-sync.txt`, `manifest-in.json`, `om-emu.diff`, `other-writes-in-ws.txt`, the CLI output |
| `run-<stamp>-review/` | `orchestration\Invoke-Sol.ps1`: `review.md` (Sol's final message), `run-log.json`, isolation report, the event stream |

Execution happens elsewhere: `C:\Dev\OM3-tasks\<ID>\ws\`, a disposable workspace built by
`orchestration\New-TaskWorkspace.ps1`, with the research reachable read-only through
`ws\ref\`. See [PROJECT-STATE.md §9](../PROJECT-STATE.md#9-workspaces-isolation-and-recovery).

STATUS values: DRAFT, APPROVED, RUNNING, REVIEW, CORRECTING, ACCEPTED, REJECTED,
BLOCKED, CLOSED.

Accepted results are **promoted** by Opus to their permanent place (for example
`analysis/button-af/readiness/<name>/`, `scripts/`), recorded in the research document
they belong to, and archived. A task record is the working history, not the evidence location.

Archiving rule: records are archived as text. Bulk dumps of stock firmware bytes stay
local and are listed by hash only, following the archive's existing practice.

Templates: `tasks/_templates/`.
