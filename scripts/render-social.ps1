# Render the same props JSON to all three social formats (16:9, 9:16, 1:1).
# Usage: .\scripts\render-social.ps1 -Props briefs\example-skedai.props.json [-Name skedai] [-Scale 1]
param(
  [Parameter(Mandatory = $true)][string]$Props,
  [string]$Name = "",
  [double]$Scale = 1
)

$root = Split-Path $PSScriptRoot -Parent
$remotion = Join-Path $root "remotion"
$propsPath = (Resolve-Path $Props).Path
if (-not $Name) {
  $Name = [IO.Path]::GetFileNameWithoutExtension($propsPath) -replace '\.props$', ''
}
$outDir = Join-Path $root "output\social"
New-Item -ItemType Directory -Force $outDir | Out-Null

$targets = @(
  @{ Comp = "ProductPromo"; Tag = "16x9" },
  @{ Comp = "SocialReel";   Tag = "9x16" },
  @{ Comp = "SquareAd";     Tag = "1x1" }
)

Push-Location $remotion
try {
  foreach ($t in $targets) {
    $out = Join-Path $outDir ("{0}-{1}.mp4" -f $Name, $t.Tag)
    Write-Host "Rendering $($t.Comp) -> $out"
    npx remotion render $t.Comp $out "--props=$propsPath" --gl=angle "--scale=$Scale"
    if ($LASTEXITCODE -ne 0) { throw "Render failed: $($t.Comp)" }
  }
  Write-Host "Done. Files in $outDir"
} finally {
  Pop-Location
}
