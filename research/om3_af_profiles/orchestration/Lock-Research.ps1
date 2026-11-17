<#
Makes the research data read-only for the current Windows user while an agent runs,
and restores it afterwards.

Mechanism: one inheritable DENY rule for the current user with exactly
WriteData, AppendData, WriteExtendedAttributes, WriteAttributes, Delete and
DeleteSubdirectoriesAndFiles (mask 0x10156). Synchronize is deliberately absent:
icacls adds it to deny entries, which also blocks reading. The rule is set through
the .NET ACL API, which leaves it out. Tested 17 Nov 2026: modify, create, delete, rename, mkdir and
attribute changes are refused; read, list, copy-out and Python reads still work;
removal restores the original ACL exactly.

Residual risk (documented in PROJECT-STATE): the file owner can always rewrite a DACL,
so a process that deliberately removes the rule defeats it. Every run therefore also
verifies that the rule is still present afterwards, and the snapshot audit runs as well.

Usage:
  Lock-Research.ps1 -Mode Lock -Task T0-canary [-Extra <paths>]
  Lock-Research.ps1 -Mode Unlock
  Lock-Research.ps1 -Mode Status
Exit 0 on success. State file: C:\Dev\OM3-tasks\.research-lock.json
#>
param(
  [Parameter(Mandatory)] [ValidateSet('Lock', 'Unlock', 'Status')] [string] $Mode,
  [string] $Task = '',
  [string[]] $Extra = @()
)
$ErrorActionPreference = 'Stop'
$StateDir = 'C:\Dev\OM3-tasks'
$StateFile = Join-Path $StateDir '.research-lock.json'
$Roots = @('C:\Dev\OM3-research', 'C:\Dev\OM3-worktrees')
# Directories under the roots with inheritance disabled (scan of 17 Nov 2026); they get the rule explicitly.
$ProtectedDirs = @(
  'C:\Dev\OM3-research\tooling\python-deps\bin', 'C:\Dev\OM3-research\tooling\python-deps\peewee-4.5.3.dist-info',
  'C:\Dev\OM3-research\tooling\python-deps\peewee-stubs', 'C:\Dev\OM3-research\tooling\python-deps\playhouse',
  'C:\Dev\OM3-research\tooling\python-deps\__pycache__'
)
$OmEmuHome = Join-Path $env:USERPROFILE '.om-emu'
$User = "$env:USERDOMAIN\$env:USERNAME"
$Rights = [System.Security.AccessControl.FileSystemRights]'WriteData,AppendData,WriteExtendedAttributes,WriteAttributes,Delete,DeleteSubdirectoriesAndFiles'

function New-Rule { New-Object System.Security.AccessControl.FileSystemAccessRule($User, $Rights, 'ContainerInherit,ObjectInherit', 'None', 'Deny') }
# Read and write the DACL only. Set-Acl rewrites the whole descriptor, which needs SeSecurityPrivilege
# on directories that carry an audit section (found on tooling\python-deps\bin, 17 Nov 2026).
function Get-Dacl([string]$p) { (New-Object System.IO.DirectoryInfo $p).GetAccessControl([System.Security.AccessControl.AccessControlSections]::Access) }
function Set-Dacl([string]$p, $a) { (New-Object System.IO.DirectoryInfo $p).SetAccessControl($a) }
function Has-Rule([string]$p) {
  @((Get-Dacl $p).GetAccessRules($true, $false, [System.Security.Principal.NTAccount]) | Where-Object {
      $_.AccessControlType -eq 'Deny' -and $_.IdentityReference.Value -eq $User -and
      [int]$_.FileSystemRights -eq [int]$Rights }).Count -gt 0
}
function Add-Rule([string]$p) {
  if (Has-Rule $p) { return }
  $a = Get-Dacl $p; $a.AddAccessRule((New-Rule)); Set-Dacl $p $a
}
function Remove-Rule([string]$p) {
  if (-not (Test-Path -LiteralPath $p)) { return }
  $a = Get-Dacl $p; [void]$a.RemoveAccessRuleSpecific((New-Rule)); Set-Dacl $p $a
}
function Try-Create([string]$dir) {
  $f = Join-Path $dir ('.lockprobe-' + [guid]::NewGuid().ToString('N'))
  try { [IO.File]::WriteAllText($f, 'x'); Remove-Item -LiteralPath $f -Force; return $true } catch { return $false }
}
function Try-OpenWrite([string]$file) {
  try { $s = [IO.File]::Open($file, 'Open', 'Write', 'ReadWrite'); $s.Close(); return $true } catch { return $false }
}
function Try-Read([string]$file) { try { $null = [IO.File]::ReadAllBytes($file); return $true } catch { return $false } }

