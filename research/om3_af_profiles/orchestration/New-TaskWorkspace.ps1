<#
Builds a disposable execution workspace for one agent task, outside the research tree:

  C:\Dev\OM3-tasks\<Task>\
    ws\                      Grok's --workspace (the only writable tree during a run)
      TASK.md                generated: paths, commands and rules for this workspace
      brief.md               copy of tasks\<Task>\brief.md
      work\out, work\scripts the agent's outputs
      ref\                   junction -> C:\Dev\OM3-research (read-only while locked)
      inputs\                copies of the pinned decoded main and resource 0106 (hash-verified; locked during runs)
      projects\              copy of ghidra-projects\OM3_main_full (with -Ghidra)
      om-emu\                copy of tooling\om-emu including its pinned local changes (with -OmEmu)
      tools\ghidra\          the Ghidra install through junctions, with a private support\ whose
                             launch.properties points settings/cache/temp into state\ghidra-user
      state\                 ghidra-user, tmp
      .cursor\cli.json       deny rules for this workspace
    manifest-in.json         hashes and identities of everything supplied
Nothing in C:\Dev\OM3-research is modified.
#>
param(
  [Parameter(Mandatory)] [string] $Task,
  [switch] $Ghidra,
  [switch] $OmEmu,
  [switch] $Rebuild,     # set an existing workspace aside as ws-superseded-<stamp> (never deleted) and build a new one
  [string] $Root = 'C:\Dev\OM3-research',
  [string] $TasksRoot = 'C:\Dev\OM3-tasks'
)
$ErrorActionPreference = 'Stop'
function Sha([string]$p) { (Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLower() }
function Invoke-Git { $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & git.exe -c core.safecrlf=false @args 2>$null } finally { $ErrorActionPreference = $old } }

$rec = Join-Path $Root "tasks\$Task"
if (-not (Test-Path "$rec\brief.md")) { throw "missing $rec\brief.md" }
$tr = Join-Path $TasksRoot $Task
$ws = Join-Path $tr 'ws'
if (Test-Path $ws) {
  if (-not $Rebuild) { throw "$ws exists; use -Rebuild to set it aside and build a new one" }
  Rename-Item $ws ("ws-superseded-" + (Get-Date).ToString('yyyyMMdd-HHmmss'))
  if (Test-Path "$tr\manifest-in.json") { Rename-Item "$tr\manifest-in.json" ("manifest-in-superseded-" + (Get-Date).ToString('yyyyMMdd-HHmmss') + '.json') }
}
foreach ($d in 'work\out', 'work\scripts', 'inputs', 'state\tmp', 'tools', '.cursor') { New-Item -ItemType Directory -Force (Join-Path $ws $d) | Out-Null }

Copy-Item "$rec\brief.md" "$ws\brief.md"
if (Test-Path "$rec\review-brief.md") { Copy-Item "$rec\review-brief.md" "$ws\review-brief.md" }
Copy-Item "$Root\tasks\_templates" "$ws\templates" -Recurse
cmd /c mklink /J "$ws\ref" "$Root" | Out-Null

# Pinned inputs
$pins = [ordered]@{
  '00_0100_50000020.decoded.bin' = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
  '02_0106_458c0020.decoded.bin' = '3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059'
}
$inputs = @()
foreach ($n in $pins.Keys) {
  Copy-Item "$Root\analysis\decoded\$n" "$ws\inputs\$n"
  $h = Sha "$ws\inputs\$n"; if ($h -ne $pins[$n]) { throw "input copy hash mismatch: $n" }
  $inputs += [pscustomobject]@{ path = "inputs/$n"; sha256 = $h }
}

