<#
Runs one or more tasks with Grok 4.7 High (Cursor CLI), each in its own disposable execution
workspace. Several tasks given together run **concurrently** inside one lock window
(owner request, 18 Nov 2026): pre-checks and workspace builds per task, one lock, all agents
started, all awaited, one unlock, then audit and harvest per task.

Layers, in order of strength:
  1. Windows integrity: each agent is a Low-integrity copy of the CLI and can write only to
     Low-labelled folders (its own agent home and its workspace's work/state/projects/om-emu).
  2. Operating-system lock: the research workspace, the archive worktree, ~\.om-emu and each
     workspace's supplied inputs and tools are write-denied for this user during the run.
  3. Location: workspaces are under C:\Dev\OM3-tasks, outside the research tree; the research
     is reached through the read-only ref\ junction.
  4. Cursor: the workspace's .cursor\cli.json allow and deny rules. Cursor's own sandbox is
     unavailable on Windows (T0 attempt 1).
  5. Audit: workspace snapshot before/after, input re-hash, lock-rule presence check, OM-Emu diff.
No unrestricted flags (--force/--yolo) are used.

Usage:  Invoke-Grok.ps1 -Task T2b-xyz,T3a-abc -Ghidra -OmEmu
#>
param(
  [Parameter(Mandatory)] [string[]] $Task,
  [switch] $Ghidra,
  [switch] $OmEmu,
  [int] $TimeoutMinutes = 180,
  [switch] $NoSandbox,                 # Cursor's sandbox is macOS/Linux only; on Windows it is never requested
  [string] $Root = 'C:\Dev\OM3-research',
  [string] $TasksRoot = 'C:\Dev\OM3-tasks'
)
$ErrorActionPreference = 'Stop'
$Model = 'grok-4.7-high'               # fixed by design; there is no model parameter (Fable excluded)
$orc = Join-Path $Root 'orchestration'
function Fail([string]$m) { Write-Error $m; exit 2 }
function Sha([string]$p) { (Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLower() }
function Invoke-Git { $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & git.exe -c core.safecrlf=false @args 2>$null } finally { $ErrorActionPreference = $old } }

# ---- batch-wide pre-checks (workspace still writable) ----
if (Test-Path "$TasksRoot\.research-lock.json") { Fail 'research workspace is already locked (another run, or a crashed run: see PROJECT-STATE recovery)' }
if (Get-ChildItem "$Root\ghidra-projects" -Recurse -Filter '*.lock*' -ErrorAction SilentlyContinue) { Fail 'a Ghidra project is open (lock file present); close Ghidra first' }
if (($Task | Select-Object -Unique).Count -ne $Task.Count) { Fail 'duplicate task in batch' }
$rt = Get-Content -Raw "$TasksRoot\_agent\runtime.json" | ConvertFrom-Json
if (((icacls "$($rt.cli)\node.exe") -join ' ') -notmatch 'Low Mandatory Level') { Fail 'agent runtime node.exe is not labelled Low; run Initialize-AgentRuntime.ps1' }
if ((Sha "$($rt.cli)\node.exe") -ne $rt.node_sha256) { Fail 'agent runtime node.exe changed since it was built' }
$stamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$pins = & "$orc\Test-Pins.ps1" -Root $Root; $pinsOk = ($LASTEXITCODE -eq 0)
$sync = & "$orc\Test-ArchiveSync.ps1" -Root $Root; $syncOk = ($LASTEXITCODE -eq 0)
if (-not $pinsOk) { Fail "pinned inputs do not match: $($pins -join '; ')" }
if (-not $syncOk) { Fail "workspace documents/scripts are not archived: $($sync -join '; ')" }

$runs = @()
foreach ($t in $Task) {
  $rec = Join-Path $Root "tasks\$t"; $tr = Join-Path $TasksRoot $t; $ws = Join-Path $tr 'ws'
  $status = (Get-Content "$rec\STATUS" -ErrorAction SilentlyContinue | Select-Object -First 1)
  if ($status -notin @('APPROVED', 'CORRECTING')) { Fail "$t STATUS is '$status'; expected APPROVED or CORRECTING" }
  $runRec = Join-Path $rec "run-$stamp"
  New-Item -ItemType Directory -Force $runRec | Out-Null
  $pins | Out-File "$runRec\pins.txt" -Encoding utf8
  $sync | Out-File "$runRec\archive-sync.txt" -Encoding utf8
  if (-not (Test-Path $ws)) {
    & "$orc\New-TaskWorkspace.ps1" -Task $t -Ghidra:$Ghidra -OmEmu:$OmEmu -Root $Root -TasksRoot $TasksRoot | Out-File "$runRec\workspace.txt" -Encoding utf8
  } elseif ((Sha "$ws\brief.md") -ne (Sha "$rec\brief.md")) {
    Copy-Item "$rec\brief.md" "$ws\brief.md" -Force      # a correction round: refreshed brief, same workspace
  }
  # A separate Low-labelled agent home per task, so concurrent CLI instances never share state files.
  $agentHome = Join-Path $tr 'agent-home'
  if (-not (Test-Path $agentHome)) {
    & robocopy.exe $rt.home $agentHome /E /NFL /NDL /NJH /NJS /NP /XD chats projects ai-tracking plans | Out-Null
    if ($LASTEXITCODE -ge 8) { Fail "agent home copy failed for $t" }
    if (Get-ChildItem $agentHome -Recurse -Force -Attributes ReparsePoint -ErrorAction SilentlyContinue) { Fail "reparse point inside $agentHome" }
    icacls $agentHome /setintegritylevel '(OI)(CI)low' /T /C /Q | Out-Null
  }
  Copy-Item "$tr\manifest-in.json" "$runRec\manifest-in.json"
  $manIn = Get-Content -Raw "$tr\manifest-in.json" | ConvertFrom-Json
  Set-Content "$rec\STATUS" 'RUNNING'
  $runs += [pscustomobject]@{ task = $t; rec = $rec; tr = $tr; ws = $ws; home = $agentHome; runRec = $runRec; manIn = $manIn
    extra = @("$ws\inputs", "$ws\templates") + @(foreach ($d in "$ws\tools\ghidra\support", "$ws\tools\bin") { if (Test-Path $d) { $d } })
    p = $null; done = $false; launcher = $null; cliArgs = $null }
}
$snapBefore = Join-Path $TasksRoot "snap-before-$stamp.json"
& "$orc\Snapshot-Workspace.ps1" -Root $Root -Out $snapBefore

# ---- run all agents under one lock ----
$extra = @($runs | ForEach-Object { $_.extra })
$lockOut = & "$orc\Lock-Research.ps1" -Mode Lock -Task ($Task -join '+') -Extra $extra
$lockOk = ($LASTEXITCODE -eq 0)
$useSandbox = (-not $NoSandbox) -and ($env:OS -ne 'Windows_NT')
$prompt = "Read TASK.md and then brief.md in this folder completely, and carry out the brief exactly. " +
          "Section 0 of the brief overrides everything else. Write only under work. " +
          "Finish by making sure work/result.md and work/evidence-manifest.json exist."
$start = Get-Date
try {
  if (-not $lockOk) { throw "lock failed: $($lockOut -join '; ')" }
  foreach ($r in $runs) {
    $cliArgs = @('-p', '--model', $Model, '--output-format', 'json', '--trust', '--workspace', $r.ws)
    if ($useSandbox) { $cliArgs += @('--sandbox', 'enabled') }
    $cliArgs += ('"' + $prompt + '"')
    $launcher = Join-Path $r.tr "launch-$stamp.cmd"
    @"
@echo off
set "USERPROFILE=$($r.home)"
set "HOME=$($r.home)"
set "LOCALAPPDATA=$($r.home)\AppData\Local"
set "NODE_COMPILE_CACHE=$($r.home)\AppData\Local\cursor-compile-cache"
set "CURSOR_INVOKED_AS=agent.cmd"
set "TEMP=$($r.ws)\state\tmp"
set "TMP=$($r.ws)\state\tmp"
set "OM_EMU_NVRAM=off"
set "PYTHONDONTWRITEBYTECODE=1"
set "JAVA_HOME=$($r.manIn.jdk)"
rem Pinned tools first on PATH, so the agent calls them by name (Cursor allow entries match the base command exactly; T0 attempt 3).
set "PATH=$($r.ws)\tools\bin;$($r.manIn.jdk)\bin;%PATH%"
cd /d "$($r.ws)"
"$($rt.cli)\node.exe" "$($rt.cli)\index.js" $($cliArgs -join ' ') > "$($r.tr)\grok-$stamp.out.json" 2> "$($r.tr)\grok-$stamp.err.txt"
exit /b %ERRORLEVEL%
"@ | Set-Content -Encoding ascii $launcher
    $r.launcher = $launcher; $r.cliArgs = $cliArgs
    $r.p = Start-Process -FilePath "$env:SystemRoot\System32\cmd.exe" -ArgumentList @('/c', "`"$launcher`"") -WorkingDirectory $r.ws -NoNewWindow -PassThru
    $null = $r.p.Handle                 # Windows PowerShell 5.1 reports no ExitCode unless the handle is opened
  }
  $deadline = $start.AddMinutes($TimeoutMinutes)
  foreach ($r in $runs) {
    $ms = [int][math]::Max(0, ($deadline - (Get-Date)).TotalMilliseconds)
    $r.done = $r.p.WaitForExit($ms)
    if (-not $r.done) { & taskkill.exe /PID $r.p.Id /T /F | Out-Null }
  }
} finally {
  $end = Get-Date
  foreach ($r in $runs) { if ($r.p -and -not $r.p.HasExited) { & taskkill.exe /PID $r.p.Id /T /F | Out-Null } }
  $unlockOut = & "$orc\Lock-Research.ps1" -Mode Unlock -Task ($Task -join '+') -Extra $extra
  $unlockOk = ($LASTEXITCODE -eq 0)
}
if (-not $unlockOk) { Write-Warning "UNLOCK REPORTED PROBLEMS: $($unlockOut -join '; ')" }

# ---- audit (shared) and harvest (per task); workspace writable again ----
$snapAfter = Join-Path $TasksRoot "snap-after-$stamp.json"
& "$orc\Snapshot-Workspace.ps1" -Root $Root -Out $snapAfter
foreach ($r in $runs) {
  $ws = $r.ws; $runRec = $r.runRec
  # Each task's own records (written before the lock) are allowed; nothing else in the research tree may change.
  & "$orc\Compare-Snapshot.ps1" -Before $snapBefore -After $snapAfter -TaskId $r.task -Report "$runRec\isolation-workspace.txt"
  $wsClean = ($LASTEXITCODE -eq 0)
  $inputsOk = $true
  foreach ($i in $r.manIn.inputs) { if ((Sha (Join-Path $ws $i.path)) -ne $i.sha256) { $inputsOk = $false } }
  if (Test-Path "$ws\om-emu") { (Invoke-Git --no-optional-locks -C "$ws\om-emu" diff) | Set-Content -Encoding utf8 "$runRec\om-emu.diff"
                                (Invoke-Git --no-optional-locks -C "$ws\om-emu" status --porcelain) | Set-Content -Encoding utf8 "$runRec\om-emu-status.txt" }
  Get-ChildItem $ws -Recurse -File -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "$ws\work\*" -and $_.FullName -notlike "$ws\om-emu\*" -and $_.FullName -notlike "$ws\ref\*" -and
                   $_.FullName -notlike "$ws\projects\*" -and $_.FullName -notlike "$ws\tools\*" -and $_.FullName -notlike "$ws\state\*" -and
                   $_.LastWriteTime -ge $start } |
    ForEach-Object { $_.FullName.Substring($ws.Length + 1) } | Set-Content -Encoding utf8 "$runRec\other-writes-in-ws.txt"
  $harvest = @()
  foreach ($f in Get-ChildItem "$ws\work" -Recurse -File -ErrorAction SilentlyContinue) {
    $rel = $f.FullName.Substring("$ws\work".Length + 1)
    $h = Sha $f.FullName
    if ($f.Length -le 50MB) { $d = Join-Path "$runRec\work" $rel; New-Item -ItemType Directory -Force (Split-Path $d) | Out-Null; Copy-Item $f.FullName $d; $copied = $true } else { $copied = $false }
    $harvest += [pscustomobject]@{ path = $rel; bytes = $f.Length; sha256 = $h; copied = $copied }
  }
  Copy-Item "$($r.tr)\grok-$stamp.out.json", "$($r.tr)\grok-$stamp.err.txt" $runRec -ErrorAction SilentlyContinue
  $usage = $null
  try { $j = Get-Content -Raw "$($r.tr)\grok-$stamp.out.json" | ConvertFrom-Json; foreach ($k in 'usage', 'token_usage', 'tokens') { if ($j.$k) { $usage = $j.$k } } } catch { }
  $exit = $(if ($r.done -and $r.p) { $r.p.ExitCode } else { $null })
  $ok = $r.done -and ($exit -eq 0) -and $lockOk -and $unlockOk -and $wsClean -and $inputsOk -and
        (Test-Path "$ws\work\result.md") -and (Test-Path "$ws\work\evidence-manifest.json")
  [pscustomobject]@{
    task = $r.task; batch = $Task; agent = 'grok'; model = $Model; brief_sha256 = (Sha "$($r.rec)\brief.md")
    command = "$($rt.cli)\node.exe (Low integrity, via $($r.launcher)) $($r.cliArgs -join ' ')"; cursor_sandbox = $useSandbox
    started = $start.ToString('o'); ended = $end.ToString('o'); timed_out = (-not $r.done); exit_code = $exit
    lock_ok = $lockOk; lock_output = $lockOut; unlock_ok = $unlockOk; unlock_output = $unlockOut
    workspace_unchanged = $wsClean; inputs_unchanged = $inputsOk; harvested = $harvest; usage = $usage; ok = $ok
  } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 "$runRec\run-log.json"
  Set-Content "$($r.rec)\STATUS" $(if ($ok) { 'REVIEW' } else { 'BLOCKED' })
  "grok run $stamp $($r.task): ok=$ok exit=$exit timed_out=$(-not $r.done) lock=$lockOk unlock=$unlockOk workspace_unchanged=$wsClean inputs_unchanged=$inputsOk -> $runRec"
}
