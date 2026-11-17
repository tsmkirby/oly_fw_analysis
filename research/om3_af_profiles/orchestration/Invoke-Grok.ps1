<#
Runs one task with Grok 4.7 High (Cursor CLI) in its disposable execution workspace.

Layers, in order of strength:
  1. Operating system: the research workspace, the archive worktree, ~\.om-emu and the
     workspace's supplied inputs are write-denied for this user during the run (Lock-Research.ps1).
  2. Location: Grok's workspace is C:\Dev\OM3-tasks\<Task>\ws, outside the research tree;
     the research is reached through the read-only ref\ junction.
  3. Cursor: the workspace's .cursor\cli.json deny rules (allowlist mode). The Cursor sandbox is
     unavailable on Windows ("Sandbox requires macOS or Linux", T0 run 20261117-182512), so the OS
     lock is the enforcing layer here.
  4. Audit: workspace snapshot before/after, input re-hash, lock-rule presence check, OM-Emu diff.
No unrestricted flags (--force/--yolo) are used.
#>
param(
  [Parameter(Mandatory)] [string] $Task,
  [switch] $Ghidra,
  [switch] $OmEmu,
  [int] $TimeoutMinutes = 180,
  [switch] $NoSandbox,                 # Cursor's sandbox is macOS/Linux only (T0, 17 Nov 2026); on Windows it is never requested
  [string] $Root = 'C:\Dev\OM3-research',
  [string] $TasksRoot = 'C:\Dev\OM3-tasks'
)
$ErrorActionPreference = 'Stop'
$Model = 'grok-4.7-high'               # fixed by design; there is no model parameter (Fable excluded)
$Agent = Join-Path $env:LOCALAPPDATA 'cursor-agent\agent.cmd'
$orc = Join-Path $Root 'orchestration'
$rec = Join-Path $Root "tasks\$Task"
$tr = Join-Path $TasksRoot $Task
$ws = Join-Path $tr 'ws'
function Fail([string]$m) { Write-Error $m; exit 2 }
function Sha([string]$p) { (Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLower() }
function Invoke-Git { $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & git.exe -c core.safecrlf=false @args 2>$null } finally { $ErrorActionPreference = $old } }

# ---- pre-checks (workspace still writable) ----
$status = (Get-Content "$rec\STATUS" -ErrorAction SilentlyContinue | Select-Object -First 1)
if ($status -notin @('APPROVED', 'CORRECTING')) { Fail "STATUS is '$status'; expected APPROVED or CORRECTING" }
if (Test-Path "$TasksRoot\.research-lock.json") { Fail 'research workspace is already locked (another run, or a crashed run: see PROJECT-STATE recovery)' }
if (Get-ChildItem "$Root\ghidra-projects" -Recurse -Filter '*.lock*' -ErrorAction SilentlyContinue) { Fail 'a Ghidra project is open (lock file present); close Ghidra first' }
$stamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$runRec = Join-Path $rec "run-$stamp"
New-Item -ItemType Directory -Force $runRec | Out-Null
& "$orc\Test-Pins.ps1" -Root $Root | Out-File "$runRec\pins.txt" -Encoding utf8
if ($LASTEXITCODE) { Fail 'pinned inputs do not match (pins.txt)' }
& "$orc\Test-ArchiveSync.ps1" -Root $Root | Out-File "$runRec\archive-sync.txt" -Encoding utf8
if ($LASTEXITCODE) { Fail 'workspace documents/scripts are not archived (archive-sync.txt); archive before delegating' }
if (-not (Test-Path $ws)) {
  & "$orc\New-TaskWorkspace.ps1" -Task $Task -Ghidra:$Ghidra -OmEmu:$OmEmu -Root $Root -TasksRoot $TasksRoot | Out-File "$runRec\workspace.txt" -Encoding utf8
} elseif ((Sha "$ws\brief.md") -ne (Sha "$rec\brief.md")) {
  Copy-Item "$rec\brief.md" "$ws\brief.md" -Force      # a correction round: refreshed brief, same workspace
}
Copy-Item "$tr\manifest-in.json" "$runRec\manifest-in.json"
$manIn = Get-Content -Raw "$tr\manifest-in.json" | ConvertFrom-Json
Set-Content "$rec\STATUS" 'RUNNING'
& "$orc\Snapshot-Workspace.ps1" -Root $Root -Out "$tr\snap-before-$stamp.json"