$ghidraInfo = $null
if ($Ghidra) {
  New-Item -ItemType Directory "$ws\projects" | Out-Null
  Copy-Item "$Root\ghidra-projects\OM3_main_full.gpr" "$ws\projects\"
  & robocopy.exe "$Root\ghidra-projects\OM3_main_full.rep" "$ws\projects\OM3_main_full.rep" /E /NFL /NDL /NJH /NJS /NP /XF '*.lock' '*.lock~' | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy of the Ghidra project failed ($LASTEXITCODE)" }
  $src = "$Root\tooling\ghidra_12.2_PUBLIC"; $dst = "$ws\tools\ghidra"
  New-Item -ItemType Directory $dst | Out-Null
  foreach ($e in Get-ChildItem $src) {
    if ($e.Name -eq 'support') { continue }
    if ($e.PSIsContainer) { cmd /c mklink /J "$dst\$($e.Name)" "$($e.FullName)" | Out-Null } else { Copy-Item $e.FullName "$dst\" }
  }
  Copy-Item "$src\support" "$dst\support" -Recurse
  $gu = "$ws\state\ghidra-user"
  Copy-Item "$Root\tooling\ghidra-user" $gu -Recurse
  $lp = "$dst\support\launch.properties"
  $fwd = $gu.Replace('\', '/')
  $text = [IO.File]::ReadAllText($lp).Replace('C:/Dev/OM3-research/tooling/ghidra-user', $fwd)
  if ($text -notmatch [regex]::Escape("$fwd/settings")) { throw 'launch.properties redirect failed' }
  [IO.File]::WriteAllText($lp, $text)
  # Launcher with the project, program, read-only flags and quoted script path built in.
  New-Item -ItemType Directory -Force "$ws\tools\bin" | Out-Null
  @"
@echo off
rem Ghidra headless for this task workspace. Usage: tools\bin\run-ghidra.cmd -postScript Name.java [args] -log work\out\name.log
set "JAVA_HOME=$Root\tooling\jdk-25.0.5+8"
call "%~dp0..\ghidra\support\analyzeHeadless.bat" "$ws\projects" OM3_main_full -process 00_0100_50000020.decoded.bin -noanalysis -readOnly -scriptPath "$ws\work\scripts;$ws\ref\scripts" %*
exit /b %ERRORLEVEL%
"@ | Set-Content -Encoding ascii "$ws\tools\bin\run-ghidra.cmd"
  $files = Get-ChildItem "$ws\projects" -Recurse -File
  $ghidraInfo = [pscustomobject]@{ project = 'projects/OM3_main_full'; files = $files.Count
    bytes = ($files | Measure-Object Length -Sum).Sum; launcher = 'tools/ghidra/support/analyzeHeadless.bat'
    settings = 'state/ghidra-user' }
}

$emuInfo = $null
if ($OmEmu) {
  & robocopy.exe "$Root\tooling\om-emu" "$ws\om-emu" /E /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy of OM-Emu failed ($LASTEXITCODE)" }
  $head = Invoke-Git -C "$ws\om-emu" rev-parse HEAD
  $diff = ((Invoke-Git --no-optional-locks -C "$ws\om-emu" diff) -join "`n") + "`n"
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $dh = -join ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($diff.Replace("`r", ''))) | ForEach-Object { $_.ToString('x2') })
  if ($head -ne '4e4ec4ef084542a7e30eecce56970c7e09c123c9' -or $dh -ne '61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702') {
    throw "OM-Emu copy does not match the pinned state (head $head, diff $dh)" }
  $emuInfo = [pscustomobject]@{ path = 'om-emu'; head = $head; local_diff_sha256 = $dh }
}

# Workspace-local Cursor permissions. The enforcing write boundary is the operating system:
# the agent runs at Low integrity (Initialize-AgentRuntime.ps1) and only the folders labelled
# below are writable to it. The allow list therefore names the programs the work needs.
# Patterns are globs matched against the command or its base executable (Cursor CLI matchesShell).
@'
{
  "permissions": {
    "allow": [
      "Shell(python)", "Shell(python.exe)", "Shell(py)",
      "Shell(*node.exe)", "Shell(node)",
      "Shell(*java.exe)", "Shell(java)",
      "Shell(*run-ghidra.cmd)", "Shell(tools\\bin\\run-ghidra.cmd)", "Shell(.\\tools\\bin\\run-ghidra.cmd)",
      "Shell(cmd)", "Shell(whoami)", "Shell(certutil)", "Shell(findstr)", "Shell(where)",
      "Shell(ls)", "Shell(dir)", "Shell(type)", "Shell(rg)",
      "Shell(Get-FileHash)", "Shell(Get-Content)", "Shell(Get-ChildItem)", "Shell(Get-Item)",
      "Shell(Select-String)", "Shell(Measure-Object)", "Shell(Test-Path)", "Shell(Format-Hex)",
      "Shell(Write-Output)", "Shell(Set-Location)", "Shell(cd)"
    ],
    "deny": [
      "Write(ref/**)",
      "Write(inputs/**)",
      "Write(tools/**)",
      "Write(.cursor/**)",
      "Write(brief.md)",
      "Write(review-brief.md)",
      "Shell(git)",
      "Shell(icacls)",
      "Shell(cacls)",
      "Shell(takeown)",
      "Shell(Set-Acl)",
      "Shell(curl)",
      "Shell(Invoke-WebRequest)",
      "Shell(Invoke-RestMethod)",
      "Shell(wget)"
    ]
  }
}
'@ | Set-Content -Encoding ascii "$ws\.cursor\cli.json"