# Probes: directories where creation must fail while locked, files that must not open for writing, files that must stay readable.
$CreateProbes = @('C:\Dev\OM3-research', 'C:\Dev\OM3-research\runs', 'C:\Dev\OM3-research\firmware\catalog',
  'C:\Dev\OM3-research\analysis\decoded', 'C:\Dev\OM3-research\ghidra-projects', 'C:\Dev\OM3-research\scripts',
  'C:\Dev\OM3-research\analysis\button-af\readiness', 'C:\Dev\OM3-research\tooling\om-emu',
  'C:\Dev\OM3-research\tooling\ghidra-user', 'C:\Dev\OM3-research\tooling\python-deps\bin',
  'C:\Dev\OM3-research\contribution', 'C:\Dev\OM3-worktrees\archive', $OmEmuHome) + $Extra
$WriteProbes = @('C:\Dev\OM3-research\README.md', 'C:\Dev\OM3-research\PROJECT-STATE.md',
  'C:\Dev\OM3-research\firmware\catalog\OLY_E_147_1100_0000_0000.BIN',
  'C:\Dev\OM3-research\analysis\decoded\00_0100_50000020.decoded.bin',
  'C:\Dev\OM3-research\ghidra-projects\OM3_main_full.gpr')
$ReadProbes = @('C:\Dev\OM3-research\README.md', 'C:\Dev\OM3-research\ghidra-projects\OM3_main_full.gpr')

function Report([bool]$expectLocked) {
  $bad = @()
  foreach ($d in $CreateProbes) { if (Test-Path -LiteralPath $d) { $ok = Try-Create $d; if ($ok -eq $expectLocked) { $bad += "create $(if($ok){'ALLOWED'}else{'DENIED'}) in $d" } } }
  foreach ($f in $WriteProbes) { if (Test-Path -LiteralPath $f) { $ok = Try-OpenWrite $f; if ($ok -eq $expectLocked) { $bad += "open-for-write $(if($ok){'ALLOWED'}else{'DENIED'}) $f" } } }
  foreach ($f in $ReadProbes) { if (-not (Try-Read $f)) { $bad += "read DENIED $f" } }
  return ,$bad
}

switch ($Mode) {
  'Status' {
    if (Test-Path $StateFile) { "LOCKED: $(Get-Content -Raw $StateFile)" } else { 'UNLOCKED (no state file)' }
    foreach ($p in ($Roots + $ProtectedDirs + $OmEmuHome)) { if (Test-Path -LiteralPath $p) { "{0,-5} {1}" -f $(if (Has-Rule $p) { 'rule' } else { '-' }), $p } }
    exit 0
  }
  'Lock' {
    if (Test-Path $StateFile) { Write-Error "already locked: $(Get-Content -Raw $StateFile)"; exit 2 }
    New-Item -ItemType Directory -Force $StateDir | Out-Null
    $createdOmEmu = $false
    if (-not (Test-Path -LiteralPath $OmEmuHome)) { New-Item -ItemType Directory $OmEmuHome | Out-Null; $createdOmEmu = $true }
    $targets = @($Roots + $ProtectedDirs + $OmEmuHome + $Extra | Where-Object { Test-Path -LiteralPath $_ })
    [pscustomobject]@{ task = $Task; locked_utc = (Get-Date).ToUniversalTime().ToString('o'); user = $User
      targets = $targets; created_om_emu_home = $createdOmEmu } | ConvertTo-Json | Set-Content -Encoding utf8 $StateFile
    $t0 = Get-Date
    foreach ($p in $targets) { Add-Rule $p }
    $bad = Report $true
    "locked $($targets.Count) targets in $([math]::Round(((Get-Date) - $t0).TotalSeconds,1)) s; probe failures: $($bad.Count)"
    $bad
    if ($bad.Count) { exit 1 } else { exit 0 }
  }
  'Unlock' {
    $st = $null
    if (Test-Path $StateFile) { $st = Get-Content -Raw $StateFile | ConvertFrom-Json }
    $targets = @($Roots + $ProtectedDirs + $OmEmuHome + $Extra)
    if ($st) { $targets += $st.targets }
    $missing = @()
    foreach ($p in ($targets | Select-Object -Unique)) {
      if ((Test-Path -LiteralPath $p) -and $st -and ($st.targets -contains $p) -and -not (Has-Rule $p)) { $missing += $p }
      Remove-Rule $p
    }
    if ($st -and $st.created_om_emu_home -and (Test-Path -LiteralPath $OmEmuHome) -and
        -not (Get-ChildItem -LiteralPath $OmEmuHome -Force)) { Remove-Item -LiteralPath $OmEmuHome }
    $bad = Report $false
    if (-not $bad.Count) { Remove-Item -LiteralPath $StateFile -ErrorAction SilentlyContinue }
    "unlocked; rules that had disappeared while locked: $($missing.Count); probe failures: $($bad.Count)"
    $missing | ForEach-Object { "RULE MISSING BEFORE UNLOCK (possible tampering): $_" }
    $bad
    if ($bad.Count -or $missing.Count) { exit 1 } else { exit 0 }
  }
}
