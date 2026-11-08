# Opens Remotion Studio (interactive preview) for the Claude_Video project.
# Usage: .\scripts\studio.ps1
$remotion = Join-Path (Split-Path $PSScriptRoot -Parent) "remotion"
Push-Location $remotion
try {
  npx remotion studio
} finally {
  Pop-Location
}
