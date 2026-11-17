# <ID>: <title>

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: <date>

## 0. Rules that override everything below

- You are in a disposable execution workspace (`TASK.md` describes it). Write **only**
  under `work\`: `work\result.md`, `work\evidence-manifest.json`, `work\out\`,
  `work\scripts\`. If the brief allows OM-Emu changes, they go in `om-emu\` (they are diffed).
- `ref\` is the research workspace and is read-only. The operating system refuses
  writes there; do not try to work around a refusal, and report it if it blocks you.
- Ghidra: use the private `projects\` copy with `-readOnly -noanalysis` and the launcher
  in `tools\ghidra\support\` (exact command in `TASK.md`).
- OM-Emu: `OM_EMU_NVRAM` is `off`. Never point OM-Emu at `~/.om-emu`.
- No network access, no Git, no ACL or permission commands, no installs.
- Never build, write or describe as installable any firmware image, component or SD
  update file. Emulator overlays live in memory or as `*.emulator-only.*` files in `work\out\`.
- This project is **not** ready for hardware. Make no recommendation to flash.
- If the task cannot be done within these rules, stop and explain why in `work\result.md`.

## 1. Objective
## 2. Project history relevant to this task (paths under `ref\`)
## 3. Established findings you must build on (do not rediscover)
## 4. Already attempted
## 5. Unresolved: the exact question
## 6. Authorised actions
## 7. Deliverables (paths under `work\`)
## 8. Acceptance criteria
## 9. Testing and verification required
## 10. Out of scope
