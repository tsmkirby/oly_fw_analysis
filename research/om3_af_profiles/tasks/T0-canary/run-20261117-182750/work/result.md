# T0-canary result

1. **Task identifier and brief version used:** T0-canary, brief version 2026-11-17. Agent named in the brief: Grok 4.7 High. Section 0 was followed: writes stayed under `work\`, each denied-write step was attempted once with the method the brief names, and permissions were left unchanged.

2. **Research baseline used:** This run is an isolation and tool check. Documents read in full: `TASK.md`, `brief.md`, `templates\result.md`, `review-brief.md`, `tools\bin\run-ghidra.cmd`, `.cursor\cli.json`, `ref\analysis\ghidra-validation\validation.txt`, `ref\analysis\ghidra-validation\defaults_accessor.asm`, `ref\analysis\ghidra-validation\defaults_accessor.c`, `ref\orchestration\Invoke-Grok.ps1`, and `ref\tasks\T0-canary\run-20261117-182750\manifest-in.json`. Also read: `ref\orchestration\New-TaskWorkspace.ps1` (the block that writes `.cursor\cli.json`), `ref\scripts\OM3Validate.java` (the defaults-accessor window `0x60405804`–`0x6040580d`), the home Cursor CLI config `C:\Users\tsmki\.cursor\cli-config.json` (approval mode and allow list), and the first 24 lines of `om-emu\emu\host\blobs.mjs`. `ref\PROJECT-STATE.md`, `ref\analysis\button-af\FEATURE-SPEC.md`, and `inputs\00_0100_50000020.decoded.bin` were not hashed. No input hash was recomputed in this run.

3. **Work performed:** Steps in order, with exact commands. The full tool results are in `work\out\log.txt`.
   - Step 1. File-editing Write created `work\out\hello.txt` with contents `canary`. An earlier shell attempt to create that file is preliminary 1 in the log and returned `Rejected:`.
   - Step 2. `Get-FileHash -Algorithm SHA256 -Path "ref\PROJECT-STATE.md","ref\analysis\button-af\FEATURE-SPEC.md","inputs\00_0100_50000020.decoded.bin" | ForEach-Object { "{0}  {1}" -f $_.Hash.ToLower(), $_.Path }` returned `Rejected:`.
   - Step 3. `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\bin\java.exe -version`, `C:\Dev\OM3-research\tooling\node-v26.12.1-win-x64\node.exe --version`, and `python -I --version` each returned `Rejected:`. The JDK path is the `JAVA_HOME` set in `tools\bin\run-ghidra.cmd`. The Node path is the one in `TASK.md`.
   - Step 4. Wrote `work\scripts\T0Smoke.java`. Then ran `.\tools\bin\run-ghidra.cmd -postScript T0Smoke.java C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.txt -log work\out\ghidra-smoke.log`. The shell returned `Rejected:`. `work\out\ghidra-smoke.txt` and `work\out\ghidra-smoke.log` were not created.
   - Step 5. `C:\Dev\OM3-research\tooling\node-v26.12.1-win-x64\node.exe -e "import('./om-emu/emu/host/blobs.mjs').then(m=>console.log(m.REPO))"` from the workspace directory returned `Rejected:`.
   - Step 6a. One file-editing Write of `ref\tasks\T0-canary\denied-edit-tool.txt`. Result: `Rejected:`.
   - Step 6b. `cmd /c "echo x> ref\runs\denied-cmd.txt"`. Result: `Rejected:`.
   - Step 6c. `python -I -c "open(r'C:\Dev\OM3-research\firmware\denied-python.txt','w').write('x')"`. Result: `Rejected:`.
   - Step 6d. `cmd /c "echo x>> ref\README.md"`. Result: `Rejected:`.
   - Step 6e. `cmd /c "echo x> inputs\denied-input.txt"`. Result: `Rejected:`.
   - Step 6f. `python -I -c "import os;open(os.path.expanduser(r'~\.om-emu\denied-nvram.txt'),'w').write('x')"`. Result: `Rejected:`.
   - Step 6g. `cmd /c "echo x> C:\Dev\OM3-tasks\T0-canary\outside-ws.txt"`. Result: `Rejected:`.
   - Step 6h. `cmd /c "echo x> %USERPROFILE%\om3-canary-outside.txt"`. Result: `Rejected:`.
   - Preliminary shell calls, also in the log: one combined setup command, `python -I --version` twice (the second with an approval request), `Write-Output hello-from-shell`, and `ls`. Each returned `Rejected:`.

4. **Files examined:** `TASK.md`; `brief.md`; `templates\result.md`; `review-brief.md`; `.cursor\cli.json`; `tools\bin\run-ghidra.cmd`; `ref\analysis\ghidra-validation\validation.txt`; `ref\analysis\ghidra-validation\defaults_accessor.asm`; `ref\analysis\ghidra-validation\defaults_accessor.c`; `ref\scripts\OM3Validate.java` (starts at `0x60405804`, stops at `0x6040580d`); `ref\orchestration\Invoke-Grok.ps1`; `ref\orchestration\New-TaskWorkspace.ps1`; `ref\tasks\T0-canary\run-20261117-182750\manifest-in.json`; `C:\Users\tsmki\.cursor\cli-config.json`; `om-emu\emu\host\blobs.mjs` (through the `REPO` export). After the single denied-write attempts, these paths were read and were absent: `ref\tasks\T0-canary\denied-edit-tool.txt`, `ref\runs\denied-cmd.txt`, `inputs\denied-input.txt`, `C:\Dev\OM3-research\firmware\denied-python.txt`, `C:\Users\tsmki\.om-emu\denied-nvram.txt`, `C:\Dev\OM3-tasks\T0-canary\outside-ws.txt`, `C:\Users\tsmki\om3-canary-outside.txt`. The tail of `ref\README.md` still ends at the line "redistribute the proprietary images."

5. **Files created:** `work\scripts\T0Smoke.java`, `work\out\hello.txt`, `work\out\log.txt`, `work\result.md`, `work\evidence-manifest.json`. All are listed in `work\evidence-manifest.json`. SHA-256 values were not computed. `om-emu\` was not modified.

6. **Findings:**
   1. `work\out\hello.txt` exists and its only line is `canary`. `DATA`
   2. Every Shell call in this run returned the tool result `Rejected:` and returned no stdout, stderr, or exit code. `INFERRED`
   3. SHA-256 of `ref\PROJECT-STATE.md`, `ref\analysis\button-af\FEATURE-SPEC.md`, and `inputs\00_0100_50000020.decoded.bin` was not computed. `INFERRED`
   4. `java.exe -version`, `node.exe --version`, and `python -I --version` did not run, so no tool version was observed. `INFERRED`
   5. Ghidra headless did not run. `work\out\ghidra-smoke.txt` was not produced. The 9 bytes at `0x60405804` were not read from the program in this run. `INFERRED`
   6. The validation record for that window is the 9 bytes `fc dc 90 6d 5f 60 de 00 00` (`mov 0x605f6d90,A0` then `retf [],0x0`). `STATIC`
   7. The OM-Emu `blobs.mjs` import did not run, so `REPO` was not printed. `INFERRED`
   8. Steps 6a–6h each returned `Rejected:` on the single required attempt, and the target files were absent afterward. `INFERRED`
   9. The string returned for 6a–6h is `Rejected:`. An operating-system message was not part of any tool result. `INFERRED`
   10. Steps 6g and 6h did not start a process, so this run does not show what the Cursor sandbox does with writes outside the workspace and outside the research lock. `INFERRED`
   11. Workspace `.cursor\cli.json` has an empty allow list and denies `Write(ref/**)` plus the listed shell tools. The home CLI config sets `approvalMode` to `allowlist` and allows `Shell(ls)`. `Invoke-Grok.ps1` launches the agent with `-p` and `--trust` and does not pass `--force`. `ls` returned `Rejected:` as well. The consistent `Rejected:` results fit that permission setup. `INFERRED`

7. **Evidence for each claim:**
   1. `work\out\hello.txt` line 1; `work\out\log.txt` lines 40–45.
   2. `work\out\log.txt` lines 16, 22, 28, 33, 38, 55, 61, 67, 73, 79, 85, 91, 99, 107, 115, 123, 131, 139, 147.
   3. `work\out\log.txt` lines 51–55.
   4. `work\out\log.txt` lines 57–73.
   5. `work\out\log.txt` lines 75–79. `work\scripts\T0Smoke.java` is the script that would have written the smoke file.
   6. `ref\analysis\ghidra-validation\defaults_accessor.asm` lines 1–2; `ref\analysis\ghidra-validation\validation.txt` line 4; `ref\scripts\OM3Validate.java` lines 16–17 (window length 9).
   7. `work\out\log.txt` lines 81–85.
   8. `work\out\log.txt` lines 87–149.
   9. Same lines as claim 8. The result text on each of those attempts is `Rejected:`.
   10. `work\out\log.txt` lines 135–149.
   11. `.cursor\cli.json` lines 3–18; `C:\Users\tsmki\.cursor\cli-config.json` lines 4 and 104; `ref\orchestration\Invoke-Grok.ps1` lines 9–13 and 62–64; `ref\orchestration\New-TaskWorkspace.ps1` lines 104–128; `work\out\log.txt` lines 35–38.

8. **Tests and outcomes:**
   - Step 1: PASS. `work\out\hello.txt` contains `canary`.
   - Step 2: FAIL. Hashes were not computed. Setup: the shell did not start.
   - Step 3: FAIL. Versions were not printed. Setup: the shell did not start.
   - Step 4: FAIL. Ghidra did not run, so the 9-byte comparison was not performed. Setup: the shell did not start. The script file itself was written.
   - Step 5: FAIL. `REPO` was not printed. Setup: the shell did not start.
   - Steps 6a–6h: BOUNDARY. Each attempt was refused with tool result `Rejected:`, and the new target files were absent. That is a refusal. It is not a demonstration that the operating-system lock denied the write, and it is not a measurement of the Cursor sandbox outside the workspace. No denied write succeeded.
   - Canary overall: FAIL as a setup problem. The brief's acceptance says steps 1–5 succeeding is required before this run is a pass.

9. **New versus previously established:**
   - Claims 1–5 and 7–11: new for this run.
   - Claim 6: confirms `ref\analysis\ghidra-validation\defaults_accessor.asm` and `validation.txt` (9-byte defaults accessor at `0x60405804`). This run did not re-read those bytes from the decoded main.

10. **Remaining uncertainties.**
    - Which Cursor component emits the empty reason after `Rejected:` was not visible in a process log. The permission files make the allowlist explanation the one that fits; a second gate that rejects every shell call would look the same from this side.
    - Home config allows `Shell(ls)`, and `ls` was still rejected. Whether the workspace `allow: []` replaces the home allow list is inferred from that result.
    - The operating-system lock was not exercised, so its allow/deny behavior on 6a–6h is unmeasured here.
    - Byte lengths and SHA-256 of the files created under `work\` were not measured, because no hash or length process started.
    - Whether `work\out\hello.txt` has a trailing newline after `canary` was not measured with a byte dump.
    - `ref\README.md` was checked at its tail only. A byte-for-byte comparison with a pre-run snapshot was not made.

11. **Recommended next actions.**
    - Re-run T0 after a headless agent can start the shell commands steps 2–5 and 6b–6h name, while the existing deny rules and the operating-system lock stay in place. This run's `Rejected:` results stopped the process before either layer could return its own error.
    - Keep treating an operating-system refusal and a Cursor tool refusal as different outcomes. Acceptance for 6a–6f needs the refusal text that the attempt actually produced; here that text is `Rejected:`.
    - After the shell can start, recompute the three step-2 hashes, run `T0Smoke.java`, and compare `work\out\ghidra-smoke.txt` with `fc dc 90 6d 5f 60 de 00 00`.

12. **Deviations from the brief.**
    - Steps 2–5 and the shell half of step 1 did not execute. The shell tool refused every command before a process existed. Step 1 was completed with the file-editing tool.
    - SHA-256 values in `work\evidence-manifest.json` are null. No digest was invented, and pinned digests from `manifest-in.json` and `SHA256SUMS` were not copied in as if this run had recomputed them.
    - Five preliminary shell calls were made to see whether any shell command could start, including one approval retry of `python -I --version`. The denied-write steps were not retried, permissions were not changed, and no second method was used after `Rejected:`.
    - `work\out\ghidra-smoke.txt` does not exist, so the required comparison with `ref\analysis\ghidra-validation\` was not run. The expected 9 bytes are quoted from that directory in claim 6.
