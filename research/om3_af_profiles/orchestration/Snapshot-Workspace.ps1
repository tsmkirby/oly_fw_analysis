<#
Records the state of the research workspace for the isolation audit.
- SHA-256 for protected files (documents, scripts, stock inputs).
- size + last-write ticks for every other file, except heavy read-only trees,
  which are summarised by directory count and newest directory write time.
- OM-Emu: HEAD commit and SHA-256 of its CR-stripped `git diff`, plus `git status --porcelain`.
- The OM-Emu NVRAM folder (~\.om-emu) listing, because it lives outside the workspace.
Read-only. Writes only the -Out JSON file.
#>
param(
  [Parameter(Mandatory)] [string] $Out,
  [string] $Root = 'C:\Dev\OM3-research'
)
$ErrorActionPreference = 'Stop'

# Trees summarised instead of listed (large, never written by tasks).
$Summarised = @(
  'tooling\ghidra_12.2_PUBLIC', 'tooling\jdk-25.0.5+8', 'tooling\node-v26.12.1-win-x64',
  'tooling\python-deps', 'tooling\Ghidra-Rare', 'tooling\vmlinux-to-elf',
  'analysis\decompiled-main', 'analysis\decompiled-kernel', 'analysis\decompiled-scpu',
  'analysis\decompiled-linux', 'analysis\embedded'
)
# Git metadata is skipped entirely: Git state is checked through git itself
# (om_emu block below; Opus checks the contribution repository separately).
$Skipped = @('contribution\.git', 'tooling\om-emu\.git', 'reference\.git')
# Protected: hashed every time.
$HashPatterns = @(
  '^[^\\]+\.md$', '^analysis\\button-af\\[^\\]+\.md$', '^scripts\\', '^orchestration\\',
  '^firmware\\', '^analysis\\decoded\\', '^\.cursor\\', '^[^\\]+\.(ps1|py)$'
)

function Get-Sha([string]$p) { (Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLower() }
# Windows PowerShell 5.1 turns native stderr (git's CRLF warnings) into terminating errors under 'Stop'.
function Invoke-Git { $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & git.exe -c core.safecrlf=false @args 2>$null } finally { $ErrorActionPreference = $old } }

$files = New-Object System.Collections.Generic.List[object]
$dirs  = New-Object System.Collections.Generic.List[object]

function Walk([string]$dir) {
  foreach ($d in [System.IO.Directory]::EnumerateDirectories($dir)) {
    $rel = $d.Substring($Root.Length + 1)
    if ($Skipped -contains $rel) { continue }
    if ($Summarised -contains $rel) {
      # Directory times only (about 190k files live in these trees; listing them costs minutes).
      # On NTFS, creating, deleting or renaming a file updates its parent directory's time,
      # so new or removed files are detected. In-place edits of existing files here are NOT
      # detected; these trees are generated, read-only inputs, and the deny rules cover them.
      $n = 1; $t = [System.IO.Directory]::GetLastWriteTimeUtc($d).Ticks
      foreach ($s in [System.IO.Directory]::EnumerateDirectories($d, '*', 'AllDirectories')) {
        $n++; $w = [System.IO.Directory]::GetLastWriteTimeUtc($s).Ticks; if ($w -gt $t) { $t = $w }
      }
      $dirs.Add([pscustomobject]@{ path = $rel; files = $n; bytes = 0; newest = $t })
    } else { Walk $d }
  }
  foreach ($f in [System.IO.Directory]::EnumerateFiles($dir)) {
    $i = New-Object System.IO.FileInfo $f
    $rel = $f.Substring($Root.Length + 1)
    $h = $null
    foreach ($p in $HashPatterns) { if ($rel -match $p) { $h = Get-Sha $f; break } }
    $files.Add([pscustomobject]@{ path = $rel; bytes = $i.Length; mtime = $i.LastWriteTimeUtc.Ticks; sha256 = $h })
  }
}
Walk $Root

$emu = Join-Path $Root 'tooling\om-emu'
$diff = (Invoke-Git --no-optional-locks -C $emu diff) -join "`n"
$sha = [System.Security.Cryptography.SHA256]::Create()
$diffHash = -join ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($diff + "`n")) | ForEach-Object { $_.ToString('x2') })

$nv = Join-Path $env:USERPROFILE '.om-emu'
$nvram = @()
if (Test-Path $nv) {
  $nvram = Get-ChildItem $nv -Recurse -File | ForEach-Object {
    [pscustomobject]@{ path = $_.FullName; bytes = $_.Length; mtime = $_.LastWriteTimeUtc.Ticks } }
}

[pscustomobject]@{
  taken_utc   = (Get-Date).ToUniversalTime().ToString('o')
  root        = $Root
  files       = $files
  summarised  = $dirs
  om_emu      = [pscustomobject]@{
    head = (Invoke-Git -C $emu rev-parse HEAD)
    diff_sha256_lf = $diffHash
    status = @(Invoke-Git --no-optional-locks -C $emu status --porcelain)
  }
  om_emu_home = $nvram
} | ConvertTo-Json -Depth 5 -Compress | Set-Content -Encoding utf8 -LiteralPath $Out
