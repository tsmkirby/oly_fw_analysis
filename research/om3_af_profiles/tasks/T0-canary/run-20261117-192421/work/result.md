# T0-canary result

1. **Task identifier and brief version used:** T0-canary. Brief version 2026-11-17 (attempt 5: corrections after Sol's review of attempt 4). `brief.md` SHA-256 `b571ab1eeb5eb8f943b43bdcdc2d7fb1acec0f679ced557e7dc18f421dee7fd5`.

2. **Research baseline used:** This brief is an isolation and tool check. Documents read in full: `TASK.md`, `brief.md`, `templates/result.md`, `review-brief.md`, `ref/PROJECT-STATE.md` (sections 1–12), `ref/analysis/ghidra-validation/defaults_accessor.asm`, `tools/bin/run-ghidra.cmd`, `tools/bin/node26.cmd`. `ref/analysis/button-af/FEATURE-SPEC.md` was hashed and not read. `ref/PROJECT-STATE.md` §1 says T0 is next and records readiness NO-GO for installable firmware. §4 lists T0 as Ready. §9 describes Low-integrity execution. §10 pins the decoded main.

   Step 3 hashes, repeated by the step 7 hash of the same files:

   - `ref/PROJECT-STATE.md` SHA-256 `8fac3acdb64b295c2eff3e8f29127d22da4642003a7faea10c4d2a04da87b782` (14727 bytes)
   - `ref/analysis/button-af/FEATURE-SPEC.md` SHA-256 `f233815f1bb77246c8484f69f7a53e5c80837f6b87d22d2348ee41322afd2bdc` (29070 bytes)
   - `inputs/00_0100_50000020.decoded.bin` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes)

   The decoded-main digest matches `PROJECT-STATE.md` §10. The container, resource 0106, and the OM-Emu patch were not re-hashed: step 3 does not name them, and the brief forbids Git. No OM-Emu run was performed. The only write under `om-emu\` is the step 6k file `om-emu\t0-allowed.txt`.

3. **Work performed:** Steps 1–6 of the brief, then the hash commands required for the manifest. Full output is in `work/out/log.txt`. The ordered command strings are the 30 lines in the command list below. `work/evidence-manifest.json` `commands[].command` is that same list, in that order, with no extra command and no repeat.

   Steps 2, 3, and the six step-4 commands were issued in one batch. Steps 6k, 6l, 6a, 6a2, and 6b–6j were issued in one batch. Each command ran once.

4. **Files examined:**

   - `TASK.md`, `brief.md`, `templates/result.md`, `review-brief.md`
   - `ref/PROJECT-STATE.md` (full)
   - `ref/analysis/button-af/FEATURE-SPEC.md` (hashed only)
   - `ref/analysis/ghidra-validation/defaults_accessor.asm` (full; addresses `60405804` and `6040580a`)
   - `inputs/00_0100_50000020.decoded.bin` (hashed only)
   - `tools/bin/run-ghidra.cmd`, `tools/bin/node26.cmd`
   - `work/out/ghidra-smoke.txt`, `work/out/ghidra-smoke.log` (program `00_0100_50000020.decoded.bin`, address `0x60405804`)
   - `work/out/hello.txt`

5. **Files created:**

   - `work/out/hello.txt`
   - `work/scripts/T0Smoke.java`
   - `work/out/ghidra-smoke.txt`
   - `work/out/ghidra-smoke.log`
   - `work/out/py-allowed.txt`
   - `om-emu/t0-allowed.txt` (step 6k, the one allowed write outside `work\`)
   - `work/out/log.txt`
   - `work/result.md` (this file)
   - `work/evidence-manifest.json`

   Ghidra also loaded preferences and cleaned its cache under `state\ghidra-user\`. Those are tool files, not task outputs, and they are not in the manifest. Every task output above is listed in `work/evidence-manifest.json`. The manifest does not store its own SHA-256.

6. **Findings:**

   1. `DATA` — `work/out/hello.txt` is the six bytes `canary`.
   2. `DATA` — `whoami /groups` printed `Mandatory Label\Low Mandatory Level`, SID `S-1-16-4096`.
   3. `DATA` — The three step-3 digests are the values in section 2. The decoded main matches `PROJECT-STATE.md` §10.
   4. `DATA` — `java -version` printed `openjdk version "25.0.5" 2026-10-20 LTS` and `OpenJDK Runtime Environment Temurin-25.0.5+8`.
   5. `DATA` — `node26 --version` printed `v26.12.1`.
   6. `DATA` — `python -I --version` printed `Python 3.12.7`.
   7. `DATA` — `(Get-Command java).Source`, `(Get-Command node26).Source`, and `(Get-Command python).Source` were each rejected by the tool before execution. The tool response for each was `Rejected:`. No path was printed.
   8. `DATA` — The file `tools/bin/node26.cmd` contains `"C:\Dev\OM3-research\tooling\node-v26.12.1-win-x64\node.exe" %*`. This is a read of that file. It is not output from `Get-Command`.
   9. `DATA` — `tools/bin/run-ghidra.cmd` sets `JAVA_HOME=C:\Dev\OM3-research\tooling\jdk-25.0.5+8` for the Ghidra launcher. This is a read of that file. It is not output from `Get-Command java`.
   10. `STATIC` — Ghidra headless, read-only, wrote `program=00_0100_50000020.decoded.bin`, `image_base=0x0`, and `bytes=fc dc 90 6d 5f 60 de 00 00` at `0x60405804`. Exit code 0.
   11. `STATIC` — `defaults_accessor.asm` lists `fc dc 90 6d 5f 60` at `60405804` and `de 00 00` at `6040580a`. Those nine bytes are the smoke-test bytes.
   12. `DATA` — Step 6k created `om-emu\t0-allowed.txt` and step 6l created `work\out\py-allowed.txt`. Both commands exited 0 with empty stdout. Each file is one byte, `x`.
   13. `DATA` — Step 6a, the file tool creating `ref\tasks\T0-canary\denied-edit-tool.txt`, returned `Rejected:`.
   14. `DATA` — Step 6a2, the file tool creating `edit-root-denied.txt` in the workspace root, returned `Write permission denied: C:\Dev\OM3-tasks\T0-canary\ws\edit-root-denied.txt: Permission denied`.
   15. `DATA` — Steps 6b–6j each exited 1 with `PermissionError: [Errno 13] Permission denied` for the path in that command.
   16. `DATA` — The Ghidra console recorded `OS Truststore load failed: java.security.KeyStoreException: error 5, Access is denied.` Headless still exited 0.
   17. `INFERRED` — The process token observed in finding 2 is Low Mandatory Level, and the write attempts in findings 14 and 15 were denied with the recorded permission errors. `PROJECT-STATE.md` §9 describes that boundary.

7. **Evidence for each claim:**

   - 1. `work/out/log.txt` step-1; `work/out/hello.txt`; manifest output entry (6 bytes, SHA-256 `e100fbce008c04ec40637af0af91fb2f05aeedc23f856a2d3c0b1580625d755e`).
   - 2. `work/out/log.txt` step-2, the `Mandatory Label\Low Mandatory Level` line, SID `S-1-16-4096`.
   - 3. `work/out/log.txt` step-3 and step-7-hash-existing; `PROJECT-STATE.md` §10 for the decoded main.
   - 4. `work/out/log.txt` step-4-java.
   - 5. `work/out/log.txt` step-4-node26.
   - 6. `work/out/log.txt` step-4-python.
   - 7. `work/out/log.txt` step-4-getcommand-java, step-4-getcommand-node26, step-4-getcommand-python. Tool response `Rejected:`.
   - 8. `tools/bin/node26.cmd` (98 bytes, SHA-256 `0dc9aa6201773ae84c491264cc8fd4ef2084a6369337795b5b3657a5e14f3878`).
   - 9. `tools/bin/run-ghidra.cmd` line that sets `JAVA_HOME`.
   - 10. `work/out/ghidra-smoke.txt`; `work/out/log.txt` step-5-ghidra; `work/out/ghidra-smoke.log`.
   - 11. `ref/analysis/ghidra-validation/defaults_accessor.asm` lines at `60405804` and `6040580a`.
   - 12. `work/out/log.txt` step-6k and step-6l; manifest entries for both files (1 byte, SHA-256 `2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881`).
   - 13. `work/out/log.txt` step-6a.
   - 14. `work/out/log.txt` step-6a2.
   - 15. `work/out/log.txt` steps 6b–6j. Paths in the tracebacks: `ref\runs\denied-py.txt`, `C:\Dev\OM3-research\firmware\denied-py.txt`, `ref\README.md`, `inputs\denied-py.txt`, `C:\Users\tsmki\.om-emu\denied-py.txt`, `C:\Dev\OM3-tasks\T0-canary\outside-ws.txt`, `C:\Users\tsmki\om3-canary-outside.txt`, `C:\Dev\tools\om3-canary-outside.txt`, `TASK.md`.
   - 16. `work/out/log.txt` step-5-ghidra, the `DefaultTrustManagerFactory` warning.
   - 17. Findings 2, 14, and 15, together with `PROJECT-STATE.md` §9.

8. **Tests and outcomes:**

   - Step 1: PASS.
   - Step 2: PASS. The group line is `Mandatory Label\Low Mandatory Level`.
   - Step 3: PASS.
   - Step 4 `java -version`: PASS. Printed 25.0.5, Temurin-25.0.5+8.
   - Step 4 `node26 --version`: PASS. Printed `v26.12.1`.
   - Step 4 `python -I --version`: PASS. Printed `Python 3.12.7`.
   - Step 4 `(Get-Command java).Source`, `(Get-Command node26).Source`, `(Get-Command python).Source`: FAIL. The tool rejected each with `Rejected:` and the commands were not executed, so the Source paths were not printed. Section 0 says to record a tool rejection and continue, so they were not retried and no substitute command was run.
   - Step 5: PASS. Exit 0. The nine bytes match `defaults_accessor.asm`.
   - Steps 6k and 6l: PASS.
   - Step 6a: PASS as the brief's expected refusal. Tool response `Rejected:`.
   - Step 6a2: PASS as a refusal. Tool response `Write permission denied: C:\Dev\OM3-tasks\T0-canary\ws\edit-root-denied.txt: Permission denied`.
   - Steps 6b–6j: PASS as refusals. Each exited 1 with `PermissionError: [Errno 13] Permission denied`.
   - Step 7 hashes of the files that already existed: PASS. Recorded in the log.
   - SHA-256 of `work/out/log.txt`: `ece0d7819d8bd9576537da9d01c11a9cfc5533060c148a9cc852ee76b215f530`, 16662 bytes.
   - SHA-256 of this file is the manifest output entry for `work\result.md`. It is not copied into this file.

9. **New versus previously established:**

   - Finding 2 confirms `PROJECT-STATE.md` §9 (Low integrity).
   - Finding 3 confirms `PROJECT-STATE.md` §10 for the decoded main. The PROJECT-STATE and FEATURE-SPEC digests are measurements from this run.
   - Findings 4 and 5 confirm the Java 25.0.5 and Node v26.12.1 pins named in this brief and in `TASK.md`, for the version strings those commands printed.
   - Finding 7 is new for this run: the three `Get-Command` forms in the brief were rejected by the tool.
   - Findings 10 and 11 confirm `defaults_accessor.asm`.
   - Findings 12–15 are the step 6 outcomes for this run.
   - Finding 17 is inferred from this run's token and the recorded denials, consistent with `PROJECT-STATE.md` §9.

10. **Remaining uncertainties.**

    - The resolved paths of `java`, `node26`, and `python` were not printed, because those three commands were rejected before execution.
    - Step 6a recorded `Rejected:` and did not record a Windows permission traceback.
    - Step 6a2 recorded the file tool's permission-denied string. No second probe was run.
    - A `PermissionError` shows that the write was denied. It does not, by itself, separate the integrity label from the deny-write ACL in `PROJECT-STATE.md` §9. This run did observe Low Mandatory Level.
    - This agent did not produce the coordinator's workspace snapshot comparison. Unchanged research-tree and input checks belong to that audit.
    - Container, resource 0106, and the OM-Emu patch were not re-verified in this run.

11. **Recommended next actions.** Accept the version, Ghidra, and write-refusal evidence that this run recorded. Treat the three `Get-Command` results as tool rejections. Obtaining their Source lines needs a later brief or an allow list that accepts those command strings. This run did not substitute another command.

12. **Deviations from the brief.**

    - Steps 2–4 were issued together, and the step 6 attempts were issued together. Each specified command still ran once.
    - The three `Get-Command` commands returned `Rejected:` from the tool. They were not repeated, and no other path command was added.
    - `work/out/log.txt` names the log hash, the result hash, and the writes of `work/result.md` and `work/evidence-manifest.json`, and it does not contain their stdout. There is no second, confirming hash of either file.
    - File reads used the file reader and are listed in section 4. They are not shell commands and are not in the command list.

## Command list

```
Write work\out\hello.txt contents canary
whoami /groups
python -I -c "import hashlib,sys;[print(hashlib.sha256(open(p,'rb').read()).hexdigest(),p) for p in sys.argv[1:]]" ref\PROJECT-STATE.md ref\analysis\button-af\FEATURE-SPEC.md inputs\00_0100_50000020.decoded.bin
java -version
node26 --version
python -I --version
(Get-Command java).Source
(Get-Command node26).Source
(Get-Command python).Source
Write work\scripts\T0Smoke.java
tools\bin\run-ghidra.cmd -postScript T0Smoke.java C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.txt -log C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.log
python -I -c "open(r'om-emu\t0-allowed.txt','w').write('x')"
python -I -c "open(r'work\out\py-allowed.txt','w').write('x')"
Write ref\tasks\T0-canary\denied-edit-tool.txt
Write edit-root-denied.txt
python -I -c "open(r'ref\runs\denied-py.txt','w').write('x')"
python -I -c "open(r'C:\Dev\OM3-research\firmware\denied-py.txt','w').write('x')"
python -I -c "open(r'ref\README.md','a').write('x')"
python -I -c "open(r'inputs\denied-py.txt','w').write('x')"
python -I -c "import os;open(os.path.join(os.environ['SystemDrive']+os.sep,'Users',os.environ['USERNAME'],'.om-emu','denied-py.txt'),'w').write('x')"
python -I -c "open(r'C:\Dev\OM3-tasks\T0-canary\outside-ws.txt','w').write('x')"
python -I -c "import os;open(os.path.join(os.environ['SystemDrive']+os.sep,'Users',os.environ['USERNAME'],'om3-canary-outside.txt'),'w').write('x')"
python -I -c "open(r'C:\Dev\tools\om3-canary-outside.txt','w').write('x')"
python -I -c "open(r'TASK.md','a').write('x')"
python -I -c "import hashlib,os,sys; [print(hashlib.sha256(open(p,'rb').read()).hexdigest(), os.path.getsize(p), p) for p in sys.argv[1:]]" work\out\hello.txt work\scripts\T0Smoke.java work\out\ghidra-smoke.txt work\out\ghidra-smoke.log work\out\py-allowed.txt om-emu\t0-allowed.txt brief.md TASK.md templates\result.md review-brief.md ref\analysis\ghidra-validation\defaults_accessor.asm tools\bin\run-ghidra.cmd tools\bin\node26.cmd ref\PROJECT-STATE.md ref\analysis\button-af\FEATURE-SPEC.md inputs\00_0100_50000020.decoded.bin
Write work\out\log.txt
python -I -c "import hashlib,os,sys; [print(hashlib.sha256(open(p,'rb').read()).hexdigest(), os.path.getsize(p), p) for p in sys.argv[1:]]" work\out\log.txt
Write work\result.md
python -I -c "import hashlib,os,sys; [print(hashlib.sha256(open(p,'rb').read()).hexdigest(), os.path.getsize(p), p) for p in sys.argv[1:]]" work\result.md
Write work\evidence-manifest.json
```

## Command outcomes

The `result` text here is the manifest `commands[].result` text.

1. `step-1` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\out\hello.txt`
2. `step-2` — exit 0 — `Mandatory Label\Low Mandatory Level SID S-1-16-4096`
3. `step-3` — exit 0 — `8fac3acdb64b295c2eff3e8f29127d22da4642003a7faea10c4d2a04da87b782 ref\PROJECT-STATE.md; f233815f1bb77246c8484f69f7a53e5c80837f6b87d22d2348ee41322afd2bdc ref\analysis\button-af\FEATURE-SPEC.md; 5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59 inputs\00_0100_50000020.decoded.bin`
4. `step-4-java` — exit 0 — `openjdk version "25.0.5" 2026-10-20 LTS; OpenJDK Runtime Environment Temurin-25.0.5+8 (build 25.0.5+8-LTS); OpenJDK 64-Bit Server VM Temurin-25.0.5+8 (build 25.0.5+8-LTS, mixed mode, sharing)`
5. `step-4-node26` — exit 0 — `v26.12.1`
6. `step-4-python` — exit 0 — `Python 3.12.7`
7. `step-4-getcommand-java` — exit null — `Rejected:`
8. `step-4-getcommand-node26` — exit null — `Rejected:`
9. `step-4-getcommand-python` — exit null — `Rejected:`
10. `step-5-script` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\scripts\T0Smoke.java`
11. `step-5-ghidra` — exit 0 — `program=00_0100_50000020.decoded.bin image_base=0x0 addr=0x60405804 bytes=fc dc 90 6d 5f 60 de 00 00`
12. `step-6k` — exit 0 — `empty stdout; exit 0`
13. `step-6l` — exit 0 — `empty stdout; exit 0`
14. `step-6a` — exit null — `Rejected:`
15. `step-6a2` — exit null — `Write permission denied: C:\Dev\OM3-tasks\T0-canary\ws\edit-root-denied.txt: Permission denied`
16. `step-6b` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'ref\\runs\\denied-py.txt'`
17. `step-6c` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Dev\\OM3-research\\firmware\\denied-py.txt'`
18. `step-6d` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'ref\\README.md'`
19. `step-6e` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'inputs\\denied-py.txt'`
20. `step-6f` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Users\\tsmki\\.om-emu\\denied-py.txt'`
21. `step-6g` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Dev\\OM3-tasks\\T0-canary\\outside-ws.txt'`
22. `step-6h` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Users\\tsmki\\om3-canary-outside.txt'`
23. `step-6i` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Dev\\tools\\om3-canary-outside.txt'`
24. `step-6j` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'TASK.md'`
25. `step-7-hash-existing` — exit 0 — `full output in work\out\log.txt under step-7-hash-existing`
26. `step-7-write-log` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\out\log.txt`
27. `step-7-hash-log` — exit 0 — `ece0d7819d8bd9576537da9d01c11a9cfc5533060c148a9cc852ee76b215f530 16662 work\out\log.txt`
28. `step-7-write-result` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\result.md`
29. `step-7-hash-result` — exit 0 — `digest and size are the outputs entry for work\result.md; stdout is not copied here`
30. `step-7-write-manifest` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\evidence-manifest.json`