# Integrity labels: only these folders become writable to the Low-integrity agent. Everything
# else in the workspace (ref\ junction, inputs\, tools\, templates\, brief.md, TASK.md, the
# root itself) keeps the default Medium label and is therefore read-only to the agent.
# Recursive labelling is refused if a folder contains a junction (lesson of 17 Nov 2026: a
# recursive icacls followed the ref\ junction into the research tree).
# Setting a label needs WRITE_OWNER: C:\Dev\OM3-tasks carries an inheritable Full Control
# grant for this user (set once, 17 Nov 2026), so no ACL change is made here.
$writable = @('work', 'state') + @(foreach ($d in 'projects', 'om-emu') { if (Test-Path (Join-Path $ws $d)) { $d } })
foreach ($d in $writable) {
  $p = Join-Path $ws $d
  if (Get-ChildItem $p -Recurse -Force -Attributes ReparsePoint -ErrorAction SilentlyContinue) { throw "reparse point inside $p; refusing recursive operations" }
  icacls $p /setintegritylevel '(OI)(CI)low' /T /C /Q | Out-Null
  if (((icacls $p) -join ' ') -notmatch 'Low Mandatory Level') { throw "label not applied to $p" }
}

$jdk = "$Root\tooling\jdk-25.0.5+8"; $node = "$Root\tooling\node-v26.12.1-win-x64\node.exe"
$taskMd = @"
# Execution workspace for $Task

You are in a disposable copy made for this task. Read ``brief.md`` first; section 0 of the brief overrides everything.

| Path | What it is | Access |
|---|---|---|
| ``work\`` | Your outputs: ``work\result.md``, ``work\evidence-manifest.json``, ``work\out\``, ``work\scripts\`` | write |
| ``ref\`` | The research workspace C:\Dev\OM3-research (documents, scripts, evidence, decompilation) | **read-only (enforced by the operating system)** |
| ``inputs\`` | Hash-verified copies of decoded main and resource 0106 | read-only (enforced) |
| ``projects\`` | Private copy of Ghidra project OM3_main_full | use with ``-readOnly -noanalysis`` |
| ``om-emu\`` | Private copy of OM-Emu at the pinned commit with its local changes | you may modify it if the brief allows; every change is diffed afterwards |
| ``state\`` | Ghidra settings/cache and TEMP for this workspace | written by tools |
| ``tools\`` | Ghidra launcher (``tools\bin\run-ghidra.cmd``) | read-only |
| ``templates\`` | result/review templates | read-only |

Paths in the research documents such as ``scripts/...`` or ``analysis/...`` are under ``ref\``.
You run at Windows **Low integrity**: only ``work\``, ``state\``, ``projects\`` and ``om-emu\``
are writable to you and to every program you start. Everything else (this folder's root, the
rest of the disk, the user profile) refuses writes with "Access is denied". That is intended:
do not try to work around it, and report it if it blocks the task.

Ghidra headless: use the launcher, which already supplies the project copy, program,
``-noanalysis -readOnly`` and the script path (``work\scripts`` first, then ``ref\scripts``).
Capture output with ``-log`` or PowerShell redirection. Shell redirection inside a
``cmd /c "..."`` string breaks Ghidra's batch parsing. Do not redirect stdin.

``````
tools\bin\run-ghidra.cmd -postScript <Script>.java <script args> -log work\out\<name>.log
``````

Only use absolute paths, or paths relative to this folder, for script arguments.

Call tools **by name**, not by full path: ``node`` (the pinned $node is first on PATH),
``java`` (the pinned JDK), ``python -I`` (bytecode writing is disabled). The allow list matches
command names; full paths are rejected. OM-Emu checkout argument: ``om-emu``.
``OM_EMU_NVRAM`` is set to ``off``.
"@
Set-Content -Encoding utf8 "$ws\TASK.md" $taskMd

[pscustomobject]@{
  task = $Task; created_utc = (Get-Date).ToUniversalTime().ToString('o'); workspace = $ws
  brief_sha256 = (Sha "$ws\brief.md"); inputs = $inputs; ghidra = $ghidraInfo; om_emu = $emuInfo
  ref = $Root; jdk = $jdk; node = $node
} | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 "$tr\manifest-in.json"
"task workspace ready: $ws"
