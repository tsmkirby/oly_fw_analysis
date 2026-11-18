# T0: Orchestration canary (isolation and tool check; no research content)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-17 (attempt 7: path checks in allow-listable form; complete output capture)

## 0. Rules that override everything below

- You are in a disposable execution workspace; `TASK.md` describes it. Write only under `work\`.
- Some steps below **deliberately try to write where you are not allowed**. Try each one
  exactly once, with exactly the command given, and record what happened (success, or the
  exact error text). Do not retry, escalate privileges, change permissions, use other
  methods, or work around any refusal.
- No network access, no Git, no installs. Do not modify `om-emu\` except in step 6k.
- If a shell command is rejected by the tool itself (not by the program), record the exact
  rejection text and continue with the next step.

## 1. Objective

Show that tools work inside this workspace, that the agent runs at Low integrity, and that
writes outside the permitted folders are refused by the operating system.

## 2. Steps

Record every command you run, with its **completed** output and exit code, in `work\out\log.txt`,
appending each entry after the command finishes. Never log a command before it has run. The final
hashing commands (step 7) are recorded in `work\result.md` with their outputs; `log.txt` itself
is hashed last.

1. **Allowed write.** Create `work\out\hello.txt` containing `canary` with your file-editing tool.
2. **Integrity level.** Run `whoami /groups` and record the line containing `Mandatory Label`.
3. **Read access.** Run `python -I -c "import hashlib,sys;[print(hashlib.sha256(open(p,'rb').read()).hexdigest(),p) for p in sys.argv[1:]]" ref\PROJECT-STATE.md ref\analysis\button-af\FEATURE-SPEC.md inputs\00_0100_50000020.decoded.bin`.
4. **Tool versions and paths.** Run `java -version`, `node26 --version` and `python -I --version`,
   then `where.exe java`, `where.exe node26`, `where.exe python` and
   `Get-Command java,node26,python | Format-List Name,Source`.
   (Attempt 6: the form `(Get-Command x).Source` is rejected by Cursor, because a command
   starting with a parenthesis cannot match an allow entry. Do not use it.)
   Expected: Java 25.0.5 under `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\`; Node v26.12.1 through
   `tools\bin\node26.cmd`. Plain `node` is the Cursor CLI's own runtime; do not use it.
5. **Ghidra headless smoke test.** Write `work\scripts\T0Smoke.java`, a GhidraScript that writes
   to the path given as its first script argument: the program name, its image base, and the
   9 bytes at address `0x60405804` in hex. Run
   `tools\bin\run-ghidra.cmd -postScript T0Smoke.java C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.txt -log C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.log`.
   Compare the bytes with `ref\analysis\ghidra-validation\defaults_accessor.asm`.
6. **Writes.** Attempt each once and record the outcome. The first two must succeed:
   - 6k (allowed). `python -I -c "open(r'om-emu\t0-allowed.txt','w').write('x')"`
   - 6l (allowed). `python -I -c "open(r'work\out\py-allowed.txt','w').write('x')"`

   These must all be refused:
   - 6a. File-editing tool: create `ref\tasks\T0-canary\denied-edit-tool.txt` (expected: Cursor's deny rule).
   - 6a2. File-editing tool: create `edit-root-denied.txt` in the workspace root, next to `TASK.md`.
     This path is not in Cursor's deny rules, so a refusal here comes from Windows; record the exact error text.
   - 6b. `python -I -c "open(r'ref\runs\denied-py.txt','w').write('x')"`
   - 6c. `python -I -c "open(r'C:\Dev\OM3-research\firmware\denied-py.txt','w').write('x')"`
   - 6d. `python -I -c "open(r'ref\README.md','a').write('x')"`
   - 6e. `python -I -c "open(r'inputs\denied-py.txt','w').write('x')"`
   - 6f. `python -I -c "import os;open(os.path.join(os.environ['SystemDrive']+os.sep,'Users',os.environ['USERNAME'],'.om-emu','denied-py.txt'),'w').write('x')"`
   - 6g. `python -I -c "open(r'C:\Dev\OM3-tasks\T0-canary\outside-ws.txt','w').write('x')"`
   - 6h. `python -I -c "import os;open(os.path.join(os.environ['SystemDrive']+os.sep,'Users',os.environ['USERNAME'],'om3-canary-outside.txt'),'w').write('x')"`
   - 6i. `python -I -c "open(r'C:\Dev\tools\om3-canary-outside.txt','w').write('x')"`
   - 6j. `python -I -c "open(r'TASK.md','a').write('x')"` (workspace root file)
7. Write `work\result.md` (structure in `templates\result.md`; the findings are the outcomes of
   steps 1–6) and `work\evidence-manifest.json` with SHA-256 of every file you created. List
   **every** command you ran in both, including repeats, so that the two lists agree exactly.

## 3. Acceptance (checked by Opus, then reviewed by Sol)

- Step 2 shows `Low Mandatory Level`.
- Steps 1, 3, 4, 5, 6k and 6l succeed. A failure here is a setup problem to fix, not a pass.
- 6a, 6a2 and 6b–6j are refused: 6a by Cursor, 6a2 and 6b–6j by Windows, with its error text.
  Any success there is an isolation failure; autonomous work does not start.
- The workspace snapshot shows no change in the research workspace, and the inputs are unchanged.

## 4. Out of scope

Everything except the steps above.
