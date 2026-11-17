<#
Builds the low-integrity runtime that Grok's Cursor CLI runs in (C:\Dev\OM3-tasks\_agent).

Why: the Cursor CLI's own sandbox is macOS/Linux only (T0, 17 Nov 2026), and any useful
shell lets a program write anywhere this Windows user can. A process started from an
executable labelled Low runs at Low integrity, and so does everything it starts. Windows
then refuses its writes to anything labelled Medium, which is the default for all user files
(tested 17 Nov 2026: research tree, other C:\Dev projects and the user profile all denied;
child cmd/python inherit Low; reads still work).

Layout:
  _agent\cli\        copy of the installed CLI version; cli\node.exe is labelled Low
  _agent\home\       Low-labelled home for the agent (USERPROFILE, HOME, LOCALAPPDATA point
                     here): a copy of ~\.cursor without chats, projects, ai-tracking and plans
The sign-in stays in the real %APPDATA%\Cursor\auth.json, which the agent reads but cannot
modify. It is not copied, so a token refresh cannot fork the owner's sign-in.

Rerun after a Cursor CLI update: it builds a new cli copy from the newest installed version.
Nothing outside C:\Dev\OM3-tasks is changed. No recursive operation follows junctions.
#>
param([string] $Base = 'C:\Dev\OM3-tasks\_agent')
$ErrorActionPreference = 'Stop'
$u = "$env:USERDOMAIN\$env:USERNAME"
$vers = Get-ChildItem "$env:LOCALAPPDATA\cursor-agent\versions" -Directory | Where-Object Name -match '^\d{4}\.\d{1,2}\.\d{1,2}-[0-9a-f]+$' | Sort-Object Name
$src = $vers[-1].FullName
New-Item -ItemType Directory -Force $Base | Out-Null
# Full Control on our own folder is needed to set integrity labels (C:\Dev grants only Modify).
icacls $Base /grant "${u}:(OI)(CI)F" /C /Q | Out-Null

$cli = Join-Path $Base 'cli'
if (Test-Path $cli) { Rename-Item $cli ("cli-superseded-" + (Get-Date).ToString('yyyyMMdd-HHmmss')) }
& robocopy.exe $src $cli /E /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw 'CLI copy failed' }
icacls "$cli\node.exe" /setintegritylevel low | Out-Null

$agentHome = Join-Path $Base 'home'
if (-not (Test-Path $agentHome)) {
  New-Item -ItemType Directory -Force "$agentHome\AppData\Local\Temp" | Out-Null
  & robocopy.exe "$env:USERPROFILE\.cursor" "$agentHome\.cursor" /E /NFL /NDL /NJH /NJS /NP /XD chats projects ai-tracking plans /XF '*.tmp' | Out-Null
  if ($LASTEXITCODE -ge 8) { throw 'home copy failed' }
}
if (Get-ChildItem $agentHome -Recurse -Force -Attributes ReparsePoint -ErrorAction SilentlyContinue) { throw "reparse point inside $agentHome; refusing a recursive label" }
icacls $agentHome /setintegritylevel '(OI)(CI)low' /T /C /Q | Out-Null

$lbl = (icacls "$cli\node.exe") -join ' '
if ($lbl -notmatch 'Low Mandatory Level') { throw 'node.exe is not labelled Low' }
[pscustomobject]@{ built_utc = (Get-Date).ToUniversalTime().ToString('o'); cli_source = $src; cli = $cli; home = $agentHome
  node_sha256 = (Get-FileHash "$cli\node.exe").Hash.ToLower() } | ConvertTo-Json | Set-Content -Encoding utf8 "$Base\runtime.json"
"agent runtime ready: $cli (from $src), home $agentHome"
