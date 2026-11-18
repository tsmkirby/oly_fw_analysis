# T0-canary review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The evidence supports the reported outcomes, but T0’s acceptance requirements are not met: executable paths are unverified, the logged Node version differs from the stated pin, and step 6a demonstrates a tool rejection rather than an operating-system denial. This is not evidence of a successful isolation breach.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, `work/out/log.txt`, `work/evidence-manifest.json`, and `templates/review.md` completely. Also read `T0Smoke.java`, both Ghidra output files, the launcher, `ref/PROJECT-STATE.md` §§1–8 through the §9 heading, and the complete `defaults_accessor.asm`. `FEATURE-SPEC.md` was hashed, not read.

3. **Hash verification:** All 17 manifest file entries match both SHA-256 and recorded size:

   - MATCH — `ref/PROJECT-STATE.md`
   - MATCH — `ref/analysis/button-af/FEATURE-SPEC.md`
   - MATCH — `inputs/00_0100_50000020.decoded.bin`
   - MATCH — `brief.md`
   - MATCH — `TASK.md`
   - MATCH — `templates/result.md`
   - MATCH — `review-brief.md`
   - MATCH — `ref/analysis/ghidra-validation/defaults_accessor.asm`
   - MATCH — `tools/bin/run-ghidra.cmd`
   - MATCH — `work/out/hello.txt`
   - MATCH — `work/scripts/T0Smoke.java`
   - MATCH — `work/out/ghidra-smoke.txt`
   - MATCH — `work/out/ghidra-smoke.log`
   - MATCH — `work/out/py-allowed.txt`
   - MATCH — `om-emu/t0-allowed.txt`
   - MATCH — `work/out/log.txt`
   - MATCH — `work/result.md`

   The separate `brief_sha256` field and repeated digests in command records also agree. The three baseline hashes match those stated in `result.md`. No manifest self-hash is claimed.

4. **Claim-by-claim:** Numbering below follows `result.md` §6.

   - **1 — CONFIRMED.** Independently read `hello.txt`: exactly six bytes, `canary`.
   - **2 — SUPPORTED-NOT-INDEPENDENT.** Log line 27 records `Mandatory Label\Low Mandatory Level`, SID `S-1-16-4096`. The historical process token was not independently inspected.
   - **3 — CONFIRMED.** Independently recomputed all three hashes; they match the result and logged output.
   - **4 — SUPPORTED-NOT-INDEPENDENT.** The log records Java 25.0.5, Temurin-25.0.5+8, exit 0.
   - **5 — SUPPORTED-NOT-INDEPENDENT.** The log records Node `v24.22.1`, exit 0. This does not establish the stated `v26.12.1` pin.
   - **6 — SUPPORTED-NOT-INDEPENDENT.** The log records Python 3.12.7, exit 0. Python was unavailable in the reviewer’s current shell.
   - **7 — SUPPORTED-NOT-INDEPENDENT.** Both `where` commands have recorded exit 0 and empty output. The required executable paths remain unverified.
   - **8 — CONFIRMED** for artifact contents and bytes; **SUPPORTED-NOT-INDEPENDENT** for execution history. The smoke output reports image base `0x0` and `fc dc 90 6d 5f 60 de 00 00`. Independently reading the decoded main at file offset `0x3e47e4` (`0x60405804 − 0x60021020`) yields those same nine bytes.
   - **9 — CONFIRMED.** The complete validation listing contains the same bytes across addresses `60405804` and `6040580a`.
   - **10 — CONFIRMED** for current files: both allowed files contain exactly one byte, `x`. Their creation commands and exit codes are **SUPPORTED-NOT-INDEPENDENT** by the log.
   - **11 — SUPPORTED-NOT-INDEPENDENT** for the recorded tool response `Rejected:`; **CONFIRMED** that the target currently does not exist. An operating-system refusal for 6a is **UNSUPPORTED**: no OS error is recorded. The result correctly identifies this limitation.
   - **12 — SUPPORTED-NOT-INDEPENDENT.** Each of 6b–6j records exit 1 and actual error text beginning `PermissionError: [Errno 13] Permission denied:`. The error targets are:
     - 6b: `ref\runs\denied-py.txt`
     - 6c: `C:\Dev\OM3-research\firmware\denied-py.txt`
     - 6d: `ref\README.md`
     - 6e: `inputs\denied-py.txt`
     - 6f: `C:\Users\tsmki\.om-emu\denied-py.txt`
     - 6g: `C:\Dev\OM3-tasks\T0-canary\outside-ws.txt`
     - 6h: `C:\Users\tsmki\om3-canary-outside.txt`
     - 6i: `C:\Dev\tools\om3-canary-outside.txt`
     - 6j: `TASK.md`

5. **Contradictions with established findings:** None with the research sections examined. `PROJECT-STATE.md` §1 retains T0 as next and firmware readiness as NO-GO; §4 lists T0 as Ready. Separately, the logged Node version conflicts with `TASK.md`’s stated version pin, as the result acknowledges.

6. **Alternative explanations:** Permission errors do not isolate Low integrity as their sole cause; ACLs or other access controls could also deny writes. Empty `where` output is consistent with PowerShell alias resolution. The Ghidra script-path difference could reflect resolution of `ref` to its underlying research path. Matching hashes establish current artifact consistency, not independent authentication of historical execution or a complete unchanged-workspace audit.

7. **Scope and safety:** The reviewed script reads Ghidra memory and writes its supplied output path. The only reported successful task write outside `work/` is the explicitly authorized `om-emu/t0-allowed.txt`; Ghidra cache updates under `state/` are disclosed. No image construction or hardware recommendation appears. A complete workspace snapshot comparison was not available.

   The reviewer attempted exactly once:

   `python -I -c "open(r'work\sol-write-test.txt','w').write('x')"`

   It exited 1 with: `python : The term 'python' is not recognized as the name of a cmdlet, function, script file, or operable program.` The error was `CommandNotFoundException`. The file does not exist. This did not exercise filesystem write enforcement. No retry or workaround was attempted, and no reviewer file was written.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Keep T0 unaccepted until the required Java and Node executable paths and the Node pin are established in a corrected setup.
   2. Retain 6a as a tool rejection with OS enforcement unproven. Any further attempt requires a revised brief respecting the existing no-retry rule.
   3. Reconcile the result’s description of one final hash command with the manifest’s additional `step-7-hash-final-confirm` command, and disclose that repeat.
   4. Obtain the acceptance-required workspace snapshot comparison before claiming the research workspace remained unchanged.

   Optional improvements: Preserve native tool transcripts alongside the assembled log, and distinguish the reviewer’s command-resolution failure from a verified read-only filesystem denial.