<#
Runs the independent review of one task with Codex Sol (gpt-6.1-sol), read-only sandbox,
in the task's execution workspace (so it sees work\ and the read-only ref\ junction).
The research workspace and the whole task workspace are write-denied during the review.
The Codex host writes the final message to the task root (outside the lock); it is then
copied into tasks\<Task>\run-<stamp>-review\review.md.
#>
param(
  [Parameter(Mandatory)] [string] $Task,
  [int] $TimeoutMinutes = 60,
  [string] $Root = 'C:\Dev\OM3-research',
  [string] $TasksRoot = 'C:\Dev\OM3-tasks'
)
$ErrorActionPreference = 'Stop'
$Model = 'gpt-6.1-sol'                  # fixed by design
$Codex = (Get-Command codex.exe).Source
$orc = Join-Path $Root 'orchestration'
$rec = Join-Path $Root "tasks\$Task"
$tr = Join-Path $TasksRoot $Task
$ws = Join-Path $tr 'ws'
function Fail([string]$m) { Write-Error $m; exit 2 }
function Sha([string]$p) { (Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLower() }

if ((Get-Content "$rec\STATUS" | Select-Object -First 1) -ne 'REVIEW') { Fail 'STATUS must be REVIEW' }
if (-not (Test-Path "$ws\work\result.md")) { Fail 'no work\result.md to review' }
if (-not (Test-Path "$rec\review-brief.md")) { Fail "missing $rec\review-brief.md" }
if (Test-Path "$TasksRoot\.research-lock.json") { Fail 'already locked' }
Copy-Item "$rec\review-brief.md" "$ws\review-brief.md" -Force
$stamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$runRec = Join-Path $rec "run-$stamp-review"
New-Item -ItemType Directory -Force $runRec | Out-Null
$wsFiles = Get-ChildItem "$ws\work" -Recurse -File | ForEach-Object { "$(Sha $_.FullName)  $($_.FullName.Substring($ws.Length+1))" }
& "$orc\Snapshot-Workspace.ps1" -Root $Root -Out "$tr\snap-before-sol-$stamp.json"

$review = Join-Path $tr "review-$stamp.md"
$cliArgs = @('exec', '--model', $Model, '--sandbox', 'read-only', '--skip-git-repo-check', '-C', $ws,
             '--json', '-o', $review)
$prompt = "Read TASK.md, then review-brief.md in this folder completely, and carry out the review. You are read-only. " +
          "Your final message must follow templates/review.md exactly."
$cliArgs += ('"' + $prompt + '"')
# Lock only junction-free folders: the workspace root holds the ref\ junction into the research tree.
$extra = @("$ws\work") + @(if (Test-Path "$ws\om-emu") { "$ws\om-emu" })
$lockOut = & "$orc\Lock-Research.ps1" -Mode Lock -Task "$Task-review" -Extra $extra
$lockOk = ($LASTEXITCODE -eq 0)
$done = $false; $p = $null; $start = Get-Date
try {
  if (-not $lockOk) { throw "lock failed: $($lockOut -join '; ')" }
  $p = Start-Process -FilePath $Codex -ArgumentList $cliArgs -WorkingDirectory $ws -NoNewWindow -PassThru `
         -RedirectStandardOutput "$tr\sol-$stamp.events.jsonl" -RedirectStandardError "$tr\sol-$stamp.err.txt"
  $null = $p.Handle                     # Windows PowerShell 5.1 reports no ExitCode unless the handle is opened
  $done = $p.WaitForExit($TimeoutMinutes * 60 * 1000)
  if (-not $done) { & taskkill.exe /PID $p.Id /T /F | Out-Null }
} finally {
  $end = Get-Date
  $unlockOut = & "$orc\Lock-Research.ps1" -Mode Unlock -Task "$Task-review" -Extra $extra
  $unlockOk = ($LASTEXITCODE -eq 0)
}
& "$orc\Snapshot-Workspace.ps1" -Root $Root -Out "$tr\snap-after-sol-$stamp.json"
& "$orc\Compare-Snapshot.ps1" -Before "$tr\snap-before-sol-$stamp.json" -After "$tr\snap-after-sol-$stamp.json" `
    -TaskId "$Task-review" -Report "$runRec\isolation-workspace.txt"
$wsClean = ($LASTEXITCODE -eq 0)
$wsAfter = Get-ChildItem "$ws\work" -Recurse -File | ForEach-Object { "$(Sha $_.FullName)  $($_.FullName.Substring($ws.Length+1))" }
$workUnchanged = (($wsFiles -join "`n") -eq ($wsAfter -join "`n"))
if (Test-Path $review) { Copy-Item $review "$runRec\review.md" }
Copy-Item "$tr\sol-$stamp.events.jsonl", "$tr\sol-$stamp.err.txt" $runRec -ErrorAction SilentlyContinue
$usage = @(Get-Content "$tr\sol-$stamp.events.jsonl" -ErrorAction SilentlyContinue | Where-Object { $_ -match '"usage"' } | Select-Object -Last 1)
[pscustomobject]@{
  task = $Task; agent = 'sol'; model = $Model; command = "$Codex $($cliArgs -join ' ')"
  started = $start.ToString('o'); ended = $end.ToString('o'); timed_out = (-not $done)
  exit_code = $(if ($done -and $p) { $p.ExitCode } else { $null }); lock_ok = $lockOk; unlock_ok = $unlockOk
  lock_output = $lockOut; unlock_output = $unlockOut
  workspace_unchanged = $wsClean; task_work_unchanged = $workUnchanged; review_present = (Test-Path $review)
  usage_event = $(if ($usage) { $usage[0] } else { $null })
} | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 "$runRec\run-log.json"
"sol review $stamp : exit=$(if($p){$p.ExitCode}) timed_out=$(-not $done) lock=$lockOk unlock=$unlockOk workspace_unchanged=$wsClean work_unchanged=$workUnchanged review=$(Test-Path $review) -> $runRec"
