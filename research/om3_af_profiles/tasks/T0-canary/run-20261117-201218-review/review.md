# T0-canary review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

2. **Baseline checked:** Read completely: `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, `work/out/log.txt`, `work/evidence-manifest.json`, both templates, and all three supplied audit files. Research read: `ref/PROJECT-STATE.md` §§1–12 and the complete `defaults_accessor.asm`. Also inspected the smoke script, smoke outputs, and Java/Node launchers. FEATURE-SPEC was hashed only.

3. **Hash verification:** All 18 manifest entries independently recomputed with SHA-256; every hash and byte count is **MATCH**:

   - `ref/PROJECT-STATE.md`
   - `ref/analysis/button-af/FEATURE-SPEC.md`
   - `inputs/00_0100_50000020.decoded.bin`
   - `brief.md`
   - `TASK.md`
   - `templates/result.md`
   - `review-brief.md`
   - `ref/analysis/ghidra-validation/defaults_accessor.asm`
   - `tools/bin/run-ghidra.cmd`
   - `tools/bin/node26.cmd`
   - `work/out/hello.txt`
   - `work/scripts/T0Smoke.java`
   - `work/out/ghidra-smoke.txt`
   - `work/out/ghidra-smoke.log`
   - `work/out/py-allowed.txt`
   - `om-emu/t0-allowed.txt`
   - `work/out/log.txt`
   - `work/result.md`

   The three baseline hashes match result §2. Additionally, the manifest’s own hash matches `audit/run-log.json` (`3de96858…d36282`), and resource 0106 matches `audit/manifest-in.json` (`3d9fd442…a0b059`).

   The result and manifest command lists contain exactly 31 identical strings in identical order, preserving repetitions. The log’s 25 command strings match the first 25 entries exactly.

4. **Claim-by-claim:** Numbering below refers to result §6.

   - **1 — CONFIRMED:** `hello.txt` contains exactly six bytes, `canary`.
   - **2 — SUPPORTED-NOT-INDEPENDENT:** Log entry 2 records `Mandatory Label\Low Mandatory Level`, SID `S-1-16-4096`.
   - **3 — CONFIRMED:** All three digests independently match; decoded main also matches PROJECT-STATE §10.
   - **4 — SUPPORTED-NOT-INDEPENDENT:** Entries 4 and 7 record Java 25.0.5, exit 0, resolving beneath `C:\Dev\OM3-research\tooling\jdk-25.0.5+8\`.
   - **5 — SUPPORTED-NOT-INDEPENDENT:** Entries 5 and 8 record `v26.12.1`, exit 0, resolving to workspace `tools\bin\node26.cmd`. Its inspected contents invoke the pinned Node executable.
   - **6 — SUPPORTED-NOT-INDEPENDENT:** Entries 6 and 9 record Python 3.12.7 and the stated three paths.
   - **7 — SUPPORTED-NOT-INDEPENDENT:** Entry 10 records the claimed command sources and exit 0. Java and `node26` were unavailable on the reviewer’s PATH; reviewer invocation attempts returned `CommandNotFoundException`.
   - **8 — CONFIRMED** for saved program name, image-base value, address, and bytes; **SUPPORTED-NOT-INDEPENDENT** for execution and exit 0. The launcher specifies `-noanalysis -readOnly`; both logs support the run.
   - **9 — CONFIRMED:** Assembly bytes match the smoke output. Independently reading decoded main at offset `0x60405804 − 0x60021020 = 0x3e47e4` yields `fc dc 90 6d 5f 60 de 00 00`.
   - **10 — CONFIRMED** for both one-byte `x` files; **SUPPORTED-NOT-INDEPENDENT** for the creating commands’ exit codes.
   - **11 — SUPPORTED-NOT-INDEPENDENT:** Entry 15 contains actual error text `Rejected:`. This is a Cursor refusal, not Windows permission evidence.
   - **12 — SUPPORTED-NOT-INDEPENDENT:** Entry 16 contains `Write permission denied: C:\Dev\OM3-tasks\T0-canary\ws\edit-root-denied.txt: Permission denied`. This supports a permission refusal; the file tool’s message does not independently identify the underlying enforcement mechanism.
   - **13 — SUPPORTED-NOT-INDEPENDENT:** Entries 17–25 separately record each step 6b–6j command, exit 1, and `PermissionError: [Errno 13] Permission denied` naming its intended target. These are runtime permission failures, not Cursor `Rejected:` responses. None lacks error text.
   - **14 — SUPPORTED-NOT-INDEPENDENT:** Both Ghidra logs contain `OS Truststore load failed: java.security.KeyStoreException: error 5, Access is denied.` Entry 12 records exit 0.
   - **15 — SUPPORTED-NOT-INDEPENDENT:** The bounded inference follows from the recorded Low token, allowed outputs, and permission failures, consistently with PROJECT-STATE §9. It does not isolate integrity enforcement from ACL enforcement.

   The coordinator audit reports zero research-workspace violations, successful lock/unlock checks, exit 0, and unchanged inputs. These historical outcomes are **SUPPORTED-NOT-INDEPENDENT**.

   Result §12 correctly discloses a procedural deviation: the log was sealed once after execution, rather than appended after each completed command as brief §2 requires. Hash agreement cannot establish contemporaneous logging or independently prove that attempts occurred only once.

5. **Contradictions with established findings:** None. The reported Ghidra `image_base=0x0` remains distinct from PROJECT-STATE §10’s decoded-file load base `0x60021020`; the direct file-byte comparison confirms the required address mapping without resolving that metadata difference.

6. **Alternative explanations:** Permission failures do not distinguish integrity labels from deny-write ACLs. Step 6a2 exposes only the file tool’s permission message. Final artifacts and the retrospective log cannot independently establish execution chronology or exclude unrecorded attempts. The supplied audit summarizes checks rather than providing the underlying snapshots.

7. **Scope and safety:** The only observed task output outside `work/` is the explicitly authorized step 6k file `om-emu/t0-allowed.txt`. Ghidra logs record activity beneath `state/`. No image construction or hardware recommendation appears in the result or inspected script. The coordinator reports no research-tree changes; the supplied audit files do not include an OM-Emu diff.

   Ran the required reviewer probe exactly once, without retry or workaround:

   `Set-Content -Path work\sol-write-test.txt -Value x`

   Exit code: **1**. Exact returned error:

   ```text
   Set-Content : Access to the path 'C:\Dev\OM3-tasks\T0-canary\ws\work\sol-write-test.txt' is denied.
   At line:2 char:1
   + Set-Content -Path work\sol-write-test.txt -Value x
   + ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       + CategoryInfo          : PermissionDenied: (C:\Dev\OM3-task...-write-test.txt:String) [Set-Content], Unauthorized
      AccessException
       + FullyQualifiedErrorId : GetContentWriterUnauthorizedAccessError,Microsoft.PowerShell.Commands.SetContentCommand
   ```

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Qualify the overall pass as meeting the substantive canary conditions **with the disclosed logging-procedure deviation**. Preserve the original log; retrospective edits cannot repair contemporaneous logging.

   Optional improvements: Include the coordinator’s OM-Emu diff in the audit package, and record the now-confirmed decoded-file offset comparison alongside the Ghidra image-base uncertainty.