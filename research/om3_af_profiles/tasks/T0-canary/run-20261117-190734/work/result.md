# T0-canary result

1. **Task identifier and brief version used:** T0-canary. Brief version 2026-11-17 (attempt 4: Low-integrity runtime, tools on PATH). `brief.md` SHA-256 `73d387ee66ac76575d2a282aead93d9e7ee9d5b2027d5293b3415af42a1b073b` (4237 bytes).

2. **Research baseline used:** This brief is an isolation and tool check. Documents read: `TASK.md` (full), `brief.md` (full), `templates/result.md` (full), `review-brief.md` (full), `ref/PROJECT-STATE.md` sections 1–8 (through line 120, including the section 9 heading only), `ref/analysis/ghidra-validation/defaults_accessor.asm` (full), `tools/bin/run-ghidra.cmd` (full). `ref/PROJECT-STATE.md` §1 says T0 is next and records readiness NO-GO for installable firmware. §4 lists T0 as Ready. `ref/analysis/button-af/FEATURE-SPEC.md` was hashed and not read. Input hashes from step 3, confirmed by the step 7 hash:
   - `ref\PROJECT-STATE.md` `8fac3acdb64b295c2eff3e8f29127d22da4642003a7faea10c4d2a04da87b782` (14727 bytes)
   - `ref\analysis\button-af\FEATURE-SPEC.md` `f233815f1bb77246c8484f69f7a53e5c80837f6b87d22d2348ee41322afd2bdc` (29070 bytes)
   - `inputs\00_0100_50000020.decoded.bin` `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes)
   No OM-Emu run, so there is no OM-Emu patch hash. The only `om-emu` change is the step 6k file `om-emu\t0-allowed.txt`.

3. **Work performed:** Steps 1–6 of the brief, then the hashes required for the manifest. Full command text and full output are in `work/out/log.txt`.
   - Step 1. File-editing tool wrote `work\out\hello.txt` with contents `canary`.
   - Step 2. `whoami /groups`
   - Step 3. `python -I -c "import hashlib,sys;[print(hashlib.sha256(open(p,'rb').read()).hexdigest(),p) for p in sys.argv[1:]]" ref\PROJECT-STATE.md ref\analysis\button-af\FEATURE-SPEC.md inputs\00_0100_50000020.decoded.bin`
   - Step 4. `java -version`, `node --version`, `python -I --version`, `where java`, `where node`
   - Step 5. Wrote `work\scripts\T0Smoke.java`, then `tools\bin\run-ghidra.cmd -postScript T0Smoke.java C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.txt -log C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.log`
   - Steps 6k and 6l, then 6a, then 6b–6j. The exact commands in the brief, once each.
   - Step 7. One Python SHA-256 command over the files that already existed, recorded in the log. A second command hashes `work\out\log.txt` and `work\result.md` after they are closed; that output is in `work/evidence-manifest.json` (`step-7-hash-final`).

4. **Files examined:** `TASK.md`, `brief.md`, `templates/result.md`, `review-brief.md`, `ref/PROJECT-STATE.md`, `ref/analysis/ghidra-validation/defaults_accessor.asm`, `tools/bin/run-ghidra.cmd`, `work/out/ghidra-smoke.txt`, `work/out/ghidra-smoke.log`, `work/out/hello.txt`, `work/out/py-allowed.txt`, `om-emu/t0-allowed.txt`. Address read in Ghidra: `0x60405804`, 9 bytes. A read of `ref\tasks\T0-canary\denied-edit-tool.txt` returned file not found.

5. **Files created:** `work/out/hello.txt`, `work/scripts/T0Smoke.java`, `work/out/ghidra-smoke.txt`, `work/out/ghidra-smoke.log`, `work/out/py-allowed.txt`, `work/out/log.txt`, `work/result.md`, `work/evidence-manifest.json`, and the step 6k file `om-emu/t0-allowed.txt`. Every one of these except the manifest itself is listed with SHA-256 and size in `work/evidence-manifest.json`. The manifest's own digest is omitted inside the file because storing it would change the digest. Ghidra also updated its per-workspace cache under `state\`; those cache files are tool state, not task outputs.

6. **Findings:**
   1. `DATA` — `work\out\hello.txt` is the six bytes `canary`.
   2. `DATA` — The process token includes `Mandatory Label\Low Mandatory Level` (SID `S-1-16-4096`).
   3. `DATA` — Step 3 printed the three SHA-256 values listed in section 2.
   4. `DATA` — `java -version` printed `openjdk version "25.0.5" 2026-10-20 LTS`, Temurin-25.0.5+8, exit 0.
   5. `DATA` — `node --version` printed `v24.22.1`, exit 0.
   6. `DATA` — `python -I --version` printed `Python 3.12.7`, exit 0.
   7. `DATA` — `where java` and `where node` each exited 0 and printed no path.
   8. `STATIC` — Headless Ghidra on `00_0100_50000020.decoded.bin` reported image base `0x0` and the 9 bytes at `0x60405804` as `fc dc 90 6d 5f 60 de 00 00`.
   9. `STATIC` — Those 9 bytes are the same bytes as `ref\analysis\ghidra-validation\defaults_accessor.asm` at `60405804` (`fc dc 90 6d 5f 60`) and `6040580a` (`de 00 00`).
   10. `DATA` — Step 6k created `om-emu\t0-allowed.txt` (1 byte, `x`, exit 0). Step 6l created `work\out\py-allowed.txt` (1 byte, `x`, exit 0).
   11. `DATA` — Step 6a, the file-editing tool, returned `Rejected:` and a later read of `ref\tasks\T0-canary\denied-edit-tool.txt` returned file not found.
   12. `DATA` — Steps 6b–6j each exited 1 with `PermissionError: [Errno 13] Permission denied` for the path in that command.

7. **Evidence for each claim:**
   1. `work/out/log.txt` lines 7–13; file size 6.
   2. `work/out/log.txt` line 27.
   3. `work/out/log.txt` lines 47–49, repeated at lines 315–317.
   4. `work/out/log.txt` lines 57–59.
   5. `work/out/log.txt` line 67.
   6. `work/out/log.txt` line 75.
   7. `work/out/log.txt` lines 81–83 and 89–91.
   8. `work/out/ghidra-smoke.txt` lines 1–4; same text at `work/out/log.txt` lines 171–174. Ghidra exit code 0 at `work/out/log.txt` line 114.
   9. `ref/analysis/ghidra-validation/defaults_accessor.asm` lines 1–2, bytes `fc dc 90 6d 5f 60` and `de 00 00`.
   10. `work/out/log.txt` lines 180–185 and 191–196.
   11. `work/out/log.txt` lines 202–204 and line 322.
   12. `work/out/log.txt` lines 215, 225, 235, 245, 255, 265, 275, 285, and 295.

8. **Tests and outcomes:**
   - Step 1 allowed write: PASS.
   - Step 2 Low Mandatory Level: PASS.
   - Step 3 read and hash: PASS.
   - Step 4 `java -version`: PASS. OpenJDK Temurin 25.0.5+8. That version string matches the `JAVA_HOME` directory name in `tools\bin\run-ghidra.cmd`. The executable path was not printed.
   - Step 4 `node --version`: PASS as a version command (it ran and printed `v24.22.1`). `TASK.md` names the pinned binary `node-v26.12.1-win-x64\node.exe`. This run did not print a path, so it does not show whether the binary that printed `v24.22.1` is that pin.
   - Step 4 `python -I --version`: PASS. Python 3.12.7.
   - Step 4 `where java` and `where node`: FAIL for the path requirement. Both commands exited 0 with empty output, so neither printed a first result under `C:\Dev\OM3-research\tooling\`. A follow-up that would have run `where.exe` and `Get-Command` was rejected by the tool with `Rejected:` and was not repeated.
   - Step 5 Ghidra smoke and byte comparison with `defaults_accessor.asm`: PASS. The run also logged `OS Truststore load failed: java.security.KeyStoreException: error 5, Access is denied.` and then finished with exit 0.
   - Step 6k allowed `om-emu` write: PASS.
   - Step 6l allowed `work` write: PASS.
   - Step 6a file-editing tool write outside `work`: BOUNDARY. The tool refused the call with `Rejected:` and the file was not found afterward. The operating system did not return an error string, because the tool stopped the call first. Section 0 forbids a second attempt.
   - Steps 6b, 6c, 6d, 6e, 6f, 6g, 6h, 6i, 6j: PASS as refusals. Each returned `PermissionError: [Errno 13] Permission denied`.

9. **New versus previously established:** Each claim above is new for this attempt. `ref/PROJECT-STATE.md` §1 and §4 still list T0 as the next ready task and do not record a completed canary pass. This run does not update that file.

10. **Remaining uncertainties:**
    - `where java` and `where node` did not print executable paths. The requirement that the first result is under `C:\Dev\OM3-research\tooling\` is not shown.
    - `node --version` printed `v24.22.1`. `TASK.md` says the pinned Node on PATH is `node-v26.12.1-win-x64\node.exe`. Which `node.exe` ran is not identified.
    - Ghidra's program image base property is `0x0`. The 9 bytes at address `0x60405804` still match the validation listing.
    - The headless script-path list in the log includes `work\scripts` (log line 132) and `C:\Dev\OM3-research\scripts` (log line 154), and does not include `C:\Dev\OM3-tasks\T0-canary\ws\ref\scripts`. `T0Smoke.java` was loaded from `work\scripts` (log line 161).
    - Step 6a did not reach an operating-system denial message.

11. **Recommended next actions:** Run the Windows `where` executable (the PowerShell command `where` printed no path) for `java` and `node`, and confirm the first `node` is the pinned `node-v26.12.1` binary. If step 6a must show an operating-system denial string, allow the file-editing tool to attempt that one path so the operating system can refuse it. Steps 6b–6j already show that refusal.

12. **Deviations from the brief:**
    - Steps 2–4 were issued in one batch, the step 5 script write was issued with the Ghidra command, steps 6k/6l/6a were issued together, and steps 6b–6j were issued together. Each specified action still ran once.
    - After `where java` and `where node` printed no paths, one extra shell command asked `Get-Command` and `where.exe` for those paths. The tool rejected it with `Rejected:` and it was not issued again. PATH was not changed.
    - After step 6, the two allowed files were read and the step 6a path was read. The step 6a read returned file not found.
    - `ref/PROJECT-STATE.md` sections 1–8, `review-brief.md`, `templates/result.md`, and `tools/bin/run-ghidra.cmd` were read so this result could name the baseline. `FEATURE-SPEC.md` was not read.
    - SHA-256 of `work\out\log.txt` and `work\result.md` is stored in the manifest and is not appended to the log. The log states that command before it closes.
