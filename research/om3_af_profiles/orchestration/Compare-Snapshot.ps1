<#
Compares two Snapshot-Workspace.ps1 outputs. Lists every created, changed or
deleted path outside the task folder and the side-effect allowlist.
Exit code 0 = clean, 1 = violations. Writes the report to -Report.
#>
param(
  [Parameter(Mandatory)] [string] $Before,
  [Parameter(Mandatory)] [string] $After,
  [Parameter(Mandatory)] [string] $TaskId,
  [Parameter(Mandatory)] [string] $Report
)
$ErrorActionPreference = 'Stop'
$b = Get-Content -Raw $Before | ConvertFrom-Json
$a = Get-Content -Raw $After  | ConvertFrom-Json

$allowed = @(
  ('^tasks\\' + [regex]::Escape($TaskId) + '\\'),
  '^ghidra-projects\\.*\.lock~?$',
  '^tooling\\ghidra-user\\',
  '\\__pycache__\\'
)
function IsAllowed([string]$p) { foreach ($r in $allowed) { if ($p -match $r) { return $true } }; return $false }

$bm = @{}; foreach ($f in $b.files) { $bm[$f.path] = $f }
$am = @{}; foreach ($f in $a.files) { $am[$f.path] = $f }
$v = New-Object System.Collections.Generic.List[string]
$ok = New-Object System.Collections.Generic.List[string]

foreach ($k in $am.Keys) {
  $x = $am[$k]
  if (-not $bm.ContainsKey($k)) { $line = "CREATED  $k" }
  else {
    $y = $bm[$k]
    if ($x.bytes -eq $y.bytes -and $x.mtime -eq $y.mtime -and $x.sha256 -eq $y.sha256) { continue }
    $line = "CHANGED  $k"
  }
  if (IsAllowed $k) { $ok.Add($line) } else { $v.Add($line) }
}
foreach ($k in $bm.Keys) {
  if (-not $am.ContainsKey($k)) { $line = "DELETED  $k"; if (IsAllowed $k) { $ok.Add($line) } else { $v.Add($line) } }
}
$sb = @{}; foreach ($d in $b.summarised) { $sb[$d.path] = $d }
foreach ($d in $a.summarised) {
  $o = $sb[$d.path]
  if (-not $o -or $o.files -ne $d.files -or $o.bytes -ne $d.bytes -or $o.newest -ne $d.newest) { $v.Add("CHANGED-TREE  $($d.path) (a file was created, deleted or renamed inside)") }
}
if ($a.om_emu.head -ne $b.om_emu.head -or $a.om_emu.diff_sha256_lf -ne $b.om_emu.diff_sha256_lf -or
    (($a.om_emu.status -join '|') -ne ($b.om_emu.status -join '|'))) { $v.Add('CHANGED  tooling\om-emu (head, diff or status)') }
if ((($a.om_emu_home | ConvertTo-Json -Compress) -ne ($b.om_emu_home | ConvertTo-Json -Compress))) { $v.Add('CHANGED  ~\.om-emu (OM-Emu NVRAM store outside the workspace)') }

$out = @("Isolation audit for $TaskId", "before: $($b.taken_utc)", "after:  $($a.taken_utc)", '',
         "VIOLATIONS: $($v.Count)") + ($v | Sort-Object) + @('', "Allowed changes: $($ok.Count)") + ($ok | Sort-Object)
$out | Set-Content -Encoding utf8 -LiteralPath $Report
if ($v.Count -gt 0) { exit 1 } else { exit 0 }