# ---- run under lock ----
$extra = @("$ws\inputs", "$ws\templates") + @(foreach ($d in "$ws\tools\ghidra\support", "$ws\tools\bin") { if (Test-Path $d) { $d } })
$lockOut = & "$orc\Lock-Research.ps1" -Mode Lock -Task $Task -Extra $extra
$lockOk = ($LASTEXITCODE -eq 0)
$cliArgs = @('-p', '--model', $Model, '--output-format', 'json', '--trust', '--workspace', $ws)
$useSandbox = (-not $NoSandbox) -and ($env:OS -ne 'Windows_NT')
if ($useSandbox) { $cliArgs += @('--sandbox', 'enabled') }
$prompt = "Read TASK.md and then brief.md in this folder completely, and carry out the brief exactly. " +
          "Section 0 of the brief overrides everything else. Write only under work. " +
          "Finish by making sure work/result.md and work/evidence-manifest.json exist."
$cliArgs += ('"' + $prompt + '"')

# Low-integrity launch (Initialize-AgentRuntime.ps1): the CLI and everything it starts can
# write only to Low-labelled folders (the agent home and the workspace's work/state/projects/om-emu).
$rt = Get-Content -Raw "$TasksRoot\_agent\runtime.json" | ConvertFrom-Json
if (((icacls "$($rt.cli)\node.exe") -join ' ') -notmatch 'Low Mandatory Level') { Fail 'agent runtime node.exe is not labelled Low; run Initialize-AgentRuntime.ps1' }
if ((Sha "$($rt.cli)\node.exe") -ne $rt.node_sha256) { Fail 'agent runtime node.exe changed since it was built' }
$launcher = Join-Path $tr "launch-$stamp.cmd"
@"
@echo off
set "USERPROFILE=$($rt.home)"
set "HOME=$($rt.home)"
set "LOCALAPPDATA=$($rt.home)\AppData\Local"
set "NODE_COMPILE_CACHE=$($rt.home)\AppData\Local\cursor-compile-cache"
set "CURSOR_INVOKED_AS=agent.cmd"
set "TEMP=$ws\state\tmp"
set "TMP=$ws\state\tmp"
set "OM_EMU_NVRAM=off"
set "PYTHONDONTWRITEBYTECODE=1"
set "JAVA_HOME=$($manIn.jdk)"
cd /d "$ws"
"$($rt.cli)\node.exe" "$($rt.cli)\index.js" $($cliArgs -join ' ') > "$tr\grok-$stamp.out.json" 2> "$tr\grok-$stamp.err.txt"
exit /b %ERRORLEVEL%
"@ | Set-Content -Encoding ascii $launcher
$Agent = "$($rt.cli)\node.exe (Low integrity, via $launcher)"
$done = $false; $p = $null; $start = Get-Date
try {
  if (-not $lockOk) { throw "lock failed: $($lockOut -join '; ')" }
  $p = Start-Process -FilePath "$env:SystemRoot\System32\cmd.exe" -ArgumentList @('/c', "`"$launcher`"") -WorkingDirectory $ws -NoNewWindow -PassThru
  $null = $p.Handle                     # Windows PowerShell 5.1 reports no ExitCode unless the handle is opened
  $done = $p.WaitForExit($TimeoutMinutes * 60 * 1000)
  if (-not $done) { & taskkill.exe /PID $p.Id /T /F | Out-Null }
} finally {
  $end = Get-Date
  $unlockOut = & "$orc\Lock-Research.ps1" -Mode Unlock -Task $Task -Extra $extra
  $unlockOk = ($LASTEXITCODE -eq 0)
}
if (-not $unlockOk) { Write-Warning "UNLOCK REPORTED PROBLEMS: $($unlockOut -join '; ')" }

# ---- audit and harvest (workspace writable again) ----
& "$orc\Snapshot-Workspace.ps1" -Root $Root -Out "$tr\snap-after-$stamp.json"
& "$orc\Compare-Snapshot.ps1" -Before "$tr\snap-before-$stamp.json" -After "$tr\snap-after-$stamp.json" `
    -TaskId $Task -Report "$runRec\isolation-workspace.txt"
$wsClean = ($LASTEXITCODE -eq 0)
$inputsOk = $true
foreach ($i in $manIn.inputs) { if ((Sha (Join-Path $ws $i.path)) -ne $i.sha256) { $inputsOk = $false } }
if (Test-Path "$ws\om-emu") { (Invoke-Git --no-optional-locks -C "$ws\om-emu" diff) | Set-Content -Encoding utf8 "$runRec\om-emu.diff"
                              (Invoke-Git --no-optional-locks -C "$ws\om-emu" status --porcelain) | Set-Content -Encoding utf8 "$runRec\om-emu-status.txt" }
# Everything the agent created outside work\ and om-emu\ inside its workspace (allowed, but recorded).
Get-ChildItem $ws -Recurse -File -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notlike "$ws\work\*" -and $_.FullName -notlike "$ws\om-emu\*" -and $_.FullName -notlike "$ws\ref\*" -and
                 $_.FullName -notlike "$ws\projects\*" -and $_.FullName -notlike "$ws\tools\*" -and $_.FullName -notlike "$ws\state\*" -and
                 $_.LastWriteTime -ge $start } |
  ForEach-Object { $_.FullName.Substring($ws.Length + 1) } | Set-Content -Encoding utf8 "$runRec\other-writes-in-ws.txt"
# Copy work\ (files up to 50 MB; larger ones are listed with their hash only).
$harvest = @()
foreach ($f in Get-ChildItem "$ws\work" -Recurse -File -ErrorAction SilentlyContinue) {
  $rel = $f.FullName.Substring("$ws\work".Length + 1)
  $h = Sha $f.FullName
  if ($f.Length -le 50MB) { $d = Join-Path "$runRec\work" $rel; New-Item -ItemType Directory -Force (Split-Path $d) | Out-Null; Copy-Item $f.FullName $d; $copied = $true } else { $copied = $false }
  $harvest += [pscustomobject]@{ path = $rel; bytes = $f.Length; sha256 = $h; copied = $copied }
}
Copy-Item "$tr\grok-$stamp.out.json", "$tr\grok-$stamp.err.txt" $runRec -ErrorAction SilentlyContinue
$usage = $null
try { $j = Get-Content -Raw "$tr\grok-$stamp.out.json" | ConvertFrom-Json; foreach ($k in 'usage', 'token_usage', 'tokens') { if ($j.$k) { $usage = $j.$k } } } catch { }
$ok = $done -and ($p.ExitCode -eq 0) -and $lockOk -and $unlockOk -and $wsClean -and $inputsOk -and
      (Test-Path "$ws\work\result.md") -and (Test-Path "$ws\work\evidence-manifest.json")
[pscustomobject]@{
  task = $Task; agent = 'grok'; model = $Model; brief_sha256 = (Sha "$rec\brief.md")
  command = "$Agent $($cliArgs -join ' ')"; cursor_sandbox = $useSandbox
  started = $start.ToString('o'); ended = $end.ToString('o'); timed_out = (-not $done)
  exit_code = $(if ($done -and $p) { $p.ExitCode } else { $null })
  lock_ok = $lockOk; lock_output = $lockOut; unlock_ok = $unlockOk; unlock_output = $unlockOut
  workspace_unchanged = $wsClean; inputs_unchanged = $inputsOk; harvested = $harvest; usage = $usage; ok = $ok
} | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 "$runRec\run-log.json"
Set-Content "$rec\STATUS" $(if ($ok) { 'REVIEW' } else { 'BLOCKED' })
"grok run $stamp : ok=$ok exit=$(if($p){$p.ExitCode}) timed_out=$(-not $done) lock=$lockOk unlock=$unlockOk workspace_unchanged=$wsClean inputs_unchanged=$inputsOk -> $runRec"
