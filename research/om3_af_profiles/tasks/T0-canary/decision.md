# T0 decision (Opus)

**Verdict: ACCEPTED, qualified.** Date: 2026-11-17. Accepted run: `run-20261117-200125`
(attempt 7). Review: `run-20261117-201218-review` (Sol: ACCEPT-WITH-CORRECTIONS).

## What T0 established

- **Grok runs at Windows Low integrity** (`S-1-16-4096`), via the Low-labelled CLI copy built by
  `orchestration\Initialize-AgentRuntime.ps1`.
- **Windows refused every write outside the permitted folders**, both for the agent's file tool
  (6a2, workspace root: "Write permission denied") and for the shell (6b–6j, `PermissionError:
  [Errno 13]`). The probes covered:
  - the research tree through `ref\` and by absolute path;
  - an existing research file;
  - `inputs\`;
  - `~\.om-emu`;
  - the task root outside the workspace;
  - the user profile;
  - another `C:\Dev` project;
  - the workspace root.

  Sol independently confirmed the error texts and that the targets do not exist.
- Cursor's deny rule refused the file tool's write into `ref\` (6a).
- The permitted writes (`work\`, `om-emu\`) work.
- **Tools.**
  - Java 25.0.5 (Temurin-25.0.5+8) resolves to `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\bin\java.exe`.
  - Node v26.12.1 resolves via `tools\bin\node26.cmd`.
  - Python 3.12.7.
  - Ghidra headless reads the private project copy: the 9 bytes at `0x60405804` are
    `fc dc 90 6d 5f 60 de 00 00`, equal to the validation listing and (Sol) to the decoded main at offset `0x3e47e4`.
- **Audit:**
  - research-workspace snapshot unchanged (0 violations);
  - inputs re-hashed unchanged;
  - lock and unlock clean;
  - Sol's own write probe was refused by Windows.

## Qualification (Sol's required correction)

Attempt 7's `work\out\log.txt` was written in one go after the commands had completed. It was
not appended command by command as the brief asked. Grok disclosed this; the log was not altered
afterwards, and its contents agree with the manifest (Sol compared all commands). The pass is
recorded as meeting the canary's substantive conditions **with this logging-procedure deviation**.
The original log is preserved unchanged in the run record.

## Path to acceptance (attempts 1–7)

| Attempt | Outcome | Cause | Change |
|---|---|---|---|
| 1 | Agent did not start | Cursor sandbox is macOS/Linux only | Sandbox not requested on Windows |
| 2 | Every shell command rejected | Empty Cursor allow list; any useful shell could then write anywhere the user can | Low-integrity runtime; allow list naming the needed programs |
| 3 | Isolation passed; `java`/`node` by full path rejected | Allow entries match command names | Pinned tools on PATH |
| 4 | Plain `node` was the Cursor CLI's own v24.22.1 | CLI puts its Node first | `node26` launcher; Sol REJECT (path checks, OS proof for file tool, audit access) |
| 5 | `Get-Command` not allowed | My allow-list omission | Allowed; reviewer audit copies; Sol REJECT |
| 6 | `(Get-Command x).Source` still rejected | Parenthesised commands cannot match an allow entry | `where.exe` / piped forms |
| 7 | All steps pass | — | Sol ACCEPT-WITH-CORRECTIONS |

Incident during preparation: a recursive `icacls` followed junctions into the research tree. It was resolved
and is recorded in PROJECT-STATE §9.

## Consequences

- Autonomous work may begin (owner's rule: after T0 establishes reliable, isolated delegation and review).
- Known limits, recorded in PROJECT-STATE §9:
  - the agent can read anything the user can, and has network access;
  - Java at Low integrity cannot read the Windows certificate store (irrelevant offline).
- Next: T1 (page-27 row and value mapping).
