<#
Copies the workspace's current text records into the archive worktree
(C:\Dev\OM3-worktrees\archive\research\om3_af_profiles) and makes one LOCAL commit.
Never pushes (pushing needs the owner's approval).

Copied: root *.md (except README.md: the archive keeps its own), analysis\button-af\*.md,
scripts\** (except the archive's adapted decode_om3_queue95.py), orchestration\*, tasks\**,
and any extra -Paths (for example a promoted readiness folder). START-HERE.md is
stored with CRLF line endings, as the archive already has it. Files larger than 5 MB,
*.bin/*.BIN and __pycache__ are never copied; they are listed in the commit message
summary instead. Exit 0 = committed or nothing to commit.
#>
param(
  [Parameter(Mandatory)] [string] $Message,
  [string[]] $Paths = @(),
  [string] $Root = 'C:\Dev\OM3-research',
  [string] $Worktree = 'C:\Dev\OM3-worktrees\archive'
)
$ErrorActionPreference = 'Stop'
function Invoke-Git { $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & git.exe -c core.safecrlf=false @args 2>$null } finally { $ErrorActionPreference = $old } }
$ar = Join-Path $Worktree 'research\om3_af_profiles'
if (Test-Path 'C:\Dev\OM3-tasks\.research-lock.json') { Write-Error 'research is locked (agent run in progress)'; exit 2 }
if (Invoke-Git -C $Worktree status --porcelain) { Write-Error 'archive worktree has uncommitted changes; resolve first'; exit 2 }

$adapted = @('README.md', 'scripts\decode_om3_queue95.py')
$sel = @()
$sel += Get-ChildItem $Root -File -Filter *.md
$sel += Get-ChildItem "$Root\analysis\button-af" -File -Filter *.md
$sel += Get-ChildItem "$Root\scripts", "$Root\orchestration", "$Root\tasks" -Recurse -File -ErrorAction SilentlyContinue
foreach ($p in $Paths) { $sel += Get-ChildItem (Join-Path $Root $p) -Recurse -File }
$skipped = @(); $n = 0
foreach ($f in $sel) {
  $rel = $f.FullName.Substring($Root.Length + 1)
  if ($adapted -contains $rel) { continue }
  if ($rel -match '__pycache__' -or $f.Extension -ieq '.bin' -or $f.Length -gt 5MB) { $skipped += "$rel ($($f.Length) B)"; continue }
  $dst = Join-Path $ar $rel
  New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
  if ($rel -eq 'START-HERE.md') {
    $b = [IO.File]::ReadAllBytes($f.FullName); $t = [Text.Encoding]::UTF8.GetString($b).Replace("`r`n", "`n").Replace("`n", "`r`n")
    [IO.File]::WriteAllBytes($dst, [Text.Encoding]::UTF8.GetBytes($t))
  } else { Copy-Item -LiteralPath $f.FullName -Destination $dst -Force }
  $n++
}
Invoke-Git -C $Worktree add -A research/om3_af_profiles | Out-Null
$staged = @(Invoke-Git -C $Worktree diff --cached --name-only)
if (-not $staged.Count) { "nothing to commit ($n files compared)"; exit 0 }
if ($staged | Where-Object { $_ -match '\.bin$' }) { Invoke-Git -C $Worktree reset -q | Out-Null; Write-Error 'refusing: a .bin file was staged'; exit 1 }
$body = $Message + "`n"
if ($skipped.Count) { $body += "`nNot archived (binary, cache or over 5 MB):`n" + (($skipped | ForEach-Object { "- $_" }) -join "`n") + "`n" }
$body += "`nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`n"
$tmp = [IO.Path]::GetTempFileName(); [IO.File]::WriteAllText($tmp, $body)
Invoke-Git -C $Worktree commit -q -F $tmp | Out-Null; Remove-Item $tmp
"committed $($staged.Count) changed files: $(Invoke-Git -C $Worktree log --oneline -1)"
