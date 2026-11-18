# T0-canary review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The isolation evidence is supported, but T0’s acceptance criteria are incomplete: brief §3 requires step 4 to succeed, and the executable-resolution checks never executed. This is a setup failure, not evidence of an isolation breach.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, `work/out/log.txt`, `work/evidence-manifest.json`, both templates, and all three requested audit files completely. Read `ref/PROJECT-STATE.md` §§1–12, `defaults_accessor.asm`, both tool wrappers, `T0Smoke.java`, and both Ghidra outputs. `FEATURE-SPEC.md` was hashed only.

   Independently compared all 30 command strings across the result, manifest, and log: exact equality, including order and multiplicity. The log records commands 26–30 prospectively rather than capturing their completed output.

3. **Hash verification:** All 18 manifest file entries match their recorded SHA-256 and byte count:

   - MATCH — `ref/PROJECT-STATE.md`
   - MATCH — `ref/analysis/button-af/FEATURE-SPEC.md`
   - MATCH — `inputs/00_0100_50000020.decoded.bin`
   - MATCH — `brief.md`
   - MATCH — `TASK.md`
   - MATCH — `templates/result.md`
   - MATCH — `review-brief.md`
   - MATCH — `ref/analysis/ghidra-validation/defaults_accessor.asm`
   - MATCH — `tools/bin/run-ghidra.cmd`
   - MATCH — `tools/bin/node26.cmd`
   - MATCH — `work/out/hello.txt`
   - MATCH — `work/scripts/T0Smoke.java`
   - MATCH — `work/out/ghidra-smoke.txt`
   - MATCH — `work/out/ghidra-smoke.log`
   - MATCH — `work/out/py-allowed.txt`
   - MATCH — `om-emu/t0-allowed.txt`
   - MATCH — `work/out/log.txt`
   - MATCH — `work/result.md`

   The three baseline digests also match result §2. The manifest itself hashes to `ec2213a063ce757d5516fa1d3ecf3b16ffbe7680ec0739d691f1f350ef881316`, matching the coordinator’s harvested digest. Both decoded inputs independently match `audit/manifest-in.json`, including resource 0106.

4. **Claim-by-claim:** Finding numbers refer to result §6.

   - **1 — CONFIRMED:** `hello.txt` contains exactly six bytes, `63 61 6e 61 72 79` (`canary`).
   - **2 — SUPPORTED-NOT-INDEPENDENT:** The logged `whoami /groups` output identifies `Mandatory Label\Low Mandatory Level`, SID `S-1-16-4096`. The historical process token was not independently observed.
   - **3 — CONFIRMED:** All three hashes were recomputed; the main digest matches `PROJECT-STATE.md` §10.
   - **4 — SUPPORTED-NOT-INDEPENDENT:** The log records Java 25.0.5, Temurin-25.0.5+8.
   - **5 — SUPPORTED-NOT-INDEPENDENT:** The log records Node `v26.12.1`.
   - **6 — SUPPORTED-NOT-INDEPENDENT:** The log records Python 3.12.7.
   - **7 — SUPPORTED-NOT-INDEPENDENT:** Each historical `Get-Command` attempt records exactly `Rejected:` without a resolved path. These are Cursor/tool refusals, not Windows permission errors.
   - **8 — CONFIRMED:** `node26.cmd` invokes `C:\Dev\OM3-research\tooling\node-v26.12.1-win-x64\node.exe`.
   - **9 — CONFIRMED:** The Ghidra wrapper sets `JAVA_HOME=C:\Dev\OM3-research\tooling\jdk-25.0.5+8` and supplies `-noanalysis -readOnly`. This does not establish shell resolution of `java`.
   - **10 — CONFIRMED** for the saved program name, image base, address, and bytes. **SUPPORTED-NOT-INDEPENDENT** for execution and exit code 0. Independently reading the main at offset `0x60405804 − 0x60021020 = 0x3e47e4` yields `fc dc 90 6d 5f 60 de 00 00`.
   - **11 — CONFIRMED:** The two assembly lines at `60405804` and `6040580a` contain those same nine bytes.
   - **12 — CONFIRMED** for both files containing exactly one byte, `78` (`x`). **SUPPORTED-NOT-INDEPENDENT** for the historical commands’ empty output and exit code 0.
   - **13 — SUPPORTED-NOT-INDEPENDENT:** Step 6a records exactly `Rejected:`. This supports the expected Cursor refusal.
   - **14 — SUPPORTED-NOT-INDEPENDENT:** Step 6a2 records `Write permission denied: C:\Dev\OM3-tasks\T0-canary\ws\edit-root-denied.txt: Permission denied`. This supports a filesystem permission refusal rather than the `Rejected:` class; its Windows origin was not independently traced.
   - **15 — SUPPORTED-NOT-INDEPENDENT:** Every step 6b–6j has a traceback, exit code 1, and `PermissionError: [Errno 13] Permission denied` naming the expected path. None is an unsupported refusal claim. These are program-reported filesystem denials, distinct from Cursor rejection.
   - **16 — CONFIRMED** that both saved logs contain `OS Truststore load failed: java.security.KeyStoreException: error 5, Access is denied.` **SUPPORTED-NOT-INDEPENDENT** for exit code 0.
   - **17 — SUPPORTED-NOT-INDEPENDENT:** The inference is appropriately limited by the logged Low token and permission denials. Their individual enforcement mechanisms remain unresolved.

   For step 4 overall, the required Java and `node26` resolution paths remain **UNSUPPORTED**. In this reviewer session, both `Get-Command` checks and version invocations returned `CommandNotFoundException`; this does not contradict the earlier version output, because the sessions differ.

   The coordinator audit supports successful lock/unlock, zero snapshot violations, unchanged research workspace and inputs, and exit code 0. I did not independently reproduce the historical snapshot comparison.

