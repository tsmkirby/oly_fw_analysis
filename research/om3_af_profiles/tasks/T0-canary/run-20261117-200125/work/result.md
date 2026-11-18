# T0-canary result

1. **Task identifier and brief version used:** T0-canary. Brief version 2026-11-17 (attempt 7: path checks in allow-listable form; complete output capture). `brief.md` SHA-256 `35b85034a2b6fa50d71c0a137aaa2361ea6c31ffad85a1b42fa0796c076b9959` (5219 bytes).

2. **Research baseline used:** This brief is an isolation and tool check. Documents read in full: `TASK.md`, `brief.md`, `templates/result.md`, `review-brief.md`, `ref/PROJECT-STATE.md` (sections 1–12), `ref/analysis/ghidra-validation/defaults_accessor.asm`, `tools/bin/run-ghidra.cmd`, `tools/bin/node26.cmd`. `ref/analysis/button-af/FEATURE-SPEC.md` was hashed and not read. `ref/PROJECT-STATE.md` §1 says T0 is next and records readiness NO-GO for installable firmware. §4 lists T0 as Ready. §9 describes Low-integrity execution and says the Cursor sandbox is unavailable on Windows. §10 pins the decoded main at base `0x60021020`.

   §10 also records these pins, which this run did not re-hash: container `8c133084414533159f587bf46bfb4152714c4074312a47c8d8503e33d605696d`, resource `0106` `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`, OM-Emu `4e4ec4ef084542a7e30eecce56970c7e09c123c9` plus a local patch (CR-stripped diff `61cd1327…7702`). Step 3 does not name them, and the brief forbids Git. No OM-Emu run was performed. The only write under `om-emu\` is the step 6k file `om-emu\t0-allowed.txt`.

   Step 3 hashes, repeated by the step 7 hash of the same files:

   - `ref/PROJECT-STATE.md` SHA-256 `542f75d5ec4eb9a7fc454254870a95b682bc9096a85de3ab8df15d0fac503b43` (14849 bytes)
   - `ref/analysis/button-af/FEATURE-SPEC.md` SHA-256 `f233815f1bb77246c8484f69f7a53e5c80837f6b87d22d2348ee41322afd2bdc` (29070 bytes)
   - `inputs/00_0100_50000020.decoded.bin` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes)

   The decoded-main digest matches `PROJECT-STATE.md` §10.

3. **Work performed:** Steps 1–6 of the brief, then the hash commands required for the manifest. Full output of steps 1–6 is in `work/out/log.txt`. That log was written after those commands had finished. Step 7 hashing output is in the section "Step 7 hash output" below. `log.txt` was hashed last among those files; that digest is in the step 7 section and is not written back into `log.txt`.

   The ordered command strings are the 31 lines in the command list below. `work/evidence-manifest.json` `commands[].command` is that same list, in that order, with no extra command and no missing command.

   Steps 2, 3, and the seven step-4 commands were issued in one batch. The step 6 attempts were issued in one batch. Each command ran once. Entries were added to the record only after the commands in that batch had finished.

4. **Files examined:**

   - `TASK.md`, `brief.md`, `templates/result.md`, `review-brief.md`
   - `ref/PROJECT-STATE.md` (full)
   - `ref/analysis/button-af/FEATURE-SPEC.md` (hashed only)
   - `ref/analysis/ghidra-validation/defaults_accessor.asm` (full; addresses `60405804` and `6040580a`)
   - `inputs/00_0100_50000020.decoded.bin` (hashed only)
   - `tools/bin/run-ghidra.cmd`, `tools/bin/node26.cmd`
   - `work/out/ghidra-smoke.txt`, `work/out/ghidra-smoke.log` (program `00_0100_50000020.decoded.bin`, address `0x60405804`)
   - `work/out/hello.txt`
   - `work/out/log.txt`
   - `ref/tasks/T0-canary/run-20261117-194208/work/result.md`, `ref/tasks/T0-canary/run-20261117-194208/work/evidence-manifest.json`, the start of that run's `work/out/log.txt`, and that run's `work/scripts/T0Smoke.java` (format reference for this result; not used as evidence for the measurements below)

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
   4. `DATA` — `java -version` printed `openjdk version "25.0.5" 2026-10-20 LTS` and `OpenJDK Runtime Environment Temurin-25.0.5+8`. Exit code 0. `where.exe java` printed `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\bin\java.exe`.
   5. `DATA` — `node26 --version` printed `v26.12.1`. Exit code 0. `where.exe node26` printed `C:\Dev\OM3-tasks\T0-canary\ws\tools\bin\node26.cmd`.
   6. `DATA` — `python -I --version` printed `Python 3.12.7`. Exit code 0. `where.exe python` printed three paths, the first being `C:\Users\tsmki\AppData\Local\Programs\Python\Python312\python.exe`.
   7. `DATA` — `Get-Command java,node26,python | Format-List Name,Source` exited 0 and printed `java.exe` at `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\bin\java.exe`, `node26.cmd` at `C:\Dev\OM3-tasks\T0-canary\ws\tools\bin\node26.cmd`, and `python.exe` at `C:\Users\tsmki\AppData\Local\Programs\Python\Python312\python.exe`.
   8. `STATIC` — Ghidra headless, read-only, wrote `program=00_0100_50000020.decoded.bin`, `image_base=0x0`, and `bytes=fc dc 90 6d 5f 60 de 00 00` at `0x60405804`. Exit code 0. The console and log paths identify Ghidra `12.2 PUBLIC`.
   9. `STATIC` — `defaults_accessor.asm` lists `fc dc 90 6d 5f 60` at `60405804` and `de 00 00` at `6040580a`. Those nine bytes are the smoke-test bytes.
   10. `DATA` — Step 6k created `om-emu\t0-allowed.txt` and step 6l created `work\out\py-allowed.txt`. Both commands exited 0 with empty stdout. Each file is one byte, `x`.
   11. `DATA` — Step 6a, the file tool creating `ref\tasks\T0-canary\denied-edit-tool.txt`, returned `Rejected:`.
   12. `DATA` — Step 6a2, the file tool creating `edit-root-denied.txt` in the workspace root, returned `Write permission denied: C:\Dev\OM3-tasks\T0-canary\ws\edit-root-denied.txt: Permission denied`.
   13. `DATA` — Steps 6b–6j each exited 1 with `PermissionError: [Errno 13] Permission denied` for the path in that command. The tracebacks are in `work/out/log.txt`.
   14. `DATA` — The Ghidra console recorded `OS Truststore load failed: java.security.KeyStoreException: error 5, Access is denied.` Headless still exited 0.
   15. `INFERRED` — The process token observed in finding 2 is Low Mandatory Level. The allowed writes in finding 10 landed under `om-emu\` and `work\`. The write attempts in findings 12 and 13 were denied with the recorded permission errors. `PROJECT-STATE.md` §9 describes that boundary.

7. **Evidence for each claim:**

   - 1. `work/out/log.txt` entry 1; `work/out/hello.txt`; manifest output entry (6 bytes, SHA-256 `e100fbce008c04ec40637af0af91fb2f05aeedc23f856a2d3c0b1580625d755e`).
   - 2. `work/out/log.txt` entry 2, the `Mandatory Label\Low Mandatory Level` line, SID `S-1-16-4096`.
   - 3. `work/out/log.txt` entry 3 and the step 7 hash output below; `PROJECT-STATE.md` §10 for the decoded main.
   - 4. `work/out/log.txt` entries 4 and 7.
   - 5. `work/out/log.txt` entries 5 and 8.
   - 6. `work/out/log.txt` entries 6 and 9.
   - 7. `work/out/log.txt` entry 10.
   - 8. `work/out/ghidra-smoke.txt`; `work/out/log.txt` entry 12; `work/out/ghidra-smoke.log`.
   - 9. `ref/analysis/ghidra-validation/defaults_accessor.asm` lines at `60405804` and `6040580a`.
   - 10. `work/out/log.txt` entries 13 and 14; manifest entries for both files (1 byte, SHA-256 `2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881`).
   - 11. `work/out/log.txt` entry 15.
   - 12. `work/out/log.txt` entry 16.
   - 13. `work/out/log.txt` entries 17–25. Paths in the tracebacks: `ref\runs\denied-py.txt`, `C:\Dev\OM3-research\firmware\denied-py.txt`, `ref\README.md`, `inputs\denied-py.txt`, `C:\Users\tsmki\.om-emu\denied-py.txt`, `C:\Dev\OM3-tasks\T0-canary\outside-ws.txt`, `C:\Users\tsmki\om3-canary-outside.txt`, `C:\Dev\tools\om3-canary-outside.txt`, `TASK.md`.
   - 14. `work/out/log.txt` entry 12, the `DefaultTrustManagerFactory` warning.
   - 15. Findings 2, 10, 12, and 13, together with `PROJECT-STATE.md` §9.

8. **Tests and outcomes:**

   - Step 1: PASS.
   - Step 2: PASS. The group line is `Mandatory Label\Low Mandatory Level`.
   - Step 3: PASS.
   - Step 4 `java -version`: PASS. Printed 25.0.5, Temurin-25.0.5+8.
   - Step 4 `node26 --version`: PASS. Printed `v26.12.1`.
   - Step 4 `python -I --version`: PASS. Printed `Python 3.12.7`.
   - Step 4 `where.exe java`: PASS. Printed `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\bin\java.exe`.
   - Step 4 `where.exe node26`: PASS. Printed `C:\Dev\OM3-tasks\T0-canary\ws\tools\bin\node26.cmd`.
   - Step 4 `where.exe python`: PASS. Printed the three paths in finding 6. Exit code 0.
   - Step 4 `Get-Command java,node26,python | Format-List Name,Source`: PASS. Exit code 0. Sources are the paths in finding 7.
   - Step 5: PASS. Exit 0. The nine bytes match `defaults_accessor.asm`.
   - Steps 6k and 6l: PASS.
   - Step 6a: PASS as the brief's expected refusal. Tool response `Rejected:`.
   - Step 6a2: PASS as a refusal. Tool response `Write permission denied: C:\Dev\OM3-tasks\T0-canary\ws\edit-root-denied.txt: Permission denied`.
   - Steps 6b–6j: PASS as refusals. Each exited 1 with `PermissionError: [Errno 13] Permission denied`.
   - Step 7 hash of the files that already existed, then the hash of `work/out/log.txt`: PASS. Full stdout is in the step 7 section below.
   - SHA-256 of `work/out/log.txt`: `c3d2e15c785606f28abe6d462a8e1d8e5c6c13333cf5cf9ded8f71ee8a90fd3c`, 19403 bytes.
   - SHA-256 of this file is the manifest output entry for `work\result.md`. It is computed after this file is sealed and is not copied into this file.

9. **New versus previously established:**

   - Finding 2 confirms `PROJECT-STATE.md` §9 (Low integrity).
   - Finding 3 confirms `PROJECT-STATE.md` §10 for the decoded main. The PROJECT-STATE and FEATURE-SPEC digests are measurements from this run.
   - Findings 4, 5, and 7 confirm the Java 25.0.5 path under `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\` and the Node v26.12.1 launcher `tools\bin\node26.cmd` named in this brief and in `TASK.md`.
   - Finding 6 is this run's measurement of the Python interpreter that `python -I` invoked.
   - Findings 8 and 9 confirm `defaults_accessor.asm`.
   - Findings 10–13 are the step 6 outcomes for this run.
   - Finding 15 is inferred from this run's token and the recorded denials, consistent with `PROJECT-STATE.md` §9.
   - The container, resource 0106, and OM-Emu patch pins in §10 were not re-measured here.

10. **Remaining uncertainties.**

    - Step 6a recorded `Rejected:` and did not record a Windows permission traceback.
    - Step 6a2 recorded the file tool's permission-denied string. No second probe was run.
    - A `PermissionError` shows that the write was denied. It does not, by itself, separate the integrity label from the deny-write ACL in `PROJECT-STATE.md` §9. This run did observe Low Mandatory Level.
    - This agent did not produce the coordinator's workspace snapshot comparison. Unchanged research-tree and input checks belong to that audit.
    - Container, resource 0106, and the OM-Emu patch were not re-verified in this run.
    - The script reported `image_base=0x0` while §10 names decoded-main base `0x60021020`. The nine bytes read at `0x60405804` still match `defaults_accessor.asm`. This run did not also dump that address from the decoded file at offset `address − 0x60021020`.
    - The shell tool added the sentence "This command ran outside the sandbox (no restrictions) because it matched the user's command allowlist" on each accepted shell command. The `whoami /groups` output in the same entries shows `Mandatory Label\Low Mandatory Level`.
    - `where.exe python` printed three executables. `Get-Command` and `python -I --version` identify the first, Python 3.12.7.

11. **Recommended next actions.** The version strings, the resolved Java and `node26` paths, the Ghidra smoke test, and the write refusals are recorded with their outputs. Brief §3's conditions that this run can observe are met. The coordinator's post-run snapshot and input re-hash remain the check this agent does not perform.

12. **Deviations from the brief.**

    - Steps 2–4 were issued together, and the step 6 attempts were issued together. Each specified command still ran once. `work/out/log.txt` was sealed in one write after those commands had finished, with their completed output and exit codes. It was not appended after each command individually, and it was not changed after sealing.
    - `work/out/log.txt` contains commands 1–25 (steps 1–6). The step 7 hashing commands and the writes of `log.txt`, this file, and the manifest are in the command list below and in the manifest. Their hashing stdout is in the step 7 section, except the hash of this file, which is stored only in the manifest because embedding it would change the digest.
    - File reads used the file reader and are listed in section 4. They are not shell commands and are not in the command list.

## Step 7 hash output

`step-7-write-log` completed before the hashes. Tool result: `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\out\log.txt`.

`step-7-hash-existing`. Exit code 0. Command completed in 603 ms.

```
e100fbce008c04ec40637af0af91fb2f05aeedc23f856a2d3c0b1580625d755e 6 work\out\hello.txt
eb1ecbc0cb8285e4d6d5e210160dc43a1df55e14dc63ee771aaa56da5b1942f4 1193 work\scripts\T0Smoke.java
840dd11c1039e52d2ccf69531f1eb57ad27db232d7fa17a11aaca6ab1bcbc594 101 work\out\ghidra-smoke.txt
c4e3963567e042a0afcd59abee96e75d9514490cfddfb137b8e70f3d797e7901 5142 work\out\ghidra-smoke.log
2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881 1 work\out\py-allowed.txt
2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881 1 om-emu\t0-allowed.txt
35b85034a2b6fa50d71c0a137aaa2361ea6c31ffad85a1b42fa0796c076b9959 5219 brief.md
844f1af505863cbc237b06c1540d720c899ff0ddbbb536ddf5f96d175dd5d3fe 2318 TASK.md
18d605fc1f70369c40245130cdd499288bd3ae1a8fe1bdb84575cb58532d0110 1230 templates\result.md
02e78eb244dca53aec4b1c2e458ef4ad9bc9060027966b4b74350d88432a8d9f 1822 review-brief.md
f8fc54438eb7282b199fe8ce72a0a753db65c0400884bbaa8ecdf1a92924ec32 81 ref\analysis\ghidra-validation\defaults_accessor.asm
f74d17ec23f6f778b497ad181bfd39247f8a29a6cdd549d973d4798ad367a8bb 485 tools\bin\run-ghidra.cmd
0dc9aa6201773ae84c491264cc8fd4ef2084a6369337795b5b3657a5e14f3878 98 tools\bin\node26.cmd
542f75d5ec4eb9a7fc454254870a95b682bc9096a85de3ab8df15d0fac503b43 14849 ref\PROJECT-STATE.md
f233815f1bb77246c8484f69f7a53e5c80837f6b87d22d2348ee41322afd2bdc 29070 ref\analysis\button-af\FEATURE-SPEC.md
5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59 33554368 inputs\00_0100_50000020.decoded.bin
```

`step-7-hash-log` (hashed last among the files above). Exit code 0. Command completed in 580 ms.

```
c3d2e15c785606f28abe6d462a8e1d8e5c6c13333cf5cf9ded8f71ee8a90fd3c 19403 work\out\log.txt
```

`step-7-hash-result` runs after this file is sealed. Its stdout is the manifest `outputs` entry for `work\result.md`. That stdout is not pasted here.

## Command list

```
Write work\out\hello.txt contents canary
whoami /groups
python -I -c "import hashlib,sys;[print(hashlib.sha256(open(p,'rb').read()).hexdigest(),p) for p in sys.argv[1:]]" ref\PROJECT-STATE.md ref\analysis\button-af\FEATURE-SPEC.md inputs\00_0100_50000020.decoded.bin
java -version
node26 --version
python -I --version
where.exe java
where.exe node26
where.exe python
Get-Command java,node26,python | Format-List Name,Source
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
Write work\out\log.txt
python -I -c "import hashlib,os,sys; [print(hashlib.sha256(open(p,'rb').read()).hexdigest(), os.path.getsize(p), p) for p in sys.argv[1:]]" work\out\hello.txt work\scripts\T0Smoke.java work\out\ghidra-smoke.txt work\out\ghidra-smoke.log work\out\py-allowed.txt om-emu\t0-allowed.txt brief.md TASK.md templates\result.md review-brief.md ref\analysis\ghidra-validation\defaults_accessor.asm tools\bin\run-ghidra.cmd tools\bin\node26.cmd ref\PROJECT-STATE.md ref\analysis\button-af\FEATURE-SPEC.md inputs\00_0100_50000020.decoded.bin
python -I -c "import hashlib,os,sys; [print(hashlib.sha256(open(p,'rb').read()).hexdigest(), os.path.getsize(p), p) for p in sys.argv[1:]]" work\out\log.txt
Write work\result.md
python -I -c "import hashlib,os,sys; [print(hashlib.sha256(open(p,'rb').read()).hexdigest(), os.path.getsize(p), p) for p in sys.argv[1:]]" work\result.md
Write work\evidence-manifest.json
```

## Command outcomes

The `result` text here is the manifest `commands[].result` text.

1. `step-1` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\out\hello.txt`
2. `step-2` — exit 0 — `Mandatory Label\Low Mandatory Level SID S-1-16-4096; full output in work\out\log.txt entry 2`
3. `step-3` — exit 0 — `542f75d5ec4eb9a7fc454254870a95b682bc9096a85de3ab8df15d0fac503b43 ref\PROJECT-STATE.md; f233815f1bb77246c8484f69f7a53e5c80837f6b87d22d2348ee41322afd2bdc ref\analysis\button-af\FEATURE-SPEC.md; 5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59 inputs\00_0100_50000020.decoded.bin`
4. `step-4-java` — exit 0 — `openjdk version "25.0.5" 2026-10-20 LTS; OpenJDK Runtime Environment Temurin-25.0.5+8 (build 25.0.5+8-LTS); OpenJDK 64-Bit Server VM Temurin-25.0.5+8 (build 25.0.5+8-LTS, mixed mode, sharing)`
5. `step-4-node26` — exit 0 — `v26.12.1`
6. `step-4-python` — exit 0 — `Python 3.12.7`
7. `step-4-where-java` — exit 0 — `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\bin\java.exe`
8. `step-4-where-node26` — exit 0 — `C:\Dev\OM3-tasks\T0-canary\ws\tools\bin\node26.cmd`
9. `step-4-where-python` — exit 0 — `C:\Users\tsmki\AppData\Local\Programs\Python\Python312\python.exe; C:\Users\tsmki\AppData\Local\Programs\Python\Python310\python.exe; C:\Users\tsmki\AppData\Local\Microsoft\WindowsApps\python.exe`
10. `step-4-getcommand` — exit 0 — `Name=java.exe Source=C:\Dev\OM3-research\tooling\jdk-25.0.5+8\bin\java.exe; Name=node26.cmd Source=C:\Dev\OM3-tasks\T0-canary\ws\tools\bin\node26.cmd; Name=python.exe Source=C:\Users\tsmki\AppData\Local\Programs\Python\Python312\python.exe`
11. `step-5-script` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\scripts\T0Smoke.java`
12. `step-5-ghidra` — exit 0 — `program=00_0100_50000020.decoded.bin image_base=0x0 addr=0x60405804 bytes=fc dc 90 6d 5f 60 de 00 00`
13. `step-6k` — exit 0 — `empty stdout; exit 0`
14. `step-6l` — exit 0 — `empty stdout; exit 0`
15. `step-6a` — exit null — `Rejected:`
16. `step-6a2` — exit null — `Write permission denied: C:\Dev\OM3-tasks\T0-canary\ws\edit-root-denied.txt: Permission denied`
17. `step-6b` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'ref\\runs\\denied-py.txt'`
18. `step-6c` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Dev\\OM3-research\\firmware\\denied-py.txt'`
19. `step-6d` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'ref\\README.md'`
20. `step-6e` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'inputs\\denied-py.txt'`
21. `step-6f` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Users\\tsmki\\.om-emu\\denied-py.txt'`
22. `step-6g` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Dev\\OM3-tasks\\T0-canary\\outside-ws.txt'`
23. `step-6h` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Users\\tsmki\\om3-canary-outside.txt'`
24. `step-6i` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'C:\\Dev\\tools\\om3-canary-outside.txt'`
25. `step-6j` — exit 1 — `PermissionError: [Errno 13] Permission denied: 'TASK.md'`
26. `step-7-write-log` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\out\log.txt`
27. `step-7-hash-existing` — exit 0 — `full stdout in work\result.md section Step 7 hash output under step-7-hash-existing`
28. `step-7-hash-log` — exit 0 — `c3d2e15c785606f28abe6d462a8e1d8e5c6c13333cf5cf9ded8f71ee8a90fd3c 19403 work\out\log.txt`
29. `step-7-write-result` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\result.md`
30. `step-7-hash-result` — exit 0 — `stdout is the manifest outputs entry for work\result.md; it is not pasted into this file`
31. `step-7-write-manifest` — exit null — `Wrote contents to C:\Dev\OM3-tasks\T0-canary\ws\work\evidence-manifest.json`
