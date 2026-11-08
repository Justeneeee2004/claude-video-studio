# Render selected frames of a composition as PNGs (visual QA without a full render).
# Usage: .\scripts\stills.ps1 -Comp ProductPromo [-Frames "0,60,150,300,500,700"] [-Props briefs\x.props.json] [-OutDir output\stills\promo]
param(
  [Parameter(Mandatory = $true)][string]$Comp,
  [string]$Frames = "0,30,60,90",
  [string]$Props = "",
  [string]$OutDir = ""
)

$root = Split-Path $PSScriptRoot -Parent
$remotion = Join-Path $root "remotion"
if (-not $OutDir) {
  $OutDir = Join-Path $root "output\stills\$Comp"
}
New-Item -ItemType Directory -Force $OutDir | Out-Null

$renderArgs = @("remotion", "render", $Comp, $OutDir, "--frames=$Frames", "--image-format=png", "--gl=angle")
if ($Props) {
  $renderArgs += "--props=" + (Resolve-Path $Props).Path
}

Push-Location $remotion
try {
  & npx @renderArgs
  if ($LASTEXITCODE -ne 0) { throw "Still render failed for $Comp" }
  Write-Host "Stills -> $OutDir"
  Get-ChildItem $OutDir -Filter *.png | Select-Object Name, Length
} finally {
  Pop-Location
}