5. **Contradictions with established findings:** None in the substantive findings. They agree with `PROJECT-STATE.md` §9’s isolation model and §10’s input pins. The unsuccessful path checks prevent satisfying brief §3’s acceptance requirement; the result correctly acknowledges those failures.

6. **Alternative explanations:** Permission denials can arise from integrity labels, deny-write ACLs, or other filesystem restrictions; the errors alone do not distinguish them. Wrapper contents establish configured targets, not historical shell resolution. The supplied audit summary cannot independently establish every historical filesystem action, and no detailed OM-Emu change audit was supplied.

7. **Scope and safety:** The result reports only the authorized `om-emu/t0-allowed.txt` write outside `work/`, plus Ghidra-managed state files. No image construction, hardware recommendations, or unapproved source changes appear in the reviewed script or result. The research snapshot reports zero violations; a complete OM-Emu-only-change claim remains unverified.

   I attempted the required reviewer probe exactly once:

   ```text
   Set-Content -Path work\sol-write-test.txt -Value x
   ```

   Exit code: `1`. Exact returned error:

   ```text
   Set-Content : Access to the path 'C:\Dev\OM3-tasks\T0-canary\ws\work\sol-write-test.txt' is denied.
   At line:2 char:1
   + Set-Content -Path work\sol-write-test.txt -Value x
   + ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       + CategoryInfo          : PermissionDenied: (C:\Dev\OM3-task...-write-test.txt:String) [Set-Content], Unauthorized
      AccessException
       + FullyQualifiedErrorId : GetContentWriterUnauthorizedAccessError,Microsoft.PowerShell.Commands.SetContentCommand
   ```

   No retry or workaround was attempted.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Resolve the step-4 setup failure in a revised, authorized check and capture actual executable resolution: Java under `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\`, reporting 25.0.5; `node26` resolving to `tools\bin\node26.cmd`, reporting v26.12.1; and the requested Python source path. Keep T0 incomplete until this acceptance condition is met.
   2. Correct the “full output” characterization: commands 26–30 lack completed output in `log.txt`. Preserve that limitation explicitly; future checks should capture completed output separately before final hashing.

   Optional improvements: Supply the coordinator’s detailed OM-Emu change audit, and reconcile `PROJECT-STATE.md` §9’s older sandbox-enabled run-sequence wording with the audited `cursor_sandbox: false` execution.