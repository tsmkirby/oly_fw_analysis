<#
Verifies the pinned inputs every task depends on. Exit 0 = all match.
#>
param([string] $Root = 'C:\Dev\OM3-research')
$ErrorActionPreference = 'Stop'
# Windows PowerShell 5.1 turns native stderr (git's CRLF warnings) into terminating errors under 'Stop'.
function Invoke-Git { $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & git.exe -c core.safecrlf=false @args 2>$null } finally { $ErrorActionPreference = $old } }
$pins = [ordered]@{
  'firmware\catalog\OLY_E_147_1100_0000_0000.BIN' = '8c133084414533159f587bf46bfb4152714c4074312a47c8d8503e33d605696d'
  'analysis\decoded\00_0100_50000020.decoded.bin'  = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
  'analysis\decoded\02_0106_458c0020.decoded.bin'  = '3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059'
}
$bad = 0
foreach ($k in $pins.Keys) {
  $h = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $Root $k)).Hash.ToLower()
  $s = if ($h -eq $pins[$k]) { 'OK  ' } else { $bad++; 'FAIL' }
  "$s $k"
}
$emu = Join-Path $Root 'tooling\om-emu'
$head = Invoke-Git -C $emu rev-parse HEAD
$s = if ($head -eq '4e4ec4ef084542a7e30eecce56970c7e09c123c9') { 'OK  ' } else { $bad++; 'FAIL' }
"$s om-emu HEAD $head"
# CR-stripped diff, hashed the same way as the archived om-emu-local.patch check (17 Nov).
$diff = ((Invoke-Git -C $emu diff) -join "`n") + "`n"
$sha = [System.Security.Cryptography.SHA256]::Create()
$dh = -join ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($diff.Replace("`r",''))) | ForEach-Object { $_.ToString('x2') })
$s = if ($dh -eq '61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702') { 'OK  ' } else { $bad++; 'FAIL' }
"$s om-emu local diff $dh"
if ($bad) { exit 1 } else { exit 0 }
