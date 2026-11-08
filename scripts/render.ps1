# Render one composition to MP4.
# Usage: .\scripts\render.ps1 -Comp ProductPromo [-Props briefs\x.props.json] [-Out output\renders\x.mp4] [-Scale 1] [-Codec h264]
param(
  [Parameter(Mandatory = $true)][string]$Comp,
  [string]$Props = "",
  [string]$Out = "",
  [double]$Scale = 1,
  [string]$Codec = "h264"
)

$root = Split-Path $PSScriptRoot -Parent
$remotion = Join-Path $root "remotion"

if (-not $Out) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmm"
  $Out = Join-Path $root "output\renders\$Comp-$stamp.mp4"
}
New-Item -ItemType Directory -Force (Split-Path $Out -Parent) | Out-Null

$renderArgs = @("remotion", "render", $Comp, $Out, "--gl=angle", "--codec=$Codec", "--scale=$Scale")
if ($Props) {
  $renderArgs += "--props=" + (Resolve-Path $Props).Path
}

Push-Location $remotion
try {
  & npx @renderArgs
  if ($LASTEXITCODE -ne 0) { throw "Render failed for $Comp" }
  Write-Host "Rendered -> $Out"
} finally {
  Pop-Location
}
