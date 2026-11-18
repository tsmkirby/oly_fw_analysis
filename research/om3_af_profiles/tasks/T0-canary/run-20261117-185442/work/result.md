# T0-canary result

1. **Task identifier and brief version used:** T0-canary. Brief version 2026-11-17 (attempt 3: Low-integrity runtime). `brief.md` SHA-256 `944586a3f395e82ff514864b3357c30218fcaa1ba942a9b547a338d402d2873e` (4137 bytes).

2. **Research baseline used:** This brief is an isolation and tool check. Documents read: `TASK.md` (full), `brief.md` (full), `templates/result.md` (full), `review-brief.md` (full), `ref/PROJECT-STATE.md` sections 1–6 (through the open questions), `ref/analysis/ghidra-validation/defaults_accessor.asm` (full), `ref/analysis/ghidra-validation/validation.txt` lines 1–11, `tools/bin/run-ghidra.cmd` (full). `ref/PROJECT-STATE.md` §1 names T0 as the next task and records readiness NO-GO for installable firmware. Input hashes from step 3, confirmed again by the step 7 hash:
   - `ref\PROJECT-STATE.md` `8fac3acdb64b295c2eff3e8f29127d22da4642003a7faea10c4d2a04da87b782`
   - `ref\analysis\button-af\FEATURE-SPEC.md` `f233815f1bb77246c8484f69f7a53e5c80837f6b87d22d2348ee41322afd2bdc` (hashed, not read)
   - `inputs\00_0100_50000020.decoded.bin` `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes)
   No OM-Emu run, so there is no OM-Emu patch hash.

3. **Work performed:** Steps 1–6 of the brief, then the hashes required for the manifest. Full command text and full output are in `work/out/log.txt`.
   - Step 1. File-editing tool wrote `work\out\hello.txt` with contents `canary`.
   - Step 2. `whoami /groups`
   - Step 3. `python -I -c "import hashlib,sys;[print(hashlib.sha256(open(p,'rb').read()).hexdigest(),p) for p in sys.argv[1:]]" ref\PROJECT-STATE.md ref\analysis\button-af\FEATURE-SPEC.md inputs\00_0100_50000020.decoded.bin`
   - Step 4. `& "C:\Dev\OM3-research\tooling\jdk-25.0.5+8\bin\java.exe" -version` ; `& "C:\Dev\OM3-research\tooling\node-v26.12.1-win-x64\node.exe" --version` ; `python -I --version`
   - Step 5. Wrote `work\scripts\T0Smoke.java`, then `tools\bin\run-ghidra.cmd -postScript T0Smoke.java C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.txt -log C:\Dev\OM3-tasks\T0-canary\ws\work\out\ghidra-smoke.log`
   - Steps 6k, 6l, and 6b–6j. The exact `python -I -c` commands in the brief, once each.
   - Step 6a. File-editing tool attempted to create `ref\tasks\T0-canary\denied-edit-tool.txt`.
   - Step 7. One Python SHA-256 command over the files that already existed, recorded in the log. A second command hashes `work\out\log.txt` and `work\result.md` after they are closed; that output is in `work/evidence-manifest.json` (`step-7-hash-final`).

4. **Files examined:** `TASK.md`, `brief.md`, `templates/result.md`, `review-brief.md`, `ref/PROJECT-STATE.md`, `ref/analysis/ghidra-validation/defaults_accessor.asm`, `ref/analysis/ghidra-validation/validation.txt`, `tools/bin/run-ghidra.cmd`, `work/out/ghidra-smoke.txt`, `work/out/ghidra-smoke.log`, `work/out/hello.txt`, `work/out/py-allowed.txt`, `om-emu/t0-allowed.txt`. Address read in Ghidra: `0x60405804`, 9 bytes.

5. **Files created:** `work/out/hello.txt`, `work/scripts/T0Smoke.java`, `work/out/ghidra-smoke.txt`, `work/out/ghidra-smoke.log`, `work/out/py-allowed.txt`, `work/out/log.txt`, `work/result.md`, `work/evidence-manifest.json`, and the step 6k file `om-emu/t0-allowed.txt`. Every one of these except the manifest itself is listed with SHA-256 and size in `work/evidence-manifest.json`. The manifest's own digest is omitted inside the file because storing it would change the digest. Ghidra also updated its per-workspace cache under `state\`; those cache files are tool state, not task outputs.

6. **Findings:**
   1. `DATA` — `work\out\hello.txt` is the six bytes `canary`.
   2. `DATA` — The process token includes `Mandatory Label\Low Mandatory Level` (SID `S-1-16-4096`).
   3. `DATA` — Step 3 printed the three SHA-256 values listed in section 2.
   4. `DATA` — `python -I --version` printed `Python 3.12.7`.
   5. `DATA` — The Java version command returned the tool result `Rejected:` and did not start.
   6. `DATA` — The Node version command returned the tool result `Rejected:` and did not start.
   7. `STATIC` — Headless Ghidra on `00_0100_50000020.decoded.bin` reported image base `0x0` and the 9 bytes at `0x60405804` as `fc dc 90 6d 5f 60 de 00 00`.
   8. `STATIC` — Those 9 bytes are the same bytes as `ref\analysis\ghidra-validation\defaults_accessor.asm` at `60405804` (`fc dc 90 6d 5f 60`) and `6040580a` (`de 00 00`).
   9. `DATA` — Step 6k created `om-emu\t0-allowed.txt` (1 byte, `x`, exit 0). Step 6l created `work\out\py-allowed.txt` (1 byte, `x`, exit 0).
   10. `DATA` — Step 6a, the file-editing tool, returned `Rejected:` and left `ref\tasks\T0-canary\denied-edit-tool.txt` uncreated.
   11. `DATA` — Steps 6b–6j each exited 1 with `PermissionError: [Errno 13] Permission denied` for the path in that command.

7. **Evidence for each claim:**
   1. `work/out/log.txt` lines 7–12 and line 256; file size 6.
   2. `work/out/log.txt` line 26.
   3. `work/out/log.txt` lines 46–48, repeated at lines 268–270.
   4. `work/out/log.txt` line 72.
   5. `work/out/log.txt` lines 50–55.
   6. `work/out/log.txt` lines 58–63.
   7. `work/out/ghidra-smoke.txt` lines 1–4; same text at `work/out/log.txt` lines 130–133. Ghidra exit code 0 at `work/out/log.txt` line 84.
   8. `ref/analysis/ghidra-validation/defaults_accessor.asm` lines 1–2, bytes `fc dc 90 6d 5f 60` and `de 00 00`.
   9. `work/out/log.txt` lines 144–157 and lines 260–261.
   10. `work/out/log.txt` lines 136–141. A workspace search for `denied-edit-tool.txt` found 0 files.
   11. `work/out/log.txt` lines 168, 178, 188, 198, 208, 218, 228, 238, and 248.

8. **Tests and outcomes:**
   - Step 1 allowed write: PASS.
   - Step 2 Low Mandatory Level: PASS.
   - Step 3 read and hash: PASS.
   - Step 4 Python version: PASS.
   - Step 4 Java version: FAIL. The tool rejected the command before `java.exe` ran. Exact tool text: `Rejected:`
   - Step 4 Node version: FAIL. The tool rejected the command before `node.exe` ran. Exact tool text: `Rejected:`
   - Step 5 Ghidra smoke and byte comparison with `defaults_accessor.asm`: PASS. The run also logged `OS Truststore load failed: java.security.KeyStoreException: error 5, Access is denied.` and then finished with exit 0.
   - Step 6k allowed `om-emu` write: PASS.
   - Step 6l allowed `work` write: PASS.
   - Step 6a file-editing tool write outside `work`: BOUNDARY. The tool refused the call with `Rejected:` and the file was not created. The operating system did not return an error string, because the tool stopped the call first. Section 0 forbids a second attempt.
   - Steps 6b, 6c, 6d, 6e, 6f, 6g, 6h, 6i, 6j: PASS as refusals. Each returned `PermissionError: [Errno 13] Permission denied`.

9. **New versus previously established:** Each claim above is new for this attempt. `ref/PROJECT-STATE.md` §1 and §4 still list T0 as the next ready task and do not record a completed canary pass. This run does not update that file.

10. **Remaining uncertainties:**
    - Java and Node version strings were not printed. The Ghidra log identifies `ghidra_12.2_PUBLIC` and the launcher sets `JAVA_HOME` to `C:\Dev\OM3-research\tooling\jdk-25.0.5+8`, which is path evidence from `tools\bin\run-ghidra.cmd`, not the output of `java.exe -version`.
    - Ghidra's program image base property is `0x0`. The 9 bytes at address `0x60405804` still match the validation listing.
    - The headless script-path list in the log includes `work\scripts` and does not include `ref\scripts`. `T0Smoke.java` was loaded from `work\scripts`.
    - Step 6a did not reach an operating-system denial message.

11. **Recommended next actions:** Add the exact `java.exe -version` and `node.exe --version` commands to the command allowlist and re-run step 4. If step 6a must show an operating-system denial string, allow the file-editing tool to attempt that one path so the operating system can refuse it. Steps 6b–6j already show that refusal.

12. **Deviations from the brief:**
    - The Java and Node commands were issued through PowerShell as `& "...exe" -version` / `& "...exe" --version`, with quotes around the path, because the JDK directory name contains `+`. The brief's command text has no call operator. The tool rejected those two invocations. They were not issued again.
    - Step 1, the step 5 script write, and the step 2–4 shells were issued in one batch. The Ghidra command and steps 6a–6j were issued in a second batch. Each specified action still ran once.
    - One read-only workspace search confirmed `denied-edit-tool.txt` was absent after step 6a.
    - SHA-256 of `work\out\log.txt` and `work\result.md` is stored in the manifest and is not appended to the log. The log states that command before it closes.
