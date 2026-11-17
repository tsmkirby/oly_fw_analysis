<#
Compares workspace text files with their copies on archive/om3-af-research
(research/om3_af_profiles/). Git blob ids are compared directly: the archive's
.gitattributes is `* -text`, so the bytes are stored unconverted.
Reports DIFF (workspace differs from archive) and lists workspace documents/scripts
missing from the archive. Exit 0 only if nothing differs.
Read-only: uses `git hash-object` without -w.
#>
param(
  [string] $Root = 'C:\Dev\OM3-research',
  [string] $Repo = 'C:\Dev\OM3-research\contribution',
  [string] $Ref  = 'archive/om3-af-research'
)
$ErrorActionPreference = 'Stop'
# Windows PowerShell 5.1 turns native stderr (git's CRLF warnings) into terminating errors under 'Stop'.
function Invoke-Git { $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & git.exe -c core.safecrlf=false @args 2>$null } finally { $ErrorActionPreference = $old } }
$prefix = 'research/om3_af_profiles/'
$tree = @{}
foreach ($l in (Invoke-Git -C $Repo ls-tree -r $Ref -- $prefix)) {
  $parts = $l -split "`t", 2; $id = ($parts[0] -split ' ')[2]
  $tree[$parts[1].Substring($prefix.Length)] = $id
}
# Archive files that intentionally differ from the workspace (verified 17 Nov 2026):
#   README.md                      archive-specific README for fork readers
#   scripts/decode_om3_queue95.py  adds a recorded-evidence fallback path
$Adapted = @('README.md', 'scripts/decode_om3_queue95.py')
# Workspace files deliberately not archived (owner decision pending; see 01-preservation-plan P3).
$NotArchived = @('om3-concise-pr-description.md', 'om3-draft-pr-body.md')

$diff = 0; $missing = New-Object System.Collections.Generic.List[string]
foreach ($rel in $tree.Keys) {
  if ($rel -like 'recorded-evidence/*') { continue }       # archive-only material
  $p = Join-Path $Root ($rel -replace '/', '\')
  if (-not (Test-Path -LiteralPath $p)) { continue }        # removed or relocated in workspace: not a sync error
  $id = Invoke-Git -C $Repo hash-object --no-filters -- $p
  if ($id -eq $tree[$rel]) { continue }
  if ($Adapted -contains $rel) { "ADAPTED  $rel (intentional archive version; reconcile by hand)"; continue }
  # Some files were archived with different line endings (e.g. START-HERE.md is CRLF in the archive).
  $ws = ([System.IO.File]::ReadAllText($p)).Replace("`r", '')
  $ar = ((Invoke-Git -C $Repo cat-file -p $tree[$rel]) -join "`n") + "`n"
  if ($ws.TrimEnd("`n") -eq $ar.Replace("`r", '').TrimEnd("`n")) { "EOL-ONLY $rel"; continue }
  $diff++; "DIFF     $rel"
}
# Documents and scripts that should be archived but are not.
$want = @(Get-ChildItem $Root -File -Filter *.md) + @(Get-ChildItem "$Root\analysis\button-af" -File -Filter *.md) +
        @(Get-ChildItem "$Root\scripts" -File -Recurse -ErrorAction SilentlyContinue) +
        @(Get-ChildItem "$Root\orchestration" -File -ErrorAction SilentlyContinue)
foreach ($f in $want) {
  $rel = $f.FullName.Substring($Root.Length + 1).Replace('\', '/')
  if ($rel -match '__pycache__' -or $NotArchived -contains $rel) { continue }
  if (-not $tree.ContainsKey($rel)) { $missing.Add("UNARCHIVED $rel") }
}
$missing
"differences: $diff; unarchived documents/scripts: $($missing.Count)"
if ($diff -or $missing.Count) { exit 1 } else { exit 0 }
